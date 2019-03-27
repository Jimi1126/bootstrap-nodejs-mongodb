Handler = require "./Handler"
ExecHandler = require "./ExecHandler"
LOG = LoggerUtil.getLogger "SavePicInfoHandler"
class SavePicInfoHandler extends Handler
	handle: (param, callback)->
		that = @
		dao = new MongoDao __b_config.dbInfo, {epcos: ["entity", "resultData"]}
		image = param.data
		param.socket?.emit 0, "#{image.img_name}：保存数据"
		data = []
		param.data and param.data._id and (data = data.concat param.data)
		param.image and (data = data.concat param.image.filter (b)-> b._id)
		param.bill and (data = data.concat param.bill.filter (b)-> b._id)
		param.field and (data = data.concat param.field.filter (f)-> f._id)
		if data.length is 0
			return callback null,param
		addArr = data.filter (d) ->
			if d.modify is 0
				return delete d.modify
			else
				return false
		updArr = data.filter (d) ->
			if d.modify is 1
				return delete d.modify
			else
				return false
		param.socket?.emit 0, "#{image.img_name}：新增数据，#{addArr.length}条"
		param.socket?.emit 0, "#{image.img_name}：更新数据，#{updArr.length}条"
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
				return cb null if !param.enterEntitys or param.enterEntitys.length is 0
				dao.epcos.resultData.insert param.enterEntitys, cb
		], (err)->
			if err
				LOG.error JSON.stringify err
				param.socket?.emit -1, "#{image.img_name}：保存数据失败"
			else
				param.socket?.emit 0, "#{image.img_name}：保存数据完成，共#{addArr.concat(updArr).concat(param.enterEntitys).length}条"
			callback null, param

module.exports = SavePicInfoHandler
