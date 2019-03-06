Handler = require "./Handler"
ExecHandler = require "./ExecHandler"
LOG = LoggerUtil.getLogger "EnterEntityHandler"
class EnterEntityHandler extends Handler
  handle: (callback)->
    that = @
    that.data.enterEntitys = enterEntitys = []
    return callback null if !@data.images or @data.images.length is 0
    dao = new MongoDao __b_config.dbInfo, {epcos: ["deploy", "resultData"]}
    filter = {
      project: that.data.deploy.project._id.toString()
      type: "enter"
      state: "1" #启用
    }
    dao.epcos.deploy.selectList filter, (err, docs)->
      if err
        LOG.error err
        return callback null
      confMap = {}
      for conf in docs
        confMap[conf.file_id] || (confMap[conf.file_id] = [])
        confMap[conf.file_id].push {
          field_id: conf.field_id
          field_name: conf.field_name
          src_type: conf.src_type
          value: {}
          tip: ""
        }
      for key, confs of confMap
        for entity in that.data[confs[0].src_type + "s"]
          continue unless entity.deploy_id is key
          enterEntitys.push {
            _id: Utils.uuid 24, 16
            project: filter.project
            deploy_id: entity.deploy_id
            code: entity.code
            source_img: entity.source_img
            path: entity.path
            img_name: entity.img_name
            enter: confs
            stage: "ocr"
            priority: "1"
            create_at: moment().format "YYYYMMDDHHmmss"
          }
          entity.isDeploy = 1
      callback null

module.exports = EnterEntityHandler