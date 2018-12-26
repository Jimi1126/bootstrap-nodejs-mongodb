Proxy = require "./Proxy"
LOG = loggerUtil.getLogger "DAOProxy"
###
# 数据库操作层代理
###
class DAOProxy extends Proxy
  constructor: (target)->
    super(target)
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