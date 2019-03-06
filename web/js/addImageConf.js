$.namespace("addImageConf");

AddImageConf = function() { }

AddImageConf.prototype = {
	loadUI: new LoadUI(),
	taskList: [],
	init: function() {

	},
	initPage: function() {
		this.dropdown = $("#taskList").dropMenu({
			code: "task",
			width: 150,
			height: 100
		});
		this.bindEvent();
	},
	bindEvent: function() {
		var that = this;
		this.dropdown.onChange = function(id) {
			var curTask = that.taskList.filter(function(t) {return id == t._id})[0];
			curTask && $(".input-group input[dataField='s_url']").val(curTask.path_name);
			curTask && $(".input-group input[dataField='task_name']").val(curTask.name);
		}
	},
	/**
		* 加载项目信息.
		*/
	loadTaskList: function (obj, callback) {
		var that = this;
		that.loadUI.show();
		$.post("/task/getTasks", {project: (obj.project || obj._id)}, function(data, status, xhr) {
			that.loadUI.hide();
			that.taskList = data ? data : [];
      if (status == "success") {
        var menu = [];
        that.taskList.forEach(function (proj) {
          menu.push({ id: proj._id, text: proj.name });
        });
        that.dropdown.initData(menu);
        obj.task && that.dropdown.value(obj.task);
        callback && callback.call(that);
      }
		});
	},
	addUploadInput : function(target, options) {
		if (!target) {
			return;
		}
		var loader = $(
			"<div class='input-group upload-input-group'>"
		+ "   <div class='input-group-addon custom-btn' style='cursor: pointer'>"
		+ "     <span></span>"
		+ '     <span class="glyphicon glyphicon-upload" aria-hidden="true"></span>'
		+ '   </div>'
		+ '   <input type="text" class="form-control" readonly dataField="img_path">'
		+ '   <span class="input-group-addon">条件</span>'
		+ '   <input type="text" class="form-control" dataField="filter">'
		+ '   <form action="" style="display: none">'
		+ '     <input type="file">'
		+ '   </form>'
		+ "</div>");
		var minus = $('<span class="input-group-addon custom-btn">'
		+ '     <span class="glyphicon glyphicon-minus" aria-hidden="true"></span>'
		+ '   </span>');
		minus.bind("click", function() {
			loader.remove();
		});
		if (!$("input[type='checkbox']")[0].checked) {
			minus.hide();
		}
		loader.append(minus);

		if (options) {
			options.name && loader.find("span:first").text(options.name);
		}
		loader.find("div:first").bind("click", function() {
			loader.find("form>input").click();
		});
		loader.find("form>input")[0].onchange = function() {
			var value = $(this).val();
			loader.find("input:first").val(value);
		}
		target.append(loader);
		return loader;
	},
	value: function(_data) {
		var that = this;
		if (!!_data) {
			$(".input-group input[dataField='type']").val(_data["type"]);
			$(".input-group input[dataField='code']").val(_data["code"]);
			$(".input-group input[dataField='task_name']").val(_data["task_name"]);
			$(".input-group input[dataField='d_url']").val(_data["d_url"]);
			$(".input-group input[dataField='s_url']").val(_data["s_url"]);
			$("input[type='checkbox']")[0].checked = _data.mult;
			_data.img_paths && _data.img_paths.forEach(function(c) {
				var up = that.addUploadInput($(".container"), {name: "图片样例"});
				up.find("input[dataField='img_path']").val(c.img_path);
				up.find("input[dataField='filter']").val(c.filter);
			});
		} else {
			_data = {};
			_data["type"] = $(".input-group input[dataField='type']").val();
			_data["code"] = $(".input-group input[dataField='code']").val();
			_data["task"] = that.dropdown.value();
			_data["task_name"] = $(".input-group input[dataField='task_name']").val();
			_data["d_url"] = $(".input-group input[dataField='d_url']").val();
			_data["s_url"] = $(".input-group input[dataField='s_url']").val();
			_data.mult = $("input[type='checkbox']")[0].checked;
			_data.img_paths = [];
			var index = 0;
			$(".input-group input[dataField='img_path']").each(function () {
				if ($(this).parent().css("display") !== "none") {
					_data.img_paths.push({
						img_path: $(this).val(),
						filter: $(".input-group input[dataField='filter']:eq(" + (index++) + ")").val()
					});
				}
			});
			return _data;
		}
	},
	initPageByTop: function (project) {
		var that = this;
		that.loadTaskList(project);
		if ($("input[type='checkbox']")[0].checked) {
			$("#plusBtn").show();
			$(".custom-btn .glyphicon-minus").parent().show();
			$(".upload-input-group").show();
		} else {
			$("#plusBtn").hide();
			$(".custom-btn .glyphicon-minus").parent().hide();
			$(".upload-input-group:gt(0)").hide();
		}
		$(".upload-input-group").length == 0 && that.addUploadInput($(".container"), {name: "图片样例"});
		$("input[type='checkbox']").parent().bind("click", function(e) {
			if (!$(e.target).is("input")) {
				$("input[type='checkbox']")[0].checked = !$("input[type='checkbox']")[0].checked;
			}
			if ($("input[type='checkbox']")[0].checked) {
				$("#plusBtn").show();
				$(".custom-btn .glyphicon-minus").parent().show();
				$(".upload-input-group").show();
			} else {
				$("#plusBtn").hide();
				$(".custom-btn .glyphicon-minus").parent().hide();
				$(".upload-input-group:gt(0)").hide();
			}
		});
		$("#plusBtn").bind("click", function() {
			that.addUploadInput($(".container"), {name: "图片样例"});
		});
	}
}

window.onload = function() {
	var addConf = new AddImageConf();
	addConf.init();
	addConf.initPage();
	window.value = $.proxy(addConf.value, addConf);
	window.initPage = $.proxy(addConf.initPageByTop, addConf);
}
