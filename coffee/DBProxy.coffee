Proxy = require "./Proxy"
LOG = LoggerUtil.getLogger "DBProxy"
###
# 数据库操作层代理
###
class DBProxy extends Proxy
  constructor: (target)->
    super(target)
  proxy: (f)->
    that = @
    if f.name is "connect"
      return ->
        f.apply that.target, arguments
    ->
      [...params] = arguments
      callback = params.pop()
      startTime = moment()
      params.push ->
        endTime = moment()
        LOG.info "#{that.target.constructor.name}.#{f.name}:#{JSON.stringify params[0]}  --#{endTime - startTime}ms"
        callback.apply @, arguments
      f.apply that.target, params
module.exports = DBProxy