###
# 本模块采用策略模式、代理模式、责任链模式、观察者模式设计
###
global.argv = {project: "百年保全"}
global.moment = require "moment"
global.async = require "async"

global.LoggerUtil = require "./LoggerUtil"
global.LOG = LoggerUtil.getLogger ""

MongoDAO = require "./MongoDAO"
global.mongoDao = new MongoDAO()

StrategyContext = require "./StrategyContext"
ProDownStrategy = require "./ProDownStrategy"
DownStrategy = require "./DownStrategy"
global.StrategyProxy = require "./StrategyProxy"
global.HandlerProxy = require "./HandlerProxy"

# 下载前动作（有序）
beforeDownHandle = ["LoadConfigHandler", "ScanHandler", "ParseDirHandler"]
# 下载动作（有序）
downHandle = ["LoadBillHandler", "CutPictureHandler", "OCRHandler", "SavePicInfoHandler", "CleanHandler"]
# 下载后动作
afterDownHandle = ["", "", "", ""]
callback = ->
	strategyContext = new StrategyContext(new StrategyProxy(new DownStrategy(downHandle)))
	strategyContext.strategy.target.data = @data
	strategyContext.execute ->
new StrategyContext(new StrategyProxy(new ProDownStrategy(beforeDownHandle))).execute(callback)
