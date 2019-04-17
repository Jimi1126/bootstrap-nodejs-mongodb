function loadJs(url, callback) {
	var script = document.createElement('script');
	script.type = "text/javascript";
	if (typeof (callback) != "undefined") {
		if (script.readyState) {
			script.onreadystatechange = function () {
				if (script.readyState == "loaded" || script.readyState == "complete") {
					script.onreadystatechange = null;
					callback();
				}
			}
		} else {
			script.onload = function () {
				callback();
			}
		}
	}
	script.src = url;
	document.body.appendChild(script);
}

function loadJsSync(url) {
	var xhr, script;
	script = document.createElement('script');
	script.type = "text/javascript";
	if (window.XMLHttpRequest) {
		xhr = new XMLHttpRequest();
	} else if (window.ActiveXObject) {
		xhr = new ActiveXObject("MsXml2.XmlHttp");
	}
	xhr.onreadystatechange = function () {
		if (xhr.readyState == 4) {
			if (xhr.status == 200 || xhr.status == 304) {
				script.text = xhr.responseText;
				document.body.appendChild(script);
			}
		}
	}
	xhr.open('GET', url, false);
	xhr.send(null);
}

function closeWindow() {
	// 重置window.opener用来获取打开当前窗口的窗口引用
	// 这里置为null,避免IE下弹出关闭页面确认框
	window.opener = null;
	// JS重写当前页面
	window.open("", "_self", "");
	// 顺理成章的关闭当前被重写的窗口
	window.close();
}

$.old = {}
$.old.get = $.get;
$.old.post = $.post;
$.get = function () {
	var params, callback;
	[...params] = arguments
	if (params.length == 0) return;
	callback = params.pop();
	if (typeof callback == "function") {
		params.push(function () {
			if (arguments[0] == "notlogin") {
				$('.ic-LoadUI').remove();
				return Util.overTimeWin();
			}
			if (arguments[0] == "notauth") {
				$('.ic-LoadUI').remove();
				new ModalWindow({
					title: "提示",
					body: `<div>没有操作权限</div>`,
					width: 400,
					height: 30,
					buttons: [
						{
							"name": "确定",
							"class": "btn-primary",
							event: function () {
								this.hide();
							}
						}
					]
				}).show();
				return;
			}
			if (arguments[0] && (arguments[0].errno || arguments[0].name == "MongoError")) {
				$('.ic-LoadUI').remove();
				new DetailDialog({
					body: `<div>系统错误</div>`,
					width: 400,
					height: 30,
					hideDetail: true
				}).show().appendDetail(JSON.stringify(arguments[0]), -1);
				return;
			}
			if (arguments[1] != "success") {
				$('.ic-LoadUI').remove();
				return new Dialog().show("系统繁忙");
			}
			callback.apply(this, arguments);
		});
	} else {
		params.push(callback);
	}
	$.old.get.apply(this, params);
}
$.post = function () {
	var params, callback;
	[...params] = arguments
	if (params.length == 0) return;
	callback = params.pop();
	if (typeof callback == "function") {
		params.push(function () {
			$('.ic-LoadUI').remove();
			if (arguments[0] == "notlogin") {
				return Util.overTimeWin();
			}
			if (arguments[0] == "notauth") {
				$('.ic-LoadUI').remove();
				new ModalWindow({
					title: "提示",
					body: `<div>没有操作权限</div>`,
					width: 400,
					height: 30,
					buttons: [
						{
							"name": "确定",
							"class": "btn-primary",
							event: function () {
								this.hide();
							}
						}
					]
				}).show();
				return;
			}
			if (arguments[0] && (arguments[0].errno || arguments[0].name == "MongoError")) {
				$('.ic-LoadUI').remove();
				new DetailDialog({
					body: `<div>系统错误</div>`,
					width: 400,
					height: 30,
					hideDetail: true
				}).show().appendDetail(JSON.stringify(arguments[0]), -1);
				return;
			}
			if (arguments[1] != "success") {
				$('.ic-LoadUI').remove();
				return new Dialog().show("系统繁忙");
			}
			callback.apply(this, arguments);
		});
	} else {
		params.push(callback);
	}
	$.old.post.apply(this, params);
}

$.syncGet = function () {
	if (arguments.length < 1) return;
	var resultData = null;
	$.ajax({
		url: arguments[0],
		data: arguments[1],
		cache: false,
		async: false,
		type: "get",
		dataType: 'json',
		success: function (result) {
			if (result == "notlogin") {
				return Util.overTimeWin();
			}
			if (arguments[0] == "notauth") {
				$('.ic-LoadUI').remove();
				new ModalWindow({
					title: "提示",
					body: `<div>没有操作权限</div>`,
					width: 400,
					height: 30,
					buttons: [
						{
							"name": "确定",
							"class": "btn-primary",
							event: function () {
								this.hide();
							}
						}
					]
				}).show();
				return;
			}
			if (result && (result.errno || result.name == "MongoError")) {
				$('.ic-LoadUI').remove();
				new DetailDialog({
					body: `<div>系统错误</div>`,
					width: 400,
					height: 30,
					hideDetail: true
				}).show().appendDetail(JSON.stringify(result), -1);
				return;
			}
			resultData = result;
		},
		error: function () {
			$('.ic-LoadUI').remove();
			new DetailDialog({
				body: `<div>${arguments[1]}</div>`,
				width: 400,
				height: 30,
				hideDetail: true
			}).show().appendDetail(arguments[2], -1);
		}
	});
	return resultData;
}

$.syncPost = function () {
	if (arguments.length < 2) return;
	var resultData = null;
	$.ajax({
		url: arguments[0],
		data: arguments[1],
		cache: false,
		async: false,
		type: "POST",
		dataType: 'json',
		success: function (result) {
			if (result == "notlogin") {
				return Util.overTimeWin();
			}
			if (result && (result.errno || result.name == "MongoError")) {
				$('.ic-LoadUI').remove();
				new DetailDialog({
					body: `<div>系统错误</div>`,
					width: 400,
					height: 30,
					hideDetail: true
				}).show().appendDetail(JSON.stringify(result), -1);
				return;
			}
			resultData = result;
		},
		error: function () {
			$('.ic-LoadUI').remove();
			new DetailDialog({
				body: `<div>${arguments[1]}</div>`,
				width: 400,
				height: 30,
				hideDetail: true
			}).show().appendDetail(arguments[2], -1);
		}
	});
	return resultData;
}

