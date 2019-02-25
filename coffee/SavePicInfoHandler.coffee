Handler = require "./Handler"
ExecHandler = require "./ExecHandler"
LOG = LoggerUtil.getLogger "SavePicInfoHandler"
class SavePicInfoHandler extends Handler
	handle: (callback)->
		that = @
		dao = new MongoDao __b_config.dbInfo, {epcos: ["entity", "resultData"]}
		data = []
		that.data.images && (data = data.concat that.data.images)
		that.data.bills && (data = data.concat that.data.bills)
		that.data.fields && (data = data.concat that.data.fields)
		return callback null if data.length is 0
		addArr = data.filter (d) -> !d.inDB
		updArr = data.filter (d) ->
			if d.inDB
				return delete d.inDB
			else 
				return false
		async.parallel [
			(cb)->
				return cb null if addArr.length is 0
				dao.epcos.entity.insert addArr, cb
			(cb)->
				return cb null if updArr.length is 0
				async.eachLimit updArr, 50, (dd, cb1)->
					dao.epcos.entity.update {_id: dd._id}, dd, cb1
				, cb
			(cb)->
				return cb null if that.data.enterEntitys.length is 0
				dao.epcos.resultData.insert that.data.enterEntitys, cb
		], (err)->
			LOG.error JSON.stringify err if err
			callback null

module.exports = SavePicInfoHandler
