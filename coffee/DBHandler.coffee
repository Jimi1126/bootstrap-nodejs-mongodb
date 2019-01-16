###
# mongoDB操作
# 对mongoDB原生方法进行一层封装，简化mongo数据库的操作
# 通过数据库链接、所连接集合、连接参数来实例化DB操作对象
# 一般的实例化对象提供增删改查操作
###
mongoClient = require('mongodb').MongoClient
ObjectId = require('mongodb').ObjectId
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
      finally
        db?.close?()
    try
      mongoClient.connect @url, @DB_OPTS, cb
    catch e
      throw e
  insert: (docs, callback) ->
    @connect (err, db) =>
      throw err if err
      docs._id and typeof docs._id is "string" and (docs._id = ObjectId(docs._id))
      db.collection(@collection).insert docs, callback
  delete: (param, callback) ->
    @connect (err, db) =>
      throw err if err
      param._id and typeof param._id is "string" and (param._id = ObjectId(param._id))
      db.collection(@collection).remove param, callback
  update: (filter, setter, callback) ->
    @connect (err, db) =>
      throw err if err
      filter._id and typeof filter._id is "string" and (filter._id = ObjectId(filter._id))
      setter._id and delete setter._id
      db.collection(@collection).update filter, setter, callback
  selectOne: (param, callback) ->
    @connect (err, db) =>
      throw err if err
      param._id and typeof param._id is "string" and (param._id = ObjectId(param._id))
      db.collection(@collection).findOne param, callback
  selectBySortOrLimit: (param, sort, limit, callback) ->
    @connect (err, db) =>
      throw err if err
      param._id and typeof param._id is "string" and (param._id = ObjectId(param._id))
      if limit is -1
        db.collection(@collection).find(param).sort(sort).toArray callback
      else
        db.collection(@collection).find(param).sort(sort).limit(limit).toArray callback
  selectList: (param, callback) ->
    @connect (err, db) =>
      throw err if err
      param._id and typeof param._id is "string" and (param._id = ObjectId(param._id))
      db.collection(@collection).find(param).toArray callback
  count: (param, callback) ->
    @connect (err, db) =>
      throw err if err
      param._id and typeof param._id is "string" and (param._id = ObjectId(param._id))
      db.collection(@collection).countDocuments param, callback

module.exports = DBHandler