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
			return if !fs.existsSync curPath
			if fs.statSync(curPath).isDirectory()
				Utils.rmdir curPath, ()->
			else
				fs.unlinkSync curPath
		fs.rmdir path, callback
	else 
		callback "unexist"
Utils.cropFile = (source, target, callback)->
	if fs.existsSync source
		fs.readFile source, (err, data)->
			return callback err if err
			fs.writeFile target, data, callback
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
	uuid.join('').toLowerCase()

Utils.getLength = (str)->
	str = str || ""
	str = if typeof str is "string" then str else str + ""
	str.replace(/[\u0391-\uFFE5]/g,"aa").length  #先把中文替换成两个字节的英文，在计算长度

Utils.replaceAll = (target, sce, val)->
	if typeof target is "string"
		target = target.replace new RegExp(sce, "g"), val
	if Array.isArray target
		for t, i in target
			target[i] = val if target[i] is sce
	target
Utils.clone = (obj)->
	try
		JSON.parse JSON.stringify(obj)
	catch e
		LOG?.error e.stack
		obj

module.exports = Utils
