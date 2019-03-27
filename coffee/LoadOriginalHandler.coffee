Handler = require "./Handler"
ExecHandler = require "./ExecHandler"
LOG = LoggerUtil.getLogger "LoadOriginalHandler"
class LoadOriginalHandler extends Handler
	handle: (param, callback)->
		that = @
		if !param or !param.data
			LOG.warn "#{argv.project}：没有需要下载的原件"
			return callback? "没有需要下载的原件"
		original = param.data
		param.socket?.emit 0, "#{original.img_name}：开始下载原件"
		dao = new MongoDao __b_config.dbInfo, {epcos: ["entity"]}
		exec = new ExecHandler().queue_exec(1)
		dao.epcos.entity.selectOne original, (err, doc)->
			return callback err if err
			if doc
				original._id = doc._id.toString()
				original.state = doc.state
				param.socket?.emit 0, "#{original.img_name}：文件在数据库存在记录"
			else
				original._id = Utils.uuid 24, 16
				original.modify = 0
				original.state = 0
				original.create_at = moment().format "YYYYMMDDHHmmss"
			if original.state is 1
				param.socket?.emit 0, "#{original.img_name}：文件状态为-正常"
				return callback null, param
			original.modify is undefined && (original.modify = 1)
			param.socket?.emit 0, "#{original.img_name}：文件状态为-异常，将重新加载" if original.state is -1
			rel_path = original.s_url
			mkdirp rel_path, (err)->
				if err
					LOG.error err
					original.state = -1
					original.record = "创建下载目录失败：#{rel_path}"
					param.socket?.emit -1, "#{original.img_name}：创建下载目录失败"
					return callback null, param
				cmd = original.d_url
				if !/^dir/.test(cmd)  and !/^curl/.test(cmd)
					cmd = "curl #{cmd}"
				cmd = if cmd.endsWith "/" then "#{cmd}#{original.img_name}" else "#{cmd}/#{original.img_name}"
				if /^dir/.test(cmd)
					cmd = cmd + " " + path.resolve(rel_path + original.img_name)
					cmd = cmd.replace "dir", "copy"
					cmd = cmd.replace /\//g, "\\"
				if /^curl/.test(cmd)
					cmd = "#{cmd} -o #{rel_path}#{original.img_name}"
				cmd_display = cmd?.replace /\s+\-u\s+\S+/g, " -u '***:***'" #不打印密码
				LOG.info "#{original.img_name}开始下载: #{cmd_display}"
				param.socket?.emit 0, "#{original.img_name}执行下载"
				exec cmd, (err, stdout, stderr, spent)->
					if err
						LOG.error err
						original.state = -1 #下载失败
						original.record = "下载命令执行失败：#{cmd}"
						param.socket?.emit -1, "#{original.img_name}：下载命令执行失败"
						LOG.error "#{original.img_name}：下载命令执行失败"
					else
						original.state = 1
						original.record = ""
						param.socket?.emit 0, "#{original.img_name}：下载原件完成"
					LOG.info "#{original.img_name}：下载原件完成"
					callback null, param

module.exports = LoadOriginalHandler
