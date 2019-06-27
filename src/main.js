// Generated by CoffeeScript 2.3.2
(function() {
  var LOG, LoggerUtil, Router, SocketIORouter, app, express, httpServer;

  global.argv = {
    project: "EPCOS"
  };

  global.path = require('path');

  global.fs = require('fs');

  global.moment = require("moment");

  global.async = require("async");

  global._ = require("lodash");

  global.sprintf = require("sprintf-js");

  global.mkdirp = require("mkdirp");

  global.LoggerUtil = LoggerUtil = require('./LoggerUtil');

  global.Utils = require("./Utils");

  global.MongoDao = require("./MongoDao");

  global.LockHandler = require("./LockHandler");

  global.__b_config = require("../config/base-config.json");

  global.workspace = __dirname.replace("\src", "");

  express = require("express");

  global.app = app = express();

  httpServer = require("http").Server(app);

  global.socketIO = require("socket.io")(httpServer);

  global.locker = new LockHandler();

  Router = require("./Router");

  SocketIORouter = require("./SocketIORouter");

  LOG = LoggerUtil.getLogger("default");

  // LoggerUtil.useLogger app, LOG  #请求日志
  httpServer.listen(__b_config.serverInfo.port, __b_config.serverInfo.hostName, function() {
    LOG.info(`启动成功，访问地址：http://${__b_config.serverInfo.hostName}:${__b_config.serverInfo.port}/pages/index.html`);
    return new Router().router();
  });

  socketIO.on("connection", function(socket) {
    return new SocketIORouter().router(socket);
  });

}).call(this);
