Proxy = require "./Proxy"
LOG = LoggerUtil.getLogger "HandlerProxy"
###
# 将该代理的父类原型指向目标对象父类的原型，明确该代理的类型
# 至此该Proxy将为目标对象类型，且不再是Proxy类型
###
class HandlerProxy extends Proxy
  constructor: (target)->
    super(target)
  proxy: (f)->
    that = @
    ->
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