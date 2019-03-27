Context = require "./Context"
StrategyContext = require "./StrategyContext"
ProDownStrategy = require "./ProDownStrategy"
DownStrategy = require "./DownStrategy"
global.StrategyProxy = require "./StrategyProxy"
global.HandlerProxy = require "./HandlerProxy"
LOG = LoggerUtil.getLogger "DownloadContext"

class DownloadContext extends Context
	execute: (param, socket, callback)->
		# 下载前动作（有序）
		beforeDownHandle = ["LoadConfigHandler", "ScanHandler", "ParseDirHandler"]
		# 下载动作（有序）
		downHandle = ["LoadOriginalHandler", "ConvertHandler", "ParseProHandler", "CutImageHandler", "CutBillHandler", 
			"EnterEntityHandler", "OCRHandler", "SavePicInfoHandler", "CleanHandler"]
		# 下载后动作
		# afterDownHandle = ["", "", "", ""]
		start = moment()
		socket && socket.emit 0, "------本次下载开始于：#{start.format("YYYY-MM-DD HH:mm:ss")}------"
		LOG.info "本次下载开始于：#{start.format("YYYY-MM-DD HH:mm:ss")}"
		cb = (err)->
			return callback err if err
			proxy = new StrategyProxy(new DownStrategy(downHandle, socket))
			proxy.io = {socket: socket}
			strategyContext = new StrategyContext proxy
			strategyContext.strategy.target.data = @data
			socket.emit "total", @data?.originals?.length
			strategyContext.execute @data.originals, (err)=>
				endTime = moment()
				LOG.info "本次下载结束于：#{endTime.format("YYYY-MM-DD HH:mm:ss")} --#{endTime - start}ms"
				socket && socket.emit "final", "----本次下载结束于：#{endTime.format("YYYY-MM-DD HH:mm:ss")} --#{endTime - start}ms"
				callback err, @data?.originals?.length
		proxy = new StrategyProxy(new ProDownStrategy(beforeDownHandle, socket))
		proxy.io = {socket: socket}
		new StrategyContext(proxy).execute(param, cb)

module.exports = DownloadContext
