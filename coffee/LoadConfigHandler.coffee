# 配置加载者
Handler = require "./Handler"
LOG = LoggerUtil.getLogger "LoadConfigHandler"
class LoadConfigHandler extends Handler
	handle: (callback)->
		@data.conf = {
			# 項目配置
			conf: {}
			remote: {}
			data:{
				# 下載項
				items: []
				# 網速統計
				total: {
					files: 0
					spent: 0
				}
			}
		}
		that = @
		filter = {}
		filter = {name: argv.project} if argv.project
		mongoDao.projects.deploy.selectList filter, (err, docs)->
			async.eachSeries docs, (doc, next) ->
				that.load_pro_conf doc.name, ()->
					# that.data.common[ proj_name ] = _.cloneDeep that.data.conf
					# that.data.conf = { remote:{} }
					setTimeout next,0
			,callback
	load_pro_conf: ( projName ,callback )->
		that = @
		async.series [
			# 項目配置 project
			(next) ->
				start_at = moment()
				mongoDao.projects.conf.selectOne {project: projName, conf: "project"}, (err, doc = {}) ->
					LOG.info "加載#{projName}項目配置 --#{moment() - start_at}ms"
					return next err if err
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
				start_at = moment()
				mongoDao.projects.conf.selectOne {project: projName, conf: "fields"}, (err, doc = {}) ->
					LOG.info "加載#{projName}項目字段定義 --#{moment() - start_at}ms"
					return next err if err
					delete doc[k] for k in ["_id", "project", "conf", "v"]
					that.data.conf.fields = doc
					next()
			# 項目模板配置 bill
			(next) ->
				start_at = moment()
				mongoDao.projects.conf.selectOne {project: projName, conf: "bill"}, (err, doc = {}) ->
					LOG.info "加載#{projName}項目模板 --#{moment() - start_at}ms"
					return next err if err
					delete doc[k] for k in ["_id", "project", "conf", "v"]
					that.data.conf.bill = doc
					for template in (doc.templates or doc.template or [])
						#去掉過時的白名單
						for block in template.blocks
							delete block.white_list
						# 按照錄入順序排序
						# block_orders = get_tmpl_block_orders template.name
						# template.blocks.sort (a, b) ->
						# 	block_orders.indexOf a.code - block_orders.indexOf b.code
					next()
		], callback

module.exports = LoadConfigHandler
