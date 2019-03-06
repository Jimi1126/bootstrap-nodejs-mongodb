Context = require './Context'
class EnterContext extends Context
  select: (param, callback)->
    return callback "invalid param" unless param and param.col and param.filter
    dao = new MongoDao __b_config.dbInfo, {epcos: param.col}
    dao.epcos[param.col].selectList param.filter, callback
  selectByconf: (conf, callback)->
    col = conf.src_type
    return callback "invalid param" unless conf and col and conf.file_id
    dao = new MongoDao __b_config.dbInfo, {epcos: col}
    param = {}
    param[conf.src_type + "_type"] = conf.file_id
    dao.epcos[col].selectList param, callback
  save: (param, callback)->
    return callback "invalid param" unless param and param.col and param.data
    dao = new MongoDao __b_config.dbInfo, {epcos: param.col}
    dao.epcos[param.col].insert param.data, callback
  update: (param, callback)->
    return callback "invalid param" unless param and param.col and param.filter
    dao = new MongoDao __b_config.dbInfo, {epcos: param.col}
    dao.epcos[param.col].update param.filter, param.setter, callback
  delete: (param, callback)->
    return callback "invalid param" unless param and param.col and param.filter
    dao = new MongoDao __b_config.dbInfo, {epcos: param.col}
    dao.epcos[param.col].delete param.filter, callback
  getEnterEntity: (param, callback)->
    return callback "invalid param" unless param.data and param.data.project and param.data.stage
    dao = new MongoDao __b_config.dbInfo, {epcos: "resultData"}
    entitys = global.enter.entitys[param.data.project][param.data.stage];
    param.data._id = {$nin: (entitys.entering.map (d)-> d._id).concat entitys.data.map (d)-> d._id}
    dao.epcos.resultData.selectBySortOrLimit param.data, {priority: -1}, param.limit, (err, docs)->
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
            return cb err, image if !docs2 or !docs2.length
            cb err, docs.concat docs2
      (deploys, cb)->
        filter = {stage: "over",deploy_id: {$in: deploys.map (d)-> d._id.toString()}}
        dao.epcos.resultData.selectBySortOrSkipOrLimit filter, {create_at: 1}, +param.skip, +param.limit, cb
    ], callback
      
module.exports = EnterContext