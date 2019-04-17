$.namespace("outputStatis");
var OutputStatis = function () { }

OutputStatis.prototype = {
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
    var that = this;
    this.loadProjList(function () {
			that.loadTaskList(that.loadTableData);
		});
  },
  /**
   * 调整UI.
   */
  adjustUI: function () {
    this.mainTable && this.mainTable.setWidth(window.innerWidth - 40);
    this.mainTable && this.mainTable.setHeight(window.innerHeight - 165);
    this.mainTable && this.mainTable.refresh();
  },
  /**
   * 初始化组件.
   */
  initCompent: function() {
    var that = this;
    this.$projDrop = $("#projDrop").dropMenu({
      height: 100,
      notHover: true
    });
    this.$taskDrop = $("#taskDrop").dropMenu({
      height: 100,
      notHover: true
    });
    this.mainTable = $("#mainTable").icTable({
      rowNum: true,
      editable: false,
      pagination: true,
      height: 519,
      title: ["项目", "业务", "环节", "工号", "姓名", "字符总量", "有效字符总量", "准确率", "分块数量", "录入？数量", "录入？比例"],
      dataFields: ["project", "task", "stage", "usercode", "username", "char_total", "char_valid", "valid_precision", "count", "symbol", "symbol_precision"]
    });
    that.$projDrop.onChange = function (id, old) {
			if (id != old) {
        that.cur_proj = that.projects.filter((pro)=> {return pro._id == id})[0] || {};
        that.loadTaskList();
      }
		};
		that.$taskDrop.onChange = function (id, old) {
			if (id != old) {
        that.cur_task = that.tasks.filter((tas)=> {return tas._id == id})[0] || {};
      }
		};
  },
  /**
   * 事件绑定.
   */
  bindEvent: function () {
    var that = this;
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
		* 加载项目信息.
		*/
	loadProjList: function (callback) {
		var that = this;
		that.loadUI.show();
		$.get("/config/getDeploy", { type: "proj" }, function (data, status, xhr) {
			that.loadUI.hide();
			that.projects = data ? data : [];
			if (status == "success") {
				var menu = [];
				data.forEach(function (proj) {
					menu.push({ id: proj._id, text: proj.name });
				});
				that.$projDrop.initData(menu);
				menu[0] && that.$projDrop.value(menu[0].id);
				callback && callback.call(that);
			}
		});
  },
  /**
	 * 加载业务信息.
	 */
	loadTaskList: function (callback) {
		var that = this;
		that.loadUI.show();
		$.post("/task/getTasks", { project: that.$projDrop.value(), state: {$in: ["已导出", "已合并"]} }, function (data, status, xhr) {
			that.loadUI.hide();
			that.tasks = data ? data : [];
			if (status == "success") {
				var menu = [];
				that.tasks.forEach(function (proj) {
					menu.push({ id: proj._id, text: proj.name });
				});
				that.$taskDrop.initData(menu);
				menu[0] && that.$taskDrop.value(menu[0].id);
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
    query.project = this.$projDrop.value();
    if (!query.project) {
      return;
    }
    that.mainTable.pager.onChangePageNum = function(total, amount, cur_num, old_num) {
      that.loadUI.show();
      var skip = +amount * (+cur_num - 1);
      var limit = +amount;
      $.post("/output/getOutPutPageData", {ispage: true, filter: query, skip: skip, limit: limit}, function(data, status, xhr) {
        that.loadUI.hide();
        if (status == "success") {
          data = data || [];
          var displayList = [];
          var p_map = {};
          that.projects.forEach((pro)=>{p_map[pro._id] = pro.name;});
          var t_map = {};
          that.tasks.forEach((tas)=>{t_map[tas._id] = tas.name;});
          var s_map = {
            "ocr": "OCR",
            "op1": "一码",
            "op2": "二码",
            "op3": "问题件",
            "op4": "复核"
          };
          data.forEach((dat)=> {
            for (var stage in dat.statis) {
              for (var usercode in dat.statis[stage]) {
                var userOuput = dat.statis[stage][usercode];
                displayList.push({
                  project: p_map[dat.project],
                  task: t_map[dat.task],
                  stage: s_map[stage],
                  usercode: usercode,
                  username: "",
                  char_total: userOuput.chatLength,
                  char_valid: 0,
                  valid_precision: 0,
                  count: userOuput.count,
                  symbol: userOuput.symbol,
                  symbol_precision: 0
                });
              }
            }
          });
          that.mainTable.value(displayList);
          that.mainTable.select(0);
        }
      });
    }
    that.loadUI.show();
    $.post("/output/getOutPutPageData", {isCount: true, filter: query}, function(data, status, xhr) {
      that.loadUI.hide();
      if (status == "success") {
        data = +data || 0;
        that.mainTable.pager.setTotal(data);
      }
    });
  },
}

window.onload = function () {
  var output = new OutputStatis();
  output.init();
  output.initPage();
}