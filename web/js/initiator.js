if ($) {
  $.namespace = function () {
    var a = arguments, o = null, i, j, d;
    for (i = 0; i < a.length; i = i + 1) {
      d = a[i].split(".");
      o = window;
      for (j = 0; j < d.length; j = j + 1) {
        o[d[j]] = o[d[j]] || {};
        o = o[d[j]];
      }
    }
    return o;
  };
}

function Util() { }
Util.uuid = function (len, radix) {
  var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
  var uuid = [], i;
  radix = radix || chars.length;

  if (len) {
    // Compact form
    for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
  } else {
    // rfc4122, version 4 form
    var r;

    // rfc4122 requires these characters
    uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
    uuid[14] = '4';

    // Fill in random data.  At i==19 set the high bits of clock sequence as
    // per rfc4122, sec. 4.1.5
    for (i = 0; i < 36; i++) {
      if (!uuid[i]) {
        r = 0 | Math.random() * 16;
        uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
      }
    }
  }
  return uuid.join('');
}
Util.isEmpty = function (t) {
  if (t === undefined || t === null || t === "") {
    return true;
  }
  if (Array.isArray(t) && t.length == 0) {
    return true;
  }
  if (t instanceof Object && Object.keys(t).length == 0) {
    return true;
  }
  return false;
}

function LoadUI(target) {
  this.target = target ? target : window.top;
  this.loader = $("<div class='ic-LoadUI'><img src='../images/loading.gif'></div>");
  this.loader.width($(this.target.document).width());
  this.loader.height($(this.target.document).height());
}
LoadUI.prototype = {
  show: function () {
    $(this.target.document.body).append(this.loader);
  },
  hide: function () {
    this.loader.remove();
  }
}

function Dialog(target) {
  this.target = target ? target : window.top;
  this.loader = $("<div class='ic-Dialog'></div>");
}
Dialog.prototype = {
  show: function (msg) {
    var that = this;
    this.loader.text(msg);
    $(this.target.document.body).append(this.loader);
    var time1 = null;
    var time2 = null;
    var fun = function () {
      var count1 = 0;
      var count2 = 0;
      time1 = that.target.setInterval(function () {
        count1++;
        if (count1 == 4) {
          time2 = that.target.setInterval(function () {
            count2++;
            that.loader.css("opacity", that.loader.css("opacity") - 0.1);
            if (count2 == 10) {
              that.loader.remove();
              that.loader.css("opacity", 1);
              that.target.clearInterval(time2);
            }
          }, 200);
          that.target.clearInterval(time1);
        }
      }, 1000);
    }
    this.loader.mouseover(function () {
      that.target.clearInterval(time1);
      that.target.clearInterval(time2);
      that.loader.css("opacity", 1);
    });
    this.loader.mouseout(function () {
      fun.call(that);
    });
    fun.call(this);
  }
}

