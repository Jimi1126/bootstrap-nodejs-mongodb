Context = require './Context'
class ConfigContext extends Context
  exist: (param, callback)->
    cont = {}
    cont[param.db] = [param.col]
    dao = new MongoDao __b_config.dbInfo, cont
    dao[param.db][param.col].selectOne param.filter, (err, doc)->
      return callback err if err
      unless doc
        callback null, false
      else
        callback null, true
  getDeploy: (param, callback)->
    dao = new MongoDao __b_config.dbInfo, {epcos: ["deploy"]}
    dao.epcos.deploy.selectList param, callback
  saveDeploy: (data, callback)->
    dao = new MongoDao __b_config.dbInfo, {epcos: ["deploy"]}
    dao.epcos.deploy.insert data, callback
  updateDeploy: (filter, setter, callback)->
    dao = new MongoDao __b_config.dbInfo, {epcos: ["deploy"]}
    dao.epcos.deploy.update filter, setter, callback
  addOrUpdateDeploy: (data, callback)->
    dao = new MongoDao __b_config.dbInfo, {epcos: ["deploy"]}
    dao.epcos.deploy.addOrUpdate data, callback
  deleteDeploy: (param, callback)->
    dao = new MongoDao __b_config.dbInfo, {epcos: ["deploy"]}
    dao.epcos.deploy.delete param, callback
module.exports = ConfigContext