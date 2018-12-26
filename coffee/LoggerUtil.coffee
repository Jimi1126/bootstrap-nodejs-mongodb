###
# 日志模块
###
log4js = require "log4js"
configLog = require "../config/config-log.json"
log4js.configure configLog
class LoggerUtil
  ###
  # 默认全局使用default类别
  # 通过传入类名，生成该类类别的日志对象
  ###
  getLogger: (category)->
    unless category or category is "" or category is "default"
      log4js.getLogger "default"
    else
      configLog.categories[category] = configLog.categories.default
      log4js.configure configLog
      log4js.getLogger category
  useLogger: (app, logger)->
    app?.use?(log4js.connectLogger(logger || @getLogger(), {
      format: '[:remote-addr :method :url :status :response-timems][:referrer HTTP/:http-version :user-agent]'
    }))
module.exports = new LoggerUtil()