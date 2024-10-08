Handler = require "./Handler"
ExecHandler = require "./ExecHandler"
LOG = LoggerUtil.getLogger "ScanHandler"
class ScanHandler extends Handler
  handle: ()->
    [...params] = arguments
    callback = params.pop()
    return callback params[0] if params.length > 0
    that = @
    unless that.data.deploy.project
      LOG.warn "项目未配置 [#{argv.project}]"
      return callback? null
    unless that.data.deploy.images
      LOG.warn "项目未进行图片配置 [#{argv.project}]"
      return callback? null
    exec = new ExecHandler().queue_exec()
    async.each that.data.deploy.images, (image, cb)->
      return cb null unless image.d_url
      cmd = image.d_url
      if !/^dir/.test(cmd)  and !/^curl/.test(cmd)
        cmd = "curl #{cmd}"
      cmd_display = cmd?.replace /\s+\-u\s+\S+/g, " -u '***:***'" #不打印密码
      LOG.info "开始扫描 image.d_url: #{cmd_display}"
      start_at = moment()
      exec cmd, (error, lines, stderr) ->
        lines = ("" + lines).trim().split /[\r\n]+/
        if error
          LOG.error error
          lines = []
        LOG.info "扫描结束, #{lines.length} 行, #{moment() - start_at}ms"
        image.lines = lines
        cb null
    , callback
module.exports = ScanHandler