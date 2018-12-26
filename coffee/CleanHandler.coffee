###
# 图片下载解析等操作后进行内存磁盘释放操作
###
Handler = require "./Handler"
ExecHandler = require "./ExecHandler"
LOG = LoggerUtil.getLogger "CleanHandler"
class CleanHandler extends Handler
  handle: (callback)->
    LOG.info "清理"
    callback()
      
module.exports = CleanHandler