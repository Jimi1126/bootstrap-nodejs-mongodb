###
# 下载策略
###
Istrategy = require "./Istrategy"
class DownStrategy extends Istrategy
  ###
  # 策略的业务数据
  # 通过在实例化操作者过程中提供引用，让所在该策略中的操作者都有权访问
  # 因此一个操作者将访问上一位操作者处理完的数据
  ###
  data: {}
  ## 操作者名称列表，策略会根据这个顺序调用操作者
  handlerList: []
  constructor: (execOrderList, socket)->
    super()
    if execOrderList and execOrderList instanceof Array
      for moduleName, i in execOrderList
        continue unless moduleName or moduleName isnt ""
        Handler = require './' + moduleName
        proxy = new HandlerProxy new Handler(@data)
        proxy.io = {socket: socket}
        @handlerList.push proxy
  ###
  # 执行策略
  # 下载策略也是采用操作链模式，不同与预下载策略
  # 下载策略采用async模块提供的series方法进行流程控制，由中间函数next通知下一位操作者
  # 于是我们只需将操作者的执行方法交给async就行了
  # 注：
  #   下载策略需用到预下载中的业务数据，将下载策略对象的业务数据引用指向预下载策略对象中的业务数据时
  #   操作者所持有的业务数据对象引用也应该重新指向下载策略的业务数据
  ###
  execute: (callback)->
    callback() if @handlerList.length is 0
    arr = @handlerList.map((handler)=> handler.target.data = @data; (next)-> handler.execute.call handler, next)
    async.series arr, callback
module.exports = DownStrategy