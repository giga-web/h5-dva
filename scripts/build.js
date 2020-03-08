// 开源-工具
const fs = require('fs-extra');

// 打包工具
const webpack = require('webpack');

// 打包工具-生产配置
const config = require('./config/webpack.config.prod.js');

// 自研-工具
const paths = require('./util/paths');


// ============================================================
// 清空构建目录
fs.emptyDirSync(paths.BuildDir);

// 复制 public 目录中除 index.html 文件外的其他内容到构建目录
fs.copySync(paths.PublicDir, paths.BuildDir, {
  dereference: true,
  filter: file => file !== paths.IndexHtml,
});
// ============================================================


// ============================================================
// 创建编译对象
const compiler = webpack(config);

// 运行编译对象
compiler.run((err, stats) => { // Stats Object
  if (err) {
    console.error(err.stack || err);
    if (err.details) {
      console.error(err.details);
    }
    return;
  }

  const info = stats.toJson();

  if (stats.hasErrors()) {
    console.error(info.errors);
  }

  if (stats.hasWarnings()) {
    console.warn(info.warnings);
  }

  // Log result...
  console.log(stats.toString({
    chunks: false,  // Makes the build much quieter
    colors: true    // Shows colors in the console
  }));
});
// ============================================================