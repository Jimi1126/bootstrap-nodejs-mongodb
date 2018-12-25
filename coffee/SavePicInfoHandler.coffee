Handler = require "./Handler"
ExecHandler = require "./ExecHandler"
LOG = LoggerUtil.getLogger "SavePicInfoHandler"
class SavePicInfoHandler extends Handler
  handle: (callback)->
    LOG.info "保存图片信息"
    callback()
      
module.exports = SavePicInfoHandler