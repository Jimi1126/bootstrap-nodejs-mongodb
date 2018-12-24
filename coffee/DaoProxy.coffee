Proxy = require "./Proxy"
LOG = loggerUtil.getLogger "DAOProxy"
###
# 将该代理的父类原型指向目标对象父类的原型，明确该代理的类型
# 至此该Proxy将为目标对象类型，且不再是Proxy类型
###
class DAOProxy extends Proxy
  constructor: (target)->
    super(target)
    @.__proto__ = target.__proto__
  proxy: (f)->
    that = @
    if f.name is "init"
      return ->
        f.apply that.target, arguments
    ->
      [params..., callback] = arguments
      startTime = moment()
      params.push ->
        endTime = moment()
        LOG.info "#{@.__proto__.constructor.name}.#{f.name}:访问数据库#{params[0]}集合#{params[1]}  --#{endTime - startTime}ms"
        callback.apply @, arguments
      f.apply that.target, params
module.exports = DAOProxy