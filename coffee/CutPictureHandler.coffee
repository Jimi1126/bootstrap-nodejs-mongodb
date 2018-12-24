Handler = require "./Handler"
ExecHandler = require "./ExecHandler"
LOG = LoggerUtil.getLogger "CutPictureHandler"
class CutPictureHandler extends Handler
  handle: (item, callback)->
    LOG.info "切图"
    callback()
      
module.exports = CutPictureHandler