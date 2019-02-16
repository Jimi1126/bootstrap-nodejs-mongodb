express = require "express"
bodyParser = require 'body-parser'
cookieParser = require "cookie-parser"
session = require "express-session"
multer = require "multer"
ObjectId = require('mongodb').ObjectId
ConfigContext = require "./ConfigContext"
EnterContext = require "./EnterContext"
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
			secret: "login"
			resave: true
			key: "login"
			saveUninitialized: true
			cookie: {
				secure: false # http有效
				maxAge: 5 * 60 * 1000
			}
		})
		# 拦截器
		app.use "/pages", (req, res, next)->
			global.curPageName = pageName = req.originalUrl.split("/")[2].split(".")[0]
			global.curSession = req.session.id
			if !req.session.user and !req.originalUrl.startsWith("/pages/login.html") and !req.originalUrl.startsWith("/pages/overTime.html")
				if global.sockets[req.session.id]
						for name, socket of global.sockets[req.session.id]
							pageName isnt name && socket && socket.emit "closeWindow"
				res.redirect 302, "/pages/login.html"
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
			if req.session.user or req.originalUrl.startsWith("/user/login")
				next()
			else
				if global.sockets[req.session.id] && req.session
					for name, socket of global.sockets[req.session.id]
						socket && socket.emit "overTime", !!req.session.user
				res.json null
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
			userContext.login param, (err, flags)->
				if flags is "success"
					req.session.user = param
					req.session._garbage = Date()
					req.session.touch()
					if global.sockets[req.session.id] && req.session
						for name, socket of global.sockets[req.session.id]
							socket && socket.emit "overTime", !!req.session.user
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
					if global.sockets[req.session.id]
						for name, socket of global.sockets[req.session.id]
							socket && socket.emit "closeWindow"
					res.json "success"
		app.use "/user", userRouter

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
			context.selectByconf data.conf, (err, docs)->
				if err
					LOG.error err
					return res.json err
				res.json docs
		configRouter.post "/updateEnterEntity", (req, res)->
			data = if Object.keys(req.query).length is 0 then req.body else req.query
			context = new EnterContext()
		app.use "/config", configRouter

module.exports = Router
