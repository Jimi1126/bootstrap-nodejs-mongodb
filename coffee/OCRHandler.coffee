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
		if !param.enterEntitys
			LOG.warn "没有OCR的实体"
			param.socket?.emit 0, "#{image.img_name}：没有OCR的实体"
			return callback null, param
		param.socket?.emit 0, "#{image.img_name}：开始进行OCR"
		outputStatis = []
		async.eachLimit @data.enterEntitys, 50, (enterEntity, cb)->
			file_path = enterEntity.path + enterEntity.img_name
			fs.readFile file_path, (err)->
				if err
					enterEntity.stage = "error"
					enterEntity.remark = err
					param.socket?.emit -1, "#{image.img_name}：OCR失败"
					return cb null
				param.socket?.emit -1, "#{image.img_name}：OCR完成"
				res = {"fc001": "123", "fc002": "123", "fc003": "123"}
				enterEntity.stage = "op2"
				statis = {
					project: enterEntity.project
					deploy_id: enterEntity.deploy_id
					usercode: "ocr"
					chatLength: 0
					symbol: 0
				}
				for en in enterEntity.enter
					delete en.src_type
					if res[en.field_id]
						en.handler["op1"] = "ocr"
						en.value["op1"] = res[en.field_id]
						statis.chatLength += Utils.getLength res[en.field_id]
						statis.symbol += if Utils.replaceAll(res[en.field_id], "？", "").length is 0 then 1 else 0
				outputStatis.push statis
				cb null
		, (err)->
			LOG.error err if err
			dao = new MongoDao __b_config.dbInfo, {epcos: ["outputData"]}
			return callback null, param if !outputStatis.length
			dao.epcos.outputData.insert outputStatis, (error)->
				LOG.error error if error
				callback null, param

module.exports = OCRHandler
