###
# 策略上下文
# 对策略进行二次封装，避免高层模块对策略的直接调用
# 实例化参数必须符合Istrategy策略规范，并且必须是Istrategy子类
###
Istrategy = require './Istrategy'
Context = require './Context'
class StrategyContext extends Context
  constructor: (strategy) ->
    super()
    unless (strategy.target || strategy) instanceof Istrategy
      throw 'you have to provide a strategy'
    @strategy = strategy
  execute: ->
    @strategy.execute.apply @strategy, arguments
module.exports = StrategyContext