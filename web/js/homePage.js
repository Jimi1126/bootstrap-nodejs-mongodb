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
		$("#username").text(epcos.userInfo && epcos.userInfo.nickname);
		$("#post").text(epcos.userInfo && epcos.userInfo.staffRole);
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
					{id:"1",code:"1",name: "项目录入", winName: "项目录入", type: "newWin", url: "../pages/enterPage.html"},
					{id:"1",code:"1",name: "录入清单", winName: "录入清单", type: "newWin", url: "../pages/enterDetail.html"}
				]},
				{id:"1",code:"1",name: "统计报表", subMenu: [
					{id:"1",code:"1",name: "产量统计", winName: "产量统计", type: "newWin", url: "../pages/outputStatis.html"},
					{id:"1",code:"1",name: "页数统计", winName: "页数统计", type: "newWin", url: "../pages/pageStatis.html"}
				]},
				{id:"1",code:"1",name: "权限设置", winName: "权限设置", type: "newWin", url: "../pages/authConfig.html"},
			]
		});
		},
		/**
			* 退出事件.
			*/
		logoutEvent: function() {
			var that = this;
			var modalWindow = new ModalWindow({
				title: "注销",
				body: "<div>是否退出当前登陆？</div>",
				width: 300,
				height: 28,
				buttons: [{
					name: "取消",
					class: "btn-default",
					event: function () {
						this.hide();
					}
				}, {
					name: "退出",
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
