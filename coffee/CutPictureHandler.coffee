Handler = require "./Handler"
ExecHandler = require "./ExecHandler"
LOG = LoggerUtil.getLogger "CutPictureHandler"
class CutPictureHandler extends Handler
  handle: (callback)->
    LOG.info "切图"
    callback()
      
module.exports = CutPictureHandler