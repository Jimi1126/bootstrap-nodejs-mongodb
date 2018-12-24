log4js = require "log4js"
configLog = require "../config/config-log.json"
log4js.configure configLog

# 日志输出
class LoggerUtil
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