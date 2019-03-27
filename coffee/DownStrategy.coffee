###
# 下载策略
###
Istrategy = require "./Istrategy"
LOG = LoggerUtil.getLogger "DownStrategy"
class DownStrategy extends Istrategy

	MAX_LENGTH: 50

	constructor: (execOrderList, @socket)->
		super()
		###
		# 策略的业务数据
		# 通过在实例化操作者过程中提供引用，让所在该策略中的操作者都有权访问
		# 因此一个操作者将访问上一位操作者处理完的数据
		###
		@data = {}
		## 操作者名称列表，策略会根据这个顺序调用操作者
		@handlerList = []
		if execOrderList and execOrderList instanceof Array
			for moduleName, i in execOrderList
				continue unless moduleName or moduleName isnt ""
				Handler = require './' + moduleName
				proxy = new HandlerProxy new Handler(@data)
				proxy.io = {socket: @socket}
				@handlerList.push proxy
	###
	# 执行策略
	# 下载策略也是采用操作链模式，不同与预下载策略
	# 下载策略采用async模块提供的series方法进行流程控制，由中间函数next通知下一位操作者
	# 于是我们只需将操作者的执行方法交给async就行了
	# 注：
	#   下载策略需用到预下载中的业务数据，将下载策略对象的业务数据引用指向预下载策略对象中的业务数据时
	#   操作者所持有的业务数据对象引用也应该重新指向下载策略的业务数据
	###
	execute: (files, callback)->
		return callback() if @handlerList.length is 0 or !files or !files.length
		that = @
		for hand in @handlerList
			hand.target.data = @data
		socket = @socket
		down_stat = {total: files.length, success: 0, exist: 0, failure: 0}
		async.eachLimit files, @MAX_LENGTH, (file, cb)->
			startTime = moment()
			arr = that.handlerList.map (handler, i)->
				if i is 0
					(next)->
						handler.handle.call handler, {data: file, socket: socket}, next
				else
					handler.handle
			async.waterfall arr, (err)->
				endTime = moment()
				if err
					LOG.error file.img_name + "：" + err
					socket.emit 0, file.img_name + "：" + err
					down_stat.failure++
				else
					down_stat.success++
				socket.emit 1, "#{file.img_name}：下载解析完成  --#{endTime - startTime}ms"
				cb null
		, (err)->
			socket.emit 0, JSON.stringify down_stat
			callback()
module.exports = DownStrategy
