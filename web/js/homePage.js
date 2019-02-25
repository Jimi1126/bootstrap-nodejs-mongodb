$.namespace("homePage");

HomePage = function() {}

HomePage.prototype = {
	loadUI: new LoadUI(),
	dialog: new Dialog(),
	init: function() {
		this.adjustUI();
		this.loadMenu();
		this.bindEvent();
	},
	initPage: function() {

	},
	adjustUI: function() {

	},
	bindEvent: function() {
		$("#logout").bind("click", $.proxy(this.logoutEvent, this));
	},
	loadMenu: function() {
		$(".content-body:first").navMenu({
			data: [
				{id:"1",code:"1",name: "系统管理", subMenu: [
					{id:"1",code:"1",name: "项目配置", winName: "项目配置", type: "newWin", url: "../pages/projectConfig.html"},
					{id:"1",code:"1",name: "业务管理", winName: "业务管理", type: "newWin", url: "../pages/businessManagement.html"}
				]},
				{id:"1",code:"1",name: "数据录入", subMenu: [
					{id:"1",code:"1",name: "项目录入", winName: "项目录入", type: "newWin", url: "../pages/enterPage.html"}
				]},
				{id:"1",code:"1",name: "统计分析"}
			]
		});
		},
		/**
			* 退出事件.
			*/
		logoutEvent: function() {
			var that = this;
			var modalWindow = new ModalWindow({
				title: "退出",
				body: "<div>是否退出当前登陆？</div>",
				width: 222,
				height: 28,
				buttons: [{
					name: "是",
					class: "btn-primary",
					event: function () {
						that.loadUI.show();
						$.get("/user/logout", function (data, status, xhr) {
							that.loadUI.hide();
							if (status == 'success') {
								modalWindow.hide();
								data == "success" && (window.location.href = "/pages/login.html")
							} else {
								that.dialog.show('系统繁忙');
							}
						});
					}
				}, {
					name: "否",
					class: "btn-default",
					event: function () {
						this.hide();
					}
						}
						]
		});
		modalWindow.show();
	}
}
window.onload = function() {
	var homePage = new HomePage();
	homePage.init();
	homePage.initPage();
}
