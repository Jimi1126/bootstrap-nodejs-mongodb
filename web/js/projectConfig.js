$.namespace("projectConfig");

ProjectConfig = function () { }

ProjectConfig.prototype = {
  loadUI: new LoadUI(),
  dialog: new Dialog(),
  dropdown: {},
  projects: [],
  images: [],
  curProj: {},

  /**
   * 初始化数据.
  */
  init: function () {

  },
  /**
   * 初始化页面.
  */
  initPage: function () {
    this.loadUI.show();
    this.adjustUI();
    this.initComponent();
    this.loadProjList(function () {
      this.projects.length > 0 ? this.dropdown.value(this.projects[0]._id) : this.loadProjInfo();
    });
    this.bindEvent();
    this.loadUI.hide();
  },
  initComponent: function () {
    var that = this;
    this.dropdown = $(".dropdown").dropMenu({
      width: 120,
      height: 100
    });
    this.dropdown.onChange = function (id) {
      that.loadProjInfo(that.projects.filter(function (p) { return p._id == id })[0]);
    }
    this.imageTable = $("#imageTable").icTable({
      title: ["图片编码", "图片下载地址", "图片保存地址"],
      dataFields: ["code", "d_url", "s_url"]
    });
  },
  /**
   * 事件绑定.
   */
  bindEvent: function () {
    $("#proj_add").bind('click', $.proxy(this.addProjConfEvent, this));
    $('#proj_mod').bind('click', $.proxy(this.modProjConfEvent, this));
    $('#proj_del').bind('click', $.proxy(this.delProjConfEvent, this));
    $('#image_add').bind('click', $.proxy(this.addImageConfEvent, this));
    $('#image_mod').bind('click', $.proxy(this.modImageConfEvent, this));
    $('#image_del').bind('click', $.proxy(this.delImageConfEvent, this));
    window.onresize = this.adjustUI;
  },
  /**
   * 按钮控制.
   */
  buttonControl: function() {
    if (Util.isEmpty(this.projects)) {
      $("#proj_mod").disabled();
      $("#proj_del").disabled();
      $('#image_add').disabled();
      $('#image_mod').disabled();
      $('#image_del').disabled();
    } else {
      $("#proj_mod").enabled();
      $("#proj_del").enabled();
      $('#image_add').enabled();
      if (Util.isEmpty(this.images)) {
        $('#image_mod').disabled();
        $('#image_del').disabled();
      } else {
        $('#image_mod').enabled();
        $('#image_del').enabled();
      }
    }
  },
  /**
   * 加载项目信息.
  */
  loadProjList: function (callback) {
    var that = this;
    $.get("/config/getDeploy", { type: "proj" }, function (data, status, xhr) {
      that.projects = data ? data : [];
      if (status == "success") {
        var menu = [];
        data.forEach(function (proj) {
          menu.push({ id: proj._id, text: proj.projName });
        });
        that.dropdown.initData(menu);
        callback && callback.call(that);
      }
      that.buttonControl();
    });
  },
  /**
   * 调整UI.
  */
  adjustUI: function () {
    var c_height = window.innerHeight;
    if (c_height > 440) {
      $(".body-div").height(c_height - 208);
      $("#imageTable").height(c_height - 208 - 160);
    } else {
      $(".body-div").height(240);
      $("#imageTable").height(240 - 160);
    }
  },
  /**
   * 加载项目配置.
  */
  loadProjInfo: function (project) {
    var that = this;
    that.curProj = project;
    if (!!project) {
      $("input[dataField='projName']").val(project.projName);
      $("input[dataField='projCode']").val(project.projCode);
      that.loadProjDeploy();
    } else {
      $("input[dataField='projName']").val("");
      $("input[dataField='projCode']").val("");
      that.imageTable.value([]);
    }
  },
  /**
   * 加载项目配置.
  */
  loadProjDeploy: function () {
    var that = this;
    if (!!that.curProj) {
      that.loadUI.show();
      $.get("/config/getDeploy", { project: that.curProj._id, type: "image" }, function (data, status, xhr) {
        if (status == 'success') {
          that.images = data;
          that.imageTable.value(data);
          that.imageTable.select(0);
        }
        that.buttonControl();
        that.loadUI.hide();
      });
    }
  },
  /**
   * 新增项目配置事件.
  */
  addProjConfEvent: function () {
    var that = this;
    var modalWindow = new ModalWindow({
      title: "新增项目配置",
      url: "addProjConf.html",
      width: 600,
      height: 50,
      buttons: [{
        name: "新增",
        class: "btn-primary",
        event: function () {
          var project = this.value();
          if (Util.isEmpty(project.projName)) {
            return that.dialog.show('项目名称为必填项');
          }
          if (Util.isEmpty(project.projCode)) {
            return that.dialog.show('项目编码为必填项');
          }
          that.loadUI.show();
          project._id = Util.uuid(24, 16).toLowerCase();
          project.type = "proj";
          $.post("/config/saveDeploy", project, function (data, status, xhr) {
            if (status == 'success') {
              if (data == "exist") {
                that.dialog.show('项目名称或项目编码已存在');
              } else {
                that.dialog.show('新增成功');
                that.loadProjList(function () { this.dropdown.value(project._id) });
                modalWindow.hide();
              }
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
   * 修改项目信息
   */
  modProjConfEvent: function () {
    var that = this;
    var modalWindow = new ModalWindow({
      title: "修改项目配置",
      url: "addProjConf.html",
      width: 600,
      height: 50,
      data: that.curProj,
      buttons: [{
        name: "保存",
        class: "btn-primary",
        event: function () {
          that.loadUI.show();
          var project = this.value();
          that.curProj.projName = project.projName;
          that.curProj.projCode = project.projCode;
          $.post("/config/updateDeploy", that.curProj, function (data, status, xhr) {
            if (status == 'success') {
              that.dialog.show('修改成功');
              that.loadProjList(function () { that.dropdown.value(project._id) });
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
   * 删除项目配置事件.
  */
  delProjConfEvent: function () {
    var that = this;
    var modalWindow = new ModalWindow({
      title: "删除项目配置",
      body: "<div>删除项目配置后，该项目相应的图片配置也一并删除，你确定删除吗？</div>",
      width: 500,
      height: 40,
      buttons: [{
        name: "确定",
        class: "btn-primary",
        event: function () {
          that.loadUI.show();
          $.post("/config/deleteDeploy", that.curProj, function (data, status, xhr) {
            that.loadUI.hide();
            if (status == 'success') {
              that.dialog.show('删除成功');
              that.loadProjList(function () {
                that.projects.length > 0 ? that.dropdown.value(that.projects[0]._id) : that.loadProjInfo();
              });
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
  /**
     * 新增图片配置事件.
    */
  addImageConfEvent: function () {
    var that = this;
    var modalWindow = new ModalWindow({
      title: "新增图片配置",
      url: "addImageConf.html",
      width: 850,
      height: 50,
      buttons: [{
        name: "新增",
        class: "btn-primary",
        event: function () {
          var image = this.value();
          if (Util.isEmpty(image.code)) {
            return that.dialog.show('图片编码为必填项');
          }
          that.loadUI.show();
          image.project = that.curProj._id;
          image._id = Util.uuid(24, 16).toLowerCase();
          image.type = "image";
          $.post("/config/saveDeploy", image, function (data, status, xhr) {
            if (status == 'success') {
              if (data == "exist") {
                that.dialog.show('图片编码已存在');
              } else {
                that.dialog.show('新增成功');
                that.images.push(image);
                that.imageTable.value(that.images);
                that.imageTable.select(that.images.length - 1);
                that.buttonControl();
                modalWindow.hide();
              }
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
   * 修改图片配置
   */
  modImageConfEvent: function () {
    var that = this;
    var image = that.imageTable.select();
    var modImage = that.images.filter(function (im) {return im.code == image.code})[0];
    var modalWindow = new ModalWindow({
      title: "修改图片配置",
      url: "updateImageConf.html",
      width: 850,
      height: 450,
      data: image,
      params: modImage,
      buttons: [{
        name: "保存",
        class: "btn-primary",
        event: function () {
          var image = this.value();
          if (Util.isEmpty(image.code)) {
            return that.dialog.show('项目编码为必填项');
          }
          that.loadUI.show();
          modImage.code = image.code;
          modImage.d_url = image.d_url;
          modImage.s_url = image.s_url;
          $.post("/config/updateDeploy", modImage, function (data, status, xhr) {
            if (status == 'success') {
              that.dialog.show('修改成功');
              that.imageTable.asyncData(that.images);
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
    * 删除图片配置事件.
    */
  delImageConfEvent: function () {
    var that = this;
    var modalWindow = new ModalWindow({
      title: "删除图片配置",
      body: "<div>删除图片配置后，该图片配置的分块及字段配置也一并删除，你确定删除吗？</div>",
      width: 500,
      height: 40,
      buttons: [{
        name: "确定",
        class: "btn-primary",
        event: function () {
          var image = that.imageTable.select();
          var index = 0;
          var delImage = that.images.filter(function (im, i) {
            if (im.code == image.code) {
              index = i;
              return true;
            }
            return false;
          })[0];
          $.post("/config/deleteDeploy", delImage, function (data, status, xhr) {
            that.loadUI.hide();
            if (status == 'success') {
              that.dialog.show('删除成功');
              that.imageTable.remove(index);
              that.images = [].concat(that.images.slice(0, index), that.images.slice(index + 1));
              that.buttonControl();
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

window.onload = function () {
  projectConfig = new ProjectConfig();
  projectConfig.init();
  projectConfig.initPage();
}