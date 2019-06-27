$.namespace("homePage");

var HomePage = function () { }

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
		this.initCanvs();
	},
	adjustUI: function () {
		$(".home_pg").attr("src", "../images/index_03.png");
	},
	bindEvent: function () {
		$("#logout").bind("click", $.proxy(this.logoutEvent, this));
	},
	initCanvs: function () {
		if (!window.echarts) {
			return;
		}
		var $canvs1 = echarts.init($("#canvs1")[0]);
		var $canvs2 = echarts.init($("#canvs2")[0]);
		var $canvs3 = echarts.init($("#canvs3")[0]);
		var $canvs4 = echarts.init($("#canvs4")[0]);
		var data = [];
		for (var i = 0; i < 20; i++) {
			data.push({
				"date": "日期" + i,
				"usercode": "886" + i,
				"username": "张三" + i,
				"char_total": (Math.random() * 100000 + "").substr(0, Math.ceil(Math.random() * 10)),
				"char_valid": (Math.random() * 100000 + "").substr(0, Math.ceil(Math.random() * 10)),
				"valid_precision": (Math.random() * 100 + "").substr(0, 4) + "%",
				"time": "41",
				"bill_num": (Math.random() * 100000 + "").substr(0, Math.ceil(Math.random() * 10)),
				"bill_precision": (Math.random() * 100 + "").substr(0, 4) + "%",
				"char_precision": (Math.random() * 100 + "").substr(0, 4) + "%",
				"enter_char": (Math.random() * 100000 + "").substr(0, Math.ceil(Math.random() * 10)),
				"enter_char_prop": (Math.random() * 100 + "").substr(0, 4) + "%",
				"char_ocr": (Math.random() * 100000 + "").substr(0, Math.ceil(Math.random() * 10)),
				"char_ocr_prop": (Math.random() * 100 + "").substr(0, 4) + "%"
			});
		}
		var option = {
			title: {
				text: '字符总量'
			},
			xAxis: {
				type: 'category',
				data: data.map(function (dat) { return dat.username })
			},
			yAxis: {
				type: 'value'
			},
			series: [{
				data: data.map(function (dat) { return dat.char_total }),
				type: 'bar'
			}]
		};
		
		$canvs1.setOption(option, true);
		option.title.text = "有效字符总量";
		option.series[0].data = data.map(function (dat) { return dat.char_valid });
		$canvs2.setOption(option, true);
		option.title.text = "分块数量";
		option.series[0].data = data.map(function (dat) { return dat.bill_num });
		$canvs3.setOption(option, true);
		option.title.text = "录入？数量";
		option.series[0].data = data.map(function (dat) { return dat.enter_char });
		$canvs4.setOption(option, true);
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
