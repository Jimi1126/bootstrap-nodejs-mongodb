BussinessContext = require './BussinessContext'
EnterContext = require "./EnterContext"
exec = require("child_process").exec
ObjectId = require('mongodb').ObjectId
LOG = LoggerUtil.getLogger "TaskContext"
class TaskContext extends BussinessContext
	mergeImage: (param, callback)->
		that = @
		param.filter.stage = "over"
		new EnterContext().getResultData param, (err, docs)->
			LOG.error err if err
			return callback err if err
			return callback null if !docs or docs.length is 0
			e_s_map = {}
			for re in docs
				fc001 = re.enter.filter((e)-> e.field_id == "fc001")[0]
				fc002 = re.enter.filter((e)-> e.field_id == "fc002")[0]
				fc003 = re.enter.filter((e)-> e.field_id == "fc003")[0]
				fc = fc002 || fc001
				continue if !fc
				val = if fc.value.op4 then fc.value.op4 else fc.value.op2
				e_s_map[val] = e_s_map[val] || []
				e_s_map[val].push re.source_img
			that.select {col: "entity", filter: {_id: {$in: docs.map (re)-> ObjectId(re.source_img)}}}, (err, ims)->
				LOG.error err if err
				return callback err if err
				return callback null if !ims or ims.length is 0
				getOriginal_filter = {_id: {$in: []}}
				o_m_map = {}
				for im in ims
					o_m_map[im._id.toString()] = im.source_img
					getOriginal_filter._id.$in.push ObjectId(im.source_img)
				for key, val of e_s_map
					for vv,i in val
						val[i] = o_m_map[vv]
				that.select {col: "entity", filter: getOriginal_filter}, (err, originals)->
					LOG.error err if err
					return callback err if err
					return callback null if !originals or originals.length is 0
					o_n_map = {}
					for orig in originals
						o_n_map[orig._id.toString()] = orig.img_name
					for key, val of e_s_map
						for vv,i in val
							val[i] = o_n_map[vv]
					res_path = originals[0].s_url.replace "image", "resultData"
					img_dir = originals[0].s_url.replace "image/", ""
					merge_cmd = "cd " + img_dir + " && gm convert %(imgs)s -quality 100 %(outFile)s"
					mkdirp res_path, (err)->
						return callback err if err
						async.eachOf e_s_map, (images, file_name, cb)->
							try
								cmd = sprintf.sprintf merge_cmd, {imgs: "image/" + images.join(" image/"), outFile: "resultData/" + file_name + ".PDF"}
								exec cmd, (err, stdout, stderr, spent)->
									if err
										LOG.error e.stack
										return cb "ERROR：" + file_name
									cb err
							catch e
								LOG.error e.stack
								cb "ERROR：" + file_name
						, (err)->
							if err
								LOG.error err
								return callback err
							that.update {col: "task", filter: {_id: param.filter.task}, setter: {$set: {state: "已合并"}}}, callback

module.exports = TaskContext
