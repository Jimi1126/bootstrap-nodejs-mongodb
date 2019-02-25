EnterContext = require "./EnterContext"
LOG = LoggerUtil.getLogger "SocketIORouter"
class SocketIORouter
	router: (socket)->
		socket.use (packet, next)->
			str = socket.request.headers.cookie || ""
			index = str.indexOf("login=s%3A")
			return socket.emit "unlogin" if index is -1
			sessionid = str.substring index + 10, index + 42
			if global?.sessions?[sessionid] and global.sessions[sessionid].cookie.maxAge > 0
				global.sessions[sessionid]._garbage = Date()
				global.sessions[sessionid].touch()
				next()
			else unless global.sessions?[sessionid]
				socket.emit "unlogin"
			else
				socket.emit "overTime", true
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
		socket.on "refreshOverTime", ->
			socket.broadcast.emit "overTime", false
		socket.on "refreshEnterEntity", (conf, callback)->
		# context.refreshEnterEntity {data: conf}, (err, data)->
		#   if err
		#     LOG.error err
		#   else
		#     callback err
		# 释放录入实体
		socket.on "letEnterEntity", (data, callback)->
			return callback?"failed" if !data or !data.project or !data.stage
			entitys = global.enter.entitys[data.project][data.stage]
			entitys.data.unshift (entitys.entering.splice (entitys.entering.findIndex (en)-> en._id.toString() is data._id), 1)[0]
			callback?"success"
		socket.on "submitEnter", (data, callback)->
			return callback?"failed" if !data or !data.project or !data.stage
			rankArr = ["new", "ocr", "op1", "op2", "op3", "op4"]
			try
				entitys = global.enter.entitys[data.project][data.stage]
				entitys.entering.splice (entitys.entering.findIndex (en)-> en._id.toString() is data._id), 1
				data.stage = rankArr[(rankArr.findIndex (r) -> r is data.stage) + 1]
				entitys = global.enter.entitys[data.project][data.stage]
				entitys && (entitys.isEmpty = false)
				context = new EnterContext()
				context.update {col: "resultData", filter: {_id: data._id}, setter: data}, callback
			catch e
				callback e
		socket.on "disconnect", ->

module.exports = SocketIORouter