$.namespace = function () {
	var a = arguments, o = null, i, j, d;
	for (i = 0; i < a.length; i = i + 1) {
		d = a[i].split(".");
		o = window;
		for (j = 0; j < d.length; j = j + 1) {
			o[d[j]] = o[d[j]] || {};
			o = o[d[j]];
		}
	}
	return o;
};
$.bindMenuBtn = function () {
	var params;
	params = arguments;
	return function () {
		window.open.apply(window, params);
	}
};

function Util() { }

Util.uuid = function (len, radix) {
	var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
	var uuid = [], i;
	radix = radix || chars.length;

	if (len) {
		// Compact form
		for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
	} else {
		// rfc4122, version 4 form
		var r;

		// rfc4122 requires these characters
		uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
		uuid[14] = '4';

		// Fill in random data. At i==19 set the high bits of clock sequence as
		// per rfc4122, sec. 4.1.5
		for (i = 0; i < 36; i++) {
			if (!uuid[i]) {
				r = 0 | Math.random() * 16;
				uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
			}
		}
	}
	return uuid.join('');
}

Util.isEmpty = function (t) {
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
}

Util.getNowDate = function () {
	var currentdate, date, month, seperator1, strDate, year;
	date = new Date();
	seperator1 = "-";
	year = date.getFullYear();
	month = date.getMonth() + 1;
	strDate = date.getDate();
	if (month >= 1 && month <= 9) {
		month = "0" + month;
	}
	if (strDate >= 0 && strDate <= 9) {
		strDate = "0" + strDate;
	}
	currentdate = year + seperator1 + month + seperator1 + strDate;
	return currentdate;
}

Util.getBitDate = function (bit) {
	var res = "", date, arr;
	date = new Date();
	arr = [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()];
	for (var i = 0, len = arr.length; i < len; i++) {
		if (arr[i] >= 1 && arr[i] <= 9) {
			arr[i] = "0" + arr[i];
		}
		res += arr[i];
		if (bit && res.length >= bit) break;
	}
	return res;
}

Util.parseDate = function (dateStr) {
	if (!dateStr) {
		return "";
	}
	return dateStr.substr(0, 4) + "-" + dateStr.substr(4, 2) + "-" + dateStr.substr(6, 2) +
		" " + dateStr.substr(8, 2) + ":" + dateStr.substr(10, 2) + ":" + dateStr.substr(12, 2);
}

Util.LPAD = function (target, bit, flag) {
	target = target ? target + "" : "";
	var result = target;
	if (isNaN(bit) || (flag + "").length == 0) {
		return result;
	}
	while (result.length < bit) {
		result = flag + result;
	}
	return result;
}

Util.isChange = function (bef, cur) {
	if (Array.isArray(bef)) {
		if (bef.length != cur.length) return true;
		for (var i = 0; i < bef.length; i++) {
			if (Util.isChange(bef[i], cur[i])) {
				return true;
			}
		}
	} else if (bef instanceof Object) {
		if (Object.keys(bef).length != Object.keys(cur).length) return true;
		for (var key in bef) {
			if (Util.isChange(bef[key], cur[key])) {
				return true;
			}
		}
	} else {
		return bef !== cur;
	}
}

Util.updateDataState = function (bef, cur) {
	if (Array.isArray(cur)) {
		for (var i = 0; i < cur.length; i++) {
			if (Util.isChange(bef[i], cur[i])) {
				bef[i] && (cur[i].dataState = 2); //数据状态：0 正常，1 新增，2 修改，4 删除
				!bef[i] && (cur[i].dataState = 1);
			}
		}
	} else if (cur instanceof Object) {
		if (Util.isChange(bef, cur)) {
			bef && (cur.dataState = 2); //数据状态：0 正常，1 新增，2 修改，4 删除
			!bef && (cur.dataState = 1);
		}
	}
}

Util.getLength = function (str) {
	str = str || "";
	str = typeof str === "string" ? str : str + "";
	return str.replace(/[\u0391-\uFFE5]/g, "aa").length; //先把中文替换成两个字节的英文，在计算长度
};

Util.replaceAll = function (target, sce, val) {
	var i, j, len1, t;
	if (typeof target === "string") {
		target.replace(new RegExp(sce, "g"), val);
	}
	if (Array.isArray(target)) {
		for (i = j = 0, len1 = target.length; j < len1; i = ++j) {
			t = target[i];
			if (target[i] === sce) {
				target[i] = val;
			}
		}
	}
	return target;
};

Util.showOverTimeWin = false;
Util.overTimeWin = function () {
	if (Util.showOverTimeWin) return;
	Util.showOverTimeWin = true;
	Util.overTimeModalWindow = new ModalWindow({
		title: "登录",
		url: "overTime.html",
		close: false,
		window: window.top,
		backdrop: "static",
		keyboard: false,
		width: 400,
		height: 125,
		buttons: [{
			name: "取消",
			class: "btn-default",
			event: function () {
				window.location.reload(true);
			}
		}, {
			name: "确定",
			class: "btn-primary",
			event: function () {
				var param = {
					usercode: Util.overTimeModalWindow.contentWindow.$("#usercode").val(),
					password: Util.overTimeModalWindow.contentWindow.$("#password").val()
				};
				Util.isEmpty(param.password) && $("#tip").text("请输入密码");
				Util.isEmpty(param.usercode) && $("#tip").text("请输入用户名");
				if (Util.isEmpty(param.usercode) || Util.isEmpty(param.password)) return;
				$.post('/user/login', param, function (data, status, xhr) {
					if (status == "success") {
						data == "error" && $("#tip").text("系统繁忙");
						data == "no exist" && $("#tip").text("用户不存在");
						data == "failed" && $("#tip").text("密码有误");
						if (data == "success") {
							$("#tip").text("") && Util.overTimeModalWindow.hide();
							Util.showOverTimeWin = false;
						}
					}
				});
			}
		}]
	});
	Util.overTimeModalWindow.show();
	$(".modal-footer").append($(`<span id="tip" style="color:red;float: left;"></span>`));
}

Util.saveCSV = function (csv, saveName) {
	var blob = new Blob(['\ufeff' + csv], { type: 'text/csv,charset=UTF-8' });
	Util.openDownloadDialog(blob, saveName);
}

