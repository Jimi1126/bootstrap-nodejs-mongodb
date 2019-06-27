var IndexPage = function () { }

IndexPage.prototype = {
	init: function () {
		this.adjustUI();
		this.bindEvent();
	},
	initPage: function () {
		
	},
	adjustUI: function () {
		var width = 500;
		var height = 425;
		var c_width = window.innerWidth;
		var c_height = window.innerHeight;
		var margin_l = 0
		var margin_t = 0
		if (c_width > width) {
			margin_l = (c_width - width) / 2
		}
		if (c_height > height) {
			margin_t = (c_height - height) / 2
		}
		var style = "margin-left: " + margin_l + "px; margin-top: " + margin_t + "px;" + "width: 500px;";
		style += "background:none;border:1px #cdcdcd solid;color: #cdcdcd";
		document.getElementById("mainDiv").style = style;
	},
	bindEvent: function () {
		$("#submit").bind("click", $.proxy(this.submitEvent, this));
  },
	isEmpty: function(t) {
		if (t === undefined || t === null || t === "") {
			return true;
		}
		if (Array.isArray(t) && t.length == 0) {
			return true;
		}
		if (t instanceof Object && Object.keys(t).length == 0) {
			return true;
		}
		return false;
	},
	/**
		* 登陆.
	*/
	submitEvent: function() {
    var that = this;
		var param = {
			usercode: $("#usercode").val(),
			password: $("#password").val()
		}
		that.isEmpty(param.password) && $("#tip").text("请输入密码");
		that.isEmpty(param.usercode) && $("#tip").text("请输入用户名");
		if (that.isEmpty(param.usercode) || that.isEmpty(param.password)) return;
		$.post('/user/login', param, function (data, status, xhr) {
			if (status == "success") {
				data == "error" && $("#tip").text("系统繁忙");
				data == "no exist" && $("#tip").text("用户不存在");
				data == "failed" && $("#tip").text("密码有误");
				data == "success" && (window.location.href = "../pages/homePage.html");
			}
		});
	}
}
window.onload = function () {
	var index = new IndexPage();
	index.init();
	index.initPage();
}