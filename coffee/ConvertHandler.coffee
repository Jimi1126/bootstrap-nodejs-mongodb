Handler = require "./Handler"
ExecHandler = require "./ExecHandler"
LOG = LoggerUtil.getLogger "ConvertHandler"
class ConvertHandler extends Handler
	handle: (param, callback)->
		if !param or !param.data
			LOG.warn "#{argv.project}：没有需要解析的原件"
			return callback "没有需要解析的原件"
		original = param.data
		if original.state isnt 1
			LOG.warn "#{original.img_name}：解析-原件异常"
			param.socket?.emit -1, "#{original.img_name}：解析-原件异常"
			return callback null, param
		param.image = []
		dbImage = {
			deploy_id: original.deploy_id
			type: "image"
			source_img: original._id
			code: original.code
			upload_at: original.upload_at
		}
		dao = new MongoDao __b_config.dbInfo, {epcos: ["entity"]}
		dao.epcos.entity.selectList dbImage, (err, docs)->
			return callback err if err
			isOK = true
			if docs and docs.length > 0
				param.socket?.emit 0, "#{original.img_name}：原件解析信息在数据库存在记录"
				for doc in docs
					isOK = false if doc.state isnt 1				
				if isOK
					param.image = param.image.concat docs
					param.socket?.emit 0, "#{original.img_name}：原件解析状态为-正常"
					return callback null, param
			if !isOK
				param.socket?.emit 0, "#{original.img_name}：原件解析状态为-异常"
			exec = new ExecHandler().queue_exec 1
			if !original.img_name or !original.img_name.endsWith "pdf"
				dbImage._id = Utils.uuid 24, 16
				dbImage.img_name = original.img_name
				dbImage.path = original.s_url
				dbImage.modify = 0
				dbImage.state = 1
				dbImage.create_at = moment().format "YYYYMMDDHHmmss"
				param.image.push dbImage
				param.socket?.emit 0, "#{original.img_name}：不需要解析或未配置解析器"
				return callback null, param
			rel_path = original.s_url
			name = original.img_name.replace(".pdf", "")
			original.path = "#{rel_path}#{name}"
			mkdirp "#{rel_path}#{name}", (err)->
				if err
					LOG.error err
					original.state = -1
					original.record = "创建解析目录失败：#{rel_path}#{name}"
					param.socket?.emit -1, "#{original.img_name}：创建解析目录失败"
					return callback null, param
				conv_cmd = "gswin64c -o #{rel_path}#{name}/#{name}_%d.jpg -sDEVICE=jpeg #{rel_path}#{original.img_name}"
				exec conv_cmd, (err, stdout, stderr, spent) ->
					if err
						original.state = -1
						original.record = "解析失败：#{conv_cmd}"
						param.socket?.emit -1, "#{original.img_name}：解析失败"
						return callback err
					page = +stdout.substring(stdout.lastIndexOf("Page") + 4)
					for index in [1...page]
						newImage = Utils.clone dbImage
						newImage._id = Utils.uuid 24, 16
						newImage.img_name = "#{name}_#{index}.jpg"
						newImage.path = "#{rel_path}#{name}/"
						newImage.modify = 0
						newImage.state = 1
						newImage.create_at = moment().format "YYYYMMDDHHmmss"
						param.image.push newImage
					original.state = 1
					original.record = ""
					param.socket?.emit 0, "#{original.img_name}：原件解析完成"
					stdout = "#{stdout}".trim()
					stderr = "#{stderr}".trim()
					LOG.info stdout if stdout.length > 0
					LOG.info stderr if stderr.length > 0
					callback err, param

module.exports = ConvertHandler
