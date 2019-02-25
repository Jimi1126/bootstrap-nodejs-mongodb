Handler = require "./Handler"
ExecHandler = require "./ExecHandler"
LOG = LoggerUtil.getLogger "OCRHandler"
class OCRHandler extends Handler
	handle: (callback)->
		that = @
		unless @data.enterEntitys
			LOG.warn "#{argv.project}：没有录入的内容"
			return callback null
		async.eachLimit @data.enterEntitys, 50, (enterEntity, cb)->
			file_path = enterEntity.path + enterEntity.img_name
			fs.readFile file_path, (err)->
				if err
					enterEntity.stage = "error"
					enterEntity.remark = err
					return cb null
				result = {}
				enterEntity.stage = "ocr"
				for en in enterEntity.enter
					delete en.src_type
					# en.value = result[en.field_id]
					en.value = "123"
				cb null
		, callback

module.exports = OCRHandler
