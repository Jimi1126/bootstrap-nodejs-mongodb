function loadJs(url,callback) {
	var script = document.createElement('script');
	script.type="text/javascript";
	if(typeof(callback) != "undefined") {
		if(script.readyState) {
			script.onreadystatechange=function(){
				if(script.readyState == "loaded" || script.readyState == "complete"){
					script.onreadystatechange=null;
					callback();
				}
			}
		} else {
			script.onload=function(){
				callback();
			}
		}
	}
	script.src=url;
	document.body.appendChild(script);
}

function loadJsSync(url) {
	var xhr, script;
	script = document.createElement('script');
	script.type="text/javascript";
	if ( window.XMLHttpRequest ) {
		xhr = new XMLHttpRequest(); 
	} else if ( window.ActiveXObject ) {
		xhr = new ActiveXObject("MsXml2.XmlHttp");
	}
	xhr.onreadystatechange = function() {
		if ( xhr.readyState == 4 ) {
			if ( xhr.status == 200 || xhr.status == 304 ) {
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

var socket;
loadJs("/socket.io/socket.io.js", function() {
	socket = io.connect('http://192.168.3.69:8090');
	// socket.emit("checkOverTime");
	socket.on("unlogin", function() {window.location.reload(true);});
	socket.on("overTime", function(flag) {
		if (flag) {
			Util.overTimeWin();
		} else {
			Util.showOverTimeWin = false;
			Util.overTimeModalWindow.hide();
		}
	});
	socket.on("closeWindow", closeWindow);
});

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
	return function() {
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

Util.showOverTimeWin = false;
Util.overTimeWin = function() {
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
							window.setTimeout(function() {
								socket.emit("checkOverTime");
								socket.emit("refreshOverTime");
							}, 0)
						}
					}
				});
			}
		}, {
			name: "取消",
			class: "btn-default",
			event: function () {
				window.location.reload(true);
			}
		}]
		});
	Util.overTimeModalWindow.show();
	$(".modal-footer").append($(`<span id="tip" style="color:red;float: left;"></span>`));
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
		window.addEventListener("onunload", function() {
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
		that.target.onunLoad = function() {
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
		this.loader.find("button").bind("click", function() {
			that.loader.remove();
		});
		fun.call(this);
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
			html = '<button type="button" class="btn ' + button['class'] + '">' + button.name + '</button>';
			$html = $(html);
			button.title && $html.attr("title", button.title);
			$html.bind("click", $.proxy(button.event, that));
			that.$modal.find(".modal-footer").append($html);
		});
	}
	options.width && that.$modal.find(".modal-dialog").width(options.width);
	that.maximize = function() {
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
		html = options.body || "";
		$html = $(html);
		options.height && $html.height(options.height);
		that.$modal.find(".modal-body").append($html);
	}
}

