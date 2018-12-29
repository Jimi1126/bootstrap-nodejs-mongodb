Handler = require "./Handler"
LOG = LoggerUtil.getLogger "ConvertHandler"
class ConvertHandler extends Handler
  handle: (callback)->
    LOG.info "图片转换"
    callback()
      
module.exports = ConvertHandler