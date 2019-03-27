Proxy = require "./Proxy"
LOG = LoggerUtil.getLogger "StrategyProxy"
###
# 策略代理类
###
class StrategyProxy extends Proxy
  io: null
  constructor: (target)->
    super(target)
  proxy: (f)->
    that = @
    ->
      ## 默认只代理策略的执行方法，并只添加日志记录能力
      if f.name is "execute"
        LOG.info "策略#{that.target.constructor.name}.#{f.name}开始执行"
        that.io and that.io.socket.emit 0, "策略#{that.target.constructor.name}.#{f.name}开始执行"
        startTime = moment()
        [...params] = arguments
        callback = params.pop()
        cb = ->
          endTime = moment()
          LOG.info "策略#{that.target.constructor.name}.#{f.name}执行结束 --#{endTime - startTime}ms"
          that.io and that.io.socket.emit 1, "策略#{that.target.constructor.name}.#{f.name}执行结束 --#{endTime - startTime}ms"
          typeof callback is "function" and callback.apply @, arguments
        params.push cb
        f.apply that.target, params
      else
        f.apply that.target, arguments

module.exports = StrategyProxy