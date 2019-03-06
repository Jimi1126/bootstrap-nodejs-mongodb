$.namespace("projectConfig");

ProjectConfig = function () { }

ProjectConfig.prototype = {
  loadUI: new LoadUI(),
  dialog: new Dialog(),
  detailWin: null,
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
    this.initComponent();
    this.adjustUI();
    this.loadProjList(function () {
      this.projects.length > 0 ? this.dropdown.value(this.projects[0]._id) : this.loadProjInfo();
    });
    this.bindEvent();
    this.loadUI.hide();
  },
  initComponent: function () {
    var that = this;
    this.dropdown = $("#projectList").dropMenu({
      width: 120,
      height: 100
    });
    this.dropdown.onChange = function (id) {
      that.loadProjInfo(that.projects.filter(function (p) { return p._id == id })[0]);
    }
    this.imageTable = $("#imageTable").icTable({
      title: ["业务名称", "配置编码", "图片下载地址", "图片保存地址"],
      dataFields: ["task_name", "code", "d_url", "s_url"]
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
    $('#enter_cof').bind('click', $.proxy(this.enterConfEvent, this));
    $('#down_parse').bind('click', $.proxy(this.downParseEvent, this));
    window.onresize = this.adjustUI;
    this.imageTable.onDbClickRow = $.proxy(this.billAndFieldConfEvent, this);
  },
  /**
   * 按钮控制.
   */
  buttonControl: function () {
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
        that.projects.forEach(function (proj) {
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
      data: {projCode: "PR" + Util.getBitDate()},
      width: 600,
      height: 50,
      backdrop: "static",
      keyboard: false,
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
          project.state = 1 //启用
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
      backdrop: "static",
      keyboard: false,
      data: that.curProj,
      buttons: [{
        name: "保存",
        class: "btn-primary",
        event: function () {
          that.loadUI.show();
          var project = this.value();
          if (Util.isEmpty(project.projName)) {
            return that.dialog.show('项目名称为必填项');
          }
          if (Util.isEmpty(project.projCode)) {
            return that.dialog.show('项目编码为必填项');
          }
          var doUpdate = function () {
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
          if (that.curProj.projCode != project.projCode) {
            var param = {
              from: "web\\images\\template\\" + that.curProj.projCode,
              to: "web\\images\\template\\" + project.projCode
            }
            $.get("/config/moddir", param, function (data, status, xhr) {
              if (status == 'success') {
                modImage.img_path = moddir;
                doUpdate();
              } else {
                that.dialog.show('更新失败');
                that.loadUI.hide();
              }
            });
          } else {
            doUpdate();
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
   * 删除项目配置事件.
  */
  delProjConfEvent: function () {
    var that = this;
    var modalWindow = new ModalWindow({
      title: "删除项目配置",
      body: "<div>删除项目配置后，该项目相应的图片、分块、字段配置将一并删除，你确定删除吗？</div>",
      width: 500,
      height: 40,
      buttons: [{
        name: "确定",
        class: "btn-primary",
        event: function () {
          that.loadUI.show();
          var doDel = function () {
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
          var param = {
            path: "web\\images\\template\\" + that.curProj.projCode
          };
          $.post("/config/delFile", param, function (data, status, xhr) {
            if (status == "success") {
              doDel();
            } else {
              that.dialog.show('删除失败');
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
     * 新增图片配置事件.
    */
  addImageConfEvent: function () {
    var that = this;
    var modalWindow = new ModalWindow({
      title: "新增图片配置",
      url: "addImageConf.html",
      width: 850,
      height: 210,
      data: {code: "IM" + Util.getBitDate()},
      params: that.curProj,
      backdrop: "static",
      keyboard: false,
      buttons: [{
        name: "新增",
        class: "btn-primary",
        event: function () {
          var image = this.value();
          if (Util.isEmpty(image.code)) {
            return that.dialog.show('图片编码为必填项');
          }
          that.loadUI.show();
          var doSave = function () {
            image.project = that.curProj._id;
            image._id = Util.uuid(24, 16).toLowerCase();
            image.state = 1 //启用
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
          var progress = 0;
          var failed = false;
          var that1 = this;
          image.img_paths.forEach(function(im, i) {
            if(!im.img_path) return;
            var file = that1.contentWindow.$("form>input")[i].files;
            var form = new FormData();
            form.append("dir", that.curProj.projCode + "/" + image.code);
            var filename = image.code + "_" + i + file[0].name.substring(file[0].name.indexOf("."));
            form.append("filename", filename);
            form.append("file", file[0]);
            var xhr = new XMLHttpRequest();
            xhr.open("post", "/config/uploadFile", true);
            xhr.send(form);
            xhr.onreadystatechange = function () {
              var result = xhr;
              if (result.readyState == 4) { //finished
                failed = result.status != 200
                im.img_path = JSON.parse(result.responseText);
                progress++;
              }
            }
          });
          var time = window.setInterval(function () {
            if (!image.img_paths[0].img_path) {
              window.clearInterval(time);
              doSave();
            } else if (progress >= image.img_paths.length) {
              window.clearInterval(time);
              if (failed) {
                that.dialog.show('上传图片失败');
                that.loadUI.hide();
              } else {
                doSave();
              }
            }
          }, 200);
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
    var modImage = that.images.filter(function (im) { return im.code == image.code })[0];
    modImage.img_paths = modImage.img_paths || [];
    modImage.projName = that.curProj.projName;
    var modalWindow = new ModalWindow({
      title: "修改图片配置",
      url: "addImageConf.html",
      width: 850,
      height: 210,
      data: modImage,
      params: modImage,
      backdrop: "static",
      keyboard: false,
      buttons: [{
        name: "保存",
        class: "btn-primary",
        event: function () {
          var image = this.value();
          if (Util.isEmpty(image.code)) {
            return that.dialog.show('项目编码为必填项');
          }
          that.loadUI.show();

          var that1 = this;
          var doUpdate = function () {
            modImage.code = image.code;
            modImage.mult = image.mult;
            modImage.task = image.task;
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
          
          var doUpdateFile = function() {
            var progress = 0;
            var total = 0;
            var failed = false;
            modImage.img_paths = []
            image.img_paths.forEach(function(im, i) {
              if (!im.img_path) return;
              modImage.img_paths.push(im);
              if (im.img_path.startsWith("web")) {
                return;
              }
              total++;
              var file = that1.contentWindow.$("form>input")[i].files;
              var form = new FormData();
              form.append("dir", that.curProj.projCode + "/" + image.code);
              var filename = image.code + "_" + i + file[0].name.substring(file[0].name.indexOf("."));
              form.append("filename", filename);
              form.append("file", file[0]);
              var xhr = new XMLHttpRequest();
              xhr.open("post", "/config/uploadFile", true);
              xhr.send(form);
              xhr.onreadystatechange = function () {
                var result = xhr;
                if (result.readyState == 4) { //finished
                  failed = result.status != 200
                  im.img_path = JSON.parse(result.responseText);
                  progress++;
                }
              }
            });
            var time = window.setInterval(function () {
              if (modImage.img_paths.length == 0) {
                doUpdate();
              }
              if (progress >= total) {
                window.clearInterval(time);
                if (failed) {
                  that.dialog.show('上传图片失败');
                  that.loadUI.hide();
                } else {
                  doUpdate();
                }
              }
            }, 200);
          }

          var doDelFile = function() {
            var delFile = [];
            modImage.img_paths.forEach(function(mmp) {
              image.img_paths.filter(function(mp) {return mp.img_path == mmp.img_path}).length == 0 && mmp.img_path && delFile.push(mmp.img_path);
            });
            if (delFile.length == 0) {
              return doUpdateFile();
            }
            $.post("/config/delImageTempl", { img: modImage, delFile: delFile }, function (data, status, xhr) {
              if (status == 'success') {
                if (data == 'error') {
                  that.dialog.show('更新失败');
                  that.loadUI.hide();
                } else {
                  doUpdateFile();
                }
              } else {
                that.dialog.show('更新失败');
                that.loadUI.hide();
              }
            });
          }

          if (modImage.img_paths.length > 0 && modImage.code != image.code) {
            var arr = modImage.img_paths[0].img_path.split("\\");
            arr[arr.length-2] = image.code;
            arr[arr.length-1] = image.code + "_0." + arr[arr.length-1].split(".")[1];
            var moddir = arr.join("\\");
            $.get("/config/moddir", { from: modImage.img_path, to: moddir }, function (data, status, xhr) {
              if (status == 'success') {
                if (data == 'exist') {
                  that.dialog.show('图片编码已存在');
                  that.loadUI.hide();
                } else {
                  doDelFile();
                }
              } else {
                that.dialog.show('更新失败');
                that.loadUI.hide();
              }
            });
          } else {
            doDelFile();
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
   * 图片分块以及字段配置
   */
  billAndFieldConfEvent: function () {
    var that = this;
    var image = that.imageTable.select();
    var modImage = that.images.filter(function (im) { return im.code == image.code })[0];
    modImage.projName = that.curProj.projName;
    var modalWindow = new ModalWindow({
      title: "修改图片配置",
      url: "updateImageConf.html",
      width: 850,
      height: 450,
      data: modImage,
      params: modImage,
      keyboard: false,
      buttons: [{
        name: "关闭",
        class: "btn-primary",
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
      body: "<div>删除图片配置后，该图片配置的分块、字段配置将一并删除，你确定删除吗？</div>",
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
          that.loadUI.show();
          var doDel = function () {
            $.post("/config/deleteDeploy", delImage, function (data, status, xhr) {
              if (status == 'success') {
                that.dialog.show('删除成功');
                that.imageTable.remove(index);
                that.images = [].concat(that.images.slice(0, index), that.images.slice(index + 1));
                that.buttonControl();
                modalWindow.hide();
              } else {
                that.dialog.show('删除失败');
              }
              that.loadUI.hide();
            });
          }
          if (delImage.img_paths && delImage.img_paths[0]) {
            var arr = delImage.img_paths[0].img_path.split("\\");
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
  enterConfEvent: function() {
    var that = this;
    var image = that.imageTable.select();
    if (Object.keys(image).length == 0) return;
    var modImage = that.images.filter(function (im) { return im.code == image.code })[0];
    modImage.projName = that.curProj.projName;
    var modalWindow = new ModalWindow({
      title: "录入配置",
      url: "enterConf.html",
      close: false,
      maximize: true,
      width: 1000,
      height: 500,
      params: modImage,
      buttons: [{
        name: "关闭",
        class: "btn-primary",
        event: function () {
          this.hide();
        }
      }]
    });
    modalWindow.show();
  },
  /**
   * 下载与解析.
   */
  downParseEvent: function() {
    var that = this;
    if (that.detailWin) {
      return that.detailWin.show();
    }
    var image = that.imageTable.select();
    var curImage = that.images.filter(function (im) { return im.code == image.code })[0];
    var modalWindow = new ModalWindow({
      title: "下载与解析",
      body: `<div>将进行[${image.task_name}]业务所需的图像下载与解析，系统暂未提供二次切图，
      请确保所选业务所需的录入分块、字段均已配置，点击确认以继续。</div>`,
      close: true,
      width: 500,
      height: 60,
      buttons: [{
        name: "关闭",
        class: "btn-default",
        event: function () {
          this.hide();
        }
      },{
        name: "确认",
        class: "btn-primary",
        event: function() {
          this.hide();
          that.openUpdateWin(curImage);
        }
      }]
    });
    modalWindow.show();
  },
  /** 
   * 进行下载与解析.
   */
  openUpdateWin : function(curImage) {
    var that= this;
    var $progress = $(`<div class="progress" style="margin:0px;">
      <div class="progress-bar" role="progressbar" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100"></div>
      </div>`);
    that.detailWin = new DetailDialog({
      title: "操作进度",
      body: $progress,
      width: 420,
      height: 20,
      window: window,
      close: false,
      backdrop: false,
      keyboard: false,
      hideDetail: false,
      buttons: [{
        name: "后台运行",
        class: "btn-primary",
        event: function () {
          this.hide();
        }
      }]
    });
    that.detailWin.show();
    var index = 0;
    var length = 15;
    var bar = $progress.find(".progress-bar");
    bar.css("width", "0%");
    bar.text("0%");
    var progress = 0;
    socket.emit("startDownAndParse", curImage);
    socket.on("downAndParseProgress", function(isDone, con) {
      if (isDone == 1) {
        index++;
        progress = Math.floor(index * 100 / length);
        // progress = progress == 100 ? 99 : progress;
        bar.css("width", progress + "%");
        bar.text(progress + "%");
      }
      con && that.detailWin.appendDetail(con);
      if (isDone == "final") {
        socket.removeAllListeners("downAndParseProgress");
        that.detailWin.$modal.find(".btn.btn-primary").unbind("click").bind("click", function() {
          that.detailWin.hide();
          that.detailWin.$modal.remove();
          that.detailWin = null;
        }).text("关闭");
      }
    });
  },
}

window.onload = function () {
  projectConfig = new ProjectConfig();
  loadJs("/socket.io/socket.io.js", function() {
		socket = io.connect('http://192.168.3.69:8090');
	});
  projectConfig.init();
  projectConfig.initPage();
}