Proxy = require "./Proxy"
LOG = LoggerUtil.getLogger "HandlerProxy"
###
# 操作者的默认代理类
###
class HandlerProxy extends Proxy
  io: null
  constructor: (target)->
    super(target)
  proxy: (f)->
    that = @
    ->
      ## 默认只代理操作者的执行方法，并只添加日志记录能力
      if f.name is "execute"
        startTime = moment()
        [...params] = arguments
        haveParam = true if params.length > 0
        callback = params.pop()
        if typeof callback is "function"
          cb = ->
            endTime = moment()
            LOG.info "#{that.target.constructor.name}.#{f.name}操作结束  --#{endTime - startTime}ms"
            that.io and that.io.socket.emit 1, "#{that.target.constructor.name}.#{f.name}操作结束  --#{endTime - startTime}ms"
            callback.apply @, arguments
          params.push cb
        else 
          params.push callback if callback and haveParam
          cb = ->
            endTime = moment()
            LOG.info "#{that.target.constructor.name}.#{f.name}操作结束  --#{endTime - startTime}ms"
            that.io and that.io.socket.emit 1, "#{that.target.constructor.name}.#{f.name}操作结束  --#{endTime - startTime}ms"
          params.push cb
        try
          f.apply that.target, params
        catch e
          LOG.error e.stack
      else
        try
          f.apply that.target, arguments
        catch e
          LOG.error e.stack

module.exports = HandlerProxy