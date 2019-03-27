###
#	对分块进行裁剪操作
###
Handler = require "./Handler"
ExecHandler = require "./ExecHandler"
LOG = LoggerUtil.getLogger "CutBillHandler"
class CutBillHandler extends Handler
	handle: (param, callback)->
		that = @
		if !param or !param.data
			LOG.warn "#{argv.project}：没有原图"
			return callback "没有原图"
		param.field = []
		original = param.data
		if !param.bill
			LOG.warn "#{argv.project}：没有分块"
			param.socket?.emit -1, "#{original.img_name}：没有分块需要切割"
			return callback null, param
		if original.state isnt 1
			LOG.warn "#{original.img_name}：字段-原件异常"
			param.socket?.emit -1, "#{original.img_name}：字段-原件异常"
			return callback null, param
		param.socket?.emit 0, "#{original.img_name}：开始切字段"
		exec = new ExecHandler().queue_exec 3
		dao = new MongoDao __b_config.dbInfo, {epcos: ["entity"]}
		async.each param.bills, (bill, cb)->
			bill_path = bill.path
			fields = that.data.deploy.fields.filter (f)-> f.bill is bill.deploy_id
			async.each fields, (field, cb1)->
				field_path = bill_path.replace "bill", "field"
				dbField = {
					deploy_id: field._id.toString()
					type: "field"
					source_img: bill.source_img
					source_bill: bill._id
					code: field.code
					img_name: field.code+bill.img_name
					path: field_path
				}
				param.field.push dbField
				dao.epcos.entity.selectOne dbField, (err, doc)->
					if err
						dbField.state = -1
						dbField.record = "系统异常"
						param.socket?.emit -1, "#{original.img_name}-#{bill.code}-#{dbField.code}：系统异常"
						return cb1 err
					if doc
						dbField._id = doc._id.toString()
						dbField.modify = 0
						dbField.state = doc.state
						dbField.isDeploy = doc.isDeploy
						param.socket?.emit 0, "#{original.img_name}-#{bill.code}-#{dbField.code}：字段在数据库存在记录"
					else
						dbField._id = Utils.uuid 24, 16
						dbField.state = 0 #待切图
						dbField.isDeploy = 0
						dbField.create_at = moment().format "YYYYMMDDHHmmss"
					if dbField.state is 1
						param.socket?.emit 0, "#{original.img_name}-#{bill.code}-#{dbField.code}：字段状态为-正常"
						return cb1 null
					dbField.modify is undefined && (dbField.modify = 1)
					param.socket?.emit 0, "#{original.img_name}-#{bill.code}-#{dbField.code}:字段状态为-异常，将重新加载" if dbField.state is -1
					mkdirp field_path, (err)->
						if err
							dbField.state = -1
							dbField.record = "创建分块切图目录失败：#{cut_path}"
							param.socket?.emit -1, "#{original.img_name}-#{bill.code}：创建#{dbField.code}分块切图目录失败"
							return cb1 err 
						options = {
							src: "#{bill_path}#{bill.img_name}"
							dst: "#{field_path}#{field.code+bill.img_name}"
							x0: field.x0
							y0: field.y0
							x1: field.x1
							y1: field.y1
						}
						cut_cmd = "gmic -v - %(src)s -crop[-1] %(x0)s,%(y0)s,%(x1)s,%(y1)s -o[-1] %(dst)s"
						try
							cut_cmd = sprintf.sprintf cut_cmd, options
						catch e
							dbField.state = -1
							dbField.record = "获取切图命令有误：#{cut_cmd}"
							param.socket?.emit -1, "#{original.img_name}-#{bill.code}-#{dbField.code}：切图失败"
							return cb1 e
						exec cut_cmd, (err, stdout, stderr, spent) ->
							if err
								dbField.state = -1
								dbField.record = "切图命令执行有误：#{cut_cmd}"
								param.socket?.emit -1, "#{original.img_name}-#{bill.code}-#{dbField.code}：切图失败"
								return cb1 err
							stdout = "#{stdout}".trim()
							stderr = "#{stderr}".trim()
							LOG.info stdout if stdout.length > 0
							LOG.info stderr if stderr.length > 0
							LOG.info "#{options.src} => #{options.dst} #{spent}ms"
							dbField.state = 1 #切图完成
							param.socket?.emit 0, "#{original.img_name}-#{bill.code}-#{dbField.code}：切图完成"
							param.socket?.emit 0, "#{original.img_name}-#{bill.code}-#{dbField.code}：#{options.src} => #{options.dst} #{spent}ms"
							LOG.info "#{options.src} => #{options.dst} #{spent}ms"
							cb1 null
			, (err)->
				LOG.info err if err
				cb null
		,(err)->
			LOG.info err if err
			callback null, param

module.exports = CutBillHandler