Util.openDownloadDialog = function (url, saveName) {
	if (typeof url === 'object' && url instanceof Blob) {
		url = URL.createObjectURL(url); // 创建blob地址
	}
	const aLink = document.createElement('a');
	aLink.href = url;
	aLink.download = saveName;
	aLink.click();
}

function LoadUI(target) {
	this.target = target ? target : window.top;
	this.loader = $("<div class='ic-LoadUI'><img src='../images/loading.gif'></div>");
	this.loader.width(this.target.innerWidth);
	this.loader.height(this.target.innerHeight);
}
LoadUI.prototype = {
	show: function () {
		var that = this;
		$(this.target.document.body).append(this.loader);
		window.addEventListener("onunload", function () {
			that.target.$('.ic-LoadUI').remove();
		});
	},
	hide: function () {
		this.loader.remove();
	}
}

function Dialog(target) {
	this.target = target ? target : window.top;
	this.loader = $("<div class='ic-Dialog'>"
		+ "<div><span class='glyphicon glyphicon-info-sign' aria-hidden='true'></span></div>"
		+ "<div style='padding: 0px 8px 0px 8px'></div>"
		+ '<button type="button" class="close">'
		+ '<span aria-hidden="true">&times;</span>'
		+ '</button>'
		+ "</div>");
}
Dialog.prototype = {
	show: function (msg) {
		var that = this;
		this.loader.find("div:eq(1)").text(msg);
		$(this.target.document.body).append(this.loader);
		var time1 = null;
		var time2 = null;
		var fun = function () {
			var count1 = 0;
			var count2 = 0;
			time1 = that.target.setInterval(function () {
				count1++;
				if (count1 == 4) {
					time2 = that.target.setInterval(function () {
						count2++;
						that.loader.css("opacity", that.loader.css("opacity") - 0.1);
						if (count2 == 10) {
							that.loader.remove();
							that.loader.css("opacity", 1);
							that.target.clearInterval(time2);
						}
					}, 200);
					that.target.clearInterval(time1);
				}
			}, 1000);
		}
		that.target.onunLoad = function () {
			that.loader.remove();
			that.loader.css("opacity", 1);
			that.target.clearInterval(time1);
			that.target.clearInterval(time2);
		}
		this.loader.mouseover(function () {
			that.target.clearInterval(time1);
			that.target.clearInterval(time2);
			that.loader.css("opacity", 1);
		});
		this.loader.mouseout(function () {
			fun.call(that);
		});
		this.loader.find("button").bind("click", function () {
			that.loader.remove();
		});
		fun.call(this);
	}
}

function DetailDialog(options) {
	if (!options) {
		throw "constructor ModalWindow error the options is undefined or null"
	};
	this.options = options;
}

DetailDialog.prototype = {
	init: function () {
		var that = this, detailBtn, sureBtn;
		that.target = that.options.window ? that.options.window : window;
		var html = '<div class="modal fade" tabindex="-1" role="dialog">'
			+ '<div class="modal-dialog" role="document">'
			+ '<div class="modal-content">'
			+ '<div class="modal-header">'
			+ '</div>'
			+ '<div class="modal-body">'
			+ '</div>'
			+ '<div class="modal-footer">'
			+ '</div>'
			+ '<div class="detial modal-footer">'
			+ '</div>'
			+ '</div>'
			+ '</div>'
			+ '</div>';
		that.$modal = $(html);
		detailBtn = $('<div class="detail-btn" title="详情"><span class="glyphicon glyphicon-menu-down" aria-hidden="true"></span></div>');
		that.$modal.find(".modal-footer:first").append(detailBtn);
		that.detail = {}
		that.detail.$detailArea = $('<div disabled style="max-height: 200px;overflow: auto;text-align:left;"></div>');
		that.$modal.find(".detial").append(that.detail.$detailArea);
		that.detail.area_line = 1;
		that.detail.auth_scroll = true;
		that.detail.isAppendEvent = false;
		that.detail.$detailArea.scroll(function () {
			if (!that.detail.isAppendEvent && (this.scrollHeight - this.scrollTop) > 131) {
				that.detail.auth_scroll = false;
			} else if (!that.detail.isAppendEvent && (this.scrollHeight - this.scrollTop) == 131) {
				that.detail.auth_scroll = true;
			} else {
				that.detail.isAppendEvent = false;
			}
		});

		detailBtn.bind("click", function () {
			if (detailBtn.find("span").hasClass("glyphicon-menu-down")) {
				detailBtn.find("span").removeClass("glyphicon-menu-down").addClass("glyphicon-menu-up");
				that.$modal.find(".detial").hide();
			} else {
				detailBtn.find("span").removeClass("glyphicon-menu-up").addClass("glyphicon-menu-down");
				that.$modal.find(".detial").show();
			}
		});
		$(that.target.document.body).append(that.$modal);
		var $html = null;
		if (that.options.close == undefined || that.options.close == null || that.options.close) {
			html = '<button type="button" class="close" data-dismiss="modal" aria-label="Close">'
				+ '<span aria-hidden="true">&times;</span>'
				+ '</button>';
			$html = $(html);
			that.$modal.find(".modal-header").append($html);
		}
		if (that.options.title) {
			html = '<h4 class="modal-title">' + that.options.title + '</h4>';
		} else {
			html = '<h4 class="modal-title">提示</h4>';
		}
		$html = $(html);
		that.$modal.find(".modal-header").append($html);
		if (that.options.buttons) {
			that.options.buttons.forEach(function (button) {
				html = '<button type="button" class="btn ' + button['class'] + '">' + button.name + '</button>';
				$html = $(html);
				button.title && $html.attr("title", button.title);
				$html.bind("click", $.proxy(button.event, that));
				that.$modal.find(".modal-footer:first").append($html);
			});
		} else {
			sureBtn = $('<button type="button" class="btn btn-primary">确定</button>');
			sureBtn.bind("click", $.proxy(that.hide, that));
			that.$modal.find(".modal-footer:first").append(sureBtn);
		}
		$html = that.options.body instanceof jQuery ? that.options.body : $(that.options.body || "");
		that.$modal.find(".modal-body").append($html);
		that.options.width && that.$modal.find(".modal-dialog").width(that.options.width);
		that.options.height && $html.height(that.options.height);
		that.options.hideDetail && detailBtn.click();
	},
	show: function () {
		var that = this;
		!that.$modal && that.init();
		var showOptions = {
			backdrop: that.options.backdrop != undefined ? that.options.backdrop : false,
			keyboard: that.options.keyboard != undefined ? that.options.keyboard : false
		}
		that.$modal.modal(showOptions);
		return this;
	},
	hide: function () {
		this.$modal && this.$modal.modal("hide");
	},
	appendDetail: function (content, co) {
		var that = this;
		var color = co ? (co == -1 ? "#a94442" : (co == 0 ? "#3c763d" : "#337ab7")) : "#3c763d";
		var $text = `<div style="color:${color}">${that.detail.area_line++}行：${content}\n<div>`
		that.detail && that.detail.$detailArea.append($text);
		that.detail.isAppendEvent = true;
		that.detail.auth_scroll && (that.detail.$detailArea[0].scrollTop = that.detail.$detailArea[0].scrollHeight);
	},
	emptyDetail: function () {
		var that = this;
		that.detail.area_line && (that.detail.area_line = 1);
		that.detail && that.detail.$detailArea.text("");
	}
}

