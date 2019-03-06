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
			return callback?()
		param = params[0]
		if !param?.project
			LOG.error "参数不完整"
			return callback?()
		dao = new MongoDao __b_config.dbInfo, {epcos: ["deploy"]}
		filter = {type: "proj", _id: param?.project}
		dao.epcos.deploy.selectOne filter, (err, doc)->
			return callback err if err
			that.data.deploy = {}
			return callback() unless doc
			that.data.deploy.project = doc
			filter = {project: doc._id.toString(), state: "1"}
			if param.task
				filter["task"] = param.task
				dao.epcos.deploy.selectList filter, (err, docs)->
					return callback err if err
					that.data.deploy.images = docs
					filter = {
						project: doc._id.toString()
						image: {$in: docs.map (im)-> im._id.toString()}
						state: "1"
					}
					dao.epcos.deploy.selectList filter, (err, docs)->
						return callback err if err
						that.data.deploy.bills = []
						that.data.deploy.fields = []
						docs.forEach and docs.forEach (doc)->
							switch doc.type
								when "bill" then that.data.deploy.bills.push doc
								when "field" then that.data.deploy.fields.push doc
						callback()
			else
				dao.epcos.deploy.selectList filter, (err, docs)->
					return callback err if err
					that.data.deploy.images = []
					that.data.deploy.bills = []
					that.data.deploy.fields = []
					docs.forEach and docs.forEach (doc)->
						switch doc.type
							when "image" then that.data.deploy.images.push doc
							when "bill" then that.data.deploy.bills.push doc
							when "field" then that.data.deploy.fields.push doc
					callback()

module.exports = LoadConfigHandler
