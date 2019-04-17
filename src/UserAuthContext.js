// Generated by CoffeeScript 2.3.2
(function() {
  var BussinessContext, LOG, ObjectId, UserAuthContext;

  BussinessContext = require('./BussinessContext');

  ObjectId = require('mongodb').ObjectId;

  LOG = LoggerUtil.getLogger("UserAuthContext");

  UserAuthContext = class UserAuthContext extends BussinessContext {
    getAuth(user, callback) {
      var param, that;
      that = this;
      param = {
        col: "user_auth",
        filter: {
          state: "0"
        }
      };
      user.username && (param.filter.usercode = user.username);
      user.nickname && (param.filter.username = user.nickname);
      if (!param.filter.usercode) {
        return callback(null, []);
      }
      return this.selectList(param, function(err, docs) {
        var arr, doc, i, id, j, k, len, len1;
        if (err) {
          return callback(null, []);
        }
        if ((!docs || !docs.length) && param.filter.usercode !== "6182") {
          return callback(null, []);
        }
        arr = [];
        for (j = 0, len = docs.length; j < len; j++) {
          doc = docs[j];
          doc.controlIds = doc.controlIds || "";
          arr = arr.concat(doc.controlIds.split(","));
        }
        for (i = k = 0, len1 = arr.length; k < len1; i = ++k) {
          id = arr[i];
          arr[i] = ObjectId(id);
        }
        param = {
          col: "sys_config",
          filter: {
            state: "0",
            type: "control"
          }
        };
        user.username !== "6182" && (param.filter._id = {
          $in: arr
        });
        return that.selectList(param, callback);
      });
    }

    accessControl(callback) {
      var param;
      param = {
        col: "sys_config",
        filter: {
          state: "0",
          type: "control",
          control_type: "2"
        }
      };
      return this.selectList(param, callback);
    }

  };

  module.exports = UserAuthContext;

}).call(this);
