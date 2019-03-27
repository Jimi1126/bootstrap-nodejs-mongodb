Context = require "./Context"
###
# 业务上下文接口
###
class BussinessContext extends Context
  selectList: (param, callback)->
    return callback "invalid param" unless param and param.col and param.filter
    dao = new MongoDao __b_config.dbInfo, {epcos: param.col}
    dao.epcos[param.col].selectList param.filter, callback
  insert: (param, callback)->
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
module.exports = BussinessContext