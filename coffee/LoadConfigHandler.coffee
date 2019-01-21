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
			dao.epcos.deploy.selectList {project: doc._id.toString()}, (err, docs)->
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
	load_pro_conf: ( projName ,callback )->
		that = @
		async.series [
			# 項目配置 project
			(next) ->
				start = moment()
				mongoDao.projects.conf.selectBySortOrLimit {project: projName, conf: "project"}, {"update_at": -1}, 1, (err, docs = []) ->
					LOG.info "加载#{projName}项目配置 --#{moment() - start}ms"
					return next err if err
					doc = docs[0]
					delete doc._id if doc._id
					_.assign that.data.conf, doc
					that.data.conf.remote.scan = [
						"curl ftp://myftp:myftp@192.168.202.3/EPCOS/HqEpcos/T/one/Type1/",
						"curl ftp://myftp:myftp@192.168.202.3/EPCOS/HqEpcos/T/one/Type2/",
						"curl ftp://myftp:myftp@192.168.202.3/EPCOS/HqEpcos/WI/one/Type1/",
						"curl ftp://myftp:myftp@192.168.202.3/EPCOS/HqEpcos/WI/one/Type2/"
					]
					that.data.conf.remote.fetch_bill = "%(bill_name)s -o %(down_name)s"
					that.data.conf.remote.max_connections = that.data.conf.remote?.max_connections or 3
					that.data.conf.report_to = "" if not that.data.conf.report_to
					that.data.conf.priority = {} if not that.data.conf.priority
					that.data.conf.priority.agencies = [] if not that.data.conf.priority.agencies
					that.data.conf.priority.types = [] if not that.data.conf.priority.types
					that.data.conf.priority.bills = [] if not that.data.conf.priority.bills
					that.data.conf.priority.files = [] if not that.data.conf.priority.files
					next()
			# 字段定义列表 fields
			(next) ->
				start = moment()
				mongoDao.projects.conf.selectBySortOrLimit {project: projName, conf: "fields"}, {"update_at": -1}, 1, (err, docs = []) ->
					LOG.info "加载#{projName}项目字段定义 --#{moment() - start}ms"
					return next err if err
					doc = docs[0]
					delete doc[k] for k in ["_id", "project", "conf", "v"]
					that.data.conf.fields = doc
					next()
			# 項目模板配置 bill
			(next) ->
				start = moment()
				mongoDao.projects.conf.selectBySortOrLimit {project: projName, conf: "bill"}, {"update_at": -1}, 1, (err, docs = []) ->
					LOG.info "加载#{projName}项目模板 --#{moment() - start}ms"
					return next err if err
					doc = docs[0]
					delete doc[k] for k in ["_id", "project", "conf", "v"]
					that.data.conf.bill = doc
					for template in (doc.templates or doc.template or [])
						for block in template.blocks
							delete block.white_list
						# block_orders = get_tmpl_block_orders template.name
						# template.blocks.sort (a, b) ->
						# 	block_orders.indexOf a.code - block_orders.indexOf b.code
					next()
		], callback

module.exports = LoadConfigHandler
