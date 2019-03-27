BussinessContext = require './BussinessContext'
EnterContext = require "./EnterContext"
exec = require("child_process").exec
ObjectId = require('mongodb').ObjectId
LOG = LoggerUtil.getLogger "SysConfigContext"
class SysConfigContext extends BussinessContext
	accessControl: (param, callback)->
    
module.exports = SysConfigContext
