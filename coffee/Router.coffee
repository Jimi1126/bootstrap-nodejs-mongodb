express = require "express"
bodyParser = require 'body-parser'
cookieParser = require "cookie-parser"
session = require "express-session"
multer = require "multer"
ObjectId = require('mongodb').ObjectId
DownloadContext = require "./DownloadContext"
ConfigContext = require "./ConfigContext"
EnterContext = require "./EnterContext"
SysConfigContext = require "./SysConfigContext"
UserAuthContext = require "./UserAuthContext"
TaskContext = require "./TaskContext"
UserContext = require "./UserContext"
ExecHandler = require "./ExecHandler"
LOG = LoggerUtil.getLogger "Router"
class Router
	constructor: ->
		@preRouter()
	preRouter: ->
		app.use '/js', express.static(path.join(workspace, 'web/js'))
		app.use '/css', express.static(path.join(workspace, 'web/css'))
		app.use '/fonts', express.static(path.join(workspace, 'web/fonts'))
		app.use '/images', express.static(path.join(workspace, 'web/images'))
		app.use '/download', express.static(path.join(workspace, 'download'))
		app.set 'view engine', 'html'
		app.use cookieParser()
		app.use session({
			secret: "epcos-user"
			resave: true
			key: "epcos-user"
			saveUninitialized: true
			rolling: false
			cookie: {
				secure: false # http有效
				maxAge: 5 * 60 * 1000
			}
		})
		# 拦截器
		app.use "/pages", (req, res, next)->
			if !req.session.user and !req.originalUrl.startsWith("/pages/login.html") and !req.originalUrl.startsWith("/pages/overTime.html")
				res.redirect 302, "/pages/login.html"
			else if req.session.user and req.originalUrl.startsWith("/pages/login.html")
				req.session._garbage = Date()
				req.session.touch()
				res.redirect 302, "/pages/homePage.html"
			else if req.originalUrl.startsWith("/pages/login.html") or req.originalUrl.startsWith("/pages/overTime.html")
				next()
			else
				req.session._garbage = Date()
				req.session.touch()
				next()
		app.use '/pages', (req, res, next)->
			res.setHeader "Content-Type", "text/html"
			next()
		app.use '/pages', express.static(path.join(workspace, 'web/pages'))
		app.all "*", (req, res, next)->
			if req.session && req.session.user
				req.session._garbage = Date()
				req.session.touch()
			if req.originalUrl.startsWith("/user/login") or req.originalUrl.startsWith("/user/logout")
				next()
			else if req.session.user
				return next() if req.session.user.username is "6182"
				return next() if global.accessControl.every (act)-> req.originalUrl.indexOf(act) is -1
				authList = req.session.auths || []
				canPass = false;
				for auth in authList
					if auth.flag and req.originalUrl.indexOf(auth.flag) > -1
						canPass = true
						break
				return res.json "notauth" unless canPass
				next()
			else
				res.json "notlogin"
		###
		# 开启跨域，便于接口访问.
		###
		app.all '*', (req, res, next) ->
			res.header 'Access-Control-Allow-Origin', '*' #控制访问来源：所有
			res.header 'Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept' #访问控制允许报头 X-Requested-With: xhr请求 
			res.header 'Access-Control_Allow-Metheds', 'GET, POST, PUT, DELETE, OPTIONS' #访问控制允许方法 
			res.header 'X-Powered-By', 'nodejs' #自定义头信息，表示服务端用nodejs 
			res.header 'Content-Type', 'application/json;charset=utf-8'
			next()
	router: ->
		app.use bodyParser.json()
		app.use bodyParser.urlencoded {extended: true}

		userRouter = express.Router() # 用户信息请求路由
		## 登陆
		userRouter.post "/login", (req, res)->
			userContext = new UserContext()
			param = if Object.keys(req.query).length is 0 then req.body else req.query
			userContext.login param, (err, flags, user)->
				if flags is "success"
					req.session.user = user
					req.session._garbage = Date()
					req.session.touch()
					global.sessions || (global.sessions = {})
					global.sessions[req.session.id] || (global.sessions[req.session.id] = req.session)
					new UserAuthContext().getAuth req.session.user, (err, auths)->
						LOG.error err if err
						req.session.auths = auths || []
						res.json flags
				else
					res.json flags
		## 获取session
		userRouter.get "/userInfo", (req, res)->
			res.json req.session && req.session.user || {}
		## 注销
		userRouter.get "/logout", (req, res)->
			unless req.session
				return res.json "success"
			req.session.destroy (err)->
				if err
					LOG.error err
					res.json err
				else
					res.json "success"
		userRouter.post "/getUsers", (req, res)->
			context = new UserContext()
			param = if Object.keys(req.query).length is 0 then req.body else req.query
			context.getUsers param, (err, users)->
				if err
					LOG.error err
					res.json null
				else
					res.json users
		app.use "/user", userRouter

		sysConfigRouter = express.Router() # 系统配置请求路由
		sysConfigRouter.post "/add", (req, res)->
			context = new SysConfigContext()
			param = if Object.keys(req.query).length is 0 then req.body else req.query
			context.insert {col: "sys_config", data: param}, (err)->
				LOG.error err if err
				res.json err
		sysConfigRouter.post "/update", (req, res)->
			context = new SysConfigContext()
			param = if Object.keys(req.query).length is 0 then req.body else req.query
			_id = param && param._id
			return res.json {errno: -1, text: "invalid param"} unless _id
			delete param._id
			context.update {col: "sys_config", filter: {_id : _id}, setter: {$set: param}}, (err)->
				LOG.error err if err
				res.json err
		sysConfigRouter.post "/delete", (req, res)->
			context = new SysConfigContext()
			param = if Object.keys(req.query).length is 0 then req.body else req.query
			return res.json {errno: -1, text: "invalid param"} unless param and param._id
			context.delete {col: "sys_config", filter: param}, (err)->
				LOG.error err if err
				res.json err
		sysConfigRouter.post "/getList", (req, res)->
			context = new SysConfigContext()
			param = if Object.keys(req.query).length is 0 then req.body else req.query
			param.col = "sys_config"
			if param && param.page
				context.selectBySortOrSkipOrLimit param, (err, docs)->
					LOG.error err if err
					res.json (docs || [])
			else
				context.selectList param, (err, docs)->
					LOG.error err if err
					res.json (docs || [])
		sysConfigRouter.get "/userMenu", (req, res)->
			authList = req.session.auths || []
			authList = authList.filter (aut) -> aut.control_type is "1"
			codeList = {}
			for auth in authList
				auth.src_page = auth.src_page || ""
				for i in [2...(auth.src_page.length + 1)]
					codeList[auth.src_page.substr(0, i)] = null unless i % 2
			codeList = Object.keys codeList
			param = {col: "sys_config", filter: {state: "0", code: {$in : codeList}}}
			new SysConfigContext().selectList param, (err, docs)->
				LOG.error err if err
				res.json (docs || [])
		app.use "/sysconf", sysConfigRouter

		userAuthRouter = express.Router() # 用户权限路由
		new UserAuthContext().accessControl (err, auths)->
			auths = auths || []
			global.accessControl = auths.map (aut)-> aut.flag
		userAuthRouter.post "/add", (req, res)->
			context = new UserAuthContext()
			param = if Object.keys(req.query).length is 0 then req.body else req.query
			param = param.data || param
			context.insert {col: "user_auth", data: param}, (err)->
				LOG.error err if err
				res.json err
		userAuthRouter.post "/update", (req, res)->
			context = new UserAuthContext()
			param = if Object.keys(req.query).length is 0 then req.body else req.query
			param = param.data || param
			context.addOrUpdate {col: "user_auth", data: param}, (err)->
				LOG.error err if err
				res.json err
		userAuthRouter.post "/delete", (req, res)->
			context = new UserAuthContext()
			param = if Object.keys(req.query).length is 0 then req.body else req.query
			return res.json {errno: -1, text: "invalid param"} unless param and param._id
			context.delete {col: "user_auth", filter: param}, (err)->
				LOG.error err if err
				res.json err
		userAuthRouter.post "/getList", (req, res)->
			context = new UserAuthContext()
			param = if Object.keys(req.query).length is 0 then req.body else req.query
			param.col = "user_auth"
			if param && param.page
				context.selectBySortOrSkipOrLimit param, (err, docs)->
					LOG.error err if err
					res.json (docs || [])
			else
				context.selectList param, (err, docs)->
					LOG.error err if err
					res.json (docs || [])
		app.use "/auth", userAuthRouter

		configRouter = express.Router() # 配置请求路由
		## 获取配置信息
		configRouter.get "/getDeploy", (req, res)->
			configContext = new ConfigContext()
			param = if Object.keys(req.query).length is 0 then req.body else req.query
			configContext.getDeploy param, (err, conf)->
				if err
					LOG.error err
					res.json null
				else
					res.json conf
		## 保存配置信息
		configRouter.post "/saveDeploy", (req, res)->
			configContext = new ConfigContext()
			data = if Object.keys(req.query).length is 0 then req.body else req.query
			type = data.type;
			verify = {db: "epcos", col: "deploy"}
			if type is "proj"
				verify.filter = {$or: [{projName: data.projName}, {projCode: data.projCode}]}
			else 
				filter = {type: type}
				if type is "image"
					filter["project"] = data.project
				if type is "bill"
					filter["project"] = data.project
					filter["image"] = data.image
				if type is "field"
					filter["project"] = data.project
					filter["image"] = data.image
					filter["bill"] = data.bill
				filter.code = data.code
				verify.filter = filter
			configContext.exist verify, (err, exist)->
				if err
					LOG.error err
					res.json null
				else if exist
					res.json "exist"
				else
					configContext.saveDeploy data, (err)->
						LOG.error err if err
						res.json null
		## 更新配置信息
		configRouter.post "/updateDeploy", (req, res)->
			configContext = new ConfigContext()
			data = if Object.keys(req.query).length is 0 then req.body else req.query
			configContext.updateDeploy {_id: data._id}, data, (err)->
				LOG.error err if err
				res.json null
		## 删除图片配置样例及裙带信息
		configRouter.post "/delImageTempl", (req, res)->
			configContext = new ConfigContext()
			data = if Object.keys(req.query).length is 0 then req.body else req.query
			return res.json null unless data.delFile
			return res.json "error" unless data.img
			async.each data.delFile, (path, cb)->
				fs.unlink path, (err)->
					if err
						LOG.error err
						return cb "error"
					filter = {project: data.img.project, image: data.img._id, src_img: path}
					configContext.getDeploy filter, (err, docs)->
						if err
							LOG.error err
							return cb "error"
						async.each docs, (doc, cb1)->
							fs.unlink doc.img_path, (err)->
								if err
									LOG.error err
									return cb1 "error"
								configContext.deleteDeploy doc, (err)->
									if err
										LOG.error err
										return cb1 "error"
									cb1 null
						, cb
			, (err)->
				res.json err
		## 删除配置信息
		configRouter.post "/deleteDeploy", (req, res)->
			configContext = new ConfigContext()
			data = if Object.keys(req.query).length is 0 then req.body else req.query
			type = data.type
			filter = {}
			if type is "proj"
				filter.$or = [
					{_id: ObjectId(data._id)}
					{project: data._id}
				]
			if type is "image"
				filter.$or = [
					{_id: ObjectId(data._id)}
					{project: data.project, image: data._id}
				]
			if type is "bill"
				filter.$or = [
					{_id: ObjectId(data._id)}
					{project: data.project, image: data.image, bill: data._id}
				]
			if type is "field"
				filter._id = data._id
			if type is "enter"
				filter._id = data._id
			if Object.keys(filter).length is 0
				return res.json null
			configContext.deleteDeploy filter, (err)->
				LOG.error err if err
				res.json null
		# 文件上传
		storage = multer.diskStorage {
			destination: (req, file, cb)->
				data = if Object.keys(req.query).length is 0 then req.body else req.query
				dir = if data.dir then "./web/images/template/#{data.dir}" else './web/images/template/'
				if data.rmdir
					fs.rmdir data.rmdir, (err)->
						LOG.error err if err
						mkdirp dir, (err)->
							LOG.error err if err
							cb err, dir
				else
					mkdirp dir, (err)->
						LOG.error err if err
						cb err, dir
			filename: (req, file, cb)->
				data = if Object.keys(req.query).length is 0 then req.body else req.query
				str = file.originalname.split '.'
				filename = if data.filename then data.filename else Date.now() + '.' + str[1]
				cb null, filename
		}
		upload = multer { storage: storage }
		configRouter.post "/uploadFile", upload.array("file", 1), (req, res, next)->
			if req.files and req.files.length > 0
				res.json req.files[0].path
			else
				res.json null
		# 文件删除
		configRouter.post "/delFile", (req, res)->
			data = if Object.keys(req.query).length is 0 then req.body else req.query
			if data
				return res.json null if !data.path
				if data.type is "file"
					fs.unlink data.path, (err)->
						LOG.error err if err
						res.json err
				else
					Utils.rmdir data.path, (err)->
						LOG.error err if err
						res.json err
			else
				res.json null
		# 文件名修改
		configRouter.get "/moddir", (req, res)->
			data = if Object.keys(req.query).length is 0 then req.body else req.query
			if data
				f_arr = data.from.split "\\"
				t_arr = data.to.split "\\"
				i = -1
				async.eachSeries f_arr, (name, cb)->
					i++
					if name isnt t_arr[i]
						m_arr = t_arr.slice 0, i
						fs.exists m_arr.join("\\") + "\\" + t_arr[i], (exist)->
							return cb "exist" if exist
							fs.rename m_arr.join("\\") + "\\" + name, m_arr.join("\\") + "\\" + t_arr[i], cb
					else
						cb null
				, (err)->
					LOG.error err if err
					res.setHeader 200
					res.json err
		# 样例切图
		configRouter.post "/crop", (req, res)->
			data = if Object.keys(req.query).length is 0 then req.body else req.query
			fs.exists data.cut_path + "\\" + data.data.code + ".jpg", (exist)->
				return res.json "exist" if exist
				mkdirp data.cut_path, (err)->
					if err
						LOG.error err
						return res.json "create dir error"
					options = {
						src: data.src
						dst: data.cut_path + "\\" + data.data.code + ".jpg"
						x0: data.data.x0
						y0: data.data.y0
						x1: data.data.x1
						y1: data.data.y1
					}
					cut_cmd = "gmic -v - %(src)s -crop[-1] %(x0)s,%(y0)s,%(x1)s,%(y1)s -o[-1] %(dst)s"
					try
						cut_cmd = sprintf.sprintf cut_cmd, options
					catch e
						LOG.error e.stack
						return res.json "create dir error"
					exec = new ExecHandler().queue_exec 1
					exec cut_cmd, (err, stdout, stderr, spent) ->
						if err
							LOG.error err
							return res.json "crop error"
						stdout = "#{stdout}".trim()
						stderr = "#{stderr}".trim()
						LOG.info stdout if stdout.length > 0
						LOG.info stderr if stderr.length > 0
						LOG.info "#{options.src} => #{options.dst} #{spent}ms"
						res.json "success"
		# 新增、修改录入配置
		configRouter.post "/addOrUpdateDeploy", (req, res)->
			configContext = new ConfigContext()
			data = if Object.keys(req.query).length is 0 then req.body else req.query
			configContext.addOrUpdateDeploy data.data, (err)->
				if err
					LOG.error err.stack
					return res.json "error"
				res.json null
		# 获取录入实体
		configRouter.post "/getEnterEntity", (req, res)->
			data = if Object.keys(req.query).length is 0 then req.body else req.query
			context = new EnterContext()
			global.enter || (global.enter = {})
			global.enter.entitys || (global.enter.entitys = {})
			global.enter.entitys.MIN_CACHE || (global.enter.entitys.MIN_CACHE = 15)
			global.enter.entitys.MAX_CACHE || (global.enter.entitys.MAX_CACHE = 80)
			global.enter.entitys[data.project] || (global.enter.entitys[data.project] = {})
			entity_task = global.enter.entitys[data.project][data.task] || (global.enter.entitys[data.project][data.task] = {})
			entitys = global.enter.entitys[data.project][data.task][data.stage] || (global.enter.entitys[data.project][data.task][data.stage] = {
				isEmpty: false,
				data:[],
				entering: []
			})
			if data.stage == "op4" and entity_task["op1"]?.isEmpty and entity_task["op2"]?.isEmpty and entity_task["op3"]?.isEmpty and entity_task["op4"]?.isEmpty
				context.update {col: "task", filter: {_id: data.task}, setter: {$set: {state: "已导出"}}}, (err)->
					LOG.error err
			if entitys.isEmpty
				entity = entitys.data.shift() || null
				entity && entitys.entering.push entity
				return res.json entity
			if entitys.data.length > 0
				entity = entitys.data.shift()
				entitys.entering.push entity
				res.json entity
			if entitys.data.length < global.enter.entitys.MIN_CACHE
				num = global.enter.entitys.MAX_CACHE - entitys.data.length
				context.getEnterEntity {data: data, limit: num}, (err)->
					LOG.error err if err
					if num is global.enter.entitys.MAX_CACHE
						entity = entitys.data.shift() || null
						entity && entitys.entering.push entity
						res.json entity
		# 释放录入实体
		configRouter.post "/letEnterEntity", (req, res)->
			data = if Object.keys(req.query).length is 0 then req.body else req.query
			data = data?.data
			return res.json "failed" if !data or !data.project or !data.stage or !global.enter
			entitys = global.enter.entitys[data.project][data.task][data.stage]
			freeObj = (entitys.entering.splice (entitys.entering.findIndex (en)-> en and en._id.toString() is data._id), 1)[0]
			freeObj && entitys.data.unshift freeObj
			res.json "success"
		# 提交录入
		configRouter.post "/submitEnter", (req, res)->
			data = if Object.keys(req.query).length is 0 then req.body else req.query
			data = data?.data
			return res.json "failed" if !data or !data.project or !data.stage
			rankArr = ["ocr", "op1", "op2", "op3", "op4", "over"]
			try
				entitys = global.enter.entitys[data.project][data.task][data.stage]
				entitys.entering.splice (entitys.entering.findIndex (en)-> en._id.toString() is data._id), 1

				chatLength = 0
				symbol = 0
				for en in data.enter
					chatLength += Utils.getLength en.value[data.stage]
					symbol += if Utils.replaceAll(en.value[data.stage], /\?|？/, "").length is 0 then 1 else 0
				statis = {
					project: data.project
					task: data.task
					stage: data.stage
					usercode: req.session.user.username
				}
				dao = new MongoDao __b_config.dbInfo, {epcos: ["outputData"]}
				dao.epcos.outputData.selectOne statis, (err, doc)->
					return LOG.error err if err
					statis.chatLength = 0
					statis.symbol = 0
					statis.count = 0
					statis = doc if doc
					statis.chatLength += chatLength
					statis.symbol += symbol
					statis.count++
					
					doc && dao.epcos.outputData.update {_id: statis._id}, statis, ->
					!doc && dao.epcos.outputData.insert statis, ->
				if data.stage is "op2"
					for en in data.enter
						data.stage = "no" if !en.value["op1"] or !en.value["op2"] or (en.value["op1"] isnt en.value["op2"])
					data.stage is "op2" and (data.stage = "over")
					data.stage is "no" and (data.stage = "op3")
				else
					data.stage = rankArr[(rankArr.findIndex (r) -> r is data.stage) + 1]
				entitys = global.enter.entitys[data.project][data.task][data.stage]
				entitys && (entitys.isEmpty = false)
				context = new EnterContext()
				setter = {
					$set: {
						stage: data.stage
						enter: data.enter
					}
				}
				context.update {col: "resultData", filter: {_id: data._id}, setter: setter}, (err)->
					res.json err
			catch e
				res.json  e
		# 保存录入实体
		configRouter.post "/saveEnterEntity", (req, res)->
			data = if Object.keys(req.query).length is 0 then req.body else req.query
			context = new EnterContext()
			context.saveEnterEntity data, (err)->
				LOG.error err if err
				res.json entity
		app.use "/config", configRouter

		## 新建任务
		taskRouter = express.Router() # 任务路由
		taskRouter.post "/newTask", (req, res)->
			data = if Object.keys(req.query).length is 0 then req.body else req.query
			mkdirp data.path_name, (err)->
				LOG.error err if err
				return res.json err if err
				context = new EnterContext()
				context.save {col: "task", data: data}, (err)->
					LOG.error err if err
					res.json err
		taskRouter.post "/getTasks", (req, res)->
			data = if Object.keys(req.query).length is 0 then req.body else req.query
			context = new EnterContext()
			context.select {col: "task", filter: data}, (err, docs)->
				LOG.error err if err
				res.json docs
		## 获取结果数据
		taskRouter.post "/getResultData", (req, res)->
			data = if Object.keys(req.query).length is 0 then req.body else req.query
			context = new EnterContext()
			data.isPage = true
			context.getResultData data, (err, docs)->
				LOG.error err if err
				res.json docs
		# 分配
		taskRouter.post "/allotImage", (req, res)->
			data = if Object.keys(req.query).length is 0 then req.body else req.query
			return res.json {errno: -1, text: "invalid param"} unless data?.data
			context = new EnterContext()
			param = {
				col: "task"
				filter: {_id: {$in: data.data.map (task)-> ObjectId(task._id)}}
				setter: {$set: {state: "录入中"}}
			}
			context.update param, (err)->
				LOG.error err if err
				res.json err
		## 合并结果图片
		taskRouter.post "/mergeImage", (req, res)->
			data = if Object.keys(req.query).length is 0 then req.body else req.query
			context = new TaskContext()
			return res.json "error" if !data.filter
			context.mergeImage data, (err)->
				return res.json err if err
				res.json "success"
		app.use "/task", taskRouter

module.exports = Router
