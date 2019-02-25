# 配置加载者
Handler = require "./Handler"
LOG = LoggerUtil.getLogger "LoadConfigHandler"
class LoadConfigHandler extends Handler
	handle: (callback)->
		that = @
		dao = new MongoDao __b_config.dbInfo, {epcos: ["deploy"]}
		start = moment()
		dao.epcos.deploy.selectOne {type: "proj", projName: argv.project}, (err, doc)->
			return callback err if err
			that.data.deploy = {}
			return callback() unless doc
			that.data.deploy.project = doc
			dao.epcos.deploy.selectList {project: doc._id.toString(), state: "1"}, (err, docs)->
				return callback err if err
				that.data.deploy.images = []
				that.data.deploy.bills = []
				that.data.deploy.fields = []
				docs.forEach and docs.forEach (doc)->
					switch doc.type
						when "image" then that.data.deploy.images.push doc
						when "bill" then that.data.deploy.bills.push doc
						when "field" then that.data.deploy.fields.push doc
				LOG.info "加载#{argv.project}项目配置 --#{moment() - start}ms"
				callback()

module.exports = LoadConfigHandler
