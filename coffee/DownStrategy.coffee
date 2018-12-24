###
# 下载策略
###
Istrategy = require "./Istrategy"
class DownStrategy extends Istrategy
  ###
  # 策略的业务数据，操作者都有权访问并修改
  # 一个操作者将访问上一位操作者处理完的数据
  # 操作者通过verify方法来检查数据并决定是否执行操作
  ###
  data: {}
  ## 操作者名称列表，策略会根据这个顺序调用操作者
  handlerList: []
  constructor: (execOrderList)->
    super()
    if execOrderList and execOrderList instanceof Array
      for moduleName, i in execOrderList
        continue unless moduleName or moduleName isnt ""
        handler = require './' + moduleName
        @handlerList.push new HandlerProxy new handler(@data)
  execute: (callback)->
    callback() if @handlerList.length is 0
    async.eachLimit @data.urls, @data.conf.remote.max_connections, (url, next) =>
      arr = @handlerList.map((handler)=> handler.target.data = @data; (next)-> handler.execute.apply handler, [url, next])
      arr.push next
      async.series arr
    , callback
module.exports = DownStrategy