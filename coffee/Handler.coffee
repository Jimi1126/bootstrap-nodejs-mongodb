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
    @on 'next', ->
      [...params] = arguments
      callback = params.pop()
      callback()
      if @nextHandler instanceof HandlerProxy or @nextHandler instanceof Handler
        @nextHandler.execute.apply @nextHandler, params
      else
        @nextHandler?.apply @, params
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
  verify: ->
    return true
  handle: (callback)->
   throw "you must implement this method"
  setLastHandler: (@lastHandler) ->
  setNextHandler: (@nextHandler) ->
module.exports = Handler