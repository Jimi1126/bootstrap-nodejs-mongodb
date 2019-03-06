$.namespace("enterPage");

EnterPage = function () { }

EnterPage.prototype = {
	loadUI: new LoadUI(),
	dialog: new Dialog(),
	timer: 60,
	curEntity: {},
	/**
		* 初始化数据.
	*/
	init: function () {
		this.adjustUI();
		this.initComponent();
		this.bindEvent();
	},
	/**
	 * 初始化页面.
	 */
	initPage: function () {
		this.loadProjList(this.loadData);
	},
	/**
		* 初始化组件.
		*/
	initComponent: function () {
		var that = this;
		this.projectList = $("#projectList").dropMenu({
			width: 120,
			height: 100
		});
		this.navBar = $("#barDiv").navBar({
			data: [
				{code: "ocr", text: "OCR"},
				{code: "op1", text: "一码"},
				{code: "op2", text: "二码"},
				{code: "op3", text: "问题件"},
				{code: "op4", text: "复核"},
				{code: "over", text: "", hidden: true}
			]
		});
		this.navBar.select("ocr");
		this.projectList.onChange = this.navBar.onChange = function(id, old) {
			if (id != old) {
				that.freeEvent(that.loadData);
			}
		};
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
		$(".content").height(window.innerHeight - 215);
	},
	/**
		* 加载项目信息.
		*/
	loadProjList: function (callback) {
		var that = this;
		$.get("/config/getDeploy", { type: "proj" }, function (data, status, xhr) {
			that.projects = data ? data : [];
			if (status == "success") {
				var menu = [];
				data.forEach(function (proj) {
					menu.push({ id: proj._id, text: proj.projName });
				});
				that.projectList.initData(menu);
				that.projectList.value(menu[0].id);
				callback && callback.call(that);
			}
		});
	},
	/**
		* 加载数据.
		*/
	loadData: function(flag) {
		var that = this;
		if (flag == "error") {
			that.loadImg(null);
			that.addInput(null);
			return;
		}
		var filter = {project: that.projectList.value(), stage: that.navBar.select()};
		$.post("/config/getEnterEntity", filter, function(data, status, xhr) {
			if (status == "success") {
				that.curEntity = data;
				that.loadImg(data);
				that.addInput(data);
			}
		});
	},
	/**
		* 新增录入项.
		* @param {*} conf 
		*/
	addInput: function(entity) {
		var that = this, $span, $input;
		$(".content-body:last").html("");
		if (!entity) return;
		entity.enter.forEach(function(en) {
			$span = $(`<span class="input-group-addon" field='${en.field_id}'>${en.field_name}</span>`);
			$input = $(`<input type="text" class="form-control" field='${en.field_id}'>`);
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
					that.curEntity.enter && that.curEntity.enter.forEach(function(en) {
						var curStage = that.navBar.select();
						en.value[curStage] = $(`input[field="${en.field_id}"]`).val();
					});
					that.submitEvent();
					that.nextBtnEvent();
				}
			}
		});
		$(".content-body:last").find("input:first").focus();
	},
	/**
		* 加载录入图片.
		*/
	loadImg: function(entity) {
		var that = this;
		var $timeSpan = $("#timeSpan");
		$timeSpan.text(that.timer);
		this.time && window.clearInterval(this.time);
		if (!entity) return $(".img-responsive").attr("src", "");
		var src = "../" + entity.path + entity.img_name;
		$(".img-responsive").attr("src", src);
		this.time = window.setInterval(function() {
			var time = +$timeSpan.text();
			if (time == 0) {
				window.clearInterval(that.time);
				that.overTimeEvent();
			} else {
				$timeSpan.text(+time - 1);
			}
		}, 1000);
	},
	/**
	 * 超时事件.
	 */
	overTimeEvent: function() {
		var that = this;
		that.freeEvent();
		var modalWindow = new ModalWindow({
      title: "录入超时",
      body: "<div>当前录入已超时，释放当前录入分块。</div>",
      width: 300,
      height: 40,
      buttons: [{
        name: "确定",
				class: "btn-primary",
				title: "确认以重新获取分块",
        event: function () {
					that.loadData();
					modalWindow.hide();
        }
      }]
    });
    modalWindow.show();
	},
	/**
	 * 释放分块.
	 */
	freeEvent: function(callback) {
		var that = this;
		if (!this.curEntity) {
			return callback && callback.call(that, null);
		}
		socket.emit("letEnterEntity", this.curEntity, function(data) {
			callback && callback.call(that, data);
		});
	},
	/**
		* 按钮控制.
		*/
	buttonControl: function () {

	},
	forceBtnEvent: function() {

	},
	/**
	 * 校验事件.
	 */
	verifyEvent: function() {
		var that = this;
		if (that.curEntity) return "不存在提交数据";
		var cur_stage = that.navBar.value();
		var notpass = [];
		for (var i = 0, len = that.curEntity.enter.length; i < len; i++) {
			if (Util.isEmpty(that.curEntity.enter[i].value[cur_stage])) {
				notpass.push({
					code: that.curEntity.enter[i].field_name,
					tip: "数据为空"
				});
			}
		}
		return notpass;
	},
	/**
	 * 提交事件.
	 */
	submitEvent: function(data) {
		var that = this;
		var msg = "";
		if (msg = that.verifyEvent()) {

		}
		socket.emit("submitEnter", that.curEntity, $.proxy(that.nextBtnEvent, that));
	},
	nextBtnEvent: function() {
		this.freeEvent(this.loadData);
	}
}

window.onload = function () {
	enterPage = new EnterPage();
	loadJs("/socket.io/socket.io.js", function() {
		socket = io.connect('http://192.168.3.69:8090');
	});
	enterPage.init();
	enterPage.initPage();
	window.onbeforeunload = function(event) {
		enterPage.freeEvent.call(enterPage);
	};
	
}
