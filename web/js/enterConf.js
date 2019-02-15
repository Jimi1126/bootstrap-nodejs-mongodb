$.namespace("enterConf");
var EnterConf = function () { }

EnterConf.prototype = {
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
    this.confTable = $("#confTable").icTable({
      rowNum: false,
      editable: true,
      height: 556,
      title: ["主键", "所属项目", "配置类型", "录入字段", "录入名称", "字段所属", "录入文件ID", "录入文件", "录入校验"],
      dataFields: [{code: "_id", dataType: "text", hidden: true},
      {code: "project", dataType: "text", hidden: true},
      {code: "type", dataType: "text", hidden: true},
      "field_id", "field_name",
      {code: "src_type", dataType: "table_dropdown", data: [{id:"image", text:"图片"}, {id:"bill", text:"分块"}, {id:"field", text:"字段"}]},
      {code: "file_id", dataType: "text", hidden: true},
      {code: "file", dataType: "table_button", event: $.proxy(that.openFileList, that)},
      "verify"]
    });
  },
  /**
   * 事件绑定.
   */
  bindEvent: function () {
    $("#addBtn").bind('click', $.proxy(this.addBtnEvent, this));
    $('#saveBtn').bind('click', $.proxy(this.saveBtnEvent, this));
    $('#delBtn').bind('click', $.proxy(this.delBtnEvent, this));
  },
  /**
   * 初始化数据.
   */
  initData: function() {
    var that = this;
    $.get("/config/getDeploy", {project: that.image.project}, function(data, status, xhr) {
      if (status == "success") {
        data.forEach(function(f) {
          if (f.type == "image") {
            f.img_paths && f.img_paths.length > 0 && f.img_paths.forEach(function(p) {
              that.images.push({
                _id: f._id,
                type: f.type,
                code: f.code,
                img_code: "-",
                src_image: "-",
                src_bill: "-",
                img_path: p.img_path
              });
            });
          } else if (f.type == "bill") {
            var img = data.filter(function(ff) {return ff._id == f.image})[0];
            that.bills.push({
              _id: f._id,
              type: f.type,
              code: f.code,
              img_code: img.code,
              src_image: f.src_img,
              src_bill: "-",
              img_path: f.img_path
            });
          } else if (f.type == "field") {
            var img = data.filter(function(ff) {return ff._id == f.image})[0];
            var bil = data.filter(function(ff) {return ff._id == f.bill})[0];
            that.fields.push({
              _id: f._id,
              type: f.type,
              code: f.code,
              img_code: img.code,
              src_image: bil.src_img,
              src_bill: bil.code,
              img_path: f.img_path
            });
          } else if (f.type == "enter"){
            that.src_config.push(f);
          }
        });
        that.confTable.value(that.src_config);
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
    this.confTable.insert({_id: Util.uuid(24, 16).toLowerCase(), project: this.image.project, type: "enter"});
    this.confTable.select(this.confTable.value().length - 1);
  },
  getChange: function (src, cur) {
    if (!src || src.length == 0) {
      return cur;
    }
    var changeSet = [];
    src.forEach(function(s, i) {
      for (var key in s) {
        if (s[key] != cur[i][key]) {
          changeSet.push(cur[i]);
          break;
        }
      }
    });
    return changeSet.concat(cur.slice(src.length, cur.length));
  },
  /**
   * 保存按钮事件.
   */
  saveBtnEvent: function () {
    var that = this;
    var cur_config = that.confTable.value();
    var changeSet = that.getChange(that.src_config, cur_config);
    if (changeSet.length == 0) {
      that.dialog.show('不存在修改内容');
      return false;
    }
    that.loadUI.show();
    $.post("/config/addOrUpdateDeploy", {data: changeSet}, function(data, status, xhr) {
      if (status == "success") {
        if (data == "error") {
          that.dialog.show('保存失败');
        } else {
          that.src_config = cur_config;
          that.dialog.show('保存成功');
        }
      } else {
        that.dialog.show('保存失败');
      }
      that.loadUI.hide();
    });
  },
  /**
   * 删除按钮事件.
   */
  delBtnEvent: function () {
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
          that.loadUI.show();
          var index = -1;
          for (var i = 0, j = that.src_config.length; i < j; i++) {
            if (that.src_config[i]._id == config._id) {
              index = i;
              break;
            }
          }
          $.post("/config/deleteDeploy", config, function (data, status, xhr) {
            that.loadUI.hide();
            if (status == 'success') {
              that.dialog.show('删除成功');
              that.confTable.remove(index);
              that.src_config = [].concat(that.src_config.slice(0, index), that.src_config.slice(index + 1));
              modalWindow.hide();
            } else {
              that.dialog.show('删除失败');
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
    modalWindow.show();
  },
}

window.initPage = function (modImage) {
  enterConf = new EnterConf();
  enterConf.image = modImage;
  enterConf.init();
  enterConf.initPage();
}