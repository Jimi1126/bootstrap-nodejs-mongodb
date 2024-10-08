// Generated by CoffeeScript 2.3.2
(function() {
  var ConvertHandler, ExecHandler, Handler, LOG;

  Handler = require("./Handler");

  ExecHandler = require("./ExecHandler");

  LOG = LoggerUtil.getLogger("ConvertHandler");

  ConvertHandler = class ConvertHandler extends Handler {
    handle(param, callback) {
      var dao, dbImage, original, ref;
      if (!param || !param.data) {
        LOG.warn(`${argv.project}：没有需要解析的原件`);
        return callback("没有需要解析的原件");
      }
      original = param.data;
      if (original.state !== 1) {
        LOG.warn(`${original.img_name}：解析-原件异常`);
        if ((ref = param.socket) != null) {
          ref.emit(-1, `${original.img_name}：解析-原件异常`);
        }
        return callback(null, param);
      }
      param.image = [];
      dbImage = {
        deploy_id: original.deploy_id,
        type: "image",
        source_img: original._id,
        code: original.code,
        upload_at: original.upload_at
      };
      dao = new MongoDao(__b_config.dbInfo, {
        epcos: ["entity"]
      });
      return dao.epcos.entity.selectList(dbImage, function(err, docs) {
        var doc, exec, i, isOK, len, name, ref1, ref2, ref3, ref4, rel_path;
        if (err) {
          return callback(err);
        }
        isOK = true;
        if (docs && docs.length > 0) {
          if ((ref1 = param.socket) != null) {
            ref1.emit(0, `${original.img_name}：原件解析信息在数据库存在记录`);
          }
          for (i = 0, len = docs.length; i < len; i++) {
            doc = docs[i];
            if (doc.state !== 1) {
              isOK = false;
            }
          }
          if (isOK) {
            param.image = param.image.concat(docs);
            if ((ref2 = param.socket) != null) {
              ref2.emit(0, `${original.img_name}：原件解析状态为-正常`);
            }
            return callback(null, param);
          }
        }
        if (!isOK) {
          if ((ref3 = param.socket) != null) {
            ref3.emit(0, `${original.img_name}：原件解析状态为-异常`);
          }
        }
        exec = new ExecHandler().queue_exec(1);
        if (!original.img_name || !original.img_name.endsWith("pdf")) {
          dbImage._id = Utils.uuid(24, 16);
          dbImage.img_name = original.img_name;
          dbImage.path = original.s_url;
          dbImage.modify = 0;
          dbImage.state = 1;
          dbImage.create_at = moment().format("YYYYMMDDHHmmss");
          param.image.push(dbImage);
          if ((ref4 = param.socket) != null) {
            ref4.emit(0, `${original.img_name}：不需要解析或未配置解析器`);
          }
          return callback(null, param);
        }
        rel_path = original.s_url;
        name = original.img_name.replace(".pdf", "");
        original.path = `${rel_path}${name}`;
        return mkdirp(`${rel_path}${name}`, function(err) {
          var conv_cmd, ref5;
          if (err) {
            LOG.error(err);
            original.state = -1;
            original.record = `创建解析目录失败：${rel_path}${name}`;
            if ((ref5 = param.socket) != null) {
              ref5.emit(-1, `${original.img_name}：创建解析目录失败`);
            }
            return callback(null, param);
          }
          conv_cmd = `gswin64c -o ${rel_path}${name}/${name}_%d.jpg -sDEVICE=jpeg ${rel_path}${original.img_name}`;
          return exec(conv_cmd, function(err, stdout, stderr, spent) {
            var index, j, newImage, page, ref6, ref7, ref8;
            if (err) {
              original.state = -1;
              original.record = `解析失败：${conv_cmd}`;
              if ((ref6 = param.socket) != null) {
                ref6.emit(-1, `${original.img_name}：解析失败`);
              }
              return callback(err);
            }
            page = +stdout.substring(stdout.lastIndexOf("Page") + 4);
            for (index = j = 1, ref7 = page + 1; (1 <= ref7 ? j < ref7 : j > ref7); index = 1 <= ref7 ? ++j : --j) {
              newImage = Utils.clone(dbImage);
              newImage._id = Utils.uuid(24, 16);
              newImage.img_name = `${name}_${index}.jpg`;
              newImage.path = `${rel_path}${name}/`;
              newImage.modify = 0;
              newImage.state = 1;
              newImage.create_at = moment().format("YYYYMMDDHHmmss");
              param.image.push(newImage);
            }
            original.state = 1;
            original.record = "";
            if ((ref8 = param.socket) != null) {
              ref8.emit(0, `${original.img_name}：原件解析完成`);
            }
            stdout = `${stdout}`.trim();
            stderr = `${stderr}`.trim();
            if (stdout.length > 0) {
              LOG.info(stdout);
            }
            if (stderr.length > 0) {
              LOG.info(stderr);
            }
            return callback(err, param);
          });
        });
      });
    }

  };

  module.exports = ConvertHandler;

}).call(this);
