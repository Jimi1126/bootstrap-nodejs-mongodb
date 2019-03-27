Handler = require "./Handler"
ExecHandler = require "./ExecHandler"
LOG = LoggerUtil.getLogger "EnterEntityHandler"
class EnterEntityHandler extends Handler
  handle: (param, callback)->
    that = @
    if !param or !param.data
      LOG.warn "没有要构造的实体"
      return callback "没有要构造的实体"
    original = param.data
    if original.state isnt 1
      LOG.warn "#{original.img_name}：构造实体-原件异常"
      param.socket?.emit -1, "#{original.img_name}：构造实体-原件异常"
      return callback null, param
    param.enterEntitys = enterEntitys = []
    param.socket?.emit 0, "#{original.img_name}：开始构造录入实体"
    dao = new MongoDao __b_config.dbInfo, {epcos: ["deploy", "resultData"]}
    deploy_ids = []
    deploy_ids.push param.data.deploy_id
    for b in param.bill
      if deploy_ids.indexOf(b.deploy_id) is -1
        deploy_ids.push b.deploy_id
    for f in param.field
      if deploy_ids.indexOf(f.deploy_id) is -1
        deploy_ids.push f.deploy_id
    filter = {
      project: that.data.deploy.project._id.toString()
      deploy_id: {$in: deploy_ids}
      type: "enter"
      state: "1" #启用
    }
    dao.epcos.deploy.selectList filter, (err, docs)->
      if err
        LOG.error err
        param.socket?.emit 0, "#{original.img_name}：构造录入实体失败"
        return callback null, param
      confMap = {}
      for conf in docs
        confMap[conf.deploy_id] || (confMap[conf.deploy_id] = [])
        confMap[conf.deploy_id].push {
          field_id: conf.field_id
          field_name: conf.field_name
          src_type: conf.src_type
          handler:{}
          value: {}
          tip: ""
        }
      for key, confs of confMap
        entityName = confs[0].src_type
        for entity in param[entityName] || []
          continue if entity.modify is undefined
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
            stage: "op1"
            priority: "1"
            create_at: entity.create_at
          }
          entity.isDeploy = 1
      param.socket?.emit 0, "#{original.img_name}：构造录入实体完成"
      callback null, param

module.exports = EnterEntityHandler