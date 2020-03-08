module.exports = {

  // 每个环境都定义了特定于该环境的全局变量
  // 环境列表：https://eslint.org/docs/user-guide/configuring#specifying-environments
  "env": {
    "node": true,
    "browser": true,

    // 支持 ES6 全局变量，设置后将自动启用 ES6 语法
    // 但是解析选择中的 ecmaVersion 仍然可以设置，这两者没有强关联
    "es6": true
  },

  // 手动指定全局变量
  "globals": {
    "__webpack_require__": "readonly"
  },

  // 解析器选项，默认解析器是 Espree
  // 即使指定另外的解析器(babel-eslint)，parserOptions 也是需要的
  // 因为当其它解析器是将源码转换成 es5 时，对于那些 es5 不支持的特性，ESLint 还是需要根据 parserOptions 的配置才能正常工作
  // parserOptions 总是会传递给解析器，至于用不用交由解析器来抉择
  "parserOptions": {

    // 指定要启用的语法版本
    "ecmaVersion": 6,

    // 默认 "script"，可选 "module" 如果您的代码在 ECMAScript 模块(使用各种导入和导出语句定义模块)中
    "sourceType": "module",

    // 指定附加的语言特性
    "ecmaFeatures": {
      "arrowFunctions": true,
    }
  },

  // ESlint 默认的解析器不支持实验性和非标准(Flow or TypeScript types)的语法
  // babel-eslint 让 ESLint 在 Babel 转换后的源代码上运行
  // 支持更多的解析器选项：https://github.com/babel/babel-eslint#additional-parser-configuration
  "parser": 'babel-eslint',

  // 默认情况，ESLint 支持 es5 语法
  "extends": [
    // 规则页面打勾的规则都将被应用：https://eslint.org/docs/rules/
    "eslint:recommended",
    // 使用插件中的配置，支持 React JSX
    "plugin:react/recommended"
  ],

  // 插件
  "plugins": [
    // babel-eslint 的伴侣。
    // babel-eslint 在将 eslint 与 Babel 配合使用方面做得非常出色，但无法更改内置规则以支持实验功能。
    // eslint-plugin-babel 重新实现有问题的规则，因此它们不会误报。
    "babel"
  ],

  // 手动指定规则
  "rules": {
    "react/prop-types": "off"
  }
};