// Generated by CoffeeScript 2.3.2
(function() {
  var BussinessContext, EnterContext, LOG, ObjectId, TaskContext, exec;

  BussinessContext = require('./BussinessContext');

  EnterContext = require("./EnterContext");

  exec = require("child_process").exec;

  ObjectId = require('mongodb').ObjectId;

  LOG = LoggerUtil.getLogger("TaskContext");

  TaskContext = class TaskContext extends BussinessContext {
    mergeImage(param, callback) {
      var that;
      that = this;
      param.filter.stage = "over";
      return that.selectOne({
        col: "task",
        filter: {
          _id: param.filter.task
        }
      }, function(err, task) {
        if (err) {
          return callback(err);
        }
        if (!task) {
          return callback("failed");
        }
        return new EnterContext().getResultData(param, function(err, docs) {
          var e_s_map, fc, fc001, fc002, fc003, j, k, len, len1, re, ref, stage, val;
          if (err) {
            LOG.error(err);
          }
          if (err) {
            return callback(err);
          }
          if (!docs || docs.length === 0) {
            return callback(null);
          }
          e_s_map = {};
          for (j = 0, len = docs.length; j < len; j++) {
            re = docs[j];
            fc001 = re.enter.filter(function(e) {
              return e.field_id === "fc001";
            })[0];
            fc002 = re.enter.filter(function(e) {
              return e.field_id === "fc002";
            })[0];
            fc003 = re.enter.filter(function(e) {
              return e.field_id === "fc003";
            })[0];
            fc = fc002 || fc001;
            if (!fc) {
              continue;
            }
            ref = task.flowList.reverse();
            for (k = 0, len1 = ref.length; k < len1; k++) {
              stage = ref[k];
              if (fc.value[stage]) {
                val = fc.value[stage];
                break;
              }
            }
            e_s_map[val] = e_s_map[val] || [];
            e_s_map[val].push(re.source_img);
          }
          return that.selectList({
            col: "entity",
            filter: {
              _id: {
                $in: docs.map(function(re) {
                  return ObjectId(re.source_img);
                })
              }
            }
          }, function(err, ims) {
            var getOriginal_filter, i, im, key, l, len2, len3, m, o_m_map, vv;
            if (err) {
              LOG.error(err);
            }
            if (err) {
              return callback(err);
            }
            if (!ims || ims.length === 0) {
              return callback("未能找到原文件");
            }
            getOriginal_filter = {
              _id: {
                $in: []
              }
            };
            o_m_map = {};
            for (l = 0, len2 = ims.length; l < len2; l++) {
              im = ims[l];
              o_m_map[im._id.toString()] = im.source_img;
              getOriginal_filter._id.$in.push(ObjectId(im.source_img));
            }
            for (key in e_s_map) {
              val = e_s_map[key];
              for (i = m = 0, len3 = val.length; m < len3; i = ++m) {
                vv = val[i];
                val[i] = o_m_map[vv];
              }
            }
            return that.selectList({
              col: "entity",
              filter: getOriginal_filter
            }, function(err, originals) {
              var img_dir, is_pdf, len4, len5, merge_cmd, n, o, o_n_map, orig, pdf_original_path, pdf_result_path, res_path;
              if (err) {
                LOG.error(err);
              }
              if (err) {
                return callback(err);
              }
              if (!originals || originals.length === 0) {
                return callback("未能找到原文件");
              }
              is_pdf = /PDF|pdf/.test(originals[0].img_name);
              o_n_map = {};
              for (n = 0, len4 = originals.length; n < len4; n++) {
                orig = originals[n];
                o_n_map[orig._id.toString()] = orig.img_name;
              }
              for (key in e_s_map) {
                val = e_s_map[key];
                for (i = o = 0, len5 = val.length; o < len5; i = ++o) {
                  vv = val[i];
                  val[i] = o_n_map[vv];
                }
              }
              for (key in e_s_map) {
                val = e_s_map[key];
                e_s_map[key] = Utils.uniq(val);
              }
              res_path = originals[0].s_url.replace("image", "resultData");
              img_dir = originals[0].s_url.replace("image/", "");
              merge_cmd = "cd " + img_dir + " && gm convert %(imgs)s -quality 100 %(outFile)s";
              pdf_original_path = workspace + originals[0].s_url;
              pdf_result_path = workspace + res_path;
              return mkdirp(res_path, function(err) {
                if (err) {
                  return callback(err);
                }
                return async.eachOf(e_s_map, function(images, file_name, cb) {
                  var e;
                  try {
                    if (is_pdf) {
                      return that.mergePDF({
                        pdf_result_path: path.resolve(pdf_result_path + "/" + file_name),
                        pdf_original_path,
                        images
                      }, cb);
                    } else {
                      return that.mergeOther({merge_cmd, images, file_name}, cb);
                    }
                  } catch (error) {
                    e = error;
                    LOG.error(e.stack);
                    return cb("ERROR：" + file_name);
                  }
                }, function(err) {
                  if (err) {
                    LOG.error(err);
                  }
                  return callback(err);
                });
              });
            });
          });
        });
      });
    }

    mergePDF(param, callback) {
      var pdf_merge_cmd;
      pdf_merge_cmd = "copy %(original)s %(output)s";
      return mkdirp(param.pdf_result_path, function(err) {
        if (err) {
          return callback(err);
        }
        return async.each(param.images, function(image, cb) {
          var original, output;
          original = path.resolve(param.pdf_original_path + image);
          output = path.resolve(param.pdf_result_path + "/" + image);
          return exec(sprintf.sprintf(pdf_merge_cmd, {original, output}), function(err, stdout, stderr, spent) {
            if (err) {
              LOG.error(err);
              return cb("ERROR：" + param.file_name);
            }
            return cb(err);
          });
        }, callback);
      });
    }

    mergeOther(param, callback) {
      var cmd;
      cmd = sprintf.sprintf(param.merge_cmd, {
        imgs: "image/" + param.images.join(" image/"),
        outFile: "resultData/" + param.file_name + ".PDF"
      });
      return exec(cmd, function(err, stdout, stderr, spent) {
        if (err) {
          LOG.error(e.stack);
          return callback("ERROR：" + param.file_name);
        }
        return callback(err);
      });
    }

  };

  module.exports = TaskContext;

}).call(this);
