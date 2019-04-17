Handler = require "./Handler"
LOG = LoggerUtil.getLogger "ParseDirHandler"
class ParseDirHandler extends Handler
  handle: ()->
    [...params] = arguments
    callback = params.pop()
    return callback params[0] if params.length > 0
    unless @data.deploy.images
      LOG.warn "#{argv.project}：没有进行图片配置"
      return callback null
    @data.originals = []
    for image in @data.deploy.images
      if /^dir/.test image.d_url
        reg = new RegExp("(\\S+)\\s+(\\S+)\\s+(\\S+)\\s+(\\S+)$")
      else
        reg = new RegExp("(\\S+)\\s+(\\S+\\s+\\S+\\s+\\S+)\\s+(\\S+)$")
      lines = if image.lines then image.lines else []
      lines = lines.split /[\r\n]+/ if "string" == typeof lines
      LOG.info "#{image.d_url}目录解析: #{lines.length} 行"
      # 反向排序，一般 ftp 返回结果，旧文档在后面
      lines.reverse()
      lines.forEach (line)=>
        line = line.trim()
        arr = reg.exec line
        return unless /(png|jpg|pdf|tif)$/.test line
        if /^dir/.test image.d_url
          size = parseInt arr[3].replace(/,/g, "")
          arr[3] = arr[4]
          upload_at = moment(arr[1]+" "+ arr[2], "YYYY/MM/DD HH:mm").format "YYYYMMDDHHmmss"
        else
          size = parseInt arr[1]
          upload_at = moment(arr[2], "MMM D HH:mm").format "YYYYMMDDHHmmss"
        @data.originals.push {
          deploy_id: image._id.toString()
          type: "original"
          code: image.code
          img_name: arr[3]
          d_url: image.d_url
          s_url: "#{image.s_url}/image/"
          size: size
          upload_at: upload_at
        }
    callback()

module.exports = ParseDirHandler