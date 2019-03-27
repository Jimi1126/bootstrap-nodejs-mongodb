$.namespace("authConfig");

AuthConfig = function() {}

AuthConfig.prototype = {
	loadUI: new LoadUI(),
	dialog: new Dialog(),
	init: function() {
		this.adjustUI();
		this.initCompent();
    this.bindEvent();
    this.loadProjList();
		this.setPageTotal();
	},
	initPage: function() {

	},
	adjustUI: function() {

	},
	/**
		* 初始化组件.
		*/
	initCompent: function() {
		var that = this;
		this.mainTable = $("#mainTable").icTable({
			rowNum: true,
			pagination: true,
			editable: false,
			height: 549,
			title: ["工号","姓名","入职时间","状态", "操作", "处理"],
			dataFields: [
				"username", "nickname","entryDate", "state", "handle1", "handle2"
			]
		});
	},
	bindEvent: function() {
		var that = this;
		$("#addBtn").bind('click', $.proxy(this.addBtnEvent, this));
		$('#authBtn').bind('click', $.proxy(this.authBtnEvent, this));
		$('#modifyBtn').bind('click', $.proxy(this.modifyBtnEvent, this));
		$("#queryBtn").bind("click", $.proxy(this.setPageTotal, this));
		that.mainTable.pager.onChangePageNum = $.proxy(that.loadTableData, that);
	},
	/**
		* 加载项目信息.
		*/
	loadProjList: function () {
		var that = this;
		$.get("/config/getDeploy", { type: "proj" }, function (data, status, xhr) {
			that.projects = data ? data : [];
    });
  },
	/**
		* 设置总数.
		*/
	setPageTotal: function() {
		var that = this;
		that.queryObj = {}
		that.loadUI.show();
		$("input[query_code]").each(function() {
			$(this).val() && (that.queryObj[$(this).attr("query_code")] = $(this).val());
		});
		var param = {
			filter: that.queryObj,
			count: true,
		}
		$.post("/user/getusers", param, function(data, status, xhr) {
			that.loadUI.hide();
			if (status == "success") {
				data && that.mainTable.pager.setTotal(data);
				!data && that.mainTable.pager.setTotal(0);
			} else {
				that.dialog.show("系统繁忙");
			}
		});
	},
	/**
		* 加载表格.
		*/
	loadTableData: function(total, amount, cur_num, old_num) {
		var that = this;
		that.loadUI.show();
		var param = {
			filter: that.queryObj,
			skip: +amount * (+cur_num - 1), 
			limit: amount
		}
		$.post("/user/getusers", param, function(data, status, xhr) {
			that.loadUI.hide();
			if (status == "success") {
				data = data || [];
				data.forEach(u => {
					u.state = !u.leaveDate ? "在职" : "离职"
				});
				that.mainTable.value(data);
				that.mainTable.select(0);
			}
		});
		},
		/**
			* 权限设置.
			*/
		authBtnEvent: function() {
			var that = this, modalWindow, mainTable;
			var cur_user = that.mainTable.select();
			modalWindow = new ModalWindow({
				title: "权限设置",
				body: `<div>
					<div class="input-group" style="margin-bottom: 8px;">
						<span class="input-group-addon">用户名</span>
						<input type="text" class="form-control" value="${cur_user.nickname}" readOnly style="width: 88px">
						<span class="input-group-addon">项目</span>
						<input type="text" class="form-control" code="projName">
						<span class="input-group-addon">功能</span>
						<input type="text" class="form-control" code="funcName">
					</div>
					<div id="mainTable"></div>
				</div>`,
				width: 600,
				height: 400,
				buttons: [{
					name: "确认",
					title: "点击确认对列表中文件夹进行分配",
					class: "btn-primary",
					event: function () {
						mainTable.value();
					}
				},{
					name: "取消",
					class: "btn-default",
					event: function () {
						modalWindow.hide();
					}
				}]
			});
			mainTable = modalWindow.$modal.find("#mainTable").icTable({
				mult: true,
				editable: false,
				width: 565,
				height: 350,
				title: ["项目", "功能"],
				dataFields: ["projName", "funcName"]
			});
      modalWindow.show();
      var roleList = [
        {projCode: 1,projName: "管理",funcCode: 1,funcName: "统计报表"},
        {projCode: 1,projName: "管理",funcCode: 1,funcName: "权限管理"}
      ];
      that.funcs = [
        {funcCode: 1, funcName: "新增"},
        {funcCode: 2, funcName: "分配"},
        {funcCode: 3, funcName: "合并"}
      ];
      that.projects && that.projects.forEach(function(pro) {
        that.funcs && that.funcs.forEach(function(func) {
          roleList.push({
            projCode: pro.projCode,
            projName: pro.projName,
            funcCode: func.funcCode,
            funcName: func.funcName
          });
        });
      });
			modalWindow.$modal.on("shown.bs.modal", function() {
				mainTable.refresh();
				mainTable.value(roleList);
				modalWindow.$modal.find("input[code]").bind('input propertychange',function () {
					var proj_exp = new RegExp(modalWindow.$modal.find(`input[code="projName"]`).val());
					var func_exp = new RegExp(modalWindow.$modal.find(`input[code="funcName"]`).val());
					mainTable.value(roleList.filter(function(ro) {
						return proj_exp.test(ro.projName) && func_exp.test(ro.funcName);
					}));
				});
			});
		},
}
window.onload = function() {
	var authConfig = new AuthConfig();
	authConfig.init();
	authConfig.initPage();
}
