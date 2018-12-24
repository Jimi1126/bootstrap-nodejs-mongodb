DBHandler = require "./DBHandler"
mongoCondig = require "../config/config-mongo.json"
DAO = require "./DAO"
LOG = LoggerUtil.getLogger "MongoDAO"
class MongoDAO extends DAO
  # 初始化状态：-1待加载，0加载中，1加载完成，2加载异常
  DB_STATUS: -1
  constructor: ->
    super()
    @init()
  init: ->
    @DB_STATUS = 0
    perfix = "mongodb://#{mongoCondig.username}:#{mongoCondig.password}@#{mongoCondig.hostName}:#{mongoCondig.port}/"
    postfix = "?#{mongoCondig.auth}"
    @projects = {}
    @projects["conf"] = new DBHandler perfix + "projects" + postfix, "conf", mongoCondig.DB_OPTS
    @projects["deploy"] = new DBHandler perfix + "projects" + postfix, "deploy", mongoCondig.DB_OPTS
    @sys_user = {}
    @sys_user["conf"] = new DBHandler perfix + "sys_user" + postfix, "users", mongoCondig.DB_OPTS
    @sys_user["deploy"] = new DBHandler perfix + "sys_user" + postfix, "session", mongoCondig.DB_OPTS
    filter = {}
    filter = {name: argv.project} if argv.project
    @projects.deploy.selectList filter, (err, docs) =>
      if err
        LOG.error "projects connect err #{err.stack}"
        @DB_STATUS = 2
        return
      for proj_conf in docs
        #内存数据库 projectname_task
        if proj_conf.task and proj_conf.task isnt ""
          proj_cache_db = "#{proj_conf.name}_cache"
          @[proj_cache_db] = {}
          @[proj_cache_db]["task"] = new DBHandler proj_conf.task, "task", mongoCondig.DB_OPTS
          @[proj_cache_db]["examine"] = new DBHandler proj_conf.task, "examine", mongoCondig.DB_OPTS
          LOG.info "cache_db:#{proj_cache_db} bindList:task,examine"
        #历史数据库 winter_projectname
        bindList = proj_conf.table ? []
        bindList.push.apply bindList, [
          "history"
          "sum"
          "wrong"
          "quality"
          "examine"
          "notice"
        ]
        @[proj_conf.name] = {}
        @[proj_conf.name][col] = new DBHandler proj_conf.task, col, mongoCondig.DB_OPTS for col in bindList
        LOG.info "history_db:#{proj_conf.name} bindList:#{bindList.toString()}"
      @DB_STATUS = 1
    return
module.exports = MongoDAO