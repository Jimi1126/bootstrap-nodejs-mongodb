$.namespace("authConfig");

AuthConfig = function () { }

AuthConfig.prototype = {
	loadUI: new LoadUI(),
	dialog: new Dialog(),
	menuList: [],
	userAuthList: [],
	init: function () {
		this.initCompent();
		this.adjustUI();
		this.bindEvent();
	},
	initPage: function () {
		this.loadMenuList();
		this.loadTableData();
	},
	adjustUI: function () {
		this.mainTable && this.mainTable.setWidth(window.innerWidth - 40);
		this.mainTable && this.mainTable.setHeight(window.innerHeight - 210);
		this.mainTable.refresh();
	},
	/**
		* 初始化组件.
		*/
	initCompent: function () {
		var that = this;
		this.mainTable = $("#mainTable").icTable({
			rowNum: true,
			editable: false,
			height: 549,
			title: ["主键", "工号", "姓名", "权限IDs", "权限名称", "路由条件", "状态", "创建时间"],
			dataFields: [
				{ code: "_id", hidden: true },
				"usercode",
				{ code: "username", dataType: "table_button", event: $.proxy(that.openUserList, that) },
				{ code: "controlIds", hidden: true },
				{ code: "controlNms", dataType: "table_button", event: $.proxy(that.openAuthList, that) },
				{ code: "flags", hidden: true },
				{ code: "state", dataType: "table_dropdown", data: [{ id: "0", text: "启用" }, { id: "1", text: "停用" }] },
				{ code: "create_at", hidden: true }
			]
		});
	},
	bindEvent: function () {
		var that = this;
		$("#addBtn").bind('click', $.proxy(that.addUserAuth, that));
		$("#saveBtn").bind('click', $.proxy(that.saveUserAuth, that));
		$("#delBtn").bind('click', function () {
			that.delBtnEvent(that.mainTable.select(), "/auth/delete", (data) => {
				that.userAuthList.splice(that.userAuthList.findIndex(function (me) { return me._id == data._id }), 1);
				that.mainTable.value(that.userAuthList);
				that.mainTable.select(0);
			})
		});
		$('#controlBtn').bind('click', $.proxy(this.controlBtnEvent, this));
		$("#queryBtn").bind("click", $.proxy(this.loadTableData, this));
		window.onresize = $.proxy(this.adjustUI, this);
	},
	/**
	 * 加载菜单.
	 */
	loadMenuList: function () {
		var that = this;
		that.loadUI.show();
		var param = {
			filter: { type: "menu", "menu_type" : 2, state: 0 }
		}
		$.post("/sysconf/getList", param, function (data, status, xhr) {
			that.loadUI.hide();
			that.menuList = data || [];
		});
	},
	/**
		* 加载表格.
		*/
	loadTableData: function () {
		var that = this;
		that.loadUI.show();
		var param = {
			filter: {state: {$in : ["0", "1"]}}
		}
		$("input[query_code]").each(function () {
			$(this).val() && (param.filter[$(this).attr("query_code")] = $(this).val());
		});
		$.post("/auth/getList", param, function (data, status, xhr) {
			that.loadUI.hide();
			if (status == "success") {
				that.userAuthList = data || [];
				that.mainTable.value(that.userAuthList);
				that.mainTable.select(0);
			}
		});
	},
	/**
	 * 新增用户权限控制.
	 */
	addUserAuth: function () {
		var that = this;
		this.mainTable.insert({ "_id": Util.uuid(24, 16), create_at: Util.getBitDate(), state: "0" });
	},
	/**
	 * 保存用户权限控制.
	 */
	saveUserAuth: function() {
		var that = this;
		var tableData = that.mainTable.value();
		if (!Util.isChange(that.userAuthList, tableData)) {
			return that.dialog.show("不存在修改，不需要保存");
		}
		that.loadUI.show();
		Util.updateDataState(that.userAuthList, tableData);
		var addArr = [];
		var updArr = [];
		addArr = tableData.filter(dat => {
			if (dat.dataState == 1) {
				delete dat.dataState;
				return true;
			}
			return false;
		});
		updArr = tableData.filter(dat => {
			if (dat.dataState == 2) {
				delete dat.dataState;
				return true;
			}
			return false;
		});
		var process = 0;
		var index = Util.isEmpty(addArr) || Util.isEmpty(updArr) ? 1 : 2;
		Util.isEmpty(addArr) || $.post("/auth/add", {data: addArr}, function (data, status, xhr) {
			process++
			if (status == "success") {
			}
		});
		Util.isEmpty(updArr) || $.post("/auth/update", {data: updArr}, function (data, status, xhr) {
			process++
			if (status == "success") {
			}
		});
		var timer = window.setInterval(()=> {
			if (process >= index) {
				window.clearInterval(timer);
				that.loadUI.hide();
				that.dialog.show("保存成功");
				that.userAuthList = tableData;
				that.mainTable.value(that.userAuthList);
				that.mainTable.select(0);
			}
		}, 200);
	},
	/**
	 * 用户选择.
	 */
	openUserList: function () {
		var that = this, modalWindow, userTable, setPageTotal;
		modalWindow = new ModalWindow({
			title: "选择用户",
			body: `<div>
					<div class="input-group" style="margin-bottom: 8px;">
						<span class="input-group-addon">用户名称</span>
						<input type="text" class="form-control" code="username" style="width: 90%;">
						<span class="input-group-addon">工号</span>
						<input type="text" class="form-control" code="usercode" style="width: 60%;">
						<button id="queryUserBtn" type="button" class="btn btn-default" style="position:absolute;margin-left: 22px">查询</button>
					</div>
					<div id="userTable"></div>
				</div>`,
			width: 600,
			height: 400,
			buttons: [{
				name: "确认",
				class: "btn-primary",
				event: function () {
					var authList = that.mainTable.value();
					var userAuth = that.mainTable.select();
					var user = userTable.select();
					authList.forEach(auth => {
						if (auth._id == userAuth._id) {
							auth.usercode = user.usercode;
							auth.username = user.username;
						}
					});
					that.mainTable.asyncData(authList);
					modalWindow.hide();
				}
			}]
		});
		userTable = modalWindow.$modal.find("#userTable").icTable({
			pagination: true,
			editable: false,
			width: 565,
			height: 350,
			title: ["工号", "用户名", "状态"],
			dataFields: [{ code: "usercode", hidden: false }, "username", "state"]
		});
		var firstQuery = true;
		var queryObj = {};
		//设置总数.
		setPageTotal = function () {
			var newQueryObj = {};
			newQueryObj.nickname = modalWindow.$modal.find(`input[code="username"]`).val();
			newQueryObj.username = modalWindow.$modal.find(`input[code="usercode"]`).val();
			if (!newQueryObj.nickname) delete newQueryObj.nickname;
			if (!newQueryObj.username) delete newQueryObj.username;
			if (!firstQuery && !Util.isChange(queryObj, newQueryObj)) return;
			queryObj = newQueryObj;
			firstQuery = false;
			var param = {
				filter: queryObj,
				count: true,
			}
			that.loadUI.show();
			$.post("/user/getusers", param, function (data, status, xhr) {
				that.loadUI.hide();
				if (status == "success") {
					data && userTable.pager.setTotal(data);
					!data && userTable.pager.setTotal(0);
				} else {
					that.dialog.show("系统繁忙");
				}
			});
		};
		userTable.pager.onChangePageNum = function (total, amount, cur_num, old_num) {
			that.loadUI.show();
			var param = {
				filter: queryObj,
				skip: +amount * (+cur_num - 1),
				limit: amount
			}
			$.post("/user/getusers", param, function (data, status, xhr) {
				that.loadUI.hide();
				if (status == "success") {
					var userList = [];
					data = data || [];
					data.forEach(u => {
						userList.push({
							usercode: u.username,
							username: u.nickname,
							state: !u.leaveDate ? "在职" : "离职"
						});
					});
					userTable.value(userList);
					userTable.select(0);
				}
			});
		};
		modalWindow.show();
		setPageTotal();
		modalWindow.$modal.find("#queryUserBtn").bind("click", $.proxy(setPageTotal, that));
		modalWindow.$modal.find(".input-group input[code]").on("focus", function() {
			window.onkeydown = function(e) {
				if (e.keyCode == 13) {
					modalWindow.$modal.find("#queryUserBtn").click();
				}
			}
		});
	},
	/**
	 * 控制选择.
	 */
	openAuthList: function () {
		var that = this, modalWindow, authTable;
		var cur_data = that.mainTable.select();
		modalWindow = new ModalWindow({
			title: "选择权限",
			body: `<div>
					<div class="input-group filter_group" style="margin-bottom: 8px;">
						<span class="input-group-addon">页面名称：</span>
						<input filter_code="page_name" type="text" class="form-control">
						<span class="input-group-addon">控制名称：</span>
						<input filter_code="name" type="text" class="form-control">
					</div>
					<div id="authTable"></div>
				</div>`,
			width: 600,
			height: 400,
			buttons: [{
				name: "确认",
				class: "btn-primary",
				event: function () {
					var authList = that.mainTable.value();
					var selAuth = that.mainTable.select();
					var controlAuths = authTable.multSelect();
					authList.forEach(auth => {
						if (auth._id == selAuth._id) {
							auth.controlIds = controlAuths.map(ca => { return ca._id }).join(",");
							auth.controlNms = controlAuths.map(ca => { return ca.name }).join(",");
							auth.flags = controlAuths.filter(ca => {return ca.control_type == 2}).map(ca => { return ca.flag }).join(",");
						}
					});
					that.mainTable.asyncData(authList);
					modalWindow.hide();
				}
			}]
		});
		authTable = modalWindow.$modal.find("#authTable").icTable({
			mult: true,
			editable: false,
			width: 565,
			height: 350,
			title: ["_id", "权限类型", "所属页面名称", "控制名称", "标识"],
			dataFields: [{ code: "_id", hidden: true },
			{ code: "control_type", dataType: "table_dropdown", editable: true, data: [{ id: "1", text: "页面" }, { id: "2", text: "功能" }] },
				"page_name", "name", { code: "flag", hidden: true }]
		});
		var param = {
			filter: { type: "control", state: 0 }
		}
		var authList = [];
		$.post("/sysconf/getList", param, function (data, status, xhr) {
			that.loadUI.hide();
			if (status == "success") {
				authList = data || [];
				authTable.value(authList);
				var selectArr = [];
				authList.forEach(function (al, i) {
					if (cur_data.controlIds && cur_data.controlIds.indexOf(al._id) > - 1) {
						selectArr.push(i);
					}
				});
				authTable.multSelect(selectArr);
			}
		});
		modalWindow.show();
		modalWindow.$modal.find(".filter_group input[filter_code]").bind('input propertychange', function () {
			var exps = {};
			$(this).parent().find("input[filter_code]").each(function () {
				exps[$(this).attr("filter_code")] = new RegExp($(this).val());
			});
			authTable.value(authList.filter(function (item) {
				for (var code in exps) {
					if (!exps[code].test(item[code])) {
						return false;
					}
				}
				return true;
			}));
		});
	},
	/**
	 * 权限控制.
	 */
	controlBtnEvent: function () {
		var that = this, modalWindow, authTable;
		var cur_data = that.mainTable.select();
		modalWindow = new ModalWindow({
			title: "权限控制",
			body: `<div>
						<div class="btn-group">
						<button title="新增控制" id="addContrBtn" type="button" class="btn btn-default">
							新增
						</button>
						<button title="修改控制" id="modContrBtn" type="button" class="btn btn-default">
							修改
						</button>
						<button title="删除控制" id="delContrBtn" type="button" class="btn btn-default">
							删除
						</button>
						<div class="input-group filter_group" style="margin-bottom: 8px;">
						<span class="input-group-addon">页面名称：</span>
						<input filter_code="page_name" type="text" class="form-control" style="width: 60%">
						</div>
					</div>
					<div id="authTable"></div>
				</div>`,
			width: 600,
			height: 400,
			buttons: [
			]
		});
		authTable = modalWindow.$modal.find("#authTable").icTable({
			editable: false,
			width: 565,
			height: 350,
			title: ["_id", "权限类型", "页面编码", "页面名称", "控制名称", "标识"],
			dataFields: [{ code: "_id", hidden: true },
			{ code: "control_type", dataType: "table_dropdown", editable: true, data: [{ id: "1", text: "页面" }, { id: "2", text: "功能" }] },
			{ code: "src_page", hidden: true }, "page_name", "name", { code: "flag", hidden: true }]
		});
		var param = {
			filter: { type: "control", state: 0 }
		}
		var authList = [];
		$.post("/sysconf/getList", param, function (data, status, xhr) {
			that.loadUI.hide();
			if (status == "success") {
				authList = data || [];
				authTable.value(authList);
				authTable.select(0);
				var selectArr = [];
				authList.forEach(function (al, i) {
					if (cur_data.controlIds && cur_data.controlIds.indexOf(al._id) > - 1) {
						selectArr.push(i);
					}
				});
				authTable.multSelect(selectArr);
			}
		});
		modalWindow.show();
		var cb = function (flag, data) {
			if (flag) {
				authList.forEach(function (al, i) {
					if (al._id == data._id) {
						authList[i] = data;
					}
					authTable.asyncData(authList);
				})
			} else {
				authList.push(data);
				authTable.value(authList);
			}
		}
		modalWindow.$modal.find("#addContrBtn").bind("click", function () { that.addOrModEvent(authTable.select(), "add", cb) });
		modalWindow.$modal.find("#modContrBtn").bind("click", function () { that.addOrModEvent(authTable.select(), "modify", cb) });
		modalWindow.$modal.find("#delContrBtn").bind("click", function () {
			that.delBtnEvent(authTable.select(), "/sysconf/delete", (data) => {
				authList.splice(authList.findIndex(function (me) { return me._id == data._id }), 1);
				authTable.value(authList);
				authTable.select(0);
			})
		});
		$(".filter_group input[filter_code]").bind('input propertychange', function () {
			var exps = {};
			$(this).parent().find("input[filter_code]").each(function () {
				exps[$(this).attr("filter_code")] = new RegExp($(this).val());
			});
			authTable.value(authList.filter(function (item) {
				for (var code in exps) {
					if (!exps[code].test(item[code])) {
						return false;
					}
				}
				return true;
			}));
		});
	},
	/**
   * 新增、修改按钮事件.
   */
	addOrModEvent: function (cur_data, flag, callback) {
		var that = this, modalWindow;
		var flag = flag == "modify";
		modalWindow = new ModalWindow({
			title: `${flag ? "修改权限控制" : "新增权限控制"}`,
			body: `<div>
      <div class="input-group">
        <span class="input-group-addon">所属页面</span>
				<div class="dropdown" target= "src_page"></div>
				<span class="input-group-addon">控制类型</span>
        <div class="dropdown" target= "control_type"></div>
			</div>
			<div class="input-group" style="margin-top: 14px;">
        <span class="input-group-addon">权限名称</span>
				<input type="text" class="form-control" datafield= "name">
				<span class="input-group-addon">控制标识</span>
				<input type="text" class="form-control" datafield= "flag">
      </div>
      <div class="input-group" style="margin-top: 14px;">
        <span class="input-group-addon">启用状态</span>
        <div class="dropdown" target="state"></div>
      </div>
      </div>`,
			width: 500,
			height: 135,
			buttons: [{
				name: "取消",
				class: "btn-default",
				event: function () {
					this.hide();
				}
			}, {
				name: `${!flag ? "新增" : "修改"}`,
				class: "btn-primary",
				event: function () {
					var new_item = this.value();
					if (Util.isEmpty(new_item.name)) {
						return that.dialog.show('控制名称为必填');
					}
					if (Util.isEmpty(new_item.control_type)) {
						return that.dialog.show('控制类型为必填');
					}
					if (new_item.control_type == 2 && Util.isEmpty(new_item.flag)) {
						return that.dialog.show('功能控制类型，控制标识为必填');
					}
					that.loadUI.show();
					new_item.type = "control";
					new_item._id = Util.uuid(24, 16);
					flag && (new_item._id = cur_data._id);
					new_item.create_at = flag ? cur_data.create_at : Util.getBitDate();
					new_item.page_name = that.menuList.filter(function (me) { return me.code == new_item.src_page })[0].name;
					if (new_item.control_type == 1) {
						new_item.flag = "";
					}
					var url = flag ? "/sysconf/update" : "/sysconf/add";
					$.post(url, new_item, function (data, status, xhr) {
						that.loadUI.hide();
						if (status == 'success' && !data) {
							callback(flag, new_item);
							modalWindow.hide();
						} else {
							that.dialog.show('操作失败');
						}
					});
				}
			}]
		});
		var $src_page = modalWindow.$modal.find("div[target='src_page']").dropMenu({
			code: "src_page",
			width: 152,
			data: that.menuList.map(function (me) { return { id: me.code, text: me.name } })
		});
		var $control_type = modalWindow.$modal.find("div[target='control_type']").dropMenu({
			code: "control_type",
			width: 152,
			data: [{ id: "1", text: "页面" }, { id: "2", text: "功能" }]
		});
		var $state = modalWindow.$modal.find("div[target='state']").dropMenu({
			code: "state",
			width: 152,
			data: [{ id: "0", text: "启用" }, { id: "1", text: "停用" }]
		});
		$src_page.onChange = function (new_num) {
			modalWindow.$modal.find("input[datafield='name']").val(that.menuList.filter(function (me) { return me.code == new_num })[0].name);
		}
		$control_type.onChange = function (new_num) {
			if (new_num == 1) {
				modalWindow.$modal.find("input[datafield='flag']").disabled();
			} else {
				modalWindow.$modal.find("input[datafield='flag']").enabled();
			}
		}
		$state.value("0");
		if (flag && cur_data) {
			$src_page.value(cur_data.src_page);
			$control_type.value(cur_data.control_type);
			$state.value(cur_data.state);
			modalWindow.value(cur_data);
		}
		modalWindow.show();
		modalWindow.$modal.on("shown.bs.modal", function () {
			modalWindow.$modal.find("input[datafield='name']").focus();
		});
	},
	/**
   * 删除事件.
   */
	delBtnEvent: function (cur_data, url, callback) {
		var that = this;
		var modalWindow = new ModalWindow({
			title: "删除提示",
			body: `<div>请确认是否删除选择的数据</div>`,
			close: true,
			width: 400,
			height: 60,
			buttons: [{
				name: "确认",
				class: "btn-primary",
				event: function () {
					if (Util.isEmpty(cur_data)) {
						return that.dialog.show('没有删除内容');
					}
					that.loadUI.show();
					$.post(url, cur_data, function (data, status, xhr) {
						that.loadUI.hide();
						if (status == 'success' && !data) {
							that.dialog.show('删除成功');
							callback(cur_data);
							modalWindow.hide();
						} else {
							that.dialog.show('删除失败');
						}
					});
				}
			}]
		});
		modalWindow.show();
	},
}
window.onload = function () {
	var authConfig = new AuthConfig();
	authConfig.init();
	authConfig.initPage();
}
