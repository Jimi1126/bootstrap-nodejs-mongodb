Handler = require "./Handler"
ExecHandler = require "./ExecHandler"
LOG = LoggerUtil.getLogger "ConvertHandler"
class ConvertHandler extends Handler
	handle: (callback)->
		unless @data.images
			LOG.warn "#{argv.project}：没有需要解析的内容"
			return callback null
		exec = new ExecHandler().queue_exec 3
		conv_stat = {total: 0, success: 0, failure: 0}
		async.each @data.images, (image, cb)->
			return cb null if image.state isnt 1 and image.state isnt -2
			if image.img_name and image.img_name.endsWith "pdf"
				conv_stat.total++
				if image.s_url.endsWith "/"
					rel_path =  image.s_url
				else
					rel_path = "#{image.s_url}/"
				name = image.img_name.replace(".pdf", "")
				mkdirp "#{rel_path}#{name}", (err)->
					return cb err if err and image.state = -2 #解析失败
					conv_cmd = "gswin64c -o #{rel_path}#{name}/#{name}_%d.jpg -sDEVICE=jpeg #{rel_path}#{image.img_name}"
					exec conv_cmd, (err, stdout, stderr, spent) ->
						image.state = 2 #解析完成
						return cb err if err and image.state = -2 #解析失败
						stdout = "#{stdout}".trim()
						stderr = "#{stderr}".trim()
						LOG.info stdout if stdout.length > 0
						LOG.info stderr if stderr.length > 0
						conv_stat.success++
						cb err
			else
				image.state = 2 #解析完成
				cb null
		, (err)->
			LOG.error JSON.stringify err if err
			conv_stat.failure = conv_stat.total - conv_stat.success
			LOG.info JSON.stringify conv_stat
			callback.apply this, arguments

module.exports = ConvertHandler
