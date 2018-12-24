###
# 工具类
###
lodash = require "lodash"
sprintf = require "sprintf-js"

Utils = {}
recursion lodash
recursion sprintf
Utils.getOPropNms = getOPropNms = Object.getOwnPropertyNames
#递归引用
Utils.recursion = recursion = (target)->
	for key in getOPropNms target
		@[key] = target[key] if typeof target[key] is "function"
	arguments.callee target.__proto__ if target.__proto__ and target.__proto__ isnt Object.prototype

module.exports = Utils
