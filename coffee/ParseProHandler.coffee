Handler = require "./Handler"
ExecHandler = require "./ExecHandler"
LOG = LoggerUtil.getLogger "ParseProHandler"
class ParseProHandler extends Handler
  handle: (item, callback)->
    LOG.info "解析项目"
    callback()
      
module.exports = ParseProHandler