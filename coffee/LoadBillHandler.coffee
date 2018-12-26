Handler = require "./Handler"
ExecHandler = require "./ExecHandler"
LOG = LoggerUtil.getLogger "LoadBillHandler"
class LoadBillHandler extends Handler
	handle: (callback)->
		async.eachOf @data.billInfos, (billInfo, cmd, cb1)=>
			rel_path = "./download/" + cmd.substring(cmd.lastIndexOf("EPCOS") - 1)
			f_cmd = @data.conf.remote?.fetch_bill
			mkdirp rel_path, (err)=>
				throw err if err
				exec = new ExecHandler().queue_exec(3);
				async.eachLimit billInfo, @data.conf.remote.max_connections, (bill, cb2) =>
					LOG.info "下载 #{bill.bill_name}"
					# 检查保单是否存在
					mongoDao[argv.project].history.count {bill_name: bill.bill_name.replace( ".xml" , "" )}, (err, count) =>
						return callback err if err
						if not f_cmd
							LOG.error "项目配置未定义 [#{entry.conf.project}]: remote.fetch_bill"
							cb "项目配置未定义 [#{entry.conf.project}]: remote.fetch_bill"
						try
							fetch = sprintf.sprintf cmd + f_cmd, {
								bill_name: bill.bill_name
								down_name: rel_path + bill.bill_name
							}
						catch err
							LOG.info err
						exec fetch, (err, stdout, stderr, spent) =>
							return cb2 err if err
							@data.conf.data.total.files += 1
							cb2()
				, cb1
		, callback
module.exports = LoadBillHandler
