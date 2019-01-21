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
      paramStr = if f.name is "insert" then ["..."] else (JSON.stringify(p) for p in params)
      params.push ->
        endTime = moment()
        LOG.info "#{that.target.constructor.name}.#{f.name}:#{paramStr.join ","}  --#{endTime - startTime}ms"
        callback.apply @, arguments
      try
        f.apply that.target, params
      catch e
        LOG.error "#{that.target.constructor.name}.#{f.name}:#{paramStr.join ","}  --#{moment() - startTime}ms\n#{e.stack}"
        callback e
module.exports = DBProxy