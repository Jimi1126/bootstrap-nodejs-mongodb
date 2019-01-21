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
      # 反向排序，一般 ftp 返回結果，舊文件在後面
      lines.reverse()
      lines.forEach (line)=>
        line = line.trim()
        arr = /(\S+)\s+(\S+\s+\S+\s+\S+)\s+(\S+)$/.exec line
        return unless arr?[3]
        @data.images.push {
          image_type: image._id.toString()
          code: image.code
          image_name: arr[3]
          d_url: image.d_url
          s_url: image.s_url
          size: parseInt arr[1]
          create_at: moment(arr[2], "MMM D HH:mm").format "YYYYMMDDHHmmss"
        }
    callback()
    # for cmd,lines of @data.lineObj
    #   paths = []
    #   lines = lines.split /[\r\n]+/ if "string" == typeof lines
    #   LOG.info "#{cmd.substring(4)}目录解析: #{lines.length} 行"
    #   # 反向排序，一般 ftp 返回結果，舊文件在後面
    #   lines.reverse()
    #   urls = []
    #   for line in lines
    #     line = line.trim()
    #     # continue if line is "" or not /\.xml/i.test line
    #     arr = /(\S+)\s+(\S+\s+\S+\s+\S+)\s+(\S+)$/.exec line
    #     continue unless arr?[3]
    #     if argv?.bill_end 
    #       bill_end = new RegExp("[#{argv.bill_end}]\\d{2}.xml$")
    #       continue unless bill_end.test arr[3]
    #     item = {
    #       bill_name: arr[3]
    #       size: parseInt arr[1]
    #       create_at: moment(arr[2], "MMM D HH:mm").format "YYYYMMDDHHmmss"
    #     }
    #     continue if item.size < 10
    #     paths.push item
    #   # 按照文件日期排序，舊文件在前
    #   paths.sort (a, b) ->
    #     if a.create_at < b.create_at then -1 else if a.create_at > b.create_at then 1 else 0
    #   @data.billInfos ?= {}
    #   @data.billInfos[cmd] = paths

module.exports = ParseDirHandler