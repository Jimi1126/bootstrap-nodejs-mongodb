global.argv = {project: "EPCOS"}
global.path = require 'path'
global.fs = require 'fs'
global.moment = require "moment"
global.async = require "async"
global._ = require "lodash"
global.sprintf = require "sprintf-js"
global.mkdirp = require "mkdirp"
global.LoggerUtil = LoggerUtil = require './LoggerUtil'
global.Utils = require "./Utils"
global.MongoDao = require "./MongoDao"
global.__b_config = require "../config/base-config.json"
global.workspace = __dirname.replace("\src", "")

StrategyContext = require "./StrategyContext"
ProDownStrategy = require "./ProDownStrategy"
DownStrategy = require "./DownStrategy"
global.StrategyProxy = require "./StrategyProxy"
global.HandlerProxy = require "./HandlerProxy"

# 下载前动作（有序）
beforeDownHandle = ["LoadConfigHandler", "ScanHandler", "ParseDirHandler"]
# 下载动作（有序）
downHandle = ["LoadImageHandler", "ConvertHandler", "ParseProHandler", "CutImageHandler", "CutBillHandler", 
	"EnterEntityHandler", "OCRHandler", "SavePicInfoHandler", "CleanHandler"]
# 下载后动作
afterDownHandle = ["", "", "", ""]
LOG = LoggerUtil.getLogger "default"
LOG.info "本次下载开始于：#{moment().format("YYYY-MM-DD HH:mm:ss")}"
start = moment()
callback = ->
	strategyContext = new StrategyContext(new StrategyProxy(new DownStrategy(downHandle)))
	strategyContext.strategy.target.data = @data
	strategyContext.execute ->
		LOG.info "本次下载结束于：#{moment().format("YYYY-MM-DD HH:mm:ss")} --#{moment() - start}ms"

new StrategyContext(new StrategyProxy(new ProDownStrategy(beforeDownHandle))).execute(callback)
