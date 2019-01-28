// Generated by CoffeeScript 2.3.2
(function() {
  var ExecHandler, Handler, LOG, SavePicInfoHandler;

  Handler = require("./Handler");

  ExecHandler = require("./ExecHandler");

  LOG = LoggerUtil.getLogger("SavePicInfoHandler");

  SavePicInfoHandler = class SavePicInfoHandler extends Handler {
    handle(callback) {
      var b_dao, f_dao, i_dao, that;
      that = this;
      i_dao = new MongoDao(__b_config.dbInfo, {
        epcos: ["image"]
      });
      b_dao = new MongoDao(__b_config.dbInfo, {
        epcos: ["bill"]
      });
      f_dao = new MongoDao(__b_config.dbInfo, {
        epcos: ["field"]
      });
      return async.parallel([
        function(cb) {
          var data;
          if (!that.data.images) {
            LOG.trace("没有需要保存的图片内容");
            return cb(null);
          }
          data = that.data.images.filter(function(i) {
            return !i._id;
          });
          if (data.length !== 0) {
            return i_dao.epcos.image.insert(data,
        cb);
          } else {
            return cb(null);
          }
        },
        function(cb) {
          var data;
          if (!that.data.images) {
            LOG.trace("没有需要保存的图片内容");
            return cb(null);
          }
          data = that.data.images.filter(function(i) {
            return i._id;
          });
          if (data.length !== 0) {
            return async.each(data,
        function(d,
        cb1) {
              return i_dao.epcos.image.update({
                _id: d._id
              },
        d,
        cb1);
            },
        cb);
          } else {
            return cb(null);
          }
        },
        function(cb) {
          var data;
          if (!that.data.bills) {
            LOG.trace("没有需要保存的分块内容");
            return cb(null);
          }
          data = that.data.bills.filter(function(b) {
            return !b._id;
          });
          if (data.length !== 0) {
            return b_dao.epcos.bill.insert(data,
        cb);
          } else {
            return cb(null);
          }
        },
        function(cb) {
          var data;
          if (!that.data.bills) {
            LOG.trace("没有需要保存的分块内容");
            return cb(null);
          }
          data = that.data.bills.filter(function(b) {
            return b._id;
          });
          if (data.length !== 0) {
            return async.each(data,
        function(d,
        cb1) {
              return b_dao.epcos.bill.update({
                _id: d._id
              },
        d,
        cb1);
            },
        cb);
          } else {
            return cb(null);
          }
        },
        function(cb) {
          var data;
          if (!that.data.fields) {
            LOG.trace("没有需要保存的字段内容");
            return cb(null);
          }
          data = that.data.fields.filter(function(f) {
            return !f._id;
          });
          if (data.length !== 0) {
            return f_dao.epcos.field.insert(data,
        cb);
          } else {
            return cb(null);
          }
        },
        function(cb) {
          var data;
          if (!that.data.fields) {
            LOG.trace("没有需要保存的字段内容");
            return cb(null);
          }
          data = that.data.fields.filter(function(f) {
            return f._id;
          });
          if (data.length !== 0) {
            return async.each(data,
        function(d,
        cb1) {
              return f_dao.epcos.field.update({
                _id: d._id
              },
        d,
        cb1);
            },
        cb);
          } else {
            return cb(null);
          }
        }
      ], function(err) {
        if (err) {
          LOG.error(JSON.stringify(err));
        }
        return callback(null);
      });
    }

  };

  module.exports = SavePicInfoHandler;

}).call(this);
