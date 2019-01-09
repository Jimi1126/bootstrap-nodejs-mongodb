Handler = require "./Handler"
ExecHandler = require "./ExecHandler"
LOG = LoggerUtil.getLogger "ConvertHandler"
class ConvertHandler extends Handler
	handle: (callback)->
		exec = new ExecHandler().queue_exec 3
		conv_stat = {total: 0, success: 0, failure: 0}
		async.eachOf @data.billInfos, (billInfo, cmd, cb1)=>
			rel_path = path.join workspace, "download" + cmd.substring cmd.lastIndexOf("EPCOS") - 1
			async.each billInfo, (bill, cb2)=>
				if bill.bill_name and bill.bill_name.endsWith "pdf"
					conv_stat.total++
					bill_name = bill.bill_name.replace ".pdf", ""
					# bill.bill_name = []
					conv_cmd = "gswin64c -o %(bill_name)s_%%d.jpg -sDEVICE=%(type)s %(bill_name)s.pdf"
					conv_cmd = sprintf.sprintf conv_cmd, {
						bill_name: rel_path + bill_name
						type: "jpeg"
					}
					exec conv_cmd, (err, stdout, stderr, spent) ->
						if err
							bill.status = "异常"
							return cb2()
						stdout = "#{stdout}".trim()
						stderr = "#{stderr}".trim()
						LOG.info stdout if stdout.length > 0
						LOG.info stderr if stderr.length > 0
						conv_stat.success++
						cb2()
				else
					cb2()
			, cb1
		, ()->
			conv_stat.failure = conv_stat.total - conv_stat.success
			LOG.info JSON.stringify conv_stat
			callback.apply this, arguments

module.exports = ConvertHandler
