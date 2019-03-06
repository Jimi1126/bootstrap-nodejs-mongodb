$.namespace("updateImageConf");
UpdateImageConf = function () { }
UpdateImageConf.prototype = {
  image: {},
  bills: [],
  fields: [],
  loadUI: new LoadUI(),
  dialog: new Dialog(),
  /**
    * 初始化数据.
    */
  init: function () {
  },
  /**
   * 初始化页面.
  */
  initPage: function () {
    this.initComponent();
    this.loadBill();
    this.bindEvent();
  },
  /**
   * 初始化组件.
   */
  initComponent: function () {
    var that = this;
    var menu = [];
    that.image.img_paths && that.image.img_paths.forEach(function(im, i) {
      menu.push({
        id: i,
        text: im.img_path
      });
    });
    this.dropdown = $(".dropdown").dropMenu({
      data: menu
    });
    menu[0] && this.dropdown.value(menu[0].id);
    this.billTable = $("#billTable").icTable({
      title: ["编码", "起点X轴", "起点Y轴", "终点X轴", "终点Y轴", "宽", "高"],
      dataFields: ["code", "x0", "y0", "x1", "y1", "w", "h"]
    });
    this.fieldTable = $("#fieldTable").icTable({
      title: ["编码", "起点X轴", "起点Y轴", "终点X轴", "终点Y轴", "宽", "高"],
      dataFields: ["code", "x0", "y0", "x1", "y1", "w", "h"]
    });
  },
  /**
   * 加载分块.
   */
  loadBill: function () {
    var that = this;
    if (!!that.image) {
      that.loadUI.show();
      var conf = that.image.img_paths ? that.image.img_paths[that.dropdown.value()] : {}
      $.get("/config/getDeploy", { project: that.image.project, image: that.image._id, src_img: conf.img_path, type: "bill" },
        function (data, status, xhr) {
          if (status == 'success') {
            that.bills = data;
            that.billTable.value(data);
          }
          that.buttonControl();
          that.curBill = null;
          if (that.bills.length == 0) {
            that.fieldTable.value([]);
            that.loadUI.hide();
          } else {
            that.billTable.select(0);
          }
        });
    }
  },
  /**
   * 加载字段.
   */
  loadField: function (bill) {
    var that = this;
    if (!!bill) {
      that.loadUI.show();
      $.get("/config/getDeploy", { project: that.image.project, image: that.image._id, bill: bill._id, type: "field" },
        function (data, status, xhr) {
          if (status == 'success') {
            that.fields = data;
            that.fieldTable.value(data);
            that.fieldTable.select(0);
          }
          that.buttonControl();
          that.loadUI.hide();
        });
    } else {
      that.loadUI.hide();
    }
  },
  /**
   * 事件绑定.
   */
  bindEvent: function () {
    var that = this;
    $("#bill_add").bind('click', $.proxy(this.addBillConfEvent, this));
    $('#bill_mod').bind('click', $.proxy(this.modBillConfEvent, this));
    $('#bill_del').bind('click', $.proxy(this.delBillConfEvent, this));
    $('#field_add').bind('click', $.proxy(this.addFieldConfEvent, this));
    $('#field_mod').bind('click', $.proxy(this.modFieldConfEvent, this));
    $('#field_del').bind('click', $.proxy(this.delFieldConfEvent, this));

    that.dropdown.onChange = $.proxy(this.loadBill, this);

    that.billTable.onselectRow = function () {
      var bill = that.billTable.select();
      if (!that.curBill || that.curBill.code != bill.code) {
        that.curBill = bill;
        that.loadField(that.bills.filter(function (b) { return b.code == bill.code })[0]);
      }
    }
  },
  /**
   * 按钮控制.
   */
  buttonControl: function() {
    if (!this.image.img_paths) {
      $("#bill_add").disabled();
    }
    if (Util.isEmpty(this.bills)) {
      $("#bill_mod").disabled();
      $("#bill_del").disabled();
      $('#field_add').disabled();
      $('#field_mod').disabled();
      $('#field_del').disabled();
    } else {
      $("#bill_mod").enabled();
      $("#bill_del").enabled();
      $('#field_add').enabled();
      if (Util.isEmpty(this.fields)) {
        $('#field_mod').disabled();
        $('#field_del').disabled();
      } else {
        $('#field_mod').enabled();
        $('#field_del').enabled();
      }
    }
  },
  /**
   * 新增分块配置事件.
  */
  addBillConfEvent: function () {
    var that = this;
    var conf = that.image.img_paths[that.dropdown.value()]
    var modalWindow = new ModalWindow({
      title: "新增分块配置",
      url: "jcropPage.html",
      close: false,
      width: 1000,
      height: 500,
      window: window.parent,
      maximize: true,
      params: conf,
      data: {code: "BI" + Util.getBitDate()},
      buttons: [{
        name: "保存",
        class: "btn-primary",
        event: function () {
          var bill = this.value();
          if (Util.isEmpty(bill.code)) {
            return that.dialog.show('分块编码为必填项');
          }
          that.loadUI.show();
          var arr = conf.img_path.split("\\");
          arr.pop();
          var param = {
            src: conf.img_path,
            cut_path: arr.join("\\") + "\\bill",
            data: bill
          };
          $.post("/config/crop", param, function (data, status, xhr) {
            if (status == 'success' && data == "success") {
              bill.img_path = param.cut_path + "\\" + bill.code + ".jpg";
              bill.filter = conf.filter;
              bill.src_img = conf.img_path;
              bill.project = that.image.project;
              bill.image = that.image._id;
              bill.type = "bill";
              bill._id = Util.uuid(24, 16).toLowerCase();
              bill.state = 1; //启用
              $.post("/config/saveDeploy", bill, function (data, status, xhr) {
                if (status == 'success') {
                  if (data == "exist") {
                    that.dialog.show('分块编码已存在');
                  } else {
                    that.dialog.show('新增成功');
                    that.bills.push(bill);
                    that.billTable.value(that.bills);
                    that.billTable.select(that.bills.length - 1);
                    that.buttonControl();
                    modalWindow.hide();
                  }
                }
                that.loadUI.hide();
              });
            } else if (data == "exist") {
              that.dialog.show('分块编码已存在');
              that.loadUI.hide();
            } else {
              that.dialog.show('新增失败');
              that.loadUI.hide();
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
  /**
   * 修改分块配置.
   */
  modBillConfEvent: function () {
    var that = this;
    var bill = that.billTable.select();
    var modBill = that.bills.filter(function (b) { return b.code == bill.code })[0];
    var conf = that.image.img_paths[that.dropdown.value()]
    var modalWindow = new ModalWindow({
      title: "修改分块配置",
      url: "jcropPage.html",
      close: false,
      width: 1000,
      height: 500,
      data: modBill,
      params: conf,
      window: window.parent,
      maximize: true,
      buttons: [{
        name: "保存",
        class: "btn-primary",
        event: function () {
          var bill = this.value();
          if (Util.isEmpty(bill.code)) {
            return that.dialog.show('分块编码为必填项');
          }
          that.loadUI.show();
          modBill.code = bill.code;
          modBill.x0 = bill.x0;
          modBill.y0 = bill.y0;
          modBill.x1 = bill.x1;
          modBill.y1 = bill.y1;
          modBill.w = bill.w;
          modBill.h = bill.h;
          $.post("/config/updateDeploy", modBill, function (data, status, xhr) {
            if (status == 'success') {
              that.dialog.show('修改成功');
              that.billTable.asyncData(that.bills);
              modalWindow.hide();
            }
            that.loadUI.hide();
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
  /**
    * 删除分块配置事件.
    */
  delBillConfEvent: function () {
    var that = this;
    var modalWindow = new ModalWindow({
      title: "删除分块配置",
      body: "<div>删除分块片配置后，该分块配置的字段配置将一并删除，你确定删除吗？</div>",
      width: 500,
      height: 40,
      buttons: [{
        name: "确定",
        class: "btn-primary",
        event: function () {
          var bill = that.billTable.select();
          var index = 0;
          var delBill = that.bills.filter(function (b, i) {
            if (b.code == bill.code) {
              index = i;
              return true;
            }
            return false;
          })[0];
          var doDel = function() {
            $.post("/config/deleteDeploy", delBill, function (data, status, xhr) {
              if (status == 'success') {
                that.dialog.show('删除成功');
                that.billTable.remove(index);
                that.bills = [].concat(that.bills.slice(0, index), that.bills.slice(index + 1));
                that.bills.length == 0 && that.fieldTable.value([]);
                that.buttonControl();
                modalWindow.hide();
              } else {
                that.dialog.show('删除失败');
              }
              that.loadUI.hide();
            });
          }
          if (delBill.img_path) {
            var arr = delBill.img_path.split("\\");
            arr.pop();
            var param = {
              path: arr.join("\\")
            };
            $.post("/config/delFile", param, function (data, status, xhr) {
              if (status == "success") {
                doDel();
              } else {
                that.dialog.show('删除失败');
                that.loadUI.hide();
              }
            });
          } else {
            doDel();
          }
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
   * 新增字段配置事件.
  */
  addFieldConfEvent: function () {
    var that = this;
    var bill = that.billTable.select();
    var curBill = that.bills.filter(function (b) { return b.code == bill.code })[0];
    var modalWindow = new ModalWindow({
      title: "新增字段配置",
      url: "jcropPage.html",
      close: false,
      width: 1000,
      height: 500,
      window: window.parent,
      params: curBill,
      data: {code: "FI" + Util.getBitDate()},
      maximize: true,
      buttons: [{
        name: "保存",
        class: "btn-primary",
        event: function () {
          var field = this.value();
          if (Util.isEmpty(field.code)) {
            return that.dialog.show('分块编码为必填项');
          }
          that.loadUI.show();
          var arr = curBill.img_path.split("\\");
          arr.pop();
          var param = {
            src: curBill.img_path,
            cut_path: arr.join("\\") + "\\field",
            data: field
          };
          $.post("/config/crop", param, function (data, status, xhr) {
            if (status == 'success' && data == "success") {
              field.img_path = param.cut_path + "\\" + field.code + ".jpg";
              field.project = that.image.project;
              field.image = that.image._id;
              field.bill = curBill._id;
              field.src_img = curBill.src_img;
              field.type = "field";
              field._id = Util.uuid(24, 16).toLowerCase();
              field.state = 1; //启用
              $.post("/config/saveDeploy", field, function (data, status, xhr) {
                if (status == 'success') {
                  if (data == "exist") {
                    that.dialog.show('字段编码已存在');
                  } else {
                    that.dialog.show('新增成功');
                    that.fields.push(field);
                    that.fieldTable.value(that.fields);
                    that.fieldTable.select(that.fields.length - 1);
                    that.buttonControl();
                    modalWindow.hide();
                  }
                }
                that.loadUI.hide();
              });
            } else if (data == "exist") {
              that.dialog.show('字段编码已存在');
              that.loadUI.hide();
            } else {
              that.dialog.show('新增失败');
              that.loadUI.hide();
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
  /**
   * 修改字段配置.
   */
  modFieldConfEvent: function () {
    var that = this;
    var bill = that.billTable.select();
    var curBill = that.bills.filter(function (b) { return b.code == bill.code })[0];
    var field = that.fieldTable.select();
    var modField = that.fields.filter(function (f) { return f.code == field.code })[0];
    var modalWindow = new ModalWindow({
      title: "修改分块配置",
      url: "jcropPage.html",
      close: false,
      width: 1000,
      height: 500,
      params: curBill,
      data: modField,
      window: window.parent,
      maximize: true,
      buttons: [{
        name: "保存",
        class: "btn-primary",
        event: function () {
          var field = this.value();
          if (Util.isEmpty(field.code)) {
            return that.dialog.show('分块编码为必填项');
          }
          that.loadUI.show();
          modField.code = field.code;
          modField.x0 = field.x0;
          modField.y0 = field.y0;
          modField.x1 = field.x1;
          modField.y1 = field.y1;
          modField.w = field.w;
          modField.h = field.h;
          $.post("/config/updateDeploy", modField, function (data, status, xhr) {
            if (status == 'success') {
              that.dialog.show('修改成功');
              that.fieldTable.asyncData(that.fields);
              modalWindow.hide();
            }
            that.loadUI.hide();
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
  /**
    * 删除字段配置事件.
    */
   delFieldConfEvent: function () {
    var that = this;
    var modalWindow = new ModalWindow({
      title: "删除分块配置",
      body: "<div>你确定删除该字段配置吗？</div>",
      width: 300,
      height: 40,
      buttons: [{
        name: "确定",
        class: "btn-primary",
        event: function () {
          var field = that.fieldTable.select();
          var index = 0;
          var delField = that.fields.filter(function (f, i) {
            if (f.code == field.code) {
              index = i;
              return true;
            }
            return false;
          })[0];
          var doDel = function() {
            $.post("/config/deleteDeploy", delField, function (data, status, xhr) {
              that.loadUI.hide();
              if (status == 'success') {
                that.dialog.show('删除成功');
                that.fieldTable.remove(index);
                that.fields = [].concat(that.fields.slice(0, index), that.fields.slice(index + 1));
                that.buttonControl();
                modalWindow.hide();
              } else {
                that.dialog.show('删除失败');
              }
            });
          }
          if (delField.img_path) {
            var arr = delField.img_path.split("\\");
            arr.pop();
            var param = {
              path: arr.join("\\")
            };
            $.post("/config/delFile", param, function (data, status, xhr) {
              if (status == "success") {
                doDel();
              } else {
                that.dialog.show('删除失败');
                that.loadUI.hide();
              }
            });
          } else {
            doDel();
          }
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

window.initPage = function (image) {
  updateImageConf = new UpdateImageConf();
  updateImageConf.image = image;
  updateImageConf.init();
  updateImageConf.initPage();
}