function ModalWindow(options) {
  if (!options) {
    throw "constructor ModalWindow error the options is undefined or null"
  };
  var that = this;
  var html = '<div class="modal fade" tabindex="-1" role="dialog">'
    + '<div class="modal-dialog" role="document">'
    + '<div class="modal-content">'
    + '<div class="modal-header">'
    + '</div>'
    + '<div class="modal-body">'
    + '</div>'
    + '<div class="modal-footer">'
    + '</div>'
    + '</div>'
    + '</div>'
    + '</div>';
  this.$modal = $(html);
  this.$modal.on("hidden.bs.modal", function () {
    that.$modal.remove();
  });
  this.target = options.window ? options.window : window;
  $(this.target.document.body).append(this.$modal);

  var $html = null;
  if (options.close == undefined || options.close == null || options.close) {
    html = '<button type="button" class="close" data-dismiss="modal" aria-label="Close">'
      + '<span aria-hidden="true">&times;</span>'
      + '</button>';
    $html = $(html);
    that.$modal.find(".modal-header").append($html);
  }
  if (options.title) {
    html = '<h4 class="modal-title">' + options.title + '</h4>';
  } else {
    html = '<h4 class="modal-title">新建窗口</h4>';
  }
  $html = $(html);
  that.$modal.find(".modal-header").append($html);
  if (options.buttons) {
    options.buttons.forEach(function (button) {
      html = '<button type="button" class="btn ' + button['class'] + '">' + button.name + '</button>';
      $html = $(html);
      $html.bind("click", $.proxy(button.event, that));
      that.$modal.find(".modal-footer").append($html);
    });
  }
  options.width && that.$modal.find(".modal-dialog").width(options.width);
  this.resize = function() {
    if (options.maximize) {
      that.$modal.css("padding", "0px");
      that.$modal.css("margin", "0px");
      that.$modal.find(".modal-dialog").css("padding", "0px");
      that.$modal.find(".modal-dialog").css("margin", "0px");
      that.$modal.find(".modal-dialog").width($(this.target.document).width());
      var height = $(this.target.document).height() - that.$modal.find(".modal-header").height() -
        that.$modal.find(".modal-footer").height();
      that.$modal.find(".modal-body").children().height(height - 32);
    }
  }
  if (options.url) {
    html = '<div class="embed-responsive">'
      + '<iframe class="embed-responsive-item" src=""></iframe>'
      + '</div>';
    $html = $(html);
    if (options.height) {
      $html.height(options.height);
    } else {
      $html.addClass("embed-responsive-16by9");
    }
    $html.find("iframe").attr("src", options.url);
    $html.find("iframe")[0].onload = function () {
      that.contentWindow = $html.find("iframe")[0].contentWindow;
      if (options.data) that.value(options.data);
      that.$modal.on("shown.bs.modal", function () {
        that.resize();
        that.contentWindow.initPage && that.contentWindow.initPage(options.params);
      });
    }
    that.$modal.find(".modal-body").append($html);
  } else {
    html = options.body || "";
    $html = $(html);
    options.height && $html.height(options.height);
    that.$modal.find(".modal-body").append($html);
  }
}

ModalWindow.prototype = {
  value: function (_data) {
    var $body = $(this.contentWindow.document.body);
    if (!!_data) {
      for (key in _data) {
        $body.find("input[dataField=" + key + "]").val(_data[key]);
      }
    } else {
      _data = {};
      $body.find("input[dataField]").each(function () {
        _data[$(this).attr("dataField")] = $(this).val()
      });
      return _data;
    }
  },
  show: function () {
    this.$modal.modal("show");
  },
  hide: function () {
    this.$modal.modal("hide");
  }
}

$.fn.disabled = function() {
  $(this).attr("disabled", "");
}
$.fn.enabled = function() {
  $(this).removeAttr("disabled");
}

$.fn.dropMenu = function (options) {
  var backdrop, html, button, menu, initData;
  var that = this;
  that._id = "";
  html = '<button class="btn btn-default dropdown-toggle" type="button">'
    + '<span></span>'
    + '<span class="caret"></span>'
    + '</button>';
  button = $(html);
  options.width && button.width(options.width);
  button.bind("click", function () {
    if (!menu.css("display") || menu.css("display") != "block") {
      menu.css("display", "block")
      backdrop.show();
    } else {
      backdrop.hide();
      menu.css("display", "none")
    }
  });
  html = '<ul class="dropdown-menu"></ul>';
  menu = $(html);
  that.onChange = function () { }
  that.initData = initData = function (data) {
    var li = "";
    button.find("span:first").text("");
    menu.html("");
    if (!data || data.length == 0) {
      return;
    }
    that._id = data[0].id;
    button.find("span:first").text(data[0].text + " ");
    data.forEach(function (d) {
      li = '<li id=' + d.id + '><a href="#">' + d.text + '</a></li>'
      menu.append(li);
    });
    menu.find("li").bind('click', function () {
      that._id = this.id;
      button.find("span:first").text($(this).find('a').text() + " ");
      backdrop.hide();
      menu.css("display", "none");
      that.onChange(this.id);
    });
  }
  options.width && menu.width(options.width);
  options.height && menu.height(options.height);
  options.data && initData(options.data);
  backdrop = $('<div class="modal-backdrop"></div>');
  backdrop.css("opacity", 0);
  backdrop.css("z-index", 99);
  backdrop.bind("click", function () {
    $(this).hide();
    menu.css("display", "none");
  });
  $(document.body).append(backdrop);
  backdrop.hide();

  this.append(button);
  this.append(menu);
  that.value = function (_id) {
    if (_id) {
      menu.find("#" + _id).click();
    } else {
      return that._id
    }
  }
  return this;
}

