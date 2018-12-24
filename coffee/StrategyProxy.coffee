Proxy = require "./Proxy"
LOG = LoggerUtil.getLogger "StrategyProxy"
###
# 策略代理
# 将该代理的父类原型指向目标对象父类的原型，明确该代理的类型
# 至此该Proxy将为目标对象类型，且不再是Proxy类型
###
class StrategyProxy extends Proxy
  constructor: (target)->
    super(target)
    @.__proto__ = target.__proto__
  proxy: (f)->
    that = @
    ->
      if f.name is "execute"
        LOG.info "策略#{that.target.constructor.name}.#{f.name}开始执行"
        startTime = moment()
        [...params] = arguments
        callback = params.pop()
        cb = =>
          endTime = moment()
          LOG.info "策略#{that.target.constructor.name}.#{f.name}执行结束 --#{endTime - startTime}ms"
          typeof callback is "function" and callback.apply @, arguments
        params.push cb
        f.apply that.target, params
      else
        f.apply that.target, arguments

module.exports = StrategyProxy