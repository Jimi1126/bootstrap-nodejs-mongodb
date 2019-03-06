###
#	对下载解析等操作后的图片进行裁剪操作
###
Handler = require "./Handler"
ExecHandler = require "./ExecHandler"
LOG = LoggerUtil.getLogger "CutImageHandler"
class CutImageHandler extends Handler
	handle: (callback)->
		that = @
		unless @data.images
			LOG.warn "#{argv.project}：没有需要切割的分快"
			return callback null
		@data.bills = []
		exec = new ExecHandler().queue_exec 3
		dao = new MongoDao __b_config.dbInfo, {epcos: ["entity"]}
		cut_stat = {total: 0, success: 0, exist: 0, failure: 0}
		async.each @data.images, (image, cb)->
			return cb null if image.state isnt 2 and image.state isnt -3
			rel_path = image.s_url
			bills = that.data.deploy.bills.filter (b)-> b.image is image.deploy_id
			if image.img_name.endsWith "pdf"
				fs.readdir "#{rel_path}#{image.img_name.replace(".pdf", "")}/", (err, menu)->
					return cb err if err
					async.each menu, (f_nm, cb1)-> 
						async.each bills, (bill, cb2)->
							cut_path = rel_path.replace "image", "bill"
							# cut_path = "#{cut_path}#{bill.code}/"
							img_path = "#{rel_path}#{image.img_name.replace(".pdf", "")}/"
							cut_path = "#{cut_path}#{image.img_name.replace(".pdf", "")}/"
							mkdirp cut_path, (err)->
								return cb2 err if err
								cut_stat.total++
								dbBill = {
									deploy_id: bill._id.toString()
									type: "bill"
									source_img: image._id
									code: bill.code
									img_name: f_nm
									path: cut_path
									isDeploy: 0
								}
								that.data.bills.push dbBill
								dao.epcos.entity.selectOne dbBill, (err, doc)->
									return cb2 err if err
									if doc
										cut_stat.exist++
										dbBill._id = doc._id.toString()
										dbBill.inDB = true
										dbBill.state = doc.state
										dbBill.isDeploy = doc.isDeploy
									else
										dbBill._id = Utils.uuid 24, 16
										dbBill.state = 0
										dbBill.create_at = moment().format "YYYYMMDDHHmmss"
									return cb2 null if doc and (doc.state is 1 or Math.abs(doc.state) > 1)
									async.series [
										(cb3)->
											return cb3 null if !bill.filter
											exec "gm identify #{img_path}#{f_nm}", (error, stdout = "", stderr = "")->
												return cb3 error if error
												info = stdout.split " "
												width = +info[2].substring(0, info[2].indexOf("x"))
												height = +info[2].substring(info[2].indexOf("x")+1, info[2].indexOf("+"))
												if width > height && (bill.filter is "width>height" || bill.filter is "height<width")
													cb3 null
												else if width < height && (bill.filter is "width<height" || bill.filter is "height>width")
													cb3 null
												else if width == height && (bill.filter is "width==height" || bill.filter is "height==width")
													cb3 null
												else 
													cut_stat.total--
													cb3 "break"
										(cb3)->
											options = {
												src: "#{img_path}#{f_nm}"
												dst: "#{cut_path}#{f_nm}"
												x0: bill.x0
												y0: bill.y0
												x1: bill.x1
												y1: bill.y1
											}
											cut_cmd = "gmic -v - %(src)s -crop[-1] %(x0)s,%(y0)s,%(x1)s,%(y1)s -o[-1] %(dst)s"
											try
												cut_cmd = sprintf.sprintf cut_cmd, options
											catch e
												dbBill.state = -1 #切图失败
												return cb3 e
											exec cut_cmd, (err, stdout, stderr, spent) ->
												dbBill.state = 1 #切图完成
												return cb3 err if err and dbBill.state = -1 #切图失败
												stdout = "#{stdout}".trim()
												stderr = "#{stderr}".trim()
												LOG.info stdout if stdout.length > 0
												LOG.info stderr if stderr.length > 0
												LOG.info "#{options.src} => #{options.dst} #{spent}ms"
												cut_stat.success++
												cb3 null
									], (err)->
										if err is "break"
											LOG.trace "break #{bill.filter} #{img_path}#{f_nm}"
											return cb2 null
										cb2 err
						, cb1
					, (err)->
						image.state = 3 #分块完成
						LOG.error err if err and image.state = -3 #分块失败
						cb null
			else
				async.each bills, (bill, cb1)->
					cut_path = rel_path.replace "image", "bill"
					# cut_path = "#{cut_path}#{bill.code}/"
					mkdirp cut_path, (err)->
						return cb1 err if err
						cut_stat.total++
						dbBill = {
							deploy_id: bill._id.toString()
							type: "bill"
							source_img: image._id
							code: bill.code
							img_name: image.img_name
							path: cut_path
							isDeploy: 0
						}
						that.data.bills.push dbBill
						dao.epcos.entity.selectOne dbBill, (err, doc)->
							return cb1 err if err
							if doc
								cut_stat.exist++
								dbBill._id = doc._id.toString()
								dbBill.inDB = true
								dbBill.state = doc.state
								dbBill.isDeploy = doc.isDeploy
							else
								dbBill._id = Utils.uuid 24, 16
								dbBill.state = 0
								dbBill.create_at = moment().format "YYYYMMDDHHmmss"
							return cb1 null if doc and (doc.state is 1 or Math.abs(doc.state) > 1)
							async.series [
								(cb2)->
									return cb2 null if !bill.filter
									exec "gm identify #{rel_path}#{image.img_name}", (error, stdout = "", stderr = "")->
										return cb2 error if error
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
											cut_stat.total--
											cb2 "break"
								(cb2)->
									options = {
										src: "#{rel_path}#{image.img_name}"
										dst: "#{cut_path}#{image.img_name}"
										x0: bill.x0
										y0: bill.y0
										x1: bill.x1
										y1: bill.y1
									}
									cut_cmd = "gmic -v - %(src)s -crop[-1] %(x0)s,%(y0)s,%(x1)s,%(y1)s -o[-1] %(dst)s"
									try
										cut_cmd = sprintf.sprintf cut_cmd, options
									catch e
										dbBill.state = -1 #切图失败
										return cb2 e
									exec cut_cmd, (err, stdout, stderr, spent) ->
										dbBill.state = 1 #切图完成
										return cb2 err if err and dbBill.state = -1 #切图失败
										stdout = "#{stdout}".trim()
										stderr = "#{stderr}".trim()
										LOG.info stdout if stdout.length > 0
										LOG.info stderr if stderr.length > 0
										LOG.info "#{options.src} => #{options.dst} #{spent}ms"
										cut_stat.success++
										cb2 null
							], (err)->
								if err is "break"
									LOG.trace "break #{bill.filter} #{rel_path}#{image.img_name}"
									return cb1 null
								cb1 err
				, (err)->
					image.state = 3 #分块完成
					LOG.error err if err and image.state = -3 #分块失败
					cb null
		,(err)->
			LOG.error JSON.stringify err if err
			cut_stat.failure = cut_stat.total - cut_stat.success - cut_stat.exist
			LOG.info JSON.stringify cut_stat
			callback.apply this, arguments

module.exports = CutImageHandler
