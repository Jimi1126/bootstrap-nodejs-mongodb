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
    opt2 = {
      wait: param.timeout || MAX_WAITTIME
      retryWait: param.retry || RETRY
      retries: param.retries || RETRIES
    }
    param.pollPeriod && (opt2.pollPeriod = param.pollPeriod)
    param.stale && (opt2.stale = param.stale)

    @asyncLock = new AsyncLock opt1
    @lockFile = lockFile
    @lockFile.old_lock = @lockFile.lock
    @lockFile.old_unlock = @lockFile.unlock
    @lockFile.lock = (name, opts = opt2, callback)=>
      if !name
        LOG.error "未输入锁键"
        return callback "未输入锁键"
      filename = "#{lock_dir}/#{name}"
      @lockFile.old_lock filename, opts, callback
    @lockFile.unlock = (name, callback)=>
      if !name
        LOG.error "未输入锁键"
        return callback "未输入锁键"
      filename = "#{lock_dir}/#{name}"
      @lockFile.old_unlock filename, callback
    
module.exports = LockHandler