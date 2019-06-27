BussinessContext = require './BussinessContext'
LOG = LoggerUtil.getLogger "EnterContext"
class EnterContext extends BussinessContext
  getEnterTask: (data, callback)->
    if !data or !data.task
      LOG.error "参数不完整"
      return callback null, null
    global.enter || (global.enter = {})
    global.enter.tasks || (global.enter.tasks = {})
    task = global.enter.tasks[data.task]
    return callback null, task if task
    @selectOne {col: "task", filter: {_id: data.task}}, (err, doc)->
      return callback err if err
      return callback "未找到项目业务对象" unless doc
      doc.flowList.push "over"
      global.enter.tasks[data.task] = doc
      callback null, doc
  getEnterEntity: (param, callback)->
    that = @
    data = param.data
    task = param.task
    if !data or !data.project or !data.task or !data.stage
      LOG.error "参数不完整"
      return callback null, null
    global.enter || (global.enter = {})
    global.enter.entitys || (global.enter.entitys = {})
    global.enter.entitys.MIN_CACHE || (global.enter.entitys.MIN_CACHE = 30)
    global.enter.entitys.MAX_CACHE || (global.enter.entitys.MAX_CACHE = 90)
    global.enter.entitys[data.project] || (global.enter.entitys[data.project] = {})
    entity_task = global.enter.entitys[data.project][data.task] || (global.enter.entitys[data.project][data.task] = {done: false})
    entitys = global.enter.entitys[data.project][data.task][data.stage] || (global.enter.entitys[data.project][data.task][data.stage] = {
      isEmpty: false,
      data:[],
      entering: []
    })
    entity = null
    do_update = (cb)->
      flags = 0
      for stage in task.flowList
        if stage is "ocr" or stage is "over"
          flags++
          continue
        if entity_task[stage]?.isEmpty and entity_task[stage]?.data.length is 0 and entity_task[stage]?.entering.length is 0
          flags++
      if flags is task.flowList.length
        export_time = moment().format "YYYY-MM-DD HH:mm:ss"
        !entity_task.done and that.update {col: "task", filter: {_id: data.task}, setter: {$set: {state: "已导出", export_time: export_time}}}, (err)->
          cb null
          return LOG.error err if err
          entity_task.done = true
          delete global.enter.tasks[data.task]
          delete global.enter.entitys[data.project][data.task]
      else
        cb null
    if entity_task.done
      return callback null, "done"
    if entitys.data.length > 0
      entity = entitys.data.shift()
      entitys.entering.push entity
      callback null, entity
    if entitys.data.length < global.enter.entitys.MIN_CACHE
      lockKey = "enter-fatch-#{data.project}-#{data.task}-#{data.stage}"
      locker.lockFile.lock lockKey, (err)->
        if err
          LOG.error err
          return locker.lockFile.unlock lockKey, (err)->
            callback err, null
        if !entitys.isEmpty and entitys.data.length < global.enter.entitys.MIN_CACHE
          num = global.enter.entitys.MAX_CACHE - entitys.data.length
          that.fatchEnterEntity {data: data, limit: num}, (err)->
            LOG.error err if err
            if num is global.enter.entitys.MAX_CACHE
              entity = entitys.data.shift() || null
              entity && entitys.entering.push entity
              entity && callback null, entity
            if entitys.isEmpty
              do_update ->
                locker.lockFile.unlock lockKey, (err)->
                  LOG.error err if err
                if entity_task.done
                  callback null, "done"
                else 
                  !entity && callback null, entity
            else
              locker.lockFile.unlock lockKey, (err)->
                LOG.error err if err
        else if entitys.isEmpty and entitys.data.length is 0
          do_update ->
            locker.lockFile.unlock lockKey, (err)->
              LOG.error err if err
            if entity_task.done
              callback null, "done"
            else
              !entity && callback null, entity
        else
          locker.lockFile.unlock lockKey, (err)->
            LOG.error err if err
  submitEnter: (param, callback)->
    data = param.data
    task = param.task
    user = param.user
    rankArr = task.flowList
    try
      entitys = global.enter.entitys[data.project][data.task][data.stage]
      entitys.entering.splice (entitys.entering.findIndex (en)-> en._id.toString() is data._id), 1
      chatLength = 0
      symbol = 0
      for en in data.enter
        chatLength += Utils.getLength en.value[data.stage]
        symbol += if Utils.replaceAll(en.value[data.stage], /\?|？/, "").length is 0 then 1 else 0
      dao = new MongoDao __b_config.dbInfo, {epcos: ["outputData"]}
      cData = Utils.clone data
      dao.epcos.outputData.selectOne {task: data.task, project: data.project}, (err, outputStatis)->
        return LOG.error err if err
        unless outputStatis
          outputStatis = {
            task: cData.task
            project: cData.project
            statis: {}
          }
        statis = outputStatis.statis
        statis[cData.stage] || (statis[cData.stage] = {})
        stage_handler = statis[cData.stage][user.username] || (statis[cData.stage][user.username] = {chatLength: 0, symbol: 0, count: 0})
        stage_handler.chatLength += chatLength
        stage_handler.symbol += symbol
        stage_handler.count++
        dao.epcos.outputData.addOrUpdate outputStatis, (err)->
          LOG.error err if err
      cur_index = rankArr.indexOf(data.stage)
      for en in data.enter
        if /\?|？/.test(en.value[rankArr[cur_index]]) or !en.value[rankArr[cur_index-1]] or !en.value[rankArr[cur_index]] or (en.value[rankArr[cur_index - 1]] isnt en.value[rankArr[cur_index]])
          data.stage = "no" 
      if data.stage is "no"
        data.stage = rankArr[cur_index + 1]
      else
        data.stage = "over"
      if data.stage isnt "over"
        entitys = global.enter.entitys[data.project][data.task][data.stage]
        entitys && (entitys.isEmpty = false)
      context = new EnterContext()
      setter = {
        $set: {
          stage: data.stage
          enter: data.enter
        }
      }
      context.update {col: "resultData", filter: {_id: data._id}, setter: setter}, (err)->
        callback err
    catch e
      callback e
  fatchEnterEntity: (param, callback)->
    return callback "invalid param" unless param.data and param.data.project and param.data.task and param.data.stage
    dao = new MongoDao __b_config.dbInfo, {epcos: "resultData"}
    entitys = global.enter.entitys[param.data.project][param.data.task][param.data.stage];
    param.data._id = {$nin: (entitys.entering.map (d)-> d._id).concat entitys.data.map (d)-> d._id}
    param.filter = param.data
    param.sort = {priority: -1}
    @getResultData param, (err, docs)->
      docs and docs.length < param.limit and (entitys.isEmpty = true)
      err or (entitys.data = entitys.data.concat docs)
      callback err
  refreshEnterEntity: (param, callback)->
    return callback null if !param.data or !param.data.src_type
    col = param.data.src_type
    dao = new MongoDao __b_config.dbInfo, {epcos: ["deploy", col, "resultData"]}
    filter = {}
    filter[col+"_type"] = param.data.file_id
    dao.epcos[col].selectList filter, (err, entitys)->
      return callback err if err
      return callback null unless entitys
      return callback null if !Array.isArray entitys or entitys.length is 0
      async.each entitys, (entity, cb)->
        enterEntity = {
          project: param.data.project
          field_id: param.data.field_id
          field_name: param.data.field_name
          src_type: param.data.src_type
          verify: param.data.verify
          enter_conf: entity._id.toString()
          enter_img_name: entity[col+"_name"]
          enter_img_path: entity.s_url or entity.path
          state: 0
          create_at: moment().format "YYYYMMDDHHmmss"
        }
        dao.epcos.resultData.insert enterEntity, cb
      , callback
  getResultData: (param, callback)->
    return callback null if !param.filter
    dao = new MongoDao __b_config.dbInfo, {epcos: ["deploy", "task", "resultData"]}
    async.waterfall [
      (cb)->
        if param.filter.task
          filter = {_id: param.filter.task}
        else
          filter = {project: param.filter.project}
        dao.epcos.task.selectList filter, cb
      (tasks, cb)->
        filter = {task: {$in: tasks.map (t)-> t._id.toString()}}
        dao.epcos.deploy.selectList filter, (err, docs)->
          return cb err if err
          return cb err, [] if !docs or !docs.length
          filter = {image: {$in: docs.map (im)-> im._id.toString()}}
          dao.epcos.deploy.selectList filter, (err, docs2)->
            return cb err if err
            return cb err, docs if !docs2 or !docs2.length
            cb err, docs.concat docs2
      (deploys, cb)->
        filter = {stage: param.filter.stage, deploy_id: {$in: deploys.map (d)-> d._id.toString()}}
        if param.isCount
          dao.epcos.resultData.count filter, cb
        else if param.isPage
          dao.epcos.resultData.selectBySortOrSkipOrLimit filter, {create_at: 1}, +param.skip, +param.limit, cb
        else if param.isSortAndLimit
          dao.epcos.resultData.selectBySortOrLimit filter, param.sort, param.limit, cb
        else if param.limit
          dao.epcos.resultData.selectBySortOrLimit filter, param.sort, param.limit, cb
        else
          dao.epcos.resultData.selectBySortOrLimit filter, {create_at: 1}, -1, cb
    ], callback
      
module.exports = EnterContext