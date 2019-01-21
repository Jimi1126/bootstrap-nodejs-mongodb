Handler = require "./Handler"
LOG = LoggerUtil.getLogger "ParseProHandler"
class ParseProHandler extends Handler
  handle: (callback)->
    LOG.info "保单解析"
    callback()

module.exports = ParseProHandler