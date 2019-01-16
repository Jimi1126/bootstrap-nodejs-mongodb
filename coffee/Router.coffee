express = require "express"
bodyParser = require 'body-parser'
cookieParser = require "cookie-parser"
session = require "express-session"
ObjectId = require('mongodb').ObjectId
ConfigContext = require "./ConfigContext"
LOG = LoggerUtil.getLogger "Router"
class Router
	constructor: ->
		@preRouter()
	preRouter: ->
		app.use '/js', express.static(path.join(workspace, 'web/js'))
		app.use '/css', express.static(path.join(workspace, 'web/css'))
		app.use '/fonts', express.static(path.join(workspace, 'web/fonts'))
		app.use '/images', express.static(path.join(workspace, 'web/images'))
		app.set 'view engine', 'html'
		app.use '/pages', (req, res, next)->
			res.setHeader "Content-Type", "text/html"
			next()
		app.use '/pages', express.static(path.join(workspace, 'web/pages'))
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
		app.use cookieParser()
		
		configRouter = express.Router() # 配置请求路由
		## 获取项目信息
		configRouter.get "/getProjList", (req, res)->
			configContext = new ConfigContext()
			param = if Object.keys(req.query).length is 0 then req.body else req.query
			configContext.getProjList param, (err, conf)->
				if err
					LOG.error err
					res.json null
				else
					res.json conf
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
				verify.filter
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
		## 更新项目信息
		configRouter.post "/updateDeploy", (req, res)->
			configContext = new ConfigContext()
			data = if Object.keys(req.query).length is 0 then req.body else req.query
			configContext.updateDeploy {_id: data._id}, data, (err)->
				LOG.error err if err
				res.json null
		## 删除项目配置
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
		app.use "/config", configRouter

module.exports = Router
