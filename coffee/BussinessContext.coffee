Context = require "./Context"
MongoDao = require "./MongoDao"
ObjectId = require('mongodb').ObjectId
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
  addOrUpdate: (param, callback)->
    return callback "invalid param" unless param and param.col and param.data
    dao = new MongoDao __b_config.dbInfo, {epcos: param.col}
    dao.epcos[param.col].addOrUpdate param.data, callback
  delete: (param, callback)->
    return callback "invalid param" unless param and param.col and param.filter
    dao = new MongoDao __b_config.dbInfo, {epcos: param.col}
    dao.epcos[param.col].delete param.filter, callback
  selectBySortOrSkipOrLimit: (param, callback) ->
    return callback "invalid param" unless param and param.col and param.filter and +param.limit
    return callback "invalid param" if param.skip != 0 && !param.skip
    dao = new MongoDao __b_config.dbInfo, {epcos: param.col}
    dao.epcos[param.col].selectBySortOrSkipOrLimit param.filter, param.sort, +param.skip, +param.limit, callback
  selectBySortOrLimit: (param, callback) ->
    return callback "invalid param" unless param and param.col and param.filter
    dao = new MongoDao __b_config.dbInfo, {epcos: param.col}
    dao.epcos[param.col].selectBySortOrLimit param.filter, param.sort, +param.limit || -1, callback
  count: (param, callback) ->
    return callback "invalid param" unless param and param.col and param.filter
    dao = new MongoDao __b_config.dbInfo, {epcos: param.col}
    dao.epcos[param.col].count param.filter, callback
module.exports = BussinessContext