function ModalWindow(options) {
	if (!options) {
		throw "constructor ModalWindow error the options is undefined or null"
	};
	var that = this;
	that.showOptions = {
		backdrop: options.backdrop != undefined ? options.backdrop : true,
		keyboard: options.keyboard != undefined ? options.keyboard : true
	}
	var html = '<div class="modal fade" tabindex="-1" role="dialog">'
		+ '<div class="modal-dialog" role="document">'
		+ '<div class="modal-content">'
		+ '<div class="modal-header">'
		+ '</div>'
		+ '<div class="modal-body">'
		+ '</div>'
		+ '<div class="modal-footer">'
		+ '</div>'
		+ '</div>'
		+ '</div>'
		+ '</div>';
	that.$modal = $(html);
	that.$modal.on("hidden.bs.modal", function () {
		that.$modal.remove();
		that.target.$('.ic-LoadUI').remove();
	});
	that.target = options.window ? options.window : window;
	$(that.target.document.body).append(that.$modal);

	var $html = null;
	if (options.close == undefined || options.close == null || options.close) {
		html = '<button type="button" class="close" data-dismiss="modal" aria-label="Close">'
			+ '<span aria-hidden="true">&times;</span>'
			+ '</button>';
		$html = $(html);
		that.$modal.find(".modal-header").append($html);
	}
	if (options.title) {
		html = '<h4 class="modal-title">' + options.title + '</h4>';
	} else {
		html = '<h4 class="modal-title">新建窗口</h4>';
	}
	$html = $(html);
	that.$modal.find(".modal-header").append($html);
	if (options.buttons) {
		options.buttons.forEach(function (button) {
			html = `<button type="button" ${button.focus || ""} class="btn ${button['class'] || "btn-default"}">${button.name}</button>`;
			$html = $(html);
			button.title && $html.attr("title", button.title);
			$html.bind("click", $.proxy(button.event, that));
			that.$modal.find(".modal-footer").append($html);
		});
	}
	options.width && that.$modal.find(".modal-dialog").width(options.width);
	that.maximize = function () {
		if (options.maximize) {
			that.$modal.css("padding", "0px");
			that.$modal.css("margin", "0px");
			that.$modal.find(".modal-dialog").css("padding", "0px");
			that.$modal.find(".modal-dialog").css("margin", "0px");
			that.$modal.find(".modal-dialog").width(that.target.innerWidth);
			var height = that.target.innerHeight - 121;
			that.$modal.find(".modal-body").children().height(height - 32);
		}
	}
	if (options.url) {
		html = '<div class="embed-responsive">'
			+ '<iframe class="embed-responsive-item" src=""></iframe>'
			+ '</div>';
		$html = $(html);
		if (options.height) {
			$html.height(options.height);
		} else {
			$html.addClass("embed-responsive-16by9");
		}
		$html.find("iframe").attr("src", options.url);
		$html.find("iframe")[0].onload = function () {
			that.contentWindow = $html.find("iframe")[0].contentWindow;
			if (options.data) that.value(options.data);
			that.$modal.on("shown.bs.modal", function () {
				that.maximize();
				that.contentWindow.initPage && that.contentWindow.initPage(options.params);
			});
		}
		that.$modal.find(".modal-body").append($html);
	} else {
		$html = options.body instanceof jQuery ? options.body : $(options.body || "");
		options.height && $html.height(options.height);
		that.$modal.find(".modal-body").append($html);
		if (options.data) that.value(options.data);
	}
}

ModalWindow.prototype = {
	value: function (_data) {
		if (this.contentWindow && this.contentWindow.value) {
			return this.contentWindow.value(_data);
		}
		var $body = this.contentWindow ? $(this.contentWindow.document.body) : $(this.target.document.body);
		if (arguments.length > 0) {
			for (key in _data) {
				$body.find(".input-group input[dataField=" + key + "]").val(_data[key]);
			}
		} else {
			_data = {};
			$body.find(".input-group input[dataField]").each(function () {
				_data[$(this).attr("dataField")] = $(this).val().trim()
			});
			return _data;
		}
	},
	show: function () {
		var that = this;
		that.$modal.modal(that.showOptions);
		// $.get("/user/userInfo", function(data,status, xhr) {
		// if (status == "success" && data && Object.keys(data).length > 0) {
		// that.$modal.modal(that.showOptions);
		// }
		// });
	},
	hide: function () {
		this.$modal.modal("hide");
	}
}

$.fn.disabled = function () {
	$(this).attr("disabled", "");
}

$.fn.enabled = function () {
	$(this).removeAttr("disabled");
}

$.fn.table_button = function (options) {
	var html, $input, $icon;
	var that = this;
	$input = $('<input type="text" dataType="table_button" readOnly></input>');
	$icon = $('<div class="icon"><span class="glyphicon glyphicon-option-horizontal"></span></div>');
	options.code && $input.attr("dataField", options.code);
	options.width && $menu.width(options.width);
	options.height && $menu.height(options.height);
	this.append($input);
	this.append($icon);
	that.value = function (_data) {
		if (arguments.length == 0) {
			return $input.val();
		} else {
			return $input.val(_data);
		}
	}
	return this;
}

