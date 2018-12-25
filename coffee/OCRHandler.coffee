Handler = require "./Handler"
ExecHandler = require "./ExecHandler"
LOG = LoggerUtil.getLogger "OCRHandler"
class OCRHandler extends Handler
  handle: (callback)->
    LOG.info "OCR"
    callback()
      
module.exports = OCRHandler