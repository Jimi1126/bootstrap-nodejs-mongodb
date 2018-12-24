Handler = require "./Handler"
ExecHandler = require "./ExecHandler"
LOG = LoggerUtil.getLogger "OCRHandler"
class OCRHandler extends Handler
  handle: (item, callback)->
    LOG.info "机器识读图片信息"
    callback()
      
module.exports = OCRHandler