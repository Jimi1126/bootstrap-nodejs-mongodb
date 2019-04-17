Context = require "./Context"
StrategyContext = require "./StrategyContext"
ProDownStrategy = require "./ProDownStrategy"
DownStrategy = require "./DownStrategy"
AfterDownStrategy = require "./AfterDownStrategy"
global.StrategyProxy = require "./StrategyProxy"
global.HandlerProxy = require "./HandlerProxy"
LOG = LoggerUtil.getLogger "DownloadContext"

class DownloadContext extends Context
	execute: (param, socket, callback)->
		# 下载前动作（有序）
		beforeDownHandle = ["LoadConfigHandler", "ScanHandler", "ParseDirHandler"]
		# 下载动作（有序）
		downHandle = ["LoadOriginalHandler", "ConvertHandler", "ParseProHandler", "CutImageHandler",
			"CutBillHandler", "EnterEntityHandler", "OCRHandler", "SavePicInfoHandler"]
		# 下载后动作
		afterDownHandle = ["SaveOutputStatisHandler", "CleanHandler"]
		cb = (err)->
			return callback err if err
			proxy = new StrategyProxy(new DownStrategy(downHandle, socket))
			proxy.io = {socket: socket}
			strategyContext = new StrategyContext proxy
			strategyContext.strategy.target.data = @data
			socket.emit "total", @data?.originals?.length
			setTimeout =>
				strategyContext.execute @data.originals, (err)=>
					return callback err, @data?.originals?.length if err
					afterDownStrategy = new StrategyContext(new StrategyProxy(new AfterDownStrategy(afterDownHandle, socket)))
					afterDownStrategy.strategy.target.data = @data
					afterDownStrategy.execute (err)=>
						callback err, @data?.originals?.length
			, 0
		proxy = new StrategyProxy(new ProDownStrategy(beforeDownHandle, socket))
		proxy.io = {socket: socket}
		new StrategyContext(proxy).execute(param, cb)

module.exports = DownloadContext
