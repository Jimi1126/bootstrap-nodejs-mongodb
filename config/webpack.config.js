var fs = require("fs");
var path = require("path");
var Uglify = require("uglifyjs-webpack-plugin");
var HtmlPlugin = require("html-webpack-plugin");
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var webpack = require("webpack");
var js_dir = path.resolve(__dirname, "../web/js");
var css_dir = path.resolve(__dirname, "../web/css");
var html_dir = path.resolve(__dirname, "../web/pages");

var website = {
  publicPath: "http://localhost:8090/"
}

var jss = fs.readdirSync(js_dir) || [];
var csss = fs.readdirSync(css_dir) || [];
var htmls = fs.readdirSync(html_dir) || [];

var js_map = {};
jss.forEach((jsnm) => {
  // if (/^(jquery|bootstrap)/.test(jsnm)) return;
  var nms = jsnm.split(/\./);
  nms.pop()
  js_map[nms.join(".")] = `${js_dir}\\${jsnm}`;
});
var css_plugins = [];
csss.forEach((csnm) => {
  css_plugins.push(new ExtractTextPlugin(`css/${csnm}`));
});
var html_plugins = [];
htmls.forEach((htnm) => {
  var options = {
    filename: `pages/${htnm}`,
    // chunks: ["initiator", htnm.split(/\./)[0]],
    chunks: [htnm.split(/\./)[0]],
    minify: { //对html文件进行压缩
      removeAttributeQuotes: true //是否去掉属性的双引号
    },
    hash: true, //为了开发中js有缓存效果，所有加入hash，这样可以有效避免缓存js
    chunksSortMode: 'manual',//将chunks按引入的顺序排序,不用这个的话,引入到html的JS可能是错乱排序的
    template: `${html_dir}\\${htnm}`
  };
  // if (/index\.html/.test(htnm)) {
  //   options.chunks.shift();
  // }
  html_plugins.push(new HtmlPlugin(options));
});

module.exports = {
  mode: "development",
  entry: js_map,
  output: {
    path: path.resolve(__dirname, "../dist"),
    filename: "js/[name].bundle.js",
    publicPath: website.publicPath //主要作用就是处理静态文件路径的
  },
  module: {
    rules: [{
      test: require.resolve("jquery"),
      use: [
        {
          loader: "expose-loader",
          options: "$"
        },
        {
          loader: "expose-loader",
          options: "jQuery"
        }
      ]
    },
    // {
    //   test: /initiator\.js/,
    //   use: [
    //     {
    //       loader: "expose-loader",
    //       options: "loadJs"
    //     },
    //     {
    //       loader: "expose-loader",
    //       options: "loadJsSync"
    //     },
    //     {
    //       loader: "expose-loader",
    //       options: "closeWindow"
    //     },
    //     {
    //       loader: "expose-loader",
    //       options: "Util"
    //     },
    //     {
    //       loader: "expose-loader",
    //       options: "LoadUI"
    //     },
    //     {
    //       loader: "expose-loader",
    //       options: "Dialog"
    //     },
    //     {
    //       loader: "expose-loader",
    //       options: "DetailDialog"
    //     },
    //     {
    //       loader: "expose-loader",
    //       options: "ModalWindow"
    //     },
    //     {
    //       loader: "expose-loader",
    //       options: "epcos"
    //     }
    //   ]
    // },
    {
      test: /\.(htm|html)$/i,
      use: [
        { loader: "html-withimg-loader" }
      ]
    },
    {
      test: /\.css$/,
      use: ExtractTextPlugin.extract({
        fallback: "style-loader",
        use: "css-loader"
      })
      // use: [
      //   {loader: "style-loader"},
      //   {loader: "css-loader"}
      // ]
    },
    {// bootstrap font-awesome
      test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,
      loader: 'url-loader',
      options: {
        limit: 10000,
        mimetype: 'application/font-woff',
        // 字体文件放置目录
        name: 'fonts/[name]_[hash].[ext]'
      }
    }, {// bootstrap
      test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
      loader: 'url-loader',
      options: {
        limit: 10000,
        mimetype: 'application/octet-stream',
        // 字体文件放置目录
        name: 'fonts/[name]_[hash].[ext]'
      }
    }, {// bootstrap
      test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
      loader: 'file-loader',
      options: {
        limit: 10000,
        // 字体文件放置目录
        name: 'fonts/[name]_[hash].[ext]'
      }
    }, {// bootstrap
      test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
      loader: 'url-loader',
      options: {
        limit: 10000,
        mimetype: 'application/image/svg+xml',
        // 字体文件放置目录
        name: 'fonts/[name]_[hash].[ext]'
      }
    }, {// font-awesome
      test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      loader: "file-loader",
      options: {
        limit: 10000,
        // 字体文件放置目录
        name: 'fonts/[name]_[hash].[ext]'
      }
    }
    ]
  },
  plugins: []
    .concat(
      new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery'
      })
    ).concat(
      new Uglify()
    ).concat(
      html_plugins
    ).concat(
      css_plugins
    ),
  //optimization与entry/plugins同级
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          name: "commons",
          chunks: "initial",
        }
      }
    }
  },
  externals: {
    initiator: "initiator"
  },
  devServer: {
    //设置基本目录结构
    contentBase: path.resolve(__dirname, "../dist"),
    //服务器的IP地址，可以使用IP也可以使用localhost
    host: "localhost",
    //服务端压缩是否开启
    compress: true,
    //配置服务端口号
    port: 8090
  }
}