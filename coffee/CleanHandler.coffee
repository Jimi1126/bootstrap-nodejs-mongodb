Handler = require "./Handler"
ExecHandler = require "./ExecHandler"
LOG = LoggerUtil.getLogger "CleanHandler"
class CleanHandler extends Handler
  handle: (item, callback)->
    LOG.info "切图"
    callback()
      
module.exports = CleanHandler