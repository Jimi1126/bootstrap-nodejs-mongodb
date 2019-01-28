Handler = require "./Handler"
ExecHandler = require "./ExecHandler"
LOG = LoggerUtil.getLogger "ScanHandler"
class ScanHandler extends Handler
  handle: (callback)->
    that = @
    unless that.data.deploy.project
      LOG.warn "项目未配置 [#{argv.project}]"
      return callback null
    unless that.data.deploy.images
      LOG.warn "项目未进行图片配置 [#{argv.project}]"
      return callback null
    exec = new ExecHandler().queue_exec()
    async.each that.data.deploy.images, (image, cb)->
      return cb null unless image.d_url
      cmd = image.d_url
      cmd = "curl #{cmd}" unless cmd.startsWith "curl"
      cmd_display = cmd?.replace /\s+\-u\s+\S+/g, " -u '***:***'" #不打印密码
      LOG.info "开始扫描 image.d_url: #{cmd_display}"
      start_at = moment()
      exec cmd, (error, lines, stderr) ->
        lines = ("" + lines).trim().split /[\r\n]+/
        LOG.info "扫描结束, #{lines.length} 行, #{moment() - start_at}ms"
        image.lines = lines
        cb error
    , callback
module.exports = ScanHandler