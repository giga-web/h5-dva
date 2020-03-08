// Node接口
const fs = require('fs');
const path = require('path');

// 应用目录（以此为基础）
const RootDir = fs.realpathSync(process.cwd()); // "D:\sources\cold"

// 函数-解析应用路径
const resolvePath = (relativePath) => {
  return path.resolve(RootDir, relativePath);
}


// ============================================================
// 目录

// 公开的，公共的
const PublicDir = resolvePath('public'); // "D:\sources\cold\public"

// 本地库
const LibsDir = resolvePath('libs'); // "D:\sources\cold\libs"

// 源代码
const SrcDir = resolvePath('src'); // "D:\sources\cold\src"

// 构建目录
const BuildDir = resolvePath('build'); // "D:\sources\cold\build"

// 开源库
const NodeModulesDir = resolvePath('node_modules'); // "D:\sources\cold\node_modules"

// 模拟数据
const MockDir = resolvePath('mock');

// ============================================================


// ============================================================
// 文件

// package.json
const PackageJson = resolvePath('package.json'); // "D:\sources\cold\package.json"

// 首页模板
const IndexHtml = resolvePath('public/index.html'); // "D:\sources\cold\public\index.html"

// 首页入口
const IndexJs = resolvePath('src/index.js'); // "D:\sources\cold\src\index.js"

// 分片打包-开发
const AsyncImportDevJs = resolvePath('src/router/asyncImportDev.js');

// 分片打包-生产
const AsyncImportProdJS = resolvePath('src/router/asyncImportProd.js');

// 模拟数据
const MockJs = resolvePath('mock/index.js');

// ============================================================


module.exports = {
  // 目录
  RootDir,
  PublicDir,
  LibsDir,
  SrcDir,
  BuildDir,
  NodeModulesDir,
  MockDir,
  // 文件
  PackageJson,
  IndexHtml,
  IndexJs,
  AsyncImportDevJs,
  AsyncImportProdJS,
  MockJs,
}
