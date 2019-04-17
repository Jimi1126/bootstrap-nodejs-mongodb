# 配置加载者
Handler = require "./Handler"
LOG = LoggerUtil.getLogger "LoadConfigHandler"
class LoadConfigHandler extends Handler
	handle: ()->
		that = @
		[...params] = arguments
		callback = params.pop()
		if !params or params.length is 0
			LOG.error "参数不完整"
			return callback?("参数不完整")
		param = params[0]
		if !param?.project
			LOG.error "未指定项目"
			return callback?("未指定项目")
		if !param?.task
			LOG.error "未指定业务"
			return callback?("未指定业务")
		dao = new MongoDao __b_config.dbInfo, {epcos: ["deploy"]}
		filter = {}
		async.series [
			(cb)->
				filter = {type: "proj", _id: param?.project}
				dao.epcos.deploy.selectOne filter, (err, doc)->
					return cb err if err
					that.data.deploy = {}
					return cb "项目不存在" unless doc
					that.data.deploy.project = doc
					cb null
			(cb)->
				taskDao = new MongoDao __b_config.dbInfo, {epcos: ["task"]}
				filter = {
					_id: param.task
					project: param.project
				}
				taskDao.epcos.task.selectOne filter, (err, doc)->
					return cb err if err
					return cb "项目业务不存在" unless doc
					return cb "项目业务原件已下载" if doc.state isnt "待下载"
					that.data.deploy.task = doc
					cb null
			(cb)->
				filter = {
					task: param.task
					project: param.project
					type: "image"
					state: "1"
				}
				dao.epcos.deploy.selectList filter, (err, docs)->
					return cb err if err
					return cb "项目业务未进行图片配置" if !docs or !docs.length
					that.data.deploy.images = docs
					filter = {
						project: param.project
						image: {$in: docs.map (im)-> im._id.toString()}
						state: "1"
					}
					cb null
			(cb)->
				dao.epcos.deploy.selectList filter, (err, docs)->
					return cb err if err
					that.data.deploy.bills = []
					that.data.deploy.fields = []
					docs.forEach and docs.forEach (doc)->
						switch doc.type
							when "bill" then that.data.deploy.bills.push doc
							when "field" then that.data.deploy.fields.push doc
					cb null
		], (err)->
			callback?(err)


module.exports = LoadConfigHandler
