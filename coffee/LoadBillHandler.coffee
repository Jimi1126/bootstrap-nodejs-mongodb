Handler = require "./Handler"
ExecHandler = require "./ExecHandler"
LOG = LoggerUtil.getLogger "LoadBillHandler"
class LoadBillHandler extends Handler
  handle: (item, callback)->
    LOG.info "下载 #{item.bill_name}"
    # 检查保单是否存在
    mongoDao[argv.project].history.count {bill_name: item.bill_name.replace( ".xml" , "" )}, (err, count) =>
      return callback err if err
      # if num > 0
      #   msg = "已下载过 #{item.bill_name}"
      #   debug msg.bold.yellow
      #   return clean item , ()->
      #     callback new Error msg
      cmd = @data.conf.remote?.fetch_bill
      LOG.info "项目配置未定义 [#{entry.conf.project}]: remote.fetch_bill" if not cmd
      try
        fetch = sprintf.sprintf cmd, {
          url: item.bill_name
          down_url: "downFile/#{item.bill_name}"
        }
      catch err
        LOG.info err
      exec = new ExecHandler().queue_exec(3);
      exec fetch, (err, stdout, stderr, spent) =>
        callback err if err
        @data.conf.data.total.files += 1
        callback()
module.exports = LoadBillHandler