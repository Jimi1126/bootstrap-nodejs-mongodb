Handler = require "./Handler"
ExecHandler = require "./ExecHandler"
LOG = LoggerUtil.getLogger "SavePicInfoHandler"
class SavePicInfoHandler extends Handler
	handle: (callback)->
		that = @
		i_dao = new MongoDao __b_config.dbInfo, {epcos: ["image"]}
		b_dao = new MongoDao __b_config.dbInfo, {epcos: ["bill"]}
		f_dao = new MongoDao __b_config.dbInfo, {epcos: ["field"]}
		async.parallel [
			(cb)->
				if !that.data.images
					LOG.trace "没有需要保存的图片内容"
					return cb null
				data = that.data.images.filter (i)-> !i._id
				if data.length isnt 0
					i_dao.epcos.image.insert data, cb
				else
					cb null
			(cb)->
				if !that.data.images
					LOG.trace "没有需要保存的图片内容"
					return cb null
				data = that.data.images.filter (i)-> i._id
				if data.length isnt 0
					async.each data, (d, cb1)->
						i_dao.epcos.image.update {_id: d._id}, d, cb1
					, cb
				else
					cb null
			(cb)->
				if !that.data.bills
					LOG.trace "没有需要保存的分块内容"
					return cb null
				data = that.data.bills.filter (b)-> !b._id
				if data.length isnt 0
					b_dao.epcos.bill.insert data, cb
				else
					cb null
			(cb)->
				if !that.data.bills
					LOG.trace "没有需要保存的分块内容"
					return cb null
				data = that.data.bills.filter (b)-> b._id
				if data.length isnt 0
					async.each data, (d, cb1)->
						b_dao.epcos.bill.update {_id: d._id}, d, cb1
					, cb
				else
					cb null
			(cb)->
				if !that.data.fields
					LOG.trace "没有需要保存的字段内容"
					return cb null
				data = that.data.fields.filter (f)-> !f._id
				if data.length isnt 0
					f_dao.epcos.field.insert data, cb
				else
					cb null
			(cb)->
				if !that.data.fields
					LOG.trace "没有需要保存的字段内容"
					return cb null
				data = that.data.fields.filter (f)-> f._id
				if data.length isnt 0
					async.each data, (d, cb1)->
						f_dao.epcos.field.update {_id: d._id}, d, cb1
					, cb
				else
					cb null
		], (err)->
			LOG.error JSON.stringify err if err
			callback null

module.exports = SavePicInfoHandler
