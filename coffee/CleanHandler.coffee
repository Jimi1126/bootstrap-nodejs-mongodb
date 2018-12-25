Handler = require "./Handler"
ExecHandler = require "./ExecHandler"
LOG = LoggerUtil.getLogger "CleanHandler"
class CleanHandler extends Handler
  handle: (callback)->
    LOG.info "清理"
    callback()
      
module.exports = CleanHandler