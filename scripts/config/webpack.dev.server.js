// 自研-工具
const paths = require('../util/paths');

// 模拟数据
const mock = require('../mock');

module.exports = {
  // 主机
  host: 'localhost',

  // 端口
  port: 3400,

  // 自动打开默认浏览器
  open: true,

  // 内容库，逃生窗口，让开发服务器可以监听来自此处指定文件夹的内容（即非 webpack 的内容也可以监听）
  contentBase: paths.PublicDir,

  // 监听内容库
  // 默认情况下，来自 contentBase 的文件不会触发页面重新加载。
  watchContentBase: true,

  // 开启热模块加载
  hot: true,

  // 千万不要使用 / 来进行匹配，会导致 public 中的文件不能访问
  proxy: {
    '/icbp-php-web': {
      target: 'http://192.168.191.196:8082',
      changeOrigin: true
    },
    '/icbp-zuul': {
      target: 'http://192.168.191.196:8082',
      changeOrigin: true
    }
  },

  before: function(app, server, compiler) {
    Object.keys(mock).forEach(key => {
      const splited = key.split(' ');
      const method = splited[0].toLowerCase();
      const path = splited[1];
      const mockFn = mock[key];

      app[method](path, mockFn);
    });
  }
}