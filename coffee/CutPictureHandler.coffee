###
#	对下载解析等操作后的图片进行裁剪操作
###
Handler = require "./Handler"
ExecHandler = require "./ExecHandler"
LOG = LoggerUtil.getLogger "CutPictureHandler"
class CutPictureHandler extends Handler
	init: (bill)->
		bill.blocks = []
		doc_type = bill.source.docs?[0]
		tmpl = null
		for t in @data.conf.bill.templates or @data.conf.bill.template or []
			if doc_type in t.docs
				tmpl = t
				break
		unless tmpl
			msg = "#{argv.project} 保单没有匹配的模板 #{bill.bill_name} #{bill.source.docs}"
			LOG.warn msg
			return msg
		bill.template = tmpl.name
		for block in tmpl.blocks
			unless block.pic_page
				LOG.warn "#{argv.project} 分块未指定图像页 #{bill.bill_name} #{tmpl.name} #{block.code} #{block.name} #{block.pic_page} #{bill.picture}"
				continue
		# pic = bill.picture?[block.pic_page - 1]
		# unless pic
		# 	msg = "#{argv.project} 分块缺少图像 #{bill.bill_name} #{tmpl.name} #{block.code} #{block.name} #{block.pic_page} #{bill.picture}"
		# 	LOG.warn msg
		# 	bill.status = "异常"
		# 	return "异常"
		bill_block = _.merge {}, block
		bill_block.coordinate = bill_block.coordinate or []
		for v, i in bill_block.coordinate
			v = parseFloat v
			v = 0 if v < -10
			v = 100 if v > 110
			bill_block.coordinate[i] = v
		bill.blocks.push bill_block
		return null
	handle: (callback)->
		exec = new ExecHandler().queue_exec 3
		async.eachOf @data.billInfos, (billInfo, cmd, cb1)=>
			rel_path = "./download/" + cmd.substring cmd.lastIndexOf("EPCOS") - 1
			cut_path = rel_path.replace "download", "cut"
			mkdirp.sync cut_path
			async.each billInfo, (bill, cb2)=>
				return cb2() if "pdf" in bill.bill_name
				msg = @init bill
				return cb2 msg if msg
				cmd_fmt = @data.conf.extract.crop or "gmic -v - %(src)s -crop[-1] %(x0)s%%,%(y0)s%%,%(x1)s%%,%(y1)s%% -o[-1] %(dst)s"
				LOG.info "开始切图 #{bill.bill_name} #{bill.source.docs} #{bill.template} 分块数为: #{bill.blocks.length}"
				async.eachSeries bill.blocks, (block, next)=>
					return next() unless block.coordinate and block.pic_page
					# for i in [0 .. 3]
					# 	block.coordinate[i] ?= 0
					# if block.coordinate[0] >= -2 and block.coordinate[0] <= 2 and 
					# 		block.coordinate[1] >= -2 and block.coordinate[1] <= 2 and
					# 		block.coordinate[2] >= -2 and block.coordinate[2] <= 2 and
					# 		block.coordinate[3] >= -2 and block.coordinate[3] <= 2
					# 	for i in [0 .. 3]
					# 		block.coordinate[i] *= 100
					# x0 = block.coordinate[0] ?= 0
					# y0 = block.coordinate[1] ?= 0
					# x1 = block.coordinate[2] ?= 100
					# y1 = block.coordinate[3] ?= 100
					# # 图像扩展
					# crop_expand = [10, 10]
					# x0 -= crop_expand[0]
					# # x0 = 0 if x0 < 0
					# y0 -= crop_expand[1]
					# # y0 = 0 if y0 < 0
					# x1 += crop_expand[0]
					# # x0 = 100 if x0 > 100
					# y1 += crop_expand[1]
					# # y1 = 100 if y1 > 100
					x0 = 85
					y0 = 5
					x1 = 100
					y1 = 12
					src = rel_path + bill.bill_name
					dst = cut_path + bill.bill_name
					try
						cmd = sprintf.sprintf cmd_fmt, {
							src
							dst
							x0
							y0
							x1
							y1
						}
					catch err
						LOG.error err
						return next err
					# debug "開始切圖 #{bill.bill_name} #{bill.source.docs} #{bill.template} #{block.code} #{block.name}".magenta
					LOG.info cmd
					exec cmd, (err, stdout, stderr, spent) ->
						if err
							bill.status = "异常"
							return next err
						stdout = "#{stdout}".trim()
						stderr = "#{stderr}".trim()
						LOG.info stdout if stdout.length > 0
						LOG.info stderr if stderr.length > 0
						LOG.info "#{src} => #{dst} #{spent}ms"
						next()
				, (err)->
					LOG.info "切图完成 #{bill.bill_name}"
					if err
						if bill.status == "异常"
							return cb2 null
						LOG.error err
					for i in [bill.blocks.length - 1 .. 0]
						if bill.blocks[i].fields.length == 0
							LOG.info "无需录入:#{bill.blocks[i].code}没有字段"
							bill.blocks.splice i,1
					cb2()
			,cb1
		,callback

module.exports = CutPictureHandler
