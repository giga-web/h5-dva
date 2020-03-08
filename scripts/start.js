// 打包工具
const webpack = require('webpack');
const webpackDevServer = require('webpack-dev-server');

// 打包工具-开发配置
const config = require('./config/webpack.config.dev.js');
const serverConfig = require('./config/webpack.dev.server.js');

// ============================================================
// 创建编译对象
const compiler = webpack(config);

// 创建开发服务器
const devServer = new webpackDevServer(compiler, serverConfig);

// 监听开发服务器
devServer.listen(serverConfig.port, serverConfig.host, err => {
  if (err) {
    return console.log(err);
  }
  console.log('Starting the development server...');
});
// ============================================================