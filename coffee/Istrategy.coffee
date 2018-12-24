###
# 策略接口
###
class Istrategy
  ###
  # 策略执行入口
  ###
  execute: ->
    throw "you should overload this method for implement your business"
module.exports = Istrategy