$.fn.table_dropdown = function (options) {
	var html, $backdrop, $v_input, $d_input, $icon, $menu, initData;
	var that = this;
	that._id = "";
	$v_input = $('<input style="display: none;"></input>');
	$d_input = $('<input type="text" dataType="table_dropdown" readOnly></input>');
	$icon = $('<div class="icon"><span class="caret"></span></div>');
	that.append($v_input);
	that.append($d_input);
	that.append($icon);
	options.code && $v_input.attr("dataField", options.code);
	options.width && that.width(options.width);
	!options.editable && $icon.bind("click", function () {
		if (!$menu.css("display") || $menu.css("display") != "block") {
			$menu.show();
			$menu[0].scrollIntoView();
			$(document.body).append($backdrop);
			$backdrop.bind("click", function () {
				$menu.css("display", "none");
				$(this).remove();
			});
		} else {
			$menu.hide();
			$backdrop.remove();
		}
	});
	html = '<ul class="dropdown-menu"></ul>';
	$menu = $(html);
	that.onChange = function () { }
	that.initData = initData = function (data) {
		var li = "";
		$v_input.val("");
		$d_input.val("");
		$menu.html("");
		if (!data || data.length == 0) {
			return;
		}
		data.forEach(function (d) {
			li = '<li id=' + d.id + '><a href="#">' + d.text + '</a></li>'
			$menu.append(li);
		});
		$menu.find("li").bind('click', function () {
			$menu.find("li").removeClass("active");
			$(this).addClass("active");
			$v_input.val(this.id);
			$d_input.val($(this).find('a').text());
			$menu.hide();
			$backdrop.remove();
			that.onChange(this.id);
		});
	}
	options.width && $menu.width(options.width);
	options.height && $menu.height(options.height);
	options.data && initData(options.data);
	$backdrop = $('<div class="modal-backdrop"></div>');
	$backdrop.css("opacity", 0);
	$backdrop.css("z-index", 1);
	this.append($menu);
	that.value = function (_id) {
		if (arguments.length == 0) {
			return $v_input.val();
		} else {
			!Util.isEmpty(_id) && $menu.find("#" + _id).click();
		}
	}
	return this;
}

$.fn.dropMenu = function (options) {
	var html, $backdrop, $button, $v_input, $d_input, $input, $menu, initData;
	var that = this;
	that._id = "";
	html = '<button class="btn btn-default dropdown-toggle" type="button"></button>';
	$button = $(html);
	$v_input = $('<input style="display: none;"></input>');
	$d_input = $('<input type="text" dataType="dropMenu" readOnly></input>');
	$span = $('<span class="caret"></span>');
	$button.append($v_input);
	$button.append($d_input);
	$button.append($span);
	if (!options.notHover) {
		$button[0].onmouseover = function () {
			$d_input.css({
				cursor: "pointer",
				color: "#333",
				"background-color": "#e6e6e6"
			});
		}
		$button[0].onmouseout = function () { $d_input.removeAttr("style") }
	}
	options.width && $button.width(options.width);
	$button.bind("click", function () {
		if (!$menu.css("display") || $menu.css("display") != "block") {
			$menu.css("display", "block")
			$backdrop.show();
		} else {
			$backdrop.hide();
			$menu.css("display", "none")
		}
	});
	html = '<ul class="dropdown-menu"></ul>';
	$menu = $(html);
	that.onChange = function () { }
	that.initData = initData = function (data) {
		var li = "";
		$v_input.val("");
		$d_input.val("");
		$menu.html("");
		if (!data || data.length == 0) {
			return;
		}
		data.forEach(function (d) {
			li = '<li id=' + d.id + '><a href="#">' + d.text + '</a></li>'
			$menu.append(li);
		});
		$menu.find("li").bind('click', function () {
			var old = that._id;
			that._id = this.id;
			$menu.find("li").removeClass("active");
			$(this).addClass("active");
			$v_input.val(this.id);
			$d_input.val($(this).find('a').text());
			$backdrop.hide();
			$menu.css("display", "none");
			that.onChange(this.id, old);
		});
	}
	options.code && $v_input.attr("datafield", options.code);
	options.width && $menu.width(options.width);
	options.height && $menu.height(options.height);
	this._data = options.data;
	options.data && initData(options.data);
	$backdrop = $('<div class="modal-backdrop"></div>');
	$backdrop.css("opacity", 0);
	$backdrop.css("z-index", 1);
	$backdrop.bind("click", function () {
		$(this).hide();
		$menu.css("display", "none");
	});
	$(document.body).append($backdrop);
	$backdrop.hide();

	this.append($button);
	this.append($menu);
	that.value = function (_id) {
		if (arguments.length == 0) {
			return that._id
		} else {
			!Util.isEmpty(_id) && $menu.find("#" + _id).click();
		}
	}
	return this;
}

