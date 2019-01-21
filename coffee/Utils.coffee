###
# 工具类
###
fs = require 'fs'
Utils = {}
Utils.getOPropNms = getOPropNms = Object.getOwnPropertyNames

Utils.rmdir = (path, callback)->
	files = [];
	if fs.existsSync path
		files = fs.readdirSync path
		files.forEach (file, index)->
			curPath = path + "/" + file
			if fs.statSync(curPath).isDirectory()
				Utils.rmdir curPath, ()->
			else
				fs.unlinkSync curPath
		fs.rmdir path, callback

module.exports = Utils
