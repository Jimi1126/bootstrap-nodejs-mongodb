$.namespace("homePage");

HomePage = function () { }

HomePage.prototype = {
	loadUI: new LoadUI(),
	dialog: new Dialog(),
	init: function () {
		this.adjustUI();
		this.loadMenu();
		this.bindEvent();
	},
	initPage: function () {
		$("#username").text(epcos.userInfo && epcos.userInfo.nickname);
		$("#post").text(epcos.userInfo && epcos.userInfo.staffRole);
	},
	adjustUI: function () {

	},
	bindEvent: function () {
		$("#logout").bind("click", $.proxy(this.logoutEvent, this));
	},
	loadMenu: function () {
		var that = this;
		that.loadUI.show();
		$.get("/sysconf/userMenu", function (data, status, xhr) {
			that.loadUI.hide();
			var menuList = [];
			if (status == 'success') {
				data = data || [];
				data.forEach(function (menu) {
					menu.supcode == "01" && menuList.push(menu);
				});
				var fun = function (target, list) {
					if (target.menu_type == 2) return;
					target.subMenu = [];
					list.forEach(function (item) {
						if (item.supcode == target.code) {
							target.subMenu.push(item);
							fun(item, list);
						}
					});
				}
				menuList.forEach(function (menu) {
					fun(menu, data);
				});
			} else {
				that.dialog.show('系统繁忙');
			}
			$(".content-body:first").navMenu({
				data: menuList
			});
		});
	},
	/**
		* 退出事件.
		*/
	logoutEvent: function () {
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
window.onload = function () {
	var homePage = new HomePage();
	homePage.init();
	homePage.initPage();
}
