###
# 下载后策略
###
Istrategy = require "./Istrategy"
LOG = LoggerUtil.getLogger "AfterDownStrategy"
class AfterDownStrategy extends Istrategy

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
	# 下载后策略与下载策略类似，只是不用处理业务数据
	 # 默认也是携带全局的业务数据
	###
	execute: (callback)->
		return callback() if @handlerList.length is 0
		that = @
		for hand in @handlerList
			hand.target.data = @data
		funArr = @handlerList.map (handle)-> handle.handle
		async.series funArr, callback

module.exports = AfterDownStrategy