$.fn.icTable = function (options) {
  var html, header, body;
  var that = this;
  this.css('overflow-y', 'auto');
  this.css('border', '1px solid #ccc');
  html = '<table class="table table-header"><thead><tr></tr></thead></table>';
  header = $(html);
  html = '<table class="table table-body"><thead><tr></tr></thead><tbody></tbody></table>';
  body = $(html);
  if (options.title) {
    html = '<th style="min-width: 40px;width: 50px;"><input value="序号"></th>';
    header.find('thead>tr').append(html);
    options.title.forEach(function (t) {
      html = '<th><input readonly value=' + t + '></th>';
      var $html = $(html);
      $html.css("min-width", t.length * 20);
      header.find('thead>tr').append($html);
    });
  }
  this.append(header);
  this.append(body);
  this.value = function (_datas) {
    if (arguments.length == 0) {
      _datas = [];
      body.find('tbody>tr').each(function () {
        var data = {}
        $(this).find('[datafield]').each(function () {
          data[$(this).attr("datafield")] = $(this).val();
        });
        _datas.push(data);
      });
      return _datas;
    } else {
      var $tr, value, func, $td;
      func = function (e) {
        body.find('.active').removeClass("active");
        $(this).addClass("active");
        that.onselectRow && that.onselectRow();
      }
      body.find('tbody').html("");
      _datas.forEach && _datas.forEach(function (data, i) {
        $tr = $('<tr></tr>');
        html = '<td style="min-width: 40px;width: 50px;"><input style="text-align: center;" readonly value=' + (i + 1) + '></td>';
        $tr.append(html);
        $.each(options.dataFields, function (j, key) {
          value = data[key] ? data[key] : "";
          html = '<td><input dataField=' + key + '></td>';
          $td = $(html);
          i == 0 && $td.css("min-width", header.find('th:eq(' + (j + 1) + ')').css("min-width"));
          $td.find("input").val(value);
          !options.editable && $td.find("input").attr("readonly", "");
          $tr.append($td);
        });
        $tr.bind("click", func);
        body.find('tbody').append($tr);
      });
      this.refresh();
    }
  }
  this.remove = function (index) {
    if (arguments.length == 0) {
      var active = body.find('.active');
    } else if (!Util.isEmpty(index)) {
      var active = body.find('tr:eq(' + (index + 1) + ')');
    }
    if (active) {
      if (active.next().length > 0) {
        this.select(index + 1);
      } else if (active.prev().length > 0) {
        this.select(index - 1);
      }
      active.nextAll().each(function() {
        $(this).find("input:first").val($(this).find("input:first").val() - 1);
      });
      active.remove();
      this.refresh();
    }
  }
  this.select = function (index) {
    if (arguments.length == 0) {
      var data = {}
      body.find('.active').find('[datafield]').each(function () {
        data[$(this).attr("datafield")] = $(this).val();
      });
      return data;
    } else if (!Util.isEmpty(index)) {
      var $tr = body.find('tbody>tr:eq(' + index + ')');
      $tr.length > 0 && $tr.click() && $tr[0].scrollIntoView();
    }
  }
  this.asyncData = function(_datas) {
    if(!!_datas) {
      $.each(options.dataFields, function (j, key) {
        body.find("[dataField=" + key + "]").each(function(i, td) {
          $(this).val(_datas[i][key]);
        });
      });
    }
  }
  this.refresh = function () {
    header.width(this[0].clientWidth);
    body.width(this[0].clientWidth - 1);
    body.css("margin-top", header.height());
    header.find('th:gt(0)').each(function () {
      $(this).width(body.find('td:eq(' + $(this).index() + ')').width());
    });
  }
  this.refresh();
  return this;
}
