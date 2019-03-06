$.namespace("enterDetail");
var EnterDetail = function () { }

EnterDetail.prototype = {
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
      pagination: true,
      height: 519,
      title: ["业务名称", "工号", "姓名", "字符总量", "有效字符总量", "准确率", "时间", "分块数量", "分块效率", "字符效率", "录入？数量", "录入？比例", "OCR字符", "OCR字符占比"],
      dataFields: ["date", "usercode", "username", "char_total", "char_valid", "valid_precision", "time", "bill_num", "bill_precision", "char_precision", "enter_char", "enter_char_prop", "char_ocr", "char_ocr_prop"]
    });
    that.mainTable.pager.onChangePageNum = function(total, amount, cur_num, old_num) {
      that.loadUI.show();
      $.post("/task/getResultData", {filter: query, skip: +amount * (+cur_num - 1), limit: amount}, function(data, status, xhr) {
        that.mainTable.value(data || []);
        that.mainTable.select(0);
        that.loadUI.hide();
      });
    }
  },
  /**
   * 事件绑定.
   */
  bindEvent: function () {
    var that = this;
    $("#queryBtn").bind("click", $.proxy(this.loadTableData, this));
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
    var query = {}
    query.project = this.projectList.value();
    if (!query.project) {
      return;
    }
    // var tableData = [];
    // for (var i = 0; i < 200; i++) {
    //   tableData.push({
    //     "date" : "日期" + i,
    //     "usercode" : "886" + i,
    //     "username" : "张三" + i,
    //     "char_total" : (Math.random() * 1000000000 + "").substr(0, Math.ceil(Math.random() * 10)),
    //     "char_valid" : (Math.random() * 1000000000 + "").substr(0, Math.ceil(Math.random() * 10)),
    //     "valid_precision" : (Math.random() * 100 + "").substr(0, 4) + "%",
    //     "time": "41",
    //     "bill_num": (Math.random() * 1000000000 + "").substr(0, Math.ceil(Math.random() * 10)),
    //     "bill_precision": (Math.random() * 100 + "").substr(0, 4) + "%",
    //     "char_precision": (Math.random() * 100 + "").substr(0, 4) + "%",
    //     "enter_char": (Math.random() * 1000000000 + "").substr(0, Math.ceil(Math.random() * 10)),
    //     "enter_char_prop": (Math.random() * 100 + "").substr(0, 4) + "%",
    //     "char_ocr": (Math.random() * 1000000000 + "").substr(0, Math.ceil(Math.random() * 10)),
    //     "char_ocr_prop" : (Math.random() * 100 + "").substr(0, 4) + "%"
    //   });
    // }
    that.mainTable.pager.setTotal(18);
    // that.loadUI.show();
    // $("input[query_code]").each(function() {
    //   $(this).val() && (query[$(this).attr("query_code")] = $(this).val());
    // });
    // $.post("/task/getTasks", query, function(data, status, xhr) {
    //   that.loadUI.hide();
    //   if (status == "success") {
    //     that.tasks = data || [];
    //     that.mainTable.value(that.tasks);
    //     that.mainTable.select(that.tasks.length - 1);
    //   }
    // });
  },
}

window.onload = function () {
  var enter = new EnterDetail();
  enter.init();
  enter.initPage();
}