$.namespace("enterDetail");
var EnterDetail = function () { }

EnterDetail.prototype = {
  loadUI: new LoadUI(),
  dialog: new Dialog(),
  projects: [],
  tasks: [],
  queryObj: {},
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
    // var c_height = window.innerHeight;
    // if (c_height > 440) {
    //   $("#mainTable").height(c_height - 208 - 160);
    // } else {
    //   $("#mainTable").height(240 - 160);
    // }
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
    $('.form_datetime').val(Util.getNowDate());
    this.projectList = $("#projectList").dropMenu({
      height: 100,
      notHover: true
    });
    this.taskList = $("#taskList").dropMenu({
      height: 100,
      notHover: true
    });
    this.mainTable = $("#mainTable").icTable({
      rowNum: true,
      editable: false,
      // pagination: true,
      height: 500,
      title: ["FileID", "ProdNO", "MatNO", "FileName", "FilePath", "ScanDate", "Pages", "DocBoxID"],
      dataFields: ["fileID", "prodNO", "matNO","fileName", "filePath", "scanDate", "pages", "docBoxID"]
    });
    // that.mainTable.pager.onChangePageNum = function(total, amount, cur_num, old_num) {
    //   that.loadUI.show();
    //   $.post("/task/getResultData", {filter: that.queryObj, skip: +amount * (+cur_num - 1), limit: amount}, function(data, status, xhr) {
    //     data = data || [];
    //     var displayList = [];
    //     data.forEach(function(res, i) {
    //       var fc001 = res.enter.filter(function(e) {return e.field_id == "fc001"})[0];
    //       var fc002 = res.enter.filter(function(e) {return e.field_id == "fc002"})[0];
    //       var fc003 = res.enter.filter(function(e) {return e.field_id == "fc003"})[0];
    //       var moNo = fc001 ? (fc001.value.op4 ? fc001.value.op4 : fc001.value.op2) : "";
    //       var prodNO = fc002 ? (fc002.value.op4 ? fc002.value.op4 : fc002.value.op2) : "";
    //       var matNO = fc003 ? (fc003.value.op4 ? fc003.value.op4 : fc003.value.op2) : "";
    //       displayList.push({
    //         fileID: `FK${Util.getBitDate(8)}-${Util.LPAD(i + 1, 6, "0")}`,
    //         prodNO: prodNO,
    //         matNO: matNO,
    //         fileName: prodNO + ".pdf",
    //         filePath: res.create_at.substring(0, 4),
    //         scanDate: res.create_at,
    //         pages: "",
    //         docBoxID: res.path.split("/")[4]
    //       });
    //     });
    //     that.mainTable.value(displayList);
    //     that.mainTable.select(0);
    //     that.loadUI.hide();
    //   });
    // }
  },
  /**
   * 事件绑定.
   */
  bindEvent: function () {
    var that = this;
    $("#queryBtn").bind("click", $.proxy(this.loadTableData, this));
    $("#exportBtn").bind("click", $.proxy(this.downExecl, this));
    window.onresize = function() {
      that.mainTable.refresh();
    };
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
          menu.push({ id: proj._id, text: proj.projName });
        });
        that.projectList.initData(menu);
        menu[0] && that.projectList.value(menu[0].id);
        that.loadTaskList(menu[0].id, callback);
      }
    });
  },
  /**
		* 加载项目信息.
		*/
	loadTaskList: function (id, callback) {
    var that = this;
    if (!id) {
      return;
    }
		that.loadUI.show();
		$.post("/task/getTasks", {project: id}, function(data, status, xhr) {
			that.loadUI.hide();
			that.tasks = data ? data : [];
      if (status == "success") {
        var menu = [];
        that.tasks.forEach(function (proj) {
          menu.push({ id: proj._id, text: proj.name });
        });
        that.taskList.initData(menu);
        menu[0] && that.taskList.value(menu[0].id);
        callback && callback.call(that);
      }
		});
	},
  /**
   * 加载表格.
   */
  loadTableData: function() {
    var that = this;
    that.queryObj = {}
    that.queryObj.project = this.projectList.value();
    that.queryObj.task = this.taskList.value();
    that.queryObj.stage = "over"
    if (!that.queryObj.project) {
      return;
    }
    that.loadUI.show();
    // $.post("/task/getResultData", {filter: that.queryObj, isCount: true}, function(data, status, xhr) {
    //   that.loadUI.hide();
    //   if (status == "success") {
    //     data && that.mainTable.pager.setTotal(data);
    //     !data && that.mainTable.pager.setTotal(0);
    //   } else {
    //     that.dialog.show("系统繁忙");
    //   }
    // });
    $.post("/task/getResultData", {filter: that.queryObj}, function(data, status, xhr) {
      data = data || [];
      var displayList = [];
      data.forEach(function(res, i) {
        var fc001 = res.enter.filter(function(e) {return e.field_id == "fc001"})[0];
        var fc002 = res.enter.filter(function(e) {return e.field_id == "fc002"})[0];
        var fc003 = res.enter.filter(function(e) {return e.field_id == "fc003"})[0];
        var moNo = fc001 ? (fc001.value.op4 ? fc001.value.op4 : fc001.value.op2) : "";
        var prodNO = fc002 ? (fc002.value.op4 ? fc002.value.op4 : fc002.value.op2) : "";
        var matNO = fc003 ? (fc003.value.op4 ? fc003.value.op4 : fc003.value.op2) : "";
        displayList.push({
          fileID: `FK${Util.getBitDate(8)}-${Util.LPAD(i + 1, 6, "0")}`,
          prodNO: prodNO,
          matNO: matNO,
          fileName: prodNO + ".pdf",
          filePath: res.create_at.substring(0, 4),
          scanDate: res.create_at,
          pages: "",
          docBoxID: res.path.split("/")[4]
        });
      });
      that.mainTable.value(displayList);
      that.mainTable.select(0);
      that.loadUI.hide();
    });
  },
  /**
   * 下载表格.
   */
  downExecl: function() {
    Util.saveCSV(encodeURIComponent(JSON.stringify(this.mainTable.value())), "test.xls");
  }
}

window.onload = function () {
  var enter = new EnterDetail();
  enter.init();
  enter.initPage();
}