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
Utils.uuid = (len, radix)->
	chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
	uuid = []
	radix = radix || chars.length
	if len
		uuid[i] = chars[0 | Math.random() * radix] for i in [0...len]
	else
		uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-'
		uuid[14] = '4';
		for i in [0...36]
			if (!uuid[i])
				r = 0 | Math.random() * 16;
				uuid[i] = chars[ if (i == 19) then (r & 0x3) | 0x8 else r]
	uuid.join('')

module.exports = Utils
