Proxy = require "./Proxy"
LOG = LoggerUtil.getLogger "HandlerProxy"
###
# 操作者的默认代理类
###
class HandlerProxy extends Proxy
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
            callback.apply @, arguments
          params.push cb
        else 
          params.push callback if callback and haveParam
          cb = ->
            endTime = moment()
            LOG.info "#{that.target.constructor.name}.#{f.name}操作结束  --#{endTime - startTime}ms"
          params.push cb
        f.apply that.target, params
      else
        f.apply that.target, arguments

module.exports = HandlerProxy