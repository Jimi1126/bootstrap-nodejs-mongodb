###
# 预下载策略
# 采用操作链模式
###
Istrategy = require "./Istrategy"
Handler = require "./Handler"
class ProDownStrategy extends Istrategy
  constructor: (execOrderList, socket)->
    super()
    ###
    # 策略的业务数据
    # 通过在实例化操作者过程中提供引用，让所在该策略中的操作者都有权访问
    # 因此一个操作者将访问上一位操作者处理完的数据
    # 一般地操作者通过verify方法检查业务数据以决定是否进行本身的操作
    ###
    @data = {}
    ## 操作者名称列表，预下载策略会根据这个顺序调用操作者
    @handlerList = []
    if execOrderList and execOrderList instanceof Array
      for moduleName, i in execOrderList
        continue unless moduleName or moduleName isnt ""
        Handler = require './' + moduleName
        proxy = new HandlerProxy new Handler(@data)
        proxy.io = {socket: socket}
        @handlerList.push proxy
  ###
  # 执行策略
  # 预下载策略采用操作链模式，延伸于责任链模式
  # 不同于责任链模式的是，操作链模式节点在操作完成后不会退出模式，
  # 而是继续传递到下一个节点，直到链尾
  ###
  execute: ()->
    [...params] = arguments
    callback = params.pop()
    callback?() if @handlerList.length is 0
    for handlerProxy, i in @handlerList
      handlerProxy.setLastHandler @handlerList[i - 1]
      if @handlerList[i + 1]
        handlerProxy.setNextHandler @handlerList[i + 1]
      else
        handlerProxy.setNextHandler callback
      handlerProxy.execute.apply handlerProxy, params if i is 0
module.exports = ProDownStrategy