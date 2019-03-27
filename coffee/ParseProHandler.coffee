Handler = require "./Handler"
LOG = LoggerUtil.getLogger "ParseProHandler"
class ParseProHandler extends Handler
	handle: (param, callback)->
		if !param or !param.data
			LOG.warn "#{argv.project}：没有需要解析文件名的内容"
			return callback "没有需要解析文件名的内容"
		callback null, param

module.exports = ParseProHandler
