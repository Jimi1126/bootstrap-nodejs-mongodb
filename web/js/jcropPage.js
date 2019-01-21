$.namespace("jcropPage");
var JcropPage = function() {}

JcropPage.prototype = {
  loadUI: new LoadUI(),
  dialog: new Dialog(),
  target: {},
  jcrop_api: {},
  init: function() {
  },
  initPage: function() {
    this.adjustUI();
    this.bindEvent();
    if (this.target && this.target.img_path) {
      $("#element_id").attr("src", this.target.img_path.replace("web", ".."));
      this.initJcrop();
    }
  },
  adjustUI: function () {
    $(".body-content:last").children().height(window.innerHeight - $(".body-content:first").height() - 18);
  },
  bindEvent: function() {

  },
  initJcrop: function() {
    var that = this;
    $('#element_id').Jcrop({
      onChange: that.showCoords,
      onSelect: that.showCoords,
      onRelease: that.clearCoords
    }, function () {
      that.jcrop_api = this;
      that.jcrop_api.setSelect([
        $("input[dataField='x0']").val(),
        $("input[dataField='y0']").val(),
        $("input[dataField='x1']").val(),
        $("input[dataField='y1']").val()
      ]);
    });
  },
  showCoords: function (c) {
    $("input[dataField='x0']").val(c.x);
    $("input[dataField='y0']").val(c.y);
    $("input[dataField='x1']").val(c.x2);
    $("input[dataField='y1']").val(c.y2);
    $("input[dataField='w']").val(c.w);
    $("input[dataField='h']").val(c.h);
  },
  clearCoords: function () {
    $("input[dataField]:gt(1)").val("");
  }
}

window.initPage = function (params) {
  jcropPage = new JcropPage();
  jcropPage.target = params;
  jcropPage.init();
  jcropPage.initPage();
}