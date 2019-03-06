Handler = require "./Handler"
ExecHandler = require "./ExecHandler"
LOG = LoggerUtil.getLogger "LoadImageHandler"
class LoadImageHandler extends Handler
	handle: (callback)->
		that = @
		unless @data.images
			LOG.warn "#{argv.project}：没有需要下载的内容"
			return callback null
		dao = new MongoDao __b_config.dbInfo, {epcos: ["entity"]}
		exec = new ExecHandler().queue_exec(3);
		down_stat = {total: @data.images.length, success: 0, exist: 0, failure: 0}
		async.each @data.images, (image, cb)->
			dao.epcos.entity.selectOne {deploy_id: image.deploy_id, img_name: image.img_name, upload_at: image.upload_at}, (err, doc)->
				return cb err if err
				if doc
					down_stat.exist++
					image.inDB = true
					image._id = doc._id.toString()
					image.state = doc.state
					image.isDeploy = doc.isDeploy
				return cb null if doc and (doc.state is 1 or Math.abs(doc.state) > 1)
				doc or (image.create_at = moment().format "YYYYMMDDHHmmss")
				rel_path = image.s_url
				mkdirp rel_path, (err)->
					return cb err if err and image.state = -1 #下载失败
					cmd = image.d_url
					cmd = "curl #{cmd}" unless cmd.startsWith "curl"
					cmd = if cmd.endsWith "/" then "#{cmd}#{image.img_name}" else "#{cmd}/#{image.img_name}"
					cmd = "#{cmd} -o #{rel_path}#{image.img_name}"
					cmd_display = cmd?.replace /\s+\-u\s+\S+/g, " -u '***:***'" #不打印密码
					LOG.info "开始下载: #{cmd_display}"
					exec cmd, (err, stdout, stderr, spent)->
						return cb err if err and image.state = -1 #下载失败
						image.state = 1 #已下载
						down_stat.success++
						cb err
		, (err)->
			LOG.error JSON.stringify err if err
			down_stat.failure = down_stat.total - down_stat.success - down_stat.exist
			LOG.info JSON.stringify down_stat
			callback.apply this, arguments

module.exports = LoadImageHandler
