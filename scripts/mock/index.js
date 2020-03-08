// Node
const fs = require('fs');
const path = require('path');

// 排除的文件
const exclude = ['index.js', 'config.js'];

// 默认模拟数据
const mock = {};

// 循环加入模拟数据
fs.readdirSync(path.join(__dirname, ''))
  .filter(item => exclude.includes(item) === false)
  .forEach((file) => {
    Object.assign(mock, require(`./${file}`));
  });

// 导出
module.exports = mock;