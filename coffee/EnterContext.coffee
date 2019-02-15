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
    dao.epcos.deploy.insert param.data, callback
  update: (param, callback)->
    return callback "invalid param" unless param and param.col and param.filter
    dao = new MongoDao __b_config.dbInfo, {epcos: param.col}
    dao.epcos.deploy.update param.filter, param.setter, callback
  delete: (param, callback)->
    return callback "invalid param" unless param and param.col and param.filter
    dao = new MongoDao __b_config.dbInfo, {epcos: param.col}
    dao.epcos.deploy.delete param.filter, callback
module.exports = EnterContext