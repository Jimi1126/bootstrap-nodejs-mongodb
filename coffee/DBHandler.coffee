###
# mongoDB操作
# 对mongoDB原生方法进行一层封装，简化mongo数据库的操作
# 通过数据库链接、所连接集合、连接参数来实例化DB操作对象
# 一般的实例化对象提供增删改查操作
###
mongoClient = require('mongodb').MongoClient
InsertManyOptions = require('mongodb').InsertManyOptions
ObjectId = require('mongodb').ObjectId
LOG = LoggerUtil.getLogger "DBHandler"
class DBHandler
  constructor: (@url, @collection, @DB_OPTS)->
    @database = @url.substring @url.lastIndexOf("/") + 1, @url.lastIndexOf("?")
  connect: (callback)->
    cb = (err, db) =>
      unless db
        LOG.error "数据库连接获取失败"
      try
        callback err, db.db(@database)
      catch e
        LOG.error e.stack
      finally
        db?.close?()
    try
      mongoClient.connect @url, @DB_OPTS, cb
    catch e
      LOG.error e.stack
  keepConnect: (callback)->
    cb = (err, db) =>
      unless db
        LOG.error "数据库连接获取失败"
      try
        callback err, db.db(@database)
      catch e
        LOG.error e.stack
    try
      mongoClient.connect @url, @DB_OPTS, cb
    catch e
      LOG.error e.stack
  insert: (docs, callback) ->
    @connect (err, db) =>
      return callback err if err
      if Array.isArray docs
        docs.forEach (d)->
          d._id and typeof d._id is "string" and (d._id = ObjectId(d._id))
        db.collection(@collection).insert docs, callback
      else if docs instanceof Object
        docs._id and typeof docs._id is "string" and (docs._id = ObjectId(docs._id))
        db.collection(@collection).insertOne docs, callback
      else
        callback "param Invalid"
  addOrUpdate: (docs, callback) ->
    if docs instanceof Object or Array.isArray docs
      that = @
      @keepConnect (err, db) =>
        return callback err if err
        if Array.isArray docs
          async.each docs, (doc, ccb)->
            doc._id and typeof doc._id is "string" and (doc._id = ObjectId(doc._id))
            db.collection(that.collection).findOne {_id: doc._id}, (err, result)->
              if result
                db.collection(that.collection).update {_id: doc._id}, doc, ccb
              else
                db.collection(that.collection).insert doc, ccb
          , (err)->
            db?.close?()
            callback err
        else if docs instanceof Object
          docs._id and typeof docs._id is "string" and (docs._id = ObjectId(docs._id))
          db.collection(that.collection).findOne {_id: docs._id}, (err, result)->
            if result
              db.collection(that.collection).update {_id: docs._id}, docs, (err)->
                db?.close?()
                callback err
            else
              db.collection(that.collection).insert docs, (err)->
                db?.close?()
                callback err
    else
      callback null
  delete: (param, callback) ->
    @connect (err, db) =>
      return callback err if err
      param._id and typeof param._id is "string" and (param._id = ObjectId(param._id))
      db.collection(@collection).remove param, callback
  update: (filter, setter, callback) ->
    @connect (err, db) =>
      return callback err if err
      filter._id and typeof filter._id is "string" and (filter._id = ObjectId(filter._id))
      setter._id and delete setter._id
      db.collection(@collection).update filter, setter, callback
  selectOne: (param, callback) ->
    @connect (err, db) =>
      return callback err if err
      param._id and typeof param._id is "string" and (param._id = ObjectId(param._id))
      db.collection(@collection).findOne param, callback
  selectBySortOrLimit: (param, sort, limit, callback) ->
    @connect (err, db) =>
      return callback err if err
      param._id and typeof param._id is "string" and (param._id = ObjectId(param._id))
      if limit is -1
        db.collection(@collection).find(param).sort(sort).toArray callback
      else
        db.collection(@collection).find(param).sort(sort).limit(limit).toArray callback
  selectBySortOrSkipOrLimit: (param, sort, skip, limit, callback) ->
    @connect (err, db) =>
      return callback err if err
      param._id and typeof param._id is "string" and (param._id = ObjectId(param._id))
      if limit is -1
        db.collection(@collection).find(param).skip(skip).sort(sort).toArray callback
      else
        db.collection(@collection).find(param).skip(skip).limit(limit).sort(sort).toArray callback
  selectList: (param, callback) ->
    @connect (err, db) =>
      return callback err if err
      param._id and typeof param._id is "string" and (param._id = ObjectId(param._id))
      db.collection(@collection).find(param).toArray callback
  count: (param, callback) ->
    @connect (err, db) =>
      return callback err if err
      param._id and typeof param._id is "string" and (param._id = ObjectId(param._id))
      db.collection(@collection).countDocuments param, callback

module.exports = DBHandler