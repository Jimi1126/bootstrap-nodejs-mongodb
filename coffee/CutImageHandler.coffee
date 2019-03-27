###
#	对下载解析等操作后的图片进行裁剪操作
###
Handler = require "./Handler"
ExecHandler = require "./ExecHandler"
LOG = LoggerUtil.getLogger "CutImageHandler"
class CutImageHandler extends Handler
	handle: (param, callback)->
		that = @
		if !param or !param.data
			LOG.warn "#{argv.project}：没有需要切割的图片"
			return callback? "没有需要切割的图片"
		param.bill = []
		original = param.data
		if original.state isnt 1
			LOG.warn "#{original.img_name}：分块-原件异常"
			param.socket?.emit -1, "#{original.img_name}：分块-原件异常"
			return callback null, param
		image = param.image
		param.socket?.emit 0, "#{original.img_name}：开始切分块"
		exec = new ExecHandler().queue_exec 3
		dao = new MongoDao __b_config.dbInfo, {epcos: ["entity"]}
		rel_path = original.s_url
		deploy_bills = that.data.deploy.bills.filter (b)-> b.image is original.deploy_id
		if original.img_name.endsWith "pdf"
			fs.readdir "#{rel_path}#{original.img_name.replace(".pdf", "")}/", (err, menu)->
				if err
					LOG.error err
					param.socket?.emit -1, "#{original.img_name}：读取解析文件夹失败"
					return callback null, param
				original.pages = menu.length
				async.each menu, (f_nm, cb)->
					async.each deploy_bills, (bill, cb1)->
						cut_path = rel_path.replace "image", "bill"
						img_path = "#{rel_path}#{original.img_name.replace(".pdf", "")}/"
						cut_path = "#{cut_path}#{original.img_name.replace(".pdf", "")}/"
						dbBill = {
							deploy_id: bill._id.toString()
							type: "bill"
							source_img: param.image.filter((im)-> im.img_name is f_nm)._id
							code: bill.code
							img_name: "#{bill.code}#{f_nm}"
							path: cut_path
							upload_at: original.upload_at
						}
						param.bill.push dbBill
						dao.epcos.entity.selectOne dbBill, (err, doc)->
							if err
								dbBill.state = -1
								dbBill.record = "系统异常"
								param.socket?.emit 0, "#{original.img_name}：#{dbBill.code}系统异常"
								return cb1 err 
							if doc
								dbBill._id = doc._id.toString()
								dbBill.state = doc.state
								dbBill.isDeploy = doc.isDeploy
								param.socket?.emit 0, "#{original.img_name}：#{dbBill.code}分块在数据库存在记录"
							else
								dbBill._id = Utils.uuid 24, 16
								dbBill.modify = 0
								dbBill.state = 0
								dbBill.isDeploy = 0
								dbBill.create_at = moment().format "YYYYMMDDHHmmss"
							if dbBill.state is 1
								param.socket?.emit 0, "#{original.img_name}：#{dbBill.code}分块状态为-正常"
								return cb1 null
							dbBill.modify is undefined && (dbBill.modify = 1)
							param.socket?.emit 0, "#{original.img_name}：#{dbBill.code}分块状态为-异常，将重新加载" if dbBill.state is -1
							mkdirp cut_path, (err)->
								if err
									dbBill.state = -1
									dbBill.record = "创建分块切图目录失败：#{cut_path}"
									param.socket?.emit 0, "#{original.img_name}：创建#{dbBill.code}分块切图目录失败"
									return cb1 err
								async.series [
									(cb2)->
										return cb2 null if !bill.filter
										exec "gm identify #{img_path}#{f_nm}", (error, stdout = "", stderr = "")->
											if error
												dbBill.state = -1
												dbBill.record = "获取原图信息出错：gm identify #{img_path}#{f_nm}"
												param.socket?.emit -1, "#{original.img_name}：#{dbBill.code}获取原图信息出错"
												return cb2 error
											info = stdout.split " "
											width = +info[2].substring(0, info[2].indexOf("x"))
											height = +info[2].substring(info[2].indexOf("x")+1, info[2].indexOf("+"))
											if width > height && (bill.filter is "width>height" || bill.filter is "height<width")
												cb2 null
											else if width < height && (bill.filter is "width<height" || bill.filter is "height>width")
												cb2 null
											else if width == height && (bill.filter is "width==height" || bill.filter is "height==width")
												cb2 null
											else 
												cb2 "break"
									(cb2)->
										options = {
											src: "#{img_path}#{f_nm}"
											dst: "#{cut_path}#{bill.code}#{f_nm}"
											x0: bill.x0
											y0: bill.y0
											x1: bill.x1
											y1: bill.y1
										}
										cut_cmd = "gmic -v - %(src)s -crop[-1] %(x0)s,%(y0)s,%(x1)s,%(y1)s -o[-1] %(dst)s"
										try
											cut_cmd = sprintf.sprintf cut_cmd, options
										catch e
											dbBill.state = -1
											dbBill.record = "获取切图命令有误：#{cut_cmd}"
											param.socket?.emit -1, "#{original.img_name}：#{dbBill.code}切图失败"
											return cb2 e
										param.socket?.emit 0, "#{original.img_name}：开始切图-#{dbBill.code}"
										exec cut_cmd, (err, stdout, stderr, spent) ->
											if err
												dbBill.state = -1
												dbBill.record = "切图命令执行有误：#{cut_cmd}"
												param.socket?.emit -1, "#{original.img_name}：#{dbBill.code}切图失败"
												return cb2 err
											stdout = "#{stdout}".trim()
											stderr = "#{stderr}".trim()
											LOG.info stdout if stdout.length > 0
											LOG.info stderr if stderr.length > 0
											dbBill.state = 1 #切图完成
											param.socket?.emit 0, "#{original.img_name}：切图完成-#{dbBill.code}"
											param.socket?.emit 0, "#{original.img_name}：#{dbBill.code}-#{options.src} => #{options.dst} #{spent}ms"
											LOG.info "#{options.src} => #{options.dst} #{spent}ms"
											cb2 null
								], (err)->
									if err is "break"
										LOG.trace "break #{bill.filter} #{img_path}#{f_nm}"
										return cb1 null
									cb1 err
					, cb
				, (err)->
					LOG.info err if err
					callback null, param
		else
			async.each deploy_bills, (bill, cb1)->
				cut_path = rel_path.replace "image", "bill"
				dbBill = {
					deploy_id: bill._id.toString()
					type: "bill"
					source_img: param.image[0]._id
					code: bill.code
					img_name: bill.code+original.img_name
					path: cut_path
					upload_at: original.upload_at
				}
				param.bill.push dbBill
				mkdirp cut_path, (err)->
					if err
						dbBill.state = -1
						dbBill.record = "创建分块切图目录失败：#{cut_path}"
						param.socket?.emit 0, "#{original.img_name}：创建#{dbBill.code}分块切图目录失败"
						return cb1 err
					dao.epcos.entity.selectOne dbBill, (err, doc)->
						if err
							dbBill.state = -1
							dbBill.record = "系统异常"
							param.socket?.emit 0, "#{original.img_name}：#{dbBill.code}：系统异常"
							return cb1 err 
						if doc
							dbBill._id = doc._id.toString()
							dbBill.state = doc.state
							dbBill.isDeploy = doc.isDeploy
							param.socket?.emit 0, "#{original.img_name}：#{dbBill.code}分块在数据库存在记录"
						else
							dbBill._id = Utils.uuid 24, 16
							dbBill.modify = 0
							dbBill.state = 0
							dbBill.isDeploy = 0
							dbBill.create_at = moment().format "YYYYMMDDHHmmss"
						if dbBill.state is 1
							param.socket?.emit 0, "#{original.img_name}：#{dbBill.code}分块状态为-正常"
							return cb1 null
						dbBill.modify is undefined && (dbBill.modify = 1)
						param.socket?.emit 0, "#{original.img_name}：#{dbBill.code}分块状态为-异常，将重新加载" if dbBill.state is -1
						async.series [
							(cb2)->
								return cb2 null if !bill.filter
								exec "gm identify #{rel_path}#{original.img_name}", (error, stdout = "", stderr = "")->
									if error
										dbBill.state = -1
										dbBill.record = "获取原图信息出错：gm identify #{img_path}#{f_nm}"
										param.socket?.emit -1, "#{original.img_name}：#{dbBill.code}获取原图信息出错"
										return cb2 error
									info = stdout.split " "
									width = +info[2].substring(0, info[2].indexOf("x"))
									height = +info[2].substring(info[2].indexOf("x")+1, info[2].indexOf("+"))
									if width > height && (bill.filter is "width>height" || bill.filter is "height<width")
										cb2 null
									else if width < height && (bill.filter is "width<height" || bill.filter is "height>width")
										cb2 null
									else if width == height && (bill.filter is "width==height" || bill.filter is "height==width")
										cb2 null
									else 
										cb2 "break"
							(cb2)->
								options = {
									src: "#{rel_path}#{original.img_name}"
									dst: "#{cut_path}#{bill.code}#{original.img_name}"
									x0: bill.x0
									y0: bill.y0
									x1: bill.x1
									y1: bill.y1
								}
								cut_cmd = "gmic -v - %(src)s -crop[-1] %(x0)s,%(y0)s,%(x1)s,%(y1)s -o[-1] %(dst)s"
								try
									cut_cmd = sprintf.sprintf cut_cmd, options
								catch e
									dbBill.state = -1
									dbBill.record = "获取切图命令有误：#{cut_cmd}"
									param.socket?.emit -1, "#{original.img_name}：#{dbBill.code}获取切图命令有误"
									return cb2 e
								param.socket?.emit 0, "#{original.img_name}：开始切图-#{dbBill.code}"
								exec cut_cmd, (err, stdout, stderr, spent) ->
									if err
										dbBill.state = -1
										dbBill.record = "切图命令执行有误：#{cut_cmd}"
										param.socket?.emit -1, "#{original.img_name}：#{dbBill.code}切图失败"
										return cb2 err
									stdout = "#{stdout}".trim()
									stderr = "#{stderr}".trim()
									LOG.info stdout if stdout.length > 0
									LOG.info stderr if stderr.length > 0
									dbBill.state = 1 #切图完成
									param.socket?.emit 0, "#{original.img_name}：开始完成-#{dbBill.code}"
									param.socket?.emit 0, "#{original.img_name}：#{dbBill.code}-#{options.src} => #{options.dst} #{spent}ms"
									LOG.info "#{options.src} => #{options.dst} #{spent}ms"
									cb2 null
						], (err)->
							if err is "break"
								LOG.trace "break #{bill.filter} #{rel_path}#{original.img_name}"
								return cb1 null
							cb1 err
			, (err)->
				LOG.info err if err
				callback null, param

module.exports = CutImageHandler
