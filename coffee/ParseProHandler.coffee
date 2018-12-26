Handler = require "./Handler"
ExecHandler = require "./ExecHandler"
LOG = LoggerUtil.getLogger "ParseProHandler"
class ParseProHandler extends Handler
  handle: (callback)->
    LOG.info "保单解析"
    for cmd, billInfo of @data.billInfos
      for bill in billInfo
        # 单号
        bill.source ?= {}
        bill.source.bill_num = bill.bill_name.substring 5, bill.bill_name.lastIndexOf "."
        # 类型arr
        bill.source.docs = ["lk001"]
        # 批次号
    callback()
      
module.exports = ParseProHandler