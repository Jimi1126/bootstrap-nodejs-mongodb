Handler = require "./Handler"
ExecHandler = require "./ExecHandler"
LOG = LoggerUtil.getLogger "OCRHandler"
class OCRHandler extends Handler
	handle: (param, callback)->
		that = @
		if !param or !param.data
			LOG.warn "没有OCR的实体"
			return callback "没有OCR的实体"
		image = param.data
		if !that.data.outputStatis
			that.data.outputStatis = {
				task: that.data.deploy.task._id.toString()
				project: that.data.deploy.project._id.toString()
				statis: {}
			}
		if !param.enterEntitys
			LOG.warn "没有OCR的实体"
			param.socket?.emit 0, "#{image.img_name}：没有OCR的实体"
			return callback null, param
		if that.data.deploy.task.flowList[0] isnt "ocr"
			LOG.warn "#{image.img_name}：不需要OCR"
			param.socket?.emit 0, "#{image.img_name}：不需要OCR"
			return callback null, param
		param.socket?.emit 0, "#{image.img_name}：开始进行OCR"
		statis = that.data.outputStatis.statis
		statis["ocr"] || (statis["ocr"] = {})
		stage_handler = statis["ocr"]["ocr"] || (statis["ocr"]["ocr"] = {chatLength: 0, symbol: 0, count: 0})
		async.each param.enterEntitys, (enterEntity, cb)->
			file_path = enterEntity.path + enterEntity.img_name
			fs.readFile file_path, (err)->
				if err
					enterEntity.stage = "error"
					enterEntity.remark = err
					param.socket?.emit -1, "#{image.img_name}：OCR失败"
					return cb null
				param.socket?.emit 0, "#{image.img_name}：OCR完成"
				res = {"fc001": "1", "fc002": "2", "fc003": "3"}
				enterEntity.stage = that.data.deploy.task.flowList[1]
				for en in enterEntity.enter
					delete en.src_type
					if res[en.field_id]
						en.handler["ocr"] = "ocr"
						en.value["ocr"] = res[en.field_id]
						stage_handler.chatLength += Utils.getLength res[en.field_id]
						stage_handler.symbol += if Utils.replaceAll(res[en.field_id], "？", "").length is 0 then 1 else 0
						stage_handler.count++
				cb null
		, (err)->
			LOG.error err if err
			callback null, param

module.exports = OCRHandler
