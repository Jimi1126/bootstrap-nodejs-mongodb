BussinessContext = require './BussinessContext'
LOG = LoggerUtil.getLogger "OutputStatisContext"
class OutputStatisContext extends BussinessContext
	getOutPutPageData: (param, callback)->
		if param.isCount
			@count {col: "outputData", filter: param.filter}, callback
		else if param.isPage
			@selectBySortOrSkipOrLimit {col: "outputData", filter: param.filter, sort: param.sort || null, skip: +param.skip, limit: +param.limit}, callback
		else
			@selectList {col: "outputData", filter: param.filter}, callback

module.exports = OutputStatisContext