ModalWindow.prototype = {
	value: function (_data) {
		if (this.contentWindow.value) {
			return this.contentWindow.value(_data);
		}
		var $body = $(this.contentWindow.document.body);
		if (!!_data) {
			for (key in _data) {
				$body.find(".input-group input[dataField=" + key + "]").val(_data[key]);
			}
		} else {
			_data = {};
			$body.find(".input-group input[dataField]").each(function () {
				_data[$(this).attr("dataField")] = $(this).val()
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

$.fn.disabled = function() {
	$(this).attr("disabled", "");
}
$.fn.enabled = function() {
	$(this).removeAttr("disabled");
}

$.fn.table_button = function(options) {
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
	$icon.bind("click", function () {
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
			_id && $menu.find("#" + _id).click();
		}
	}
	return this;
}

$.fn.dropMenu = function (options) {
	var html, $backdrop, $button, $input, $menu, initData;
	var that = this;
	that._id = "";
	html = '<button class="btn btn-default dropdown-toggle" type="button"></button>';
	$button = $(html);
	$input = $('<input type="text" dataType="dropMenu" readOnly></input>');
	$span = $('<span class="caret"></span>');
	$button.append($input);
	$button.append($span);
	$button[0].onmouseover = function() {
		$input.css({
			cursor: "pointer", 
			color: "#333", 
			"background-color": "#e6e6e6"
		});
	}
	$button[0].onmouseout = function() { $input.removeAttr("style") }
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
		$input.val("");
		$menu.html("");
		if (!data || data.length == 0) {
			return;
		}
		that._id = data[0].id;
		$input.val(data[0].text + " ");
		data.forEach(function (d) {
			li = '<li id=' + d.id + '><a href="#">' + d.text + '</a></li>'
			$menu.append(li);
		});
		$menu.find("li").bind('click', function () {
			var old = that._id;
			that._id = this.id;
			$menu.find("li").removeClass("active");
			$(this).addClass("active");
			$input.val($(this).find('a').text());
			$backdrop.hide();
			$menu.css("display", "none");
			that.onChange(this.id, old);
		});
	}
	options.code && $input.attr("datafield", options.code);
	options.width && $menu.width(options.width);
	options.height && $menu.height(options.height);
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
			_id && $menu.find("#" + _id).click();
		}
	}
	return this;
}

$.fn.icTable = function (options) {
	var html, header, body;
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
	if (options.title) {
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
	var clickTime = 0;
	var clickTarget = null;
	body[0].addEventListener("click", function(e) {
		if (clickTarget == e.target && (new Date().getTime() - clickTime) < 500) {
			that.onDbClickRow && that.onDbClickRow();
		} else {
			clickTime = new Date().getTime();
			clickTarget = e.target;
		}
	});

	this.append(header);
	this.append(body);

	var func, showTitle, hideTitle;
	func = function () {
		body.find('tr.active').removeClass("active");
		$(this).addClass("active");
		that.onselectRow && that.onselectRow();
	}
	showTitle = function() {
		$(this).attr("title", $(this).find("input").val());
	}
	hideTitle = function() {
		$(this).removeAttr("title");
	}
	this.insert = function(data) {
		var $tr, value, $td;
		$tr = $('<tr></tr>');
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
						comp.find(".icon").bind("click", function() {setTimeout(key.event, 0)});
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
			active.nextAll().each(function() {
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
	this.asyncData = function(_datas) {
		if(!!_datas) {
			$.each(options.dataFields, function (j, key) {
				body.find("[dataField=" + (key.code || key) + "]").each(function(i, td) {
					$(this).val(_datas[i][(key.code || key)]);
				});
			});
		}
	}
	this.refresh = function () {
		header.width(this[0].clientWidth);
		body.width(this[0].clientWidth - 1);
		body.css("margin-top", header.height());
		var iterator = null;
		var width = 0;
		if (options.rowNum == undefined || options.rowNum) {
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

var NavMenu = function(option) {
	var that = this;
	var foldEvent = function(e) {
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
	that.addMenu = function(target, menus) {
		var that = this;
		menus.forEach(function(menu) {
			var $rank,$menu;
			$menu = $(`<div class="menu"><a href="#"></a></div>`);
			$menu.attr("id", menu.id);
			$menu.attr("code", menu.code);
			$menu.find("a").text(menu.name || "");
			var linkEvent = function(e) {
				e.stopPropagation();
				menu.type == "newWin" && menu.url && window.open(menu.url, menu.winName, menu.specs, menu.replace);
				menu.type == "redirect" && menu.url && (window.location.href = menu.url);
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

var NavBar = function(options) {
	var that = this, tag, fun;
	that.addClass("nav-bar");
	that.onChange = function(newCode, oldCode) { }
	fun = function() {
		var old = that.find(".active").attr("code");
		that.find(".active").removeClass("active");
		$(this).addClass("active");
		that.onChange($(this).attr("code"), old);
	}
	options && options.data && options.data.forEach(function(t) {
		tag = $(`<div class="nav-tag" code="${t.code}">${t.text}</div>`);
		tag.bind("click", fun);
		t.hidden && tag.hide();
		that.append(tag);
	});
	that.select = function(code) {
		if (arguments.length == 0) {
			return this.find(".active").attr("code");
		} else {
			this.find(".nav-tag[code='" + code + "']").click();
		}
	}
	return that;
}
$.fn.navBar = NavBar;