$.fn.icTable = function (options) {
	var html, $html, header, body, $empty;
	var that = this;
	this.css({
		'overflow-y': 'auto',
		'border': '1px solid #ccc'
	});
	options.width && this.css("width", options.width);
	options.height && this.css("height", options.height);
	html = '<table class="table table-header"><thead><tr></tr></thead></table>';
	header = $(html);
	html = '<table class="table table-body"><thead><tr></tr></thead><tbody></tbody></table>';
	body = $(html);
	html = '<div style="color: #ccc;width: 100%;text-align: center;">&lt;暂无内容&gt;</div>';
	$empty = $(html);
	!options.height && this.height() > 40 && $empty.css({
		"height": this.height() - 40,
		"line-height": this.height() - 40 + "px"
	});
	function multEvent() {
		var flag = this.checked;
		body.find('tbody>tr>td>input[dataField="mult"]').each(function () {
			this.checked = flag;
		});
	}
	body.find("tbody").append($empty);
	if (options.title) {
		if (options.mult) {
			var $th = $('<th style="min-width: 40px;width: 40px;vertical-align: middle;"></th>');
			var $check = $('<input type="checkbox" dataField="mult">');
			$check.bind("click", multEvent);
			$th.append($check);
			header.find('thead>tr').append($th);
		}
		if (options.rowNum == undefined || options.rowNum) {
			html = '<th style="min-width: 40px;width: 50px;"><input value="序号" readOnly></th>';
			header.find('thead>tr').append(html);
		}
		options.title.forEach(function (t, ii) {
			html = '<th><input readonly value=' + t + '></th>';
			var $html = $(html);
			options.dataFields[ii].hidden && $html.hide();
			$html.css("min-width", t.length * 20);
			header.find('thead>tr').append($html);
		});
	}
	if (options.pagination) {
		var $tableDiv, $page, $paging, $total, $previous, $less, $more, $next, $page_li, _amount;
		$tableDiv = $("<div></div>");
		this.css("overflow", "hidden");
		$tableDiv.css({
			'overflow-x': 'auto',
			'overflow-y': 'auto',
			'border-bottom': '1px solid #ccc'
		});
		options.width && $tableDiv.css("width", options.width);
		options.height && $tableDiv.css("height", options.height - 36);
		options.height && $empty.css({
			"height": (options.height + "").endsWith("px") ? +options.height.replace("px", "") - 80 : +options.height - 80,
			"line-height": (options.height + "").endsWith("px") ? +options.height.replace("px", "") - 80 + "px" : +options.height - 80 + "px"
		});
		$tableDiv.append(header);
		$tableDiv.append(body);
		$page = $(`<div style="height:34px;float:right;margin-right:0px;"></div>`);
		$paging = $(`<ul class="pagination" style="margin:0px;"></ul>`);
		$total = $(`<div style="float: left;line-height: 34px;margin-right: 12px;">总数：<span></span></div>`);
		$previous = $(`<li>
		<a href="#" aria-label="Previous">
		<span aria-hidden="true">&laquo;</span>
		</a>
		</li>`);
		$less = $(`<li>
		<a href="#" aria-label="less">
		<span class="glyphicon glyphicon-option-horizontal" aria-hidden="true" style="top: 4px"></span>
		</a>
		</li>`);
		$more = $(`<li>
		<a href="#" aria-label="more">
		<span class="glyphicon glyphicon-option-horizontal" aria-hidden="true" style="top: 4px"></span>
		</a>
		</li>`);
		$next = $(`<li>
		<a href="#" aria-label="Next">
		<span aria-hidden="true">&raquo;</span>
		</a>
		</li>`);
		$amount = $(`<div style="float: left;line-height: 34px;margin-right: 12px;">显示数量：<div class="dropup" style="display:inline-block"></div></div>`);
		$page.append($total);
		$paging.append($previous);
		$paging.append($less);
		$paging.append($more);
		$paging.append($next);
		$page.append($paging);
		$page.append($amount);
		var add_li = function (i) {
			if (i <= 0) return;
			$page_li = $(`<li page_n><a href="#">${i}</a></li>`);
			$page_li.bind("click", page_n_click);
			$more.before($page_li);
		}
		var page_n_click = function () {
			var old = $paging.find(".active").text();
			var t = +$total.find("span").text();
			var amount = _amount.value();
			$paging.find(".active").removeClass("active");
			$(this).addClass("active");
			that.pager.onChangePageNum(t, amount, $(this).text(), old);
		}
		$previous.bind("click", function () {
			var prev = $paging.find(".active").prev();
			var cur_num = +$paging.find(".active").text();
			cur_num <= 2 && $less.hide();
			if (cur_num == 1) {
				$previous.addClass("disabled");
			} else {
				$next.removeClass("disabled");
				if (prev.find("a[aria-label]").length > 0) {
					$more.show();
					$page_li = $(`<li page_n><a href="#">${cur_num - 1}</a></li>`);
					$page_li.bind("click", page_n_click);
					$paging.find("li[page_n]:last").unbind().remove();
					$less.after($page_li);
					$page_li.click();
				} else {
					prev.click();
				}
			}
		});
		$next.bind("click", function () {
			var next = $paging.find(".active").next();
			var t = +$total.find("span").text();
			var pageCount = Math.ceil(t / +_amount.value());
			var cur_num = +$paging.find(".active").text();
			(cur_num + 1) >= pageCount && $more.hide();
			if (cur_num == pageCount) {
				$next.addClass("disabled");
			} else {
				$previous.removeClass("disabled");
				if (next.find("a[aria-label]").length > 0) {
					$less.show();
					$paging.find("li[page_n]:first").unbind().remove();
					add_li(cur_num + 1);
					$page_li.click();
				} else {
					next.click();
				}
			}
		});
		$less.bind("click", function () {
			var firstNum;
			$more.show();
			$next.removeClass("disabled");
			firstNum = +$paging.find("li[page_n]:first").find("a").text();
			$paging.find("li[page_n]").unbind().remove();
			if (firstNum <= 6) {
				$less.hide();
				firstNum = 6;
			} else {
				$less.show();
			}
			for (var i = firstNum - 5; i < firstNum; i++) {
				add_li(i);
			}
			$paging.find("li[page_n]:first").addClass("active");
		});
		$more.bind("click", function () {
			var t, pageCount, lastNum;
			$less.show();
			$previous.removeClass("disabled");
			t = +$total.find("span").text();
			pageCount = Math.ceil(t / +_amount.value());
			lastNum = +$paging.find("li[page_n]:last").find("a").text();
			$paging.find("li[page_n]").unbind().remove();
			if (pageCount - lastNum > 5) {
				$more.show();
				for (var i = lastNum + 1; i <= lastNum + 5; i++) {
					add_li(i);
				}
			} else {
				lastNum = pageCount - 5;
				$more.hide();
				for (var i = lastNum + 1; i <= pageCount; i++) {
					add_li(i);
				}
			}
			$paging.find("li[page_n]:first").addClass("active");
		});
		this.pager = {};
		this.pager.initPaging = function () {
			var t, pageCount;
			$paging.find("li[page_n]").unbind().remove();
			$previous.removeClass("disabled");
			$next.removeClass("disabled");
			$less.hide();
			$more.hide();
			t = +$total.find("span").text();
			pageCount = Math.ceil(t / +_amount.value());
			$less.hide();
			if (pageCount > 0) {
				if (pageCount > 5) {
					$more.show();
					for (var i = 1; i <= 5; i++) {
						add_li(i);
					}
				} else {
					$more.hide();
					for (var i = 1; i <= pageCount; i++) {
						add_li(i);
					}
				}
			}
			$paging.find("li[page_n]:first").click();
		}
		this.pager.setTotal = function (t) {
			that.value([]);
			if (+t || t == 0) {
				$total.find("span").text(t);
				that.pager.initPaging();
			}
		}
		this.pager.onChangePageNum = function (total, amount, cur_num) { }
		_amount = $amount.find("div").dropMenu({
			width: 60,
			data: [
				{ id: 5, text: 5 },
				{ id: 10, text: 10 },
				{ id: 20, text: 20 },
				{ id: 50, text: 50 },
				{ id: 100, text: 100 }
			]
		});
		_amount.value(10);
		_amount.onChange = that.pager.initPaging;
		this.append($tableDiv);
		this.append($page);
	} else {
		options.width && this.css("width", options.width);
		options.height && this.css("height", options.height);
		options.height && $empty.css({
			"height": (options.height + "").endsWith("px") ? +options.height.replace("px", "") - 40 : +options.height - 40,
			"line-height": (options.height + "").endsWith("px") ? +options.height.replace("px", "") - 40 + "px" : +options.height - 40 + "px"
		});
		this.append(header);
		this.append(body);
	}
	var clickTime = 0;
	var clickTarget = null;
	body[0].addEventListener("click", function (e) {
		if (clickTarget == e.target && (new Date().getTime() - clickTime) < 500) {
			that.onDbClickRow && that.onDbClickRow();
		} else {
			clickTime = new Date().getTime();
			clickTarget = e.target;
		}
	});

	var func, showTitle, hideTitle;
	func = function () {
		body.find('tr.active').removeClass("active");
		$(this).addClass("active");
		that.onselectRow && that.onselectRow();
	}
	showTitle = function () {
		$(this).attr("title", $(this).find("input").val());
	}
	hideTitle = function () {
		$(this).removeAttr("title");
	}
	this.insert = function (data) {
		var $tr, value, $td;
		$empty && $empty.remove();
		$tr = $('<tr></tr>');
		if (options.mult) {
			html = '<td style="min-width: 40px;width: 40px;vertical-align: middle;"><input type="checkbox" dataField="mult"></td>';
			$tr.append(html);
		}
		if (options.rowNum == undefined || options.rowNum) {
			var lastRowNum = body.find("tbody input[value]:last");
			var i = lastRowNum.length == 0 ? 0 : +lastRowNum.val();
			html = '<td style="min-width: 40px;width: 50px;"><input style="text-align: center;" readonly value=' + (i + 1) + '></td>';
			$tr.append(html);
		}
		$.each(options.dataFields, function (j, key) {
			if (key instanceof Object) {
				value = data && key.code && data[key.code] ? data[key.code] : "";
				switch (key.dataType) {
					case "table_dropdown":
						var $tdDiv = $("<div class='dropdown'></div>");
						$td = $('<td></td>');
						var comp = key.dataType && $tdDiv[key.dataType](key);
						$td.append($tdDiv);
						comp.value(value);
						break;
					case "table_button":
						var $tdDiv = $("<div class='table_button'></div>");
						$td = $('<td></td>');
						var comp = key.dataType && $tdDiv[key.dataType](key);
						comp.find(".icon").bind("click", function () { setTimeout(key.event, 0) });
						$td.append($tdDiv);
						comp.value(value);
						break;
					default:
						value = data && data[(key.code || key)] ? data[(key.code || key)] : "";
						$td = $('<td><input dataType="text" dataField=' + (key.code || key) + '></td>');
						$td.find("input").val(value);
				}
			} else {
				value = data && data[key] ? data[key] : "";
				$td = $('<td><input dataType="text" dataField=' + key + '></td>');
				$td.find("input").val(value);
			}
			key.hidden && $td.hide();

			i == 0 && $td.css("min-width", header.find('th:eq(' + (j + 1) + ')').css("min-width"));
			!options.editable && $td.find("input").attr("readonly", "");
			$td.bind("mouseover", showTitle);
			$td.bind("mouseout", hideTitle);
			$tr.append($td);
		});
		$tr.bind("click", func);
		body.find('tbody').append($tr);
	};

	this.value = function (_datas) {
		if (arguments.length == 0) {
			_datas = [];
			body.find('tbody>tr').each(function () {
				var data = {}
				$(this).find('[datafield]').each(function () {
					data[$(this).attr("datafield")] = $(this).val();
				});
				_datas.push(data);
			});
			return _datas;
		} else {
			body.find('tbody').html("");
			Util.isEmpty(_datas) && body.find('tbody').append($empty);
			_datas && _datas.forEach && _datas.forEach(function (data, i) {
				that.insert(data);
			});
			this.refresh();
		}
	}
	this.remove = function (index) {
		if (arguments.length == 0) {
			var active = body.find('tr.active');
		} else if (!Util.isEmpty(index)) {
			var active = body.find('tr:eq(' + (index + 1) + ')');
		}
		if (active) {
			if (active.next().length > 0) {
				active.next().click() && active.next()[0].scrollIntoView();
			} else if (active.prev().length > 0) {
				active.prev().click() && active.prev()[0].scrollIntoView();
			}
			active.nextAll().each(function () {
				$(this).find("input[value]:first").val($(this).find("input[value]:first").val() - 1);
			});
			active.remove();
			this.refresh();
		}
	}
	this.select = function (index) {
		if (arguments.length == 0) {
			var data = {}
			body.find('tr.active').find('[datafield]').each(function () {
				data[$(this).attr("datafield")] = $(this).val();
			});
			return data;
		} else if (!Util.isEmpty(index)) {
			var $tr = body.find('tbody>tr:eq(' + index + ')');
			$tr.length > 0 && $tr.click() && $tr[0].scrollIntoView();
		}
	}
	this.multSelect = function (indexs) {
		if (arguments.length == 0) {
			if (body.find('tr>td>input[datafield="mult"]').length == 0) {
				return [that.select()];
			}
			var data = [];
			var $check = null;
			body.find('tr').each(function () {
				$check = $(this).find('input[datafield="mult"]');
				if (!$check || $check.length == 0) return;
				var multRow = {};
				if ($check[0].checked) {
					$(this).find("input[datafield]:gt(0)").each(function () {
						multRow[$(this).attr("datafield")] = $(this).val();
					});
					data.push(multRow);
				}
			});
			return data;
		} else if (!Util.isEmpty(indexs)) {
			if (body.find('tr>td>input[datafield="mult"]').length == 0) {
				return;
			}
			indexs.forEach && indexs.forEach(function (ind) {
				body.find('tr>td>input[datafield="mult"]:eq(' + ind + ')').click();
			});
		}
	}
	this.asyncData = function (_datas) {
		if (!!_datas) {
			$.each(options.dataFields, function (j, key) {
				body.find("[dataField=" + (key.code || key) + "]").each(function (i, td) {
					$(this).val(_datas[i][(key.code || key)]);
				});
			});
		}
	}
	this.setWidth = function (wi) {
		if (!!wi) {
			if (options.pagination) {
				$tableDiv.width(wi);
			}
			this.width(wi);
		}
		this.refresh();
	}
	this.setHeight = function (hi) {
		if (!!hi) {
			this.height(hi);
			if (options.pagination) {
				$tableDiv.height(hi - 34);
			}
			$empty.css({
				"height": (hi + "").endsWith("px") ? +hi.replace("px", "") - 80 : +hi - 80,
				"line-height": (hi + "").endsWith("px") ? +hi.replace("px", "") - 80 + "px" : +hi - 80 + "px"
			});
		}
	}
	this.refresh = function () {
		if (options.pagination) {
			header.width($tableDiv[0].clientWidth || $tableDiv.width());
			body.width(($tableDiv[0].clientWidth || $tableDiv.width()) - 1);
		} else {
			header.width(this[0].clientWidth || this.width());
			body.width((this[0].clientWidth || this.width()) - 1);
		}
		body.css("margin-top", header.height());
		var iterator = null;
		var width = 0;
		if (options.mult && (options.rowNum == undefined || options.rowNum)) {
			iterator = header.find('th:gt(1)');
		} else if (!options.mult && (options.rowNum == undefined || options.rowNum)) {
			iterator = header.find('th:gt(0)');
		} else if (options.mult && options.rowNum != undefined && !options.rowNum) {
			iterator = header.find('th:gt(0)');
		} else {
			iterator = header.find('th');
		}
		iterator.each(function () {
			width = body.find('td:eq(' + $(this).index() + ')').width();
			$(this).width();
			$(this).css("max-width", width + "px");
		});
		if (options.rowNum == undefined || options.rowNum) {
			iterator = body.find("tr:eq(1)").find('td:gt(0)');
		} else {
			iterator = body.find("tr:eq(1)").find('td');
		}
		iterator.each(function () {
			width = header.find('th:eq(' + $(this).index() + ')').width();
			$(this).width(width);
			$(this).css("max-width", width + "px");
		});
	}
	this.refresh();
	return this;
}

