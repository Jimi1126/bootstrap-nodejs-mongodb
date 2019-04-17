Proxy = require "./Proxy"
AsyncLock = require "async-lock"
lockFile = require "lockfile"
LOG = LoggerUtil.getLogger "LockHandler"

MAX_WAITTIME = 120000 # 最大等待时间
MAX_PENDING = 1000 # 最大处理任务
domainReentrant = true # 同域是否可重用
RETRY = 100 # 重新尝试等待时间
RETRIES = 100 # 重新尝试次数

lock_dir = "/run/lock/temp" # 使用文件锁机制，临时文件存放处
mkdirp.sync lock_dir

class LockHandler
  constructor: (param)->
    param = param || {}
    opt1 = {
      timeout: param.timeout || MAX_WAITTIME
      maxPending: param.pending || MAX_PENDING
      domainReentrant: !!param.reentrant || domainReentrant
    }
    @opts = {
      wait: param.timeout || MAX_WAITTIME
      retryWait: param.retry || RETRY
      retries: param.retries || RETRIES
    }
    param.pollPeriod && (@opts.pollPeriod = param.pollPeriod)
    param.stale && (@opts.stale = param.stale)

    @asyncLock = new AsyncLock opt1
    @lockFile = lockFile
    
module.exports = LockHandler