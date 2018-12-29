Handler = require "./Handler"
ExecHandler = require "./ExecHandler"
LOG = LoggerUtil.getLogger "LoadBillHandler"
class LoadBillHandler extends Handler
	handle: (callback)->
		down_stat = {total: 0, success: 0, exist: 0, failure: 0}
		down_stat.total += billInfo?.length for cmd, billInfo of @data.billInfos
		async.eachOf @data.billInfos, (billInfo, cmd, cb1)=>
			rel_path = "./download/" + cmd.substring(cmd.lastIndexOf("EPCOS") - 1)
			f_cmd = @data.conf.remote?.fetch_bill
			if not f_cmd
				LOG.error "项目配置未定义 [#{argv.project}]: remote.fetch_bill"
				cb1 "项目配置未定义 [#{argv.project}]: remote.fetch_bill"
			LOG.info "down_path: #{rel_path}"
			mkdirp rel_path, (err)=>
				throw err if err
				exec = new ExecHandler().queue_exec(3);
				async.eachLimit billInfo, @data.conf.remote.max_connections, (bill, cb2) =>
					# 检查保单是否存在
					mongoDao[argv.project].history.count {bill_name: bill.bill_name.replace( ".xml" , "" )}, (err, count) =>
						throw err if err
						if count > 0
							down_stat.exist++ 
							cb2()
						try
							fetch = sprintf.sprintf cmd + f_cmd, {
								bill_name: bill.bill_name
								down_name: rel_path + bill.bill_name
							}
						catch err
							LOG.info err
						exec fetch, (err, stdout, stderr, spent) =>
							return cb2 err if err
							down_stat.success++
							cb2()
				, cb1
		, ()->
			down_stat.failure = down_stat.total - down_stat.success - down_stat.exist
			LOG.info JSON.stringify down_stat
			callback.apply this, arguments
module.exports = LoadBillHandler
