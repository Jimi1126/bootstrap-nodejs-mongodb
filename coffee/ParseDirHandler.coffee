Handler = require "./Handler"
LOG = LoggerUtil.getLogger "ParseDirHandler"
class ParseDirHandler extends Handler
  handle: (callback)->
    unless @data.deploy.images
      LOG.warn "#{argv.project}：没有进行图片配置"
      return callback null
    @data.images = []
    for image in @data.deploy.images
      lines = if image.lines then image.lines else []
      lines = lines.split /[\r\n]+/ if "string" == typeof lines
      LOG.info "#{image.d_url}目录解析: #{lines.length} 行"
      # 反向排序，一般 ftp 返回结果，旧文档在后面
      lines.reverse()
      lines.forEach (line)=>
        line = line.trim()
        arr = /(\S+)\s+(\S+\s+\S+\s+\S+)\s+(\S+)$/.exec line
        return unless arr?[3]
        @data.images.push {
          _id: Utils.uuid 24, 16
          deploy_id: image._id.toString()
          type: "image"
          code: image.code
          img_name: arr[3]
          d_url: image.d_url
          s_url: image.s_url
          size: parseInt arr[1]
          state: 0
          upload_at: moment(arr[2], "MMM D HH:mm").format "YYYYMMDDHHmmss"
        }
    callback()

module.exports = ParseDirHandler