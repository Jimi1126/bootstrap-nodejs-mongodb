$.namespace("enterPage");

EnterPage = function () { }

EnterPage.prototype = {
	loadUI: new LoadUI(),
	dialog: new Dialog(),
	enter_config: [],
	timer: 60,
	cur_type_index: 0,
	cur_enter_index: 0,
	/**
		* 初始化数据.
	*/
	init: function () {
		this.adjustUI();
		this.initComponent();
		this.bindEvent();
		this.initData();
	},
	/**
		* 初始化页面.
	*/
	initPage: function () {

	},
	/**
		* 初始化组件.
		*/
	initComponent: function () {
		this.projectList = $("#projectList").dropMenu({
      width: 120,
      height: 100
		});
		this.rankList = $("#rankList").dropMenu({
      width: 120,
      height: 100
		});
	},
	/**
		* 事件绑定.
		*/
	bindEvent: function () {
		var that = this;
		window.onresize = function() {
			that.adjustUI();
		}
		document.onkeydown = function(e) {
			switch(e.keyCode) {
				case 33:
					that.lastBtnEvent.call(that);
				break;
				case 34:
				that.nextBtnEvent.call(that);
				break;
			}
		}
		$("#forceBtn").bind('click', $.proxy(this.forceBtnEvent, this));
		$('#lastBtn').bind('click', $.proxy(this.lastBtnEvent, this));
		$('#nextBtn').bind('click', $.proxy(this.nextBtnEvent, this));
	},
	/**
		* 调整UI.
	*/
	adjustUI: function () {
		$(".content").height(window.innerHeight - 185);
	},
	/**
		* 初始化数据.
		*/
	initData: function() {
		var that = this;
		$.get("/config/getDeploy", {project: "35622684ff376133ac73da21", type: "enter"}, function(data, status, xhr) {
			if (status == "success") {
				var idMap = {};
				data && data.forEach(function(item) {
					idMap[item.file_id] || (idMap[item.file_id] = []);
					idMap[item.file_id].push(item);
				});
				for (var item in idMap) {
					that.enter_config.push(idMap[item]);
				}
				that.loadPage();
			}
		});
	},
	/**
		* 加载页面.
		* @param {*} conf 
		*/
	loadPage: function() {
		var that = this;
		var confs = that.enter_config[that.cur_type_index];
		if (!confs || confs.length == 0) {
			return;
		}
		that.addInput();
		$.post("/config/getEnterEntity", {conf: confs[0]}, function(data, status, xhr) {
			if (status == "success") {
				that.enterEntity = data;
				that.loadImg();
			}
		});
	},
	/**
		* 新增录入项.
		* @param {*} conf 
		*/
	addInput: function() {
		var that = this, confs, $span, $input;
		confs = this.enter_config[this.cur_type_index];
		$(".content-body:last").html("");
		confs.forEach(function(conf) {
			$span = $(`<span class="input-group-addon" field='${conf.field_id}'>${conf.field_name}</span>`);
			$input = $(`<input type="text" class="form-control" field='${conf.field_id}'>`);
			$(".content-body:last").append($span);
			$(".content-body:last").append($input);
		});
		var keydownFun = document.onkeydown;
		$input.bind("blur",function() {
			document.onkeydown = keydownFun;
		});
		$input.bind("focus", function () {
			document.onkeydown = function(e) {
				if (e.keyCode == 13) {
					var $this,data = {};
					$(".content-body:last").find("input[field]").each(function() {
						$this = $(this);
						data[$this.attr("field")] = $this.val();
					});
					that.enterEntity[that.cur_enter_index]["op1"] = data;
					that.nextBtnEvent.call(that);
				}
			}
		});
		$(".content-body:last").find("input:first").focus();
	},
	/**
		* 加载录入图片.
		*/
	loadImg: function() {
		var that = this;
		var src = "../" + that.enterEntity[that.cur_enter_index].path + 
			that.enterEntity[that.cur_enter_index][that.enter_config[that.cur_type_index][0].src_type + "_name"];
		$(".img-responsive").attr("src", src);
		this.time && window.clearInterval(this.time);
		var $timeSpan = $("#timeSpan");
		$timeSpan.text(that.timer);
		this.time = window.setInterval(function() {
			var time = +$timeSpan.text();
			if (time == 0) {
				window.clearInterval(that.time);
				Util.overTimeWin();
			} else {
				$timeSpan.text(+time - 1);
			}
		}, 1000);
	},
	/**
		* 按钮控制.
		*/
	buttonControl: function () {

	},
	forceBtnEvent: function() {

	},
	lastBtnEvent: function() {
		if (this.cur_enter_index == 0) {
			if (this.cur_type_index == 0) {
				return;
			} else {
				this.cur_type_index--;
				this.loadPage();
			}
		} else {
			this.cur_enter_index--;
			this.addInput();
			this.loadImg();
		}
	},
	nextBtnEvent: function() {
		if (this.cur_enter_index == this.enterEntity.length - 1) {
			if (this.cur_type_index == this.enter_config.length - 1) {
				return;
			} else {
				this.cur_type_index++;
				this.cur_enter_index = 0;
				this.loadPage();
			}
		} else {
			this.cur_enter_index++;
			this.addInput();
			this.loadImg();
		}
	}
}

window.onload = function () {
	enterPage = new EnterPage();
	enterPage.init();
	enterPage.initPage();
}
