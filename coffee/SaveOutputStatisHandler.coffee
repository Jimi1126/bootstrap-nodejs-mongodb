Handler = require "./Handler"
ExecHandler = require "./ExecHandler"
LOG = LoggerUtil.getLogger "SaveOutputStatisHandler"
class SaveOutputStatisHandler extends Handler
	handle: ()->
		[...params] = arguments
		callback = params.pop()
		if @data and @data.outputStatis
			dao = new MongoDao __b_config.dbInfo, {epcos: ["outputData"]}
			dao.epcos.outputData.insert @data.outputStatis, (err)->
				LOG.error err if err
				callback? err
		else
			LOG.warn "没有产量统计对象"
			callback? null

module.exports = SaveOutputStatisHandler
