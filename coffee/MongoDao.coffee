
DBProxy = require "./DBProxy"
DBHandler = require "./DBHandler"
class MongoDao
  constructor: (config, cont)->
    throw "未进行数据库配置" unless config
    throw "请传入实例化库和集合"  unless cont
    perfix = "mongodb://#{config.username}:#{config.password}@#{config.hostName}:#{config.port}/"
    postfix = "?#{config.auth}"
    for k, v of cont
      @[k] = {}
      unless Array.isArray v
        @[k][v] = new DBProxy (new DBHandler perfix + k + postfix, v, config.DB_OPTS)
      else
        for col in v
          @[k][col] = new DBProxy (new DBHandler perfix + k + postfix, col, config.DB_OPTS)

module.exports = MongoDao