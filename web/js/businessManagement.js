$.namespace("businessManagement");
var BusinessManagement = function () { }

BusinessManagement.prototype = {
  loadUI: new LoadUI(),
  dialog: new Dialog(),
  image: {},
  images: [],
  bills: [],
  fields: [],
  src_config: [],
  init: function () {
    this.adjustUI();
    this.initCompent();
    this.bindEvent();
  },
  /**
   * 初始化页面.
   */
  initPage: function () {
    this.initData();
  },
  /**
   * 调整UI.
   */
  adjustUI: function () {
  },
  /**
   * 初始化组件.
   */
  initCompent: function() {
    var that = this;
    this.confTable = $("#mainTable").icTable({
      rowNum: true,
      editable: false,
      height: 536,
      title: ["日期", "区域", "部门", "文件名", "上传时间", "导出时间", "页数", "录入状态", "处理", "操作人"],
      dataFields: ["date", "region", "dept", "fileName", "upload_time", "export_time", "page_num", "enter_state", "manage", "handler"]
    });
  },
  /**
   * 事件绑定.
   */
  bindEvent: function () {
    $("#addBtn").bind('click', $.proxy(this.addBtnEvent, this));
    $('#allotBtn').bind('click', $.proxy(this.allotBtnEvent, this));
    $('#mergeBtn').bind('click', $.proxy(this.mergeBtnEvent, this));
  },
  /**
   * 初始化数据.
   */
  initData: function() {
    var that = this;
    $.get("/config/getDeploy", {project: that.image.project}, function(data, status, xhr) {
      if (status == "success") {
        
      }
    });
  },
  /**
   * 打开录入文件窗口.
   * @param {*} e 
   */
  openFileList: function(e) {
    var that = this;
    var rowData = that.confTable.select();
    var params = rowData.src_type == "image" ? that.images : (rowData.src_type == "bill" ? that.bills : that.fields);
    !rowData.src_type && (params = [])
    var modalWindow = new ModalWindow({
      title: "录入内容",
      url: "enterChoice.html",
      close: true,
      width: 800,
      height: 380,
      params: params,
      buttons: [{
        name: "确定",
        class: "btn-primary",
        event: function () {
          var selectVal = this.contentWindow.fileTable.select();
          var dataList = that.confTable.value();
          var sval = that.confTable.select();
          dataList.forEach(function(dd) {
            if (dd._id == sval._id) {
              dd.file = selectVal.img_path;
              dd.file_id = selectVal._id;
            }
          });
          that.confTable.asyncData(dataList);
          this.hide();
        }
      }, {
        name: "取消",
        class: "btn-default",
        event: function () {
          this.hide();
        }
      }]
    });
    modalWindow.show();
  },
  /**
   * 获取一个输入组.
  */
  getInputGroup: function () {
    
  },
  /**
   * 新增按钮事件.
   */
  addBtnEvent: function () {
    var that = this;
    var modalWindow = new ModalWindow({
      title: "新建扫描文件夹",
      body: `<div>
      <div class="input-group">
        <span class="input-group-addon">区域</span>
        <div class="dropdown" target= "region"></div>
        <span class="input-group-addon">部门</span>
        <div class="dropdown" target= "dept"></div>
        <span class="input-group-addon">日期</span>
        <input type="text" class="form-control" datafield= "date">
      </div>
      <div class="input-group" style="margin-top: 14px;">
        <span class="input-group-addon">内容</span>
        <div class="dropdown" target="content"></div>
        <span class="input-group-addon">箱号</span>
        <input type="text" class="form-control" datafield= "b-box">
        <span class="input-group-addon">盒号</span>
        <input type="text" class="form-control" datafield= "s-box">
      </div>
      </div>`,
      width: 500,
      height: 100,
      backdrop: "static",
      keyboard: false,
      buttons: [{
        name: "创建",
        class: "btn-primary",
        event: function () {
          that.loadUI.show();
          $.post("/", {}, function (data, status, xhr) {
            that.loadUI.hide();
            if (status == 'success') {
              that.dialog.show('创建完成');
              modalWindow.hide();
            } else {
              that.dialog.show('创建失败');
            }
          });
        }
      }, {
        name: "取消",
        class: "btn-default",
        event: function () {
          this.hide();
        }
      }]
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
    modalWindow.show();
  },
  /**
   * 分配按钮事件.
   */
  allotBtnEvent: function () {
    
  },
  /**
   * 合并按钮事件.
   */
  mergeBtnEvent: function () {
    var that = this;
    var config = that.confTable.select();
    var modalWindow = new ModalWindow({
      title: "删除分块配置",
      body: "<div>你确定删除“" + config.field_name + "”字段配置吗？</div>",
      width: 300,
      height: 40,
      buttons: [{
        name: "确定",
        class: "btn-primary",
        event: function () {
          
        }
      }, {
        name: "取消",
        class: "btn-default",
        event: function () {
          this.hide();
        }
      }]
    });
    modalWindow.show();
  },
}

window.onload = function () {
  bus = new BusinessManagement();
  bus.init();
  bus.initPage();
}