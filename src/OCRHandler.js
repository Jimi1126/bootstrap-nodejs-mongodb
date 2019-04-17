// Generated by CoffeeScript 2.3.2
(function() {
  var ExecHandler, Handler, LOG, OCRHandler;

  Handler = require("./Handler");

  ExecHandler = require("./ExecHandler");

  LOG = LoggerUtil.getLogger("OCRHandler");

  OCRHandler = class OCRHandler extends Handler {
    handle(param, callback) {
      var image, ref, ref1, ref2, stage_handler, statis, that;
      that = this;
      if (!param || !param.data) {
        LOG.warn("没有OCR的实体");
        return callback("没有OCR的实体");
      }
      image = param.data;
      if (!that.data.outputStatis) {
        that.data.outputStatis = {
          task: that.data.deploy.task._id.toString(),
          project: that.data.deploy.project._id.toString(),
          statis: {}
        };
      }
      if (!param.enterEntitys) {
        LOG.warn("没有OCR的实体");
        if ((ref = param.socket) != null) {
          ref.emit(0, `${image.img_name}：没有OCR的实体`);
        }
        return callback(null, param);
      }
      if (that.data.deploy.task.flowList[0] !== "ocr") {
        LOG.warn(`${image.img_name}：不需要OCR`);
        if ((ref1 = param.socket) != null) {
          ref1.emit(0, `${image.img_name}：不需要OCR`);
        }
        return callback(null, param);
      }
      if ((ref2 = param.socket) != null) {
        ref2.emit(0, `${image.img_name}：开始进行OCR`);
      }
      statis = that.data.outputStatis.statis;
      statis["ocr"] || (statis["ocr"] = {});
      stage_handler = statis["ocr"]["ocr"] || (statis["ocr"]["ocr"] = {
        chatLength: 0,
        symbol: 0,
        count: 0
      });
      return async.each(param.enterEntitys, function(enterEntity, cb) {
        var file_path;
        file_path = enterEntity.path + enterEntity.img_name;
        return fs.readFile(file_path, function(err) {
          var en, i, len, ref3, ref4, ref5, res;
          if (err) {
            enterEntity.stage = "error";
            enterEntity.remark = err;
            if ((ref3 = param.socket) != null) {
              ref3.emit(-1, `${image.img_name}：OCR失败`);
            }
            return cb(null);
          }
          if ((ref4 = param.socket) != null) {
            ref4.emit(0, `${image.img_name}：OCR完成`);
          }
          res = {
            "fc001": "123",
            "fc002": "123",
            "fc003": "123"
          };
          enterEntity.stage = that.data.deploy.task.flowList[1];
          ref5 = enterEntity.enter;
          for (i = 0, len = ref5.length; i < len; i++) {
            en = ref5[i];
            delete en.src_type;
            if (res[en.field_id]) {
              en.handler["ocr"] = "ocr";
              en.value["ocr"] = res[en.field_id];
              stage_handler.chatLength += Utils.getLength(res[en.field_id]);
              stage_handler.symbol += Utils.replaceAll(res[en.field_id], "？", "").length === 0 ? 1 : 0;
              stage_handler.count++;
            }
          }
          return cb(null);
        });
      }, function(err) {
        if (err) {
          LOG.error(err);
        }
        return callback(null, param);
      });
    }

  };

  module.exports = OCRHandler;

}).call(this);
