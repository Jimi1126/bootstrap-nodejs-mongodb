crypto = require "crypto"
Context = require "./Context"
class UserContext extends Context
	login: (param, callback)->
		dao = new MongoDao __b_config.dbInfo, {sys_user: ["users"]}
		dao.sys_user.users.selectOne {username: param.usercode}, (err, doc)->
			if err
				LOG.info err.stack
				callback null, "error"
			else unless doc
				callback null, "no exist"
			else
				try
					password = crypto.createHash("md5").update(param.password).digest "hex"
				catch e
					callback null, "error"
				if password is doc.password
					callback null, "success"
				else
					callback null, "failed"
module.exports = UserContext
