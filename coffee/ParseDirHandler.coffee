Handler = require "./Handler"
ExecHandler = require "./ExecHandler"
LOG = LoggerUtil.getLogger "ParseDirHandler"
class ParseDirHandler extends Handler
  handle: (callback)->
    lines = lines.split /[\r\n]+/ if "string" == typeof @data.lines
    LOG.info "FTP目录解析: #{@data.lines.length} 行"
    # 反向排序，一般 ftp 返回結果，舊文件在後面
    @data.lines.reverse()
    urls = []
    for line in @data.lines
      line = line.trim()
      # continue if line is "" or not /\.xml/i.test line
      arr = /(\S+)\s+(\S+\s+\S+\s+\S+)\s+(\S+)$/.exec line
      continue unless arr?[3]
      if argv?.bill_end 
        bill_end = new RegExp("[#{argv.bill_end}]\\d{2}.xml$")
        continue unless bill_end.test arr[3]
      item = {
        bill_name: arr[3]
        size: parseInt arr[1]
        create_at: moment(arr[2], "MMM D HH:mm").format "YYYYMMDDHHmmss"
      }
      continue if item.size < 10
      urls.push item
    # 按照文件日期排序，舊文件在前
    urls.sort (a, b) ->
      if a.create_at < b.create_at then -1 else if a.create_at > b.create_at then 1 else 0
    @data.urls = urls
    callback()

module.exports = ParseDirHandler