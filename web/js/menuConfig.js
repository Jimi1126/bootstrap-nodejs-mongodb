$.namespace("menuConfig");

MenuConfig = function () { }

MenuConfig.prototype = {
  loadUI: new LoadUI(),
  dialog: new Dialog(),
  menuList: [],
  init: function () {
    this.initCompent();
    this.adjustUI();
  },
  initPage: function () {
    this.bindEvent();
    this.loadTableData();
  },
  /**
   * 自适应.
   */
  adjustUI: function () {
    this.mainTable && this.mainTable.setWidth(window.innerWidth - 40);
    this.mainTable && this.mainTable.setHeight(window.innerHeight - 165);
    this.mainTable.refresh();
  },
	/**
		* 初始化组件.
		*/
  initCompent: function () {
    var that = this;
    this.mainTable = $("#mainTable").icTable({
      rowNum: true,
      editable: false,
      height: 549,
      title: ["主键", "上级编码", "编码", "菜单名称", "窗口标题", "菜单类型", "打开方式类型", "链接", "状态", "创建时间"],
      dataFields: [
        {code: "_id", hidden: true},
        {code: "supcode", hidden: true},
        {code: "code", hidden: true},
        "name", "title",
        {code: "menu_type", dataType: "table_dropdown", editable: true, data: [{id:"1", text:"节点"}, {id:"2", text:"页面"}]},
        {code: "open_type", dataType: "table_dropdown", editable: true, data: [{id:"1", text:"当前页签"}, {id:"2", text:"新建页签"}]},
        "url",
        {code: "state", dataType: "table_dropdown", editable: true, data: [{id:"0", text:"启用"}, {id:"1", text:"停用"}]},
        {code: "create_at", hidden: true}
      ]
    });
  },
  /**
   * 事件绑定.
   */
  bindEvent: function () {
    var that = this;
    $("#addBtn").bind('click', function() {that.addOrModEvent()});
    $('#modBtn').bind('click', function() {that.addOrModEvent("modify")});
    $('#delBtn').bind('click', $.proxy(this.delBtnEvent, this));
    window.onresize = $.proxy(this.adjustUI, this);
    // $("#queryBtn").bind("click", $.proxy(this.loadTableData, this));
    $(".filter_group input[filter_code]").bind('input propertychange',function () {
      var exps = {};
      $(this).parent().find("input[filter_code]").each(function() {
        exps[$(this).attr("filter_code")] = new RegExp($(this).val());
      });
      that.mainTable.value(that.menuList.filter(function(item) {
        for (var code in exps) {
          if (!exps[code].test(item[code])) {
            return false;
          }
        }
        return true;
      }));
    });
  },
	/**
		* 加载表格.
		*/
  loadTableData: function () {
    var that = this;
    that.loadUI.show();
    var param = {
      filter: { type: "menu" }
    }
    $("input[query_code]").each(function () {
      $(this).val() && (param.filter[$(this).attr("query_code")] = $(this).val());
    });
    $.post("/sysconf/getList", param, function (data, status, xhr) {
      that.loadUI.hide();
      if (status == "success") {
        that.menuList = data || [];
        that.mainTable.value(that.menuList);
        that.mainTable.select(0);
      }
    });
  },
  /**
   * 新增、修改按钮事件.
   */
  addOrModEvent: function (flag) {
    var that = this, modalWindow, cur_data;
    cur_data  = that.mainTable.select();
    modalWindow = new ModalWindow({
      title: `${!flag ? "新增菜单" : "修改菜单"}`,
      body: `<div>
      <div class="input-group">
        <span class="input-group-addon">菜单名称</span>
        <input type="text" class="form-control" datafield= "name">
      </div>
      <div class="input-group" style="margin-top: 14px;">
        <span class="input-group-addon">菜单类型</span>
        <div class="dropdown" target= "menu_type"></div>
        <span class="input-group-addon">上级菜单</span>
        <div class="dropdown" target= "supcode"></div>
        <input style="display:none" type="text" class="form-control" datafield= "code">
      </div>
      <div class="input-group" style="margin-top: 14px;">
        <span class="input-group-addon">打开方式</span>
        <div class="dropdown" target="open_type"></div>
        <span class="input-group-addon">菜单状态</span>
        <div class="dropdown" target="state"></div>
      </div>
      <div class="input-group" style="margin-top: 14px;">
        <span class="input-group-addon">打开标题</span>
        <input type="text" class="form-control" datafield= "title">
        <span class="input-group-addon">菜单链接</span>
        <input type="text" class="form-control" datafield= "url">
      </div>
      </div>`,
      width: 500,
      height: 180,
      buttons: [{
        name: "取消",
        class: "btn-default",
        event: function () {
          this.hide();
        }
      }, {
        name: `${!flag ? "新增" : "修改"}`,
        class: "btn-primary",
        event: function () {
          var menu = this.value();
          if (Util.isEmpty(menu.name)) {
            return that.dialog.show('菜单名称为必填');
          }
          if (Util.isEmpty(menu.menu_type)) {
            return that.dialog.show('菜单类型为必填');
          }
          if (Util.isEmpty(menu.supcode)) {
            return that.dialog.show('上级菜单为必填');
          }
          if (menu.menu_type == 2 && Util.isEmpty(menu.url)) {
            return that.dialog.show('页面菜单类型，链接为必填');
          }
          that.loadUI.show();
          menu._id = Util.uuid(24, 16);
          menu.open_type = menu.open_type || 2;
          menu.title = menu.title || menu.name;
          menu.type = "menu";
          flag && (menu._id = cur_data._id);
          menu.create_at = flag ? cur_data.create_at : Util.getBitDate();
          if (menu.menu_type == 1) {
            menu.open_type = "";
            menu.title = "";
            menu.url = "";
          }
          var max = 0;
          var cur = 0;
          if (!(flag && cur_data.supcode == menu.supcode)) {
            that.menuList.forEach(function(me) {
              if (me.code.length == (menu.supcode.length + 2) && me.code.startsWith(menu.supcode)) {
                cur = +me.code.substr(menu.supcode.length, 2);
                max = max > cur ? max : cur;
              }
            });
            menu.code = menu.supcode + Util.LPAD(max + 1, 2, 0);
          }
          var url = flag ? "/sysconf/update" : "/sysconf/add";
          $.post(url, menu, function (data, status, xhr) {
            that.loadUI.hide();
            if (status == 'success' && !data) {
              that.dialog.show('操作成功');
              !flag && that.menuList.push(menu);
              flag && (that.menuList[that.menuList.findIndex(function(me) {return me._id == menu._id})] = menu);
              that.mainTable.value(that.menuList);
              that.mainTable.select(0);
              modalWindow.hide();
            } else {
              that.dialog.show('操作失败');
            }
          });
        }
      }]
    });
    var $menu_type = modalWindow.$modal.find("div[target='menu_type']").dropMenu({
      code: "menu_type",
      width: 152,
      data:[{id: "1", text: "节点"}, {id: "2", text: "页面"}]
    });
    var $supcode = modalWindow.$modal.find("div[target='supcode']").dropMenu({
      code: "supcode",
      width: 152,
      data: [{id:"01", text:"根节点"}].concat(that.menuList.filter(function(me) {
        return !me.url
      }).map(function(me) {
        return {id : me.code, text: me.name}
      }))
    });
    var $open_type = modalWindow.$modal.find("div[target='open_type']").dropMenu({
      code: "open_type",
      width: 152,
      data:[{id: "1", text: "当前页签"}, {id: "2", text: "新建页签"}]
    });
    var $state = modalWindow.$modal.find("div[target='state']").dropMenu({
      code: "state",
      width: 152,
      data:[{id: "0", text: "启用"}, {id: "1", text: "停用"}]
    });
    $menu_type.onChange = function(new_num) {
      if (new_num == 1) {
        $open_type.find("button").disabled();
        modalWindow.$modal.find("input[datafield='title']").disabled();
        modalWindow.$modal.find("input[datafield='url']").disabled();
      } else {
        $open_type.find("button").enabled();
        modalWindow.$modal.find("input[datafield='title']").enabled();
        modalWindow.$modal.find("input[datafield='url']").enabled();
      }
    }
    $state.value("0");
    $menu_type.value("1");
    if (cur_data && cur_data.menu_type == 1) {
      $menu_type.value("2");
      $supcode.value(cur_data.code);
    }
    if (flag) {
      $state.value(cur_data.state);
      $menu_type.value(cur_data.menu_type);
      $supcode.value(cur_data.supcode);
      $open_type.value(cur_data.open_type);
      modalWindow.value(cur_data);
      if (cur_data.menu_type == 1 && that.menuList.some(function(me) {return me.supcode.startsWith(cur_data.code)})) {
        $menu_type.find("button").disabled();
      }
    }
    modalWindow.show();
    modalWindow.$modal.on("shown.bs.modal", function () {
      modalWindow.$modal.find("input[datafield='name']").focus();
    });
  },
  /**
   * 删除事件.
   */
  delBtnEvent: function () {
    var that = this, cur_data;
    cur_data  = that.mainTable.select();
    var modalWindow = new ModalWindow({
      title: "删除菜单",
      body: `<div>请确认是否删除【${cur_data.name}】菜单</div>`,
      close: true,
      width: 400,
      height: 60,
      buttons: [{
        name: "确认",
        class: "btn-primary",
        event: function() {
          that.loadUI.show();
          $.post("/sysconf/delete", cur_data, function (data, status, xhr) {
            that.loadUI.hide();
            if (status == 'success' && !data) {
              that.menuList.splice(that.menuList.findIndex(function(me) {return me._id == cur_data._id}), 1);
              that.mainTable.value(that.menuList);
              that.mainTable.select(0);
              that.dialog.show('删除成功');
              modalWindow.hide();
            } else {
              that.dialog.show('删除失败');
            }
          });
        }
      }]
    });
    modalWindow.show();
  },
  /**
   * 停启用事件.
   */
  stopBtnEvent: function () {

  },
  /**
    * 权限设置.
    */
  authBtnEvent: function () {
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
      }, {
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
      { projCode: 1, projName: "管理", funcCode: 1, funcName: "统计报表" },
      { projCode: 1, projName: "管理", funcCode: 1, funcName: "权限管理" }
    ];
    that.funcs = [
      { funcCode: 1, funcName: "新增" },
      { funcCode: 2, funcName: "分配" },
      { funcCode: 3, funcName: "合并" }
    ];
    that.projects && that.projects.forEach(function (pro) {
      that.funcs && that.funcs.forEach(function (func) {
        roleList.push({
          projCode: pro.projCode,
          projName: pro.projName,
          funcCode: func.funcCode,
          funcName: func.funcName
        });
      });
    });
    modalWindow.$modal.on("shown.bs.modal", function () {
      mainTable.refresh();
      mainTable.value(roleList);
      modalWindow.$modal.find("input[code]").bind('input propertychange', function () {
        var proj_exp = new RegExp(modalWindow.$modal.find(`input[code="projName"]`).val());
        var func_exp = new RegExp(modalWindow.$modal.find(`input[code="funcName"]`).val());
        mainTable.value(roleList.filter(function (ro) {
          return proj_exp.test(ro.projName) && func_exp.test(ro.funcName);
        }));
      });
    });
  },
}
window.onload = function () {
  var menuConfig = new MenuConfig();
  menuConfig.init();
  menuConfig.initPage();
}
