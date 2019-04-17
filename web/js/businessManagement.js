$.namespace("businessManagement");
var BusinessManagement = function () { }

BusinessManagement.prototype = {
  loadUI: new LoadUI(),
  dialog: new Dialog(),
  projects: [],
  tasks: [],
  init: function () {
    this.initCompent();
    this.adjustUI();
    this.bindEvent();
  },
  /**
   * 初始化页面.
   */
  initPage: function () {
    this.loadProjList(this.loadTableData);
  },
  /**
   * 调整UI.
   */
  adjustUI: function () {
    this.taskTable && this.taskTable.setWidth(window.innerWidth - 40);
    this.taskTable && this.taskTable.setHeight(window.innerHeight - 250);
    this.taskTable && this.taskTable.refresh();
  },
  /**
   * 初始化组件.
   */
  initCompent: function() {
    var that = this;
    $('.form_datetime').datetimepicker({
			format : 'yyyy-mm-dd',
      language : 'zh-CN',
      startView: 2,
      autoclose: true,
      minView: 2,
      todayBtn: true
    });
    // $('.form_datetime').val(Util.getNowDate());
    this.$projDrop = $(".dropdown").dropMenu({
      height: 100,
      notHover: true
    });
    this.taskTable = $("#mainTable").icTable({
      rowNum: true,
      editable: false,
      height: 519,
      title: ["gid","业务编码","业务名称","区域", "部门", "日期", "文件名", "上传时间", "导出时间", "页数", "状态", "优先级", "操作人"],
      dataFields: [
        {code: "_id", dataType: "text", hidden: true},
        "code", "name",
        {code: "region", dataType: "table_dropdown", editable: true, data: [{id: "HQ", text: "红旗"}, {id: "BS", text: "报税"}]},
        {code: "dept", dataType: "table_dropdown", editable: true, data: [{id: "T", text: "T"}, {id: "WI", text: "WI"}, {id: "FK", text: "FK"}]},
        "create_at", "file_name", "scan_at", "export_time", "pages","state",
        {code: "priority", dataType: "table_dropdown", editable: true, data: [{id: "1", text: "正常"}, {id: "2", text: "紧急"}, {id: "3", text: "特急"}]},
        "handler"]
    });
  },
  /**
   * 事件绑定.
   */
  bindEvent: function () {
    $("#addBtn").bind('click', $.proxy(this.addBtnEvent, this));
    $('#allotBtn').bind('click', $.proxy(this.allotBtnEvent, this));
    $('#mergeBtn').bind('click', $.proxy(this.mergeBtnEvent, this));
    $("#queryBtn").bind("click", $.proxy(this.loadTableData, this));
    window.onresize = $.proxy(this.adjustUI, this);
  },
  /**
   * 按钮控制.
   */
  buttonControl: function () {
    if (Util.isEmpty([])) {
    } else {
    }
  },
  /**
   * 初始化数据.
   */
  loadProjList: function(callback) {
    var that = this;
    $.get("/config/getDeploy", { type: "proj" }, function (data, status, xhr) {
      that.projects = data ? data : [];
      if (status == "success") {
        var menu = [];
        that.projects.forEach(function (proj) {
          menu.push({ id: proj._id, text: proj.name });
        });
        that.$projDrop.initData(menu);
        menu[0] && that.$projDrop.value(menu[0].id);
        callback && callback.call(that);
      }
      that.buttonControl();
    });
  },
  /**
   * 加载表格.
   */
  loadTableData: function() {
    var that = this;
    var query = {}
    query.project = this.$projDrop.value();
    if (!query.project) {
      return;
    }
    that.loadUI.show();
    $("input[query_code]").each(function() {
      $(this).val() && (query[$(this).attr("query_code")] = $(this).val());
    });
    $.post("/task/getTasks", query, function(data, status, xhr) {
      that.loadUI.hide();
      if (status == "success") {
        that.tasks = data || [];
        that.tasks.forEach(function(t) {
          t.scan_at = Util.parseDate(t.scan_at);
        });
        that.taskTable.value(that.tasks);
        that.taskTable.select(0);
      }
    });
  },
  /**
   * 新增按钮事件.
   */
  addBtnEvent: function () {
    var that = this;
    var modalWindow = new ModalWindow({
      title: "新建业务",
      body: `<div>
      <div class="input-group">
        <span class="input-group-addon">业务编码</span>
        <input type="text" class="form-control" datafield= "code">
        <span class="input-group-addon">业务名称</span>
        <input type="text" class="form-control" datafield= "name">
      </div>
      <div class="input-group" style="margin-top: 14px;">
        <span class="input-group-addon">区域</span>
        <div class="dropdown" target= "region"></div>
        <span class="input-group-addon">部门</span>
        <div class="dropdown" target= "dept"></div>
        <span class="input-group-addon">内容</span>
        <div class="dropdown" target="content"></div>
        <span class="input-group-addon">优先级</span>
        <div class="dropdown" target="priority"></div>
        </div>
        <div class="input-group" style="margin-top: 14px;">
        <span class="input-group-addon">日期</span>
        <input type="text" class="date form-control form_datetime" datafield= "create_at">
        <span class="input-group-addon">箱号</span>
        <input type="text" class="form-control" datafield= "b_box">
        <span class="input-group-addon">盒号</span>
        <input type="text" class="form-control" datafield= "s_box">
      </div>
      <div class="input-group" style="margin-top: 14px;">
        <span class="input-group-addon">流程选择</span>
        <span class="input-group-addon custom-btn">
          OCR
          <input type="checkbox" flowField="ocr">
        </span>
        <span class="input-group-addon custom-btn">
          一码
          <input type="checkbox" flowField="op1">
        </span>
        <span class="input-group-addon custom-btn">
          二码
          <input type="checkbox" flowField="op2">
        </span>
        <span class="input-group-addon custom-btn">
          问题件
          <input type="checkbox" flowField="op3">
        </span>
        <span class="input-group-addon custom-btn">
          复核
          <input type="checkbox" flowField="op4">
        </span>
      </div>
      </div>`,
      width: 521,
      height: 184,
      backdrop: "static",
      keyboard: false,
      buttons: [{
        name: "取消",
        class: "btn-default",
        event: function () {
          this.hide();
        }
      },{
        name: "创建",
        class: "btn-primary",
        event: function () {
          var newData = this.value();
          for (var key in newData) {
            if (!newData[key]) {
              return that.dialog.show('信息未填写完整');
            }
          }
          newData.flowList = []
          this.$modal.find("input[type='checkbox']").each(function() {
            if (this.checked) {
              newData.flowList.push($(this).attr("flowField"));
            }
          });
          if (Util.isEmpty(newData.flowList)) {
            return that.dialog.show('请选择业务处理流程');
          }
          that.loadUI.show();
          newData.project = that.$projDrop.value();
          newData.handler = epcos.userInfo.username;
          newData.path_name = `download/${newData.region}/${newData.dept}-${newData.create_at}/${newData.content}/${newData.b_box}/${newData.s_box}`;
          newData.file_name = `${newData.dept}-${newData.create_at}`;
          newData.state = "待下载";
          $.post("/task/newTask", newData, function (data, status, xhr) {
            that.loadUI.hide();
            if (status == 'success' && !data) {
              that.dialog.show('创建完成');
              that.tasks.push(newData);
              that.taskTable.value(that.tasks);
              that.taskTable.select(that.tasks.length - 1);
              that.buttonControl();
              modalWindow.hide();
            } else {
              that.dialog.show('创建失败');
            }
          });
        }
      }]
    });
    modalWindow.$modal.find("input[type='checkbox']").parent().bind("click", function(e) {
			if (!$(e.target).is("input")) {
				$(this).find("input[type='checkbox']")[0].checked = !$(this).find("input[type='checkbox']")[0].checked;
			}
		});
    modalWindow.$modal.find("div[target='region']").dropMenu({
      code: "region",
      data:[{id: "HQ", text: "红旗"}, {id: "BS", text: "报税"}]
    });
    modalWindow.$modal.find("div[target='dept']").dropMenu({
      code: "dept",
      data:[{id: "T", text: "T"}, {id: "WI", text: "WI"}, {id: "FK", text: "FK"}]
    });
    modalWindow.$modal.find("div[target='content']").dropMenu({
      code: "content",
      data:[{id: "001", text: "PDF"}, {id: "002", text: "PNG"}, {id: "003", text: "JPG"}]
    });
    modalWindow.$modal.find("div[target='priority']").dropMenu({
      code: "priority",
      data:[{id: "1", text: "正常"}, {id: "2", text: "紧急"}, {id: "3", text: "特急"}]
    }).value("1");
    modalWindow.$modal.find('.form_datetime').datetimepicker({
			format : 'yyyy-mm-dd',
      language : 'zh-CN',
      startView: 2,
      autoclose: true,
      minView: 2,
      todayBtn: true,
			initialDate : new Date()
    });
    modalWindow.value({code: "BN" + Util.getBitDate()});
    modalWindow.show();
  },
  /**
   * 分配按钮事件.
   */
  allotBtnEvent: function () {
    var that = this, modalWindow, mainTable;
    modalWindow = new ModalWindow({
      title: "确认分配",
      body: `<div><div id="mainTable"></div></div>`,
      width: 600,
      height: 200,
      buttons: [{
        name: "取消",
        class: "btn-default",
        event: function () {
          modalWindow.hide();
        }
      },{
        name: "确认",
        title: "点击确认对列表中文件夹进行分配",
        class: "btn-primary",
        event: function () {
          var allotList = mainTable.multSelect();
          $.post("/task/allotImage", {data: allotList}, function (data, status, xhr) {
            that.dialog.show("分配成功");
            modalWindow.hide();
          });
        }
      }]
    });
    mainTable = modalWindow.$modal.find("#mainTable").icTable({
      mult: true,
      rowNum: true,
      editable: false,
      width: 565,
      height: 200,
      title: ["gid","区域", "部门", "文件名", "状态", "页数", "处理"],
      dataFields: [
        {code: "_id", dataType: "text", hidden: true},
        "region", "dept", "file_name", "state", "pages", "manage"]
    });
    modalWindow.show();
    modalWindow.$modal.on("shown.bs.modal", function() {
      mainTable.value(that.taskTable.value().filter(function(t) {return t.state == "待分配"}));
    });
  },
  /**
   * 合并按钮事件.
   */
  mergeBtnEvent: function () {
    var that = this, modalWindow, mainTable;
    modalWindow = new ModalWindow({
      title: "确认合并",
      body: `<div><div id="mainTable"></div></div>`,
      width: 600,
      height: 200,
      buttons: [{
        name: "取消",
        class: "btn-default",
        event: function () {
          modalWindow.hide();
        }
      }, {
        name: "确认",
        title: "点击确认对列表中文件夹进行合并",
        class: "btn-primary",
        event: function () {
          var curTask = mainTable.select();
          if (Util.isEmpty(curTask)) {
            return that.dialog.show("无合并内容");
          }
          var param = {filter: {task: curTask._id, project: curTask.project}};
          that.loadUI.show();
          $.post("/task/mergeImage", param, function (data, status, xhr) {
            that.loadUI.hide();
            if (status == "success" && data == "success") {
              that.dialog.show("合并成功");
              modalWindow.hide();
            } else if(typeof data == "object") {
              that.dialog.show(JSON.stringify(data));
            } else {
              that.dialog.show("合并失败");
            }
          });
        }
      }]
    });
    mainTable = modalWindow.$modal.find("#mainTable").icTable({
      mult: true,
      rowNum: true,
      editable: false,
      width: 565,
      height: 200,
      title: ["gid","区域", "部门", "文件名", "状态", "页数", "处理"],
      dataFields: [
        {code: "_id", dataType: "text", hidden: true},
        "region", "dept", "file_name", "state", "pages", "manage"]
    });
    modalWindow.show();
    modalWindow.$modal.on("shown.bs.modal", function() {
      mainTable.value(that.taskTable.value().filter(function(t) {return t.state == "已导出"}));
    });
  },
}

window.onload = function () {
  bus = new BusinessManagement();
  bus.init();
  bus.initPage();
}