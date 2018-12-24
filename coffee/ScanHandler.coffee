Handler = require "./Handler"
ExecHandler = require "./ExecHandler"
LOG = LoggerUtil.getLogger "ScanHandler"
class ScanHandler extends Handler
  handle: (callback)->
    that = @
    cmd = @data.conf.remote?.scan
    cmd_display = cmd?.replace /\s+\-u\s+\S+/g, " -u '***:***'" #不打印密码
    LOG.info "开始扫描 remote.scan: #{cmd_display}"
    start_at = moment()
    return callback new Error("项目配置未定义 [#{conf.project}]: remote.scan"), "" if not cmd
    exec = new ExecHandler().queue_exec()
    exec cmd, (error, lines, stderr) ->
      lines = ("" + lines).trim().split /[\r\n]+/
      LOG.info "扫描结束, #{lines.length} 行, #{moment() - start_at}ms"
      that.data.lines = lines
      callback()
module.exports = ScanHandler