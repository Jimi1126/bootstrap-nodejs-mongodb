###
# 操作者接口
# 通过继承EventEmitter的事件响应机制，实现观察者模式以及操作链模式
# 一个操作者需要具备以下几点：
# 执行操作的能力
# 判断可以操作的能力
# 当执行模式为串行操作也就是操作链模式，还需要知道相邻的上、下位操作者
###
EventEmitter = require('events').EventEmitter
HandlerProxy = require "./HandlerProxy"
class Handler extends EventEmitter
  lastHandler: null
  nextHandler: null
  constructor: (@data)->
    super()
    ## 注册next事件，用于通知下一位操作者
    @on 'next', ->
      [...params] = arguments
      callback = params.pop()
      callback()
      if @nextHandler instanceof HandlerProxy or @nextHandler instanceof Handler
        @nextHandler.execute.apply @nextHandler, params
      else
        @nextHandler?.apply? @, params
  ###
  # 操作入口
  # 控制操作者的执行模式
  # 默认地，操作者会通过verify来判断的自身是否应该进行操作
  # 当可以进行操作时，调用handle主操作方法
  # 当操作完成后，通过触发next事件来通知下一位操作者
  # 你可在子类中覆盖该方法，以重新控制操作者的执行模式
  ###
  execute: ()->
    that = @
    if @verify()
      [...fparams] = arguments
      callback = fparams.pop()
      cb = ->
        [...params] = arguments
        params.unshift "next"
        params.push callback
        that.emit.apply that, params
      fparams.push cb
      @handle.apply @, fparams
    else
      @emit 'next', callback
  ## 判断是否应该做操作，默认地返回true，具体判断逻辑请覆盖该方法
  verify: ->
    return true
  ## 操作者所拥有的操作能力，子类必须实现该方法，以指定操作者的拥有的操作能力
  handle: (callback)->
   throw "you must implement this method"
  setLastHandler: (@lastHandler) ->
  setNextHandler: (@nextHandler) ->
module.exports = Handler