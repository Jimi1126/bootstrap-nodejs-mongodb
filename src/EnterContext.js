// Generated by CoffeeScript 2.3.2
(function() {
  var BussinessContext, EnterContext, LOG;

  BussinessContext = require('./BussinessContext');

  LOG = LoggerUtil.getLogger("EnterContext");

  EnterContext = class EnterContext extends BussinessContext {
    getEnterTask(data, callback) {
      var task;
      if (!data || !data.task) {
        LOG.error("参数不完整");
        return callback(null, null);
      }
      global.enter || (global.enter = {});
      global.enter.tasks || (global.enter.tasks = {});
      task = global.enter.tasks[data.task];
      if (task) {
        return callback(null, task);
      }
      return this.selectOne({
        col: "task",
        filter: {
          _id: data.task
        }
      }, function(err, doc) {
        if (err) {
          return callback(err);
        }
        if (!doc) {
          return callback("未找到项目业务对象");
        }
        doc.flowList.push("over");
        global.enter.tasks[data.task] = doc;
        return callback(null, doc);
      });
    }

    getEnterEntity(param, callback) {
      var data, do_update, entity, entity_task, entitys, lockKey, task, that;
      that = this;
      data = param.data;
      task = param.task;
      if (!data || !data.project || !data.task || !data.stage) {
        LOG.error("参数不完整");
        return callback(null, null);
      }
      global.enter || (global.enter = {});
      global.enter.entitys || (global.enter.entitys = {});
      global.enter.entitys.MIN_CACHE || (global.enter.entitys.MIN_CACHE = 30);
      global.enter.entitys.MAX_CACHE || (global.enter.entitys.MAX_CACHE = 90);
      global.enter.entitys[data.project] || (global.enter.entitys[data.project] = {});
      entity_task = global.enter.entitys[data.project][data.task] || (global.enter.entitys[data.project][data.task] = {
        done: false
      });
      entitys = global.enter.entitys[data.project][data.task][data.stage] || (global.enter.entitys[data.project][data.task][data.stage] = {
        isEmpty: false,
        data: [],
        entering: []
      });
      entity = null;
      do_update = function(cb) {
        var export_time, flags, i, len, ref, ref1, ref2, ref3, stage;
        flags = 0;
        ref = task.flowList;
        for (i = 0, len = ref.length; i < len; i++) {
          stage = ref[i];
          if (stage === "ocr" || stage === "over") {
            flags++;
            continue;
          }
          if (((ref1 = entity_task[stage]) != null ? ref1.isEmpty : void 0) && ((ref2 = entity_task[stage]) != null ? ref2.data.length : void 0) === 0 && ((ref3 = entity_task[stage]) != null ? ref3.entering.length : void 0) === 0) {
            flags++;
          }
        }
        if (flags === task.flowList.length) {
          export_time = moment().format("YYYY-MM-DD HH:mm:ss");
          return !entity_task.done && that.update({
            col: "task",
            filter: {
              _id: data.task
            },
            setter: {
              $set: {
                state: "已导出",
                export_time: export_time
              }
            }
          }, function(err) {
            cb(null);
            if (err) {
              return LOG.error(err);
            }
            entity_task.done = true;
            delete global.enter.tasks[data.task];
            return delete global.enter.entitys[data.project][data.task];
          });
        } else {
          return cb(null);
        }
      };
      if (entity_task.done) {
        return callback(null, "done");
      }
      if (entitys.data.length > 0) {
        entity = entitys.data.shift();
        entitys.entering.push(entity);
        callback(null, entity);
      }
      if (entitys.data.length < global.enter.entitys.MIN_CACHE) {
        lockKey = `enter-fatch-${data.project}-${data.task}-${data.stage}`;
        return locker.lockFile.lock(lockKey, function(err) {
          var num;
          if (err) {
            LOG.error(err);
            return locker.lockFile.unlock(lockKey, function(err) {
              return callback(err, null);
            });
          }
          if (!entitys.isEmpty && entitys.data.length < global.enter.entitys.MIN_CACHE) {
            num = global.enter.entitys.MAX_CACHE - entitys.data.length;
            return that.fatchEnterEntity({
              data: data,
              limit: num
            }, function(err) {
              if (err) {
                LOG.error(err);
              }
              if (num === global.enter.entitys.MAX_CACHE) {
                entity = entitys.data.shift() || null;
                entity && entitys.entering.push(entity);
                entity && callback(null, entity);
              }
              if (entitys.isEmpty) {
                return do_update(function() {
                  locker.lockFile.unlock(lockKey, function(err) {
                    if (err) {
                      return LOG.error(err);
                    }
                  });
                  if (entity_task.done) {
                    return callback(null, "done");
                  } else {
                    return !entity && callback(null, entity);
                  }
                });
              } else {
                return locker.lockFile.unlock(lockKey, function(err) {
                  if (err) {
                    return LOG.error(err);
                  }
                });
              }
            });
          } else if (entitys.isEmpty && entitys.data.length === 0) {
            return do_update(function() {
              locker.lockFile.unlock(lockKey, function(err) {
                if (err) {
                  return LOG.error(err);
                }
              });
              if (entity_task.done) {
                return callback(null, "done");
              } else {
                return !entity && callback(null, entity);
              }
            });
          } else {
            return locker.lockFile.unlock(lockKey, function(err) {
              if (err) {
                return LOG.error(err);
              }
            });
          }
        });
      }
    }

    submitEnter(param, callback) {
      var cData, chatLength, context, cur_index, dao, data, e, en, entitys, i, j, len, len1, rankArr, ref, ref1, setter, symbol, task, user;
      data = param.data;
      task = param.task;
      user = param.user;
      rankArr = task.flowList;
      try {
        entitys = global.enter.entitys[data.project][data.task][data.stage];
        entitys.entering.splice(entitys.entering.findIndex(function(en) {
          return en._id.toString() === data._id;
        }), 1);
        chatLength = 0;
        symbol = 0;
        ref = data.enter;
        for (i = 0, len = ref.length; i < len; i++) {
          en = ref[i];
          chatLength += Utils.getLength(en.value[data.stage]);
          symbol += Utils.replaceAll(en.value[data.stage], /\?|？/, "").length === 0 ? 1 : 0;
        }
        dao = new MongoDao(__b_config.dbInfo, {
          epcos: ["outputData"]
        });
        cData = Utils.clone(data);
        dao.epcos.outputData.selectOne({
          task: data.task,
          project: data.project
        }, function(err, outputStatis) {
          var stage_handler, statis;
          if (err) {
            return LOG.error(err);
          }
          if (!outputStatis) {
            outputStatis = {
              task: cData.task,
              project: cData.project,
              statis: {}
            };
          }
          statis = outputStatis.statis;
          statis[cData.stage] || (statis[cData.stage] = {});
          stage_handler = statis[cData.stage][user.username] || (statis[cData.stage][user.username] = {
            chatLength: 0,
            symbol: 0,
            count: 0
          });
          stage_handler.chatLength += chatLength;
          stage_handler.symbol += symbol;
          stage_handler.count++;
          return dao.epcos.outputData.addOrUpdate(outputStatis, function(err) {
            if (err) {
              return LOG.error(err);
            }
          });
        });
        cur_index = rankArr.indexOf(data.stage);
        ref1 = data.enter;
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          en = ref1[j];
          if (/\?|？/.test(en.value[rankArr[cur_index]]) || !en.value[rankArr[cur_index - 1]] || !en.value[rankArr[cur_index]] || (en.value[rankArr[cur_index - 1]] !== en.value[rankArr[cur_index]])) {
            data.stage = "no";
          }
        }
        if (data.stage === "no") {
          data.stage = rankArr[cur_index + 1];
        } else {
          data.stage = "over";
        }
        if (data.stage !== "over") {
          entitys = global.enter.entitys[data.project][data.task][data.stage];
          entitys && (entitys.isEmpty = false);
        }
        context = new EnterContext();
        setter = {
          $set: {
            stage: data.stage,
            enter: data.enter
          }
        };
        return context.update({
          col: "resultData",
          filter: {
            _id: data._id
          },
          setter: setter
        }, function(err) {
          return callback(err);
        });
      } catch (error) {
        e = error;
        return callback(e);
      }
    }

    fatchEnterEntity(param, callback) {
      var dao, entitys;
      if (!(param.data && param.data.project && param.data.task && param.data.stage)) {
        return callback("invalid param");
      }
      dao = new MongoDao(__b_config.dbInfo, {
        epcos: "resultData"
      });
      entitys = global.enter.entitys[param.data.project][param.data.task][param.data.stage];
      param.data._id = {
        $nin: (entitys.entering.map(function(d) {
          return d._id;
        })).concat(entitys.data.map(function(d) {
          return d._id;
        }))
      };
      param.filter = param.data;
      param.sort = {
        priority: -1
      };
      return this.getResultData(param, function(err, docs) {
        docs && docs.length < param.limit && (entitys.isEmpty = true);
        err || (entitys.data = entitys.data.concat(docs));
        return callback(err);
      });
    }

    refreshEnterEntity(param, callback) {
      var col, dao, filter;
      if (!param.data || !param.data.src_type) {
        return callback(null);
      }
      col = param.data.src_type;
      dao = new MongoDao(__b_config.dbInfo, {
        epcos: ["deploy", col, "resultData"]
      });
      filter = {};
      filter[col + "_type"] = param.data.file_id;
      return dao.epcos[col].selectList(filter, function(err, entitys) {
        if (err) {
          return callback(err);
        }
        if (!entitys) {
          return callback(null);
        }
        if (!Array.isArray(entitys || entitys.length === 0)) {
          return callback(null);
        }
        return async.each(entitys, function(entity, cb) {
          var enterEntity;
          enterEntity = {
            project: param.data.project,
            field_id: param.data.field_id,
            field_name: param.data.field_name,
            src_type: param.data.src_type,
            verify: param.data.verify,
            enter_conf: entity._id.toString(),
            enter_img_name: entity[col + "_name"],
            enter_img_path: entity.s_url || entity.path,
            state: 0,
            create_at: moment().format("YYYYMMDDHHmmss")
          };
          return dao.epcos.resultData.insert(enterEntity, cb);
        }, callback);
      });
    }

    getResultData(param, callback) {
      var dao;
      if (!param.filter) {
        return callback(null);
      }
      dao = new MongoDao(__b_config.dbInfo, {
        epcos: ["deploy", "task", "resultData"]
      });
      return async.waterfall([
        function(cb) {
          var filter;
          if (param.filter.task) {
            filter = {
              _id: param.filter.task
            };
          } else {
            filter = {
              project: param.filter.project
            };
          }
          return dao.epcos.task.selectList(filter,
        cb);
        },
        function(tasks,
        cb) {
          var filter;
          filter = {
            task: {
              $in: tasks.map(function(t) {
                return t._id.toString();
              })
            }
          };
          return dao.epcos.deploy.selectList(filter,
        function(err,
        docs) {
            if (err) {
              return cb(err);
            }
            if (!docs || !docs.length) {
              return cb(err,
        []);
            }
            filter = {
              image: {
                $in: docs.map(function(im) {
                  return im._id.toString();
                })
              }
            };
            return dao.epcos.deploy.selectList(filter,
        function(err,
        docs2) {
              if (err) {
                return cb(err);
              }
              if (!docs2 || !docs2.length) {
                return cb(err,
        docs);
              }
              return cb(err,
        docs.concat(docs2));
            });
          });
        },
        function(deploys,
        cb) {
          var filter;
          filter = {
            stage: param.filter.stage,
            deploy_id: {
              $in: deploys.map(function(d) {
                return d._id.toString();
              })
            }
          };
          if (param.isCount) {
            return dao.epcos.resultData.count(filter,
        cb);
          } else if (param.isPage) {
            return dao.epcos.resultData.selectBySortOrSkipOrLimit(filter,
        {
              create_at: 1
            },
        +param.skip,
        +param.limit,
        cb);
          } else if (param.isSortAndLimit) {
            return dao.epcos.resultData.selectBySortOrLimit(filter,
        param.sort,
        param.limit,
        cb);
          } else if (param.limit) {
            return dao.epcos.resultData.selectBySortOrLimit(filter,
        param.sort,
        param.limit,
        cb);
          } else {
            return dao.epcos.resultData.selectBySortOrLimit(filter,
        {
              create_at: 1
            },
        -1,
        cb);
          }
        }
      ], callback);
    }

  };

  module.exports = EnterContext;

}).call(this);
