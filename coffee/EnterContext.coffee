Context = require './Context'
class EnterContext extends Context
  select: (param, callback)->
    return callback "invalid param" unless param and param.col and param.filter
    dao = new MongoDao __b_config.dbInfo, {epcos: param.col}
    dao.epcos.deploy.selectList param.filter, callback
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
    callback null if !param.data or !param.data.src_type
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
    
    # async.waterfall [
    #   (cb)->
    #     images = param.data.filter((dd)-> dd.src_type is "image")
    #     return cb null, 0 if images.length is 0
    #     dao.epcos.image.count {image_type: {"$in": images.map((dd)-> dd.file_id)}}, cb
    #   (num, cb)->
    #     bills = param.data.filter((dd)-> dd.src_type is "bill")
    #     return cb null, num if bills.length is 0
    #     dao.epcos.bill.count {bill_type: {"$in": bills.map((dd)-> dd.file_id)}}, (err, res)->
    #       cb err, num + res
    #   (num, cb)->
    #     fields = param.data.filter((dd)-> dd.src_type is "field")
    #     return cb null, num if fields.length is 0
    #     dao.epcos.field.count {field_type: {"$in": fields.map((dd)-> dd.file_id)}}, (err, res)->
    #       cb err, num + res
    #   (total, cb)->
    #     count = 0
    #     param.socket and param.socket.emit "progress", 0
    #     async.each param.data, (enterConf, cb1)->
    #       col = enterConf.src_type
    #       filter = {}
    #       filter[col+"_type"] = enterConf.file_id
    #       dao.epcos[enterConf.src_type].selectList filter, (err, entitys)->
    #         return cb1 err if err
    #         return cb1 null unless entitys
    #         for entity in entitys
    #           count++
    #           param.socket and param.socket.emit "progress", Math.floor (count * 100 / total)
    #         cb1 null
    #     , cb
    # ], callback
      
module.exports = EnterContext