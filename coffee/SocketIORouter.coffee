EnterContext = require "./EnterContext"
DownloadContext = require "./DownloadContext"
LOG = LoggerUtil.getLogger "SocketIORouter"
class SocketIORouter
	router: (socket)->
		socket.use (packet, next)->
			str = socket?.request?.headers?.cookie || ""
			next()
			# index = str.indexOf("login=s%3A")
			# return socket.emit "unlogin" if index is -1
			# sessionid = str.substring index + 10, index + 42
			# if global?.sessions?[sessionid] and global.sessions[sessionid].cookie.maxAge > 0
			# 	global.sessions[sessionid]._garbage = Date()
			# 	global.sessions[sessionid].touch()
			# 	next()
			# else unless global.sessions?[sessionid]
			# 	socket.emit "unlogin"
			# else
			# 	socket.emit "overTime", true
		# 检查登陆是否超时
		socket.on "checkOverTime", ()->
			that = @
			str = @request.headers.cookie || ""
			index = str.indexOf("login=s%3A")
			sessionid = str.substring index + 10, index + 42
			cookie = global.sessions[sessionid].cookie
			checkOverTime = ->
				setTimeout ->
					if cookie.maxAge > 0
						checkOverTime cookie.maxAge
					else
						that.emit "overTime", true
				, cookie.maxAge
			checkOverTime()
		# 更新超时窗口
		socket.on "refreshOverTime", ->
			socket.emit "overTime", false
		# 更新录入对象配置
		socket.on "refreshEnterEntity", (configs, callback)->
			that = @
			project = configs[0].project
			confMap = {}
			for conf in configs
				confMap[conf.deploy_id] || (confMap[conf.deploy_id] = [])
				confMap[conf.deploy_id].push {
					field_id: conf.deploy_id
					field_name: conf.field_name
					src_type: conf.src_type
					value: {}
					tip: ""
				}
			context = new EnterContext()
			async.eachOfSeries confMap, (v, k, cb)->
				context.select {col: "resultData", filter: {deploy_id: k, stage: "op1"}}, (err, docs)->
					if err
						that.emit "refreshProgress", true, "#{k}：更新失败\n#{err}"
						return cb null
					if docs and docs.length > 0
						that.emit "refreshProgress", false, "#{k}：存在#{docs.length}个录入配置，正在更新配置"
						context.update {col: "resultData", filter: {deploy_id: k, stage: "op1"}, setter: {enter: v}}, (err)->
							if err
								that.emit "refreshProgress", true, "#{k}：更新失败\n#{err}"
							else
								that.emit "refreshProgress", true, "#{k}：更新成功"
							return cb null
					else
						context.select {col: "entity", filter: {deploy_id: k, isDeploy: 0}}, (err, docs)->
							if err
								that.emit "refreshProgress", true, "#{k}：更新失败\n#{err}"
								return cb null
							if docs and docs.length > 0
								that.emit "refreshProgress", false, "#{k}：存在#{docs.length}个录入对象，正在新增录入配置"
								enterEntitys = []
								for entity in docs
									enterEntitys.push {
										_id: Utils.uuid 24, 16
										project: project
										deploy_id: entity.deploy_id
										code: entity.code
										source_img: entity.source_img
										path: entity.path
										img_name: entity.img_name
										enter: v
										stage: "ocr"
										priority: "1"
										create_at: entity.create_at
									}
								context.save {col: "resultData", data: enterEntitys}, (err)->
									if err
										that.emit "refreshProgress", true, "#{k}：新增失败\n#{err}"
									else
										that.emit "refreshProgress", true, "#{k}：新增成功"
									return cb null
							else
								that.emit "refreshProgress", true, "#{k}：未找到该配置录入对象"
								cb null
			, (err)->
		# 下载与解析
		# socket.removeAllListeners "startDownAndParse"
		socket.on "startDownAndParse", (image)->
			that = @
			context = new DownloadContext()
			d_socket = {
				emit: (flag, logInfo)->
					setTimeout ->
						that.emit "downAndParseProgress", flag, logInfo
					, 0
				on: ()->
					that.on.apply that, arguments
			}
			context.execute image, d_socket, (err, pages)->
				if err
					LOG.error err
					that.emit "downAndParseProgress", -1, err
				else
					context = new EnterContext()
					setter = {$set: {pages: pages, state: "待分配", scan_at: moment().format("YYYYMMDDHHmmss")}}
					context.update {col: "task", filter: {_id: image.task}, setter: setter}, ->
				that.emit "downAndParseProgress", "final"
		socket.on "disconnect", ->

module.exports = SocketIORouter
