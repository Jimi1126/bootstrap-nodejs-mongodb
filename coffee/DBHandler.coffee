###
# mongoDB操作
# 对mongoDB原生方法进行一层封装，简化mongo数据库的操作
# 通过数据库链接、所连接集合、连接参数来实例化DB操作对象
# 一般的实例化对象提供增删改查操作
###
mongoClient = require('mongodb').MongoClient
class DBHandler
  constructor: (@url, @collection, @DB_OPTS)->
    @database = @url.substring @url.lastIndexOf("/") + 1, @url.lastIndexOf("?")
  connect: (callback)->
    cb = (err, db) =>
      unless db
        throw "数据库连接获取失败"
      try
        callback err, db.db(@database)
      catch e
        throw "连接数据库#{@database}失败\n#{e.stack}"
    try
      mongoClient.connect @url, @DB_OPTS, cb
    catch e
      throw e
  insert: (docs, callback) ->
    try
      @connect (err, db) =>
      throw err if err
      db.collection(@collection).insert docs, callback
    catch e
      callback e
  delete: (param, callback) ->
    try
      @connect (err, db) =>
        throw err if err
        db.collection(@collection).remove param, callback
    catch e
      callback e
  update: (filter, setter, callback) ->
    try
      @connect (err, db) =>
        throw err if err
        db.collection(@collection).update filter, setter, callback
    catch e
      callback e
  selectOne: (param, callback) ->
    try
      @connect (err, db) =>
        throw err if err
        db.collection(@collection).findOne param, callback
    catch e
      callback e
  selectList: (param, callback) ->
    try
      @connect (err, db) =>
        throw err if err
        db.collection(@collection).find(param).toArray callback
    catch e
      callback e
  count: (param, callback) ->
    try
      @connect (err, db) =>
        throw err if err
        db.collection(@collection).countDocuments param, callback
    catch e
      callback e

module.exports = DBHandler