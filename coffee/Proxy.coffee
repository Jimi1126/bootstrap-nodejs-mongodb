###
# 动态代理
# 通过传入目标对象实例化代理类
# 外部通过该代理间接访问目标对象
# 我们可以通过该代理来规范外部的访问、提供安全的调用、丰富目标对象的行为
# 通常我们需要通过继承该类来制定不同类型的对象的代理，否则外部访问与直接访问目标对象无异
# 鉴于javaScript弱类型的特征，建议在子类中做类型限制，使代理模块化
###
class Proxy
  constructor: (@target)->
    @instance @target if @target
  ###
  # 实例化代理过程
  # 通过遍历目标对象以及递归原型链，对目标对象的行为进行封装
  # 默认地，只对目标对象的行为进行封装代理，如果你需要代理目标对象的属性或更多的功能，可以覆盖该过程
  #
  # @param target 目标对象
  # @return null
  ###
  instance: (target)->
    for key in Object.getOwnPropertyNames target
      if key isnt "constructor"
        if typeof target[key] is "function"
          @[key] = @proxy target[key] unless @.hasOwnProperty key
        else
          @[key] = target[key] unless @.hasOwnProperty key
    @instance target.__proto__  if target.__proto__ and target.__proto__ isnt Object.prototype
  ###
  # 目标对象行为的封装
  # 默认地除了目标对象行为，不做其他操作
  # 你需要在子类中覆盖该方法，制定需要类型的对象行为封装
  #
  # @param f 目标对象行为
  # @return 目标对象封装后的行为
  ###
  proxy: (f)->
    that = @
    ->
      try
        f.apply that.target, arguments
      catch e
        LOG.error e.stack
module.exports = Proxy