var NavMenu = function (option) {
	var that = this;
	var foldEvent = function (e) {
		e.stopPropagation();
		var $menu = $(this);
		var $span = $menu.find("span:first");
		if ($span.hasClass("glyphicon-menu-up")) {
			$menu.parent().children().find(".nav-menu").removeClass("in");
			$menu.parent().children().find(".nav-menu").hide();
			$menu.parent().children().find(".glyphicon-menu-down").addClass("glyphicon-menu-up");
			$menu.parent().children().find(".glyphicon-menu-up").addClass("glyphicon-menu-down");
			$span.removeClass("glyphicon-menu-up");
			$span.addClass("glyphicon-menu-down");
			$menu.find(".nav-menu:first").show();
			$menu.find(".nav-menu:first").addClass("in");
		} else {
			$span.addClass("glyphicon-menu-up");
			$span.removeClass("glyphicon-menu-down");
			$menu.find(".nav-menu:first").removeClass("in");
			$menu.find(".nav-menu:first").hide();
		}
	}
	that.addMenu = function (target, menus) {
		var that = this;
		menus.forEach(function (menu) {
			var $rank, $menu;
			$menu = $(`<div class="menu"><a href="#"></a></div>`);
			$menu.attr("_id", menu._id);
			$menu.attr("code", menu.code);
			$menu.find("a").text(menu.name || "");
			var linkEvent = function (e) {
				e.stopPropagation();
				menu.open_type == "2" && menu.url && window.open(menu.url, menu.title, menu.specs || null, menu.replace || true);
				menu.open_type == "1" && menu.url && (window.location.href = menu.url);
			}
			$menu.unbind("click").bind("click", linkEvent);
			if (target == "#") {
				that.find("nav-menu:first").append($menu);
			} else if (target instanceof Object) {
				target.append($menu);
			} else {
				that.find(`.menu[id="${target}"]`).append($menu).length > 0 || that.find(`.menu[code="${target}"]`).append($menu);
			}
			if (Array.isArray(menu.subMenu) && menu.subMenu.length > 0) {
				$menu.append($(`<span class="glyphicon glyphicon-menu-up float-right"></span>`));
				$rank = $(`<div class="nav-menu fade"></div>`);
				$rank.hide();
				$menu.append($rank);
				$menu.unbind("click").bind("click", foldEvent);
				that.addMenu($rank, menu.subMenu);
			}
		});
	}
	var $top = $(`<div class="nav-menu"></div>`);
	that.append($top);
	if (Array.isArray(option.data) && option.data.length > 0) {
		that.addMenu($top, option.data);
	}
	return this;
}
$.fn.navMenu = NavMenu;

var NavBar = function (options) {
	var that = this, tag, fun;
	that.addClass("nav-bar");
	that.onChange = function (newCode, oldCode) { }
	fun = function () {
		var old = that.find(".active").attr("code");
		that.find(".active").removeClass("active");
		$(this).addClass("active");
		that.onChange($(this).attr("code"), old);
	}
	options && options.data && options.data.forEach(function (t) {
		tag = $(`<div class="nav-tag" code="${t.code}">${t.text}</div>`);
		tag.bind("click", fun);
		t.hidden && tag.hide();
		that.append(tag);
	});
	that.select = function (code) {
		if (arguments.length == 0) {
			return this.find(".active").attr("code");
		} else {
			this.find(".nav-tag[code='" + code + "']").click();
		}
	}
	that.hide = function (code) {
		if (arguments.length == 0) {
			return;
		} else {
			this.find(".nav-tag[code='" + code + "']").hide();
		}
	}
	that.show = function (code) {
		if (arguments.length == 0) {
			return;
		} else {
			this.find(".nav-tag[code='" + code + "']").show();
		}
	}
	return that;
}
$.fn.navBar = NavBar;

window.epcos = {}
epcos.userInfo = $.syncGet("/user/userInfo");