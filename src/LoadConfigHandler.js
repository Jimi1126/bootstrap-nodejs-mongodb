// Generated by CoffeeScript 2.3.2
(function() {
  // 配置加载者
  var Handler, LOG, LoadConfigHandler;

  Handler = require("./Handler");

  LOG = LoggerUtil.getLogger("LoadConfigHandler");

  LoadConfigHandler = class LoadConfigHandler extends Handler {
    handle() {
      var callback, dao, filter, param, params, that;
      that = this;
      [...params] = arguments;
      callback = params.pop();
      if (!params || params.length === 0) {
        LOG.error("参数不完整");
        return typeof callback === "function" ? callback("参数不完整") : void 0;
      }
      param = params[0];
      if (!(param != null ? param.project : void 0)) {
        LOG.error("未指定项目");
        return typeof callback === "function" ? callback("未指定项目") : void 0;
      }
      if (!(param != null ? param.task : void 0)) {
        LOG.error("未指定业务");
        return typeof callback === "function" ? callback("未指定业务") : void 0;
      }
      dao = new MongoDao(__b_config.dbInfo, {
        epcos: ["deploy"]
      });
      filter = {};
      return async.series([
        function(cb) {
          filter = {
            type: "proj",
            _id: param != null ? param.project : void 0
          };
          return dao.epcos.deploy.selectOne(filter,
        function(err,
        doc) {
            if (err) {
              return cb(err);
            }
            that.data.deploy = {};
            if (!doc) {
              return cb("项目不存在");
            }
            that.data.deploy.project = doc;
            return cb(null);
          });
        },
        function(cb) {
          var taskDao;
          taskDao = new MongoDao(__b_config.dbInfo,
        {
            epcos: ["task"]
          });
          filter = {
            _id: param.task,
            project: param.project
          };
          return taskDao.epcos.task.selectOne(filter,
        function(err,
        doc) {
            if (err) {
              return cb(err);
            }
            if (!doc) {
              return cb("项目业务不存在");
            }
            if (doc.state !== "待下载") {
              return cb("项目业务原件已下载");
            }
            that.data.deploy.task = doc;
            return cb(null);
          });
        },
        function(cb) {
          filter = {
            task: param.task,
            project: param.project,
            type: "image",
            state: "1"
          };
          return dao.epcos.deploy.selectList(filter,
        function(err,
        docs) {
            if (err) {
              return cb(err);
            }
            if (!docs || !docs.length) {
              return cb("项目业务未进行图片配置");
            }
            that.data.deploy.images = docs;
            filter = {
              project: param.project,
              image: {
                $in: docs.map(function(im) {
                  return im._id.toString();
                })
              },
              state: "1"
            };
            return cb(null);
          });
        },
        function(cb) {
          return dao.epcos.deploy.selectList(filter,
        function(err,
        docs) {
            if (err) {
              return cb(err);
            }
            that.data.deploy.bills = [];
            that.data.deploy.fields = [];
            docs.forEach && docs.forEach(function(doc) {
              switch (doc.type) {
                case "bill":
                  return that.data.deploy.bills.push(doc);
                case "field":
                  return that.data.deploy.fields.push(doc);
              }
            });
            return cb(null);
          });
        }
      ], function(err) {
        return typeof callback === "function" ? callback(err) : void 0;
      });
    }

  };

  module.exports = LoadConfigHandler;

}).call(this);
