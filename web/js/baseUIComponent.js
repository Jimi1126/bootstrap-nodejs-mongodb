function LoadUI() {
  this.target = $(document.body);
  this.loader = $("<div><img src='../images/loading.gif'></div>");
  this.loader.width(document.documentElement.clientWidth);
  this.loader.height(document.documentElement.clientHeight);
  this.loader.css("top", "0");
  this.loader.css("left", "0");
  this.loader.css("position", "absolute");
  this.loader.css("text-align", "center");
  this.loader.css("line-height", document.documentElement.clientHeight + "px");
  this.loader.css("background-color", "#fff");
  this.loader.css("opacity", 0.4);
  this.loader.css("z-index", "9999");
}
LoadUI.prototype = {
  show: function() {
    this.target.append(this.loader);
  },
  hide: function() {
    this.loader.remove();
  }
}

function Dialog() {
  this.target = $(document.body);
  this.loader = $("<div></div>");
  this.loader.width(140);
  this.loader.css("bottom", "20px");
  this.loader.css("right", "16px");
  this.loader.css("padding", "8px");
  this.loader.css("position", "absolute");
  this.loader.css("text-align", "center");
  this.loader.css("color", "#000");
  this.loader.css("font-size", "14px");
  this.loader.css("background-color", "#e9ecef");
  this.loader.css("border-radius", "8px");
  this.loader.css("border", "1px solid #ccc");
  this.loader.css("opacity", 1);
  this.loader.css("z-index", "9999");
}
Dialog.prototype = {
  show: function (msg) {
    var that = this;
    this.loader.text(msg);
    this.target.append(this.loader);
    var time1 = null;
    var time2 = null;
    var fun = function () {
      var count1 = 0;
      var count2 = 0;
      time1 = window.setInterval(function () {
        count1++;
        if (count1 == 4) {
          time2 = window.setInterval(function() {
            count2++;
            that.loader.css("opacity", that.loader.css("opacity") - 0.1);
            if (count2 == 10) {
              that.loader.remove();
              that.loader.css("opacity", 1);
              window.clearInterval(time2);
            }
          }, 200);
          window.clearInterval(time1);
        }
      }, 1000);
    }
    this.loader.mouseover(function () {
      window.clearInterval(time1);
      window.clearInterval(time2);
      that.loader.css("opacity", 1);
    });
    this.loader.mouseout(function () {
      fun.call(that);
    });
    fun.call(this);
  }
}