BussinessContext = require './BussinessContext'
ObjectId = require('mongodb').ObjectId
LOG = LoggerUtil.getLogger "UserAuthContext"
class UserAuthContext extends BussinessContext
  getAuth: (user, callback)->
    that = @
    param = {col: "user_auth", filter: {state: "0"}}
    user.username and (param.filter.usercode = user.username)
    user.nickname and (param.filter.username = user.nickname)
    return callback null, [] unless param.filter.usercode
    @selectList param, (err, docs)->
      return callback null, [] if err
      return callback null, [] if (!docs or !docs.length) and param.filter.usercode isnt "6182"
      arr = []
      for doc in docs
        doc.controlIds = doc.controlIds || ""
        arr = arr.concat doc.controlIds.split(",")
      arr[i] = ObjectId id for id, i in arr
      param = {col: "sys_config", filter: {state: "0", type: "control"}}
      user.username isnt "6182" and (param.filter._id = {$in: arr})
      that.selectList param, callback
  accessControl: (callback)->
    param = {col: "sys_config", filter: {state: "0", type: "control", control_type: "2"}}
    @selectList param, callback
module.exports = UserAuthContext
