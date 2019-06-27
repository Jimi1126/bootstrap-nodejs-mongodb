BussinessContext = require './BussinessContext'
EnterContext = require "./EnterContext"
exec = require("child_process").exec
ObjectId = require('mongodb').ObjectId
LOG = LoggerUtil.getLogger "TaskContext"
class TaskContext extends BussinessContext
	mergeImage: (param, callback)->
		that = @
		param.filter.stage = "over"
		that.selectOne {col: "task", filter: {_id: param.filter.task}}, (err, task)->
			return callback err if err
			return callback "failed" unless task
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
					for stage in task.flowList.reverse()
						if fc.value[stage]
							val = fc.value[stage]
							break;
					e_s_map[val] = e_s_map[val] || []
					e_s_map[val].push re.source_img
				originals = []
				that.selectList {col: "entity", filter: {_id: {$in: docs.map (re)-> ObjectId(re.source_img)}}}, (err, ims)->
					LOG.error err if err
					return callback err if err
					return callback "未能找到原文件" if !ims or ims.length is 0
					getOriginal_filter = {_id: {$in: []}}
					o_m_map = {}
					for im in ims
						if im.type is "original"
							originals.push im
							o_m_map[im._id.toString()] = im._id.toString()
						else
							o_m_map[im._id.toString()] = im.source_img
							getOriginal_filter._id.$in.push ObjectId(im.source_img)
					for key, val of e_s_map
						for vv,i in val
							val[i] = o_m_map[vv]
					that.selectList {col: "entity", filter: getOriginal_filter}, (err, ogs)->
						LOG.error err if err
						return callback err if err
						originals = originals.concat ogs
						return callback "未能找到原文件" if !originals or originals.length is 0
						is_pdf = /PDF|pdf/.test originals[0].img_name
						o_n_map = {}
						for orig in originals
							o_n_map[orig._id.toString()] = orig.img_name
						for key, val of e_s_map
							for vv,i in val
								val[i] = o_n_map[vv]
						for key, val of e_s_map
							e_s_map[key] = Utils.uniq val
						res_path = originals[0].s_url.replace "image", "resultData"
						img_dir = originals[0].s_url.replace "image/", ""
						merge_cmd = "cd " + img_dir + " && gm convert %(imgs)s -quality 100 %(outFile)s"
						pdf_original_path = workspace + originals[0].s_url
						pdf_result_path = workspace + res_path
						mkdirp res_path, (err)->
							return callback err if err
							async.eachOf e_s_map, (images, file_name, cb)->
								try
									if is_pdf
										that.mergePDF {
											pdf_result_path: path.resolve(pdf_result_path + "/" + file_name),
											pdf_original_path, 
											images}, cb
									else
										that.mergeOther {merge_cmd, images, file_name}, cb
								catch e
									LOG.error e.stack
									cb "ERROR：" + file_name
							, (err)->
								if err
									LOG.error err
								callback err
	mergePDF: (param, callback)->
		pdf_merge_cmd = "copy %(original)s %(output)s"
		mkdirp param.pdf_result_path, (err)->
			return callback err if err
			async.each param.images, (image, cb)->
				original = path.resolve param.pdf_original_path + image
				output = path.resolve param.pdf_result_path + "/" + image
				exec sprintf.sprintf(pdf_merge_cmd, {original, output}), (err, stdout, stderr, spent)->
					if err
						LOG.error err
						return cb "ERROR：" + param.file_name
					cb err
			, callback
	mergeOther: (param, callback)->
		cmd = sprintf.sprintf param.merge_cmd, {imgs: "image/" + param.images.join(" image/"), outFile: "resultData/" + param.file_name + ".PDF"}
		exec cmd, (err, stdout, stderr, spent)->
			if err
				LOG.error err
				return callback "ERROR：" + param.file_name
			callback err

module.exports = TaskContext
