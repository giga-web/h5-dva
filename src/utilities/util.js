/* 开源-工具 */
import queryString from 'query-string';
/* 自研-工具 */
import { history } from '@/store';
import { KEY_USER_SETTING } from '@/constants/customer';
import { DEFAULT_EMPTY_TIME } from '@/constants/backend';

// ============================================================
// 基础
// ============================================================
/**
 * 测试属性是否匹配
 */
export function testPropTypes (value, type, dev) {
  const sEnums = ['number', 'string', 'boolean', 'undefined', 'function']; // NaN
  const oEnums = ['Null', 'Object', 'Array', 'Date', 'RegExp', 'Error'];
  const nEnums = ['[object Number]', '[object String]', '[object Boolean]', '[object Undefined]', '[object Function]', '[object Null]', '[object Object]', '[object Array]', '[object Date]', '[object RegExp]', '[object Error]'];
  const reg = new RegExp('\\[object (.*?)\\]');

  // 完全匹配模式，type应该传递类似格式[object Window] [object HTMLDocument] ...
  if (reg.test(type)) {
    // 排除nEnums的12种
    if (~nEnums.indexOf(type)) {
      if (dev === true) {
        console.warn(value, 'The parameter type belongs to one of 12 types：number string boolean undefined Null Object Array Date RegExp function Error NaN');
      }
    }

    if (Object.prototype.toString.call(value) === type) {
      return true;
    }

    return false;
  }

  // 检测到的类型
  let t = typeof value;

  // 可以通过 typeof 判断的，检测到的类型存在于枚举
  if (~sEnums.indexOf(t)) {
    // 区分特殊值NaN
    if (t === 'number' && isNaN(value)) {
      t = 'NaN';
    }
    // 传递的类型和检测到的类型匹配
    if (t === type) {
      return true;
    }
    return false;
  } else {
    // 需要通过 Object.prototype.toString.call() 判断的
    const o = Object.prototype.toString.call(value);
    // 本来o的值格式是[object Object]，通过正则后值的格式是Object
    const r = new RegExp('\\[object (.*?)\\]');
    const so = o.replace(r, '$1');

    // 检测到的类型存在于枚举，传递的类型和检测到的类型匹配
    if (~oEnums.indexOf(so) && so === type) {
      return true;
    }
    return false;
  }
}

/**
 * 参数类型检测
 */
export function checkPropTypes (arr, dev) {
  // 一维数组拆分为二维数组
  const multArr = [];
  for (let i = 0; i < arr.length; i++) {
    if (i % 2 === 0) {
      multArr.push(arr.slice(i, i + 2));
    }
  }

  // 两层循环验证
  for (let n = 0; n < multArr.length; n++) {
    const v = multArr[n][0];
    const vArr = multArr[n][1];

    // 如果vArr中包含v，表示验证通过，否则要验证类型
    if (~vArr.indexOf(v)) { continue; }

    // 验证类型
    let exist = false;
    for (let m = 0; m < vArr.length; m++) {
      if (testPropTypes(v, vArr[m], dev)) {
        exist = true;
        break;
      }
    }
    // 数组中的类型和值的类型都不匹配，则报错
    if (exist === false) {
      if (dev === true) {
        console.error(v, `Error: index ${n} is of the wrong type`);
      }
    }
  }
}

/**
 * 测试可能值
 */
export function testPossibility (inputList, callback, obj) {
  /** inputList
    [
      [undefined, true, {}],
      [undefined, true],
      [1, 2, 3]
    ]
   */
  // 第一维数组的长度
  const n = inputList.length;

  // 组合
  const combination = [];
  for (let i = 0; i < n; i++) {
    combination.push(0);
  }
  // 此时的组合的格式为：[0,0,0]
  // 对combination的修改，目标是改成类似 [0,0,1] [0,0,2] [0,1,0] [0,1,1] [0,1,2] [1,0,0] [1,0,1] [1,0,2] [1,1,0] ...

  // 用于使组合的最后一个元素的值不为0，使得循环继续
  let i = 0;

  // 标识循环是否继续，默认不继续
  let isContinue = false;

  // 至少执行一次
  do {
    // 每次拿到参数数组都要循环第一维数组的长度
    const paramsArr = [];
    for (let j = 0; j < n; j++) {
      // 拿到第几个第二维数组的第几个元素
      paramsArr.push(inputList[j][combination[j]]);
    }
    // apply反向调用待测试函数
    callback.apply(obj || null, paramsArr);

    // 核心部分，对combination的修改
    i++;

    // 组合的最后一个元素的值
    combination[n - 1] = i;

    for (let j = n - 1; j >= 0; j--) {
      // 如果组合的第几个值已经和第几个第二维数组的长度相等了，表示这个第二维数组的值取完了，要归0
      if (combination[j] >= inputList[j].length) {

        combination[j] = 0;

        i = 0;

        // 如果j!=0，即不是第一个第二维数组，前一位加1
        if (j - 1 >= 0) {
          combination[j - 1] = combination[j - 1] + 1;
        }
      }
    }

    // 结束循环
    isContinue = false;

    // 当组合数组的元素有一个不是0的时候，继续循环
    for (let key in combination) {
      if (combination[key] !== 0) {
        isContinue = true;
      }
    }
  } while (isContinue);
}

/**
 * 对象检测
 */
export const checkObject = {
  isEmpty: (obj) => {
    try {
      const json = JSON.stringify(obj);
      if (json === '{}') {
        return true;
      }

      return false;

    } catch (ex) {
      console.log(ex);
      return false;
    }
  },
  isRequestParams: (obj, dev) => {
    // 特殊值
    const sv = [undefined];
    // 正常值
    const vv = ['number', 'string'];

    let result = false;

    for (let key in obj) {
      const value = obj[key];

      // 可以是特殊值
      if (~sv.indexOf(value)) {
        continue;
      }

      const type = typeof value;

      // 可以是正常值，以及NaN
      if (~vv.indexOf(type)) {
        // 不能是 NaN
        if (type === 'number' && isNaN(value)) {
          result = key;
          break;
        }

        continue;
      }

      // 不能是 {}, [], function () {}, new Date(), new RegExp(), new Error()，以及其它类型
      result = key;
      break;
    }

    if (result !== false) {
      if (dev === true) {
        console.error(`Error: ${result} must be [ undefined, number, string ]`);
      }
      return false;
    }

    return true;
  },
  isOneLevel: (obj, dev) => {
    // 特殊值
    const sv = [null, undefined];
    // 正常值
    const vv = ['number', 'string', 'boolean'];

    let result = false;

    for (let key in obj) {
      const value = obj[key];

      // 可以是特殊值
      if (~sv.indexOf(value)) {
        continue;
      }

      const type = typeof value;

      // 可以是正常值，以及NaN
      if (~vv.indexOf(type)) {
        if (type === 'number' && isNaN(value)) {
          continue;
        }

        continue;
      }

      // 不能是 {}, [], function () {}, new Date(), new RegExp(), new Error()，以及其它类型
      result = key;
      break;
    }

    if (result !== false) {
      if (dev === true) {
        console.error(`Error: ${result} must be [ null, undefined, true, number, string, NaN ]`);
      }
      return false;
    }

    return true;
  }
};



// ============================================================
// 数据转换
// ============================================================
/**
 * 比对
 * array
 */
export const compare = {
  eqArray: (left, right) => {
    checkPropTypes([
      left, ['Array'],
      right, ['Array']
    ]);

    if (left === right) {
      return true;
    }

    if (testPropTypes(left, '[object Array]') === false) {
      return false;
    }

    if (testPropTypes(right, '[object Array]') === false) {
      return false;
    }

    // 长度不一样，肯定不相同
    if (left.length !== right.length) {
      return false;
    }

    // 使用JSON.stringify检查是否存在循环引用
    try {
      JSON.stringify(left);
      JSON.stringify(right);
    } catch (ex) {
      return false;
    }

    // 递归排序
    (function loop (ele) {
      for (let key in ele) {
        const item = ele[key];

        // 如果不是一层对象，递归
        if (checkObject.isOneLevel(item) === false) {
          loop(item);
        }

        // 如果是数组，直接排序
        if (testPropTypes(item, 'Array')) {
          item.sort();
          continue;
        }

        // 对象转数组后，按属性名排序
        const sortable = [];

        for (let key in item) {
          sortable.push([key, item[key]]);
        }

        sortable.sort(function(a, b) {
          return a[0] > b[0] ? 1 : -1;
        });

        ele[key] = sortable;
      }
    })([left, right]);

    // 循环比对
    for (let i = 0; i < left.length; i++) {
      const ls = JSON.stringify(left[i]);
      const rs = JSON.stringify(right[i]);
      if (ls !== rs) {
        return false;
      }
    }
    
    return true;
  }
};

/**
 * 转换为数组
 * url
 * unique
 */
export const toArray = {
  url: (url) => {
    const urllist = url.split('/').filter(i => i);
    return urllist.map((urlItem, index) => {
      return `/${urllist.slice(0, index + 1).join('/')}`;
    });
  },
  unique: (arr) => {
    return arr.concat().sort().filter((item, index, array) => {
      return !index || (item !== array[index - 1]);
    });
  },
  sliceByLength: (arr, length) => {
    let newArr = [];
    for (let i = 0; i < arr.length;) {
      newArr.push(arr.slice(i, i + length));
      i = i + length;
    }
    return newArr;
  },
  sliceByField(arr, field) {
    const temp = {};
    const multArr = [];

    arr.forEach(item => {
      if (temp[item[field]]) {
        temp[item[field]].push(item);
      } else {
        temp[item[field]] = [item];
      }
    });

    for (let key in temp) {
      multArr.push(temp[key]);
    }

    return multArr;
  },
};

/**
 * 转换为对象
 * array
 */
export const toObject = {
  array: (arr, key) => {
    return arr.reduce((result, item) => {
      result[item[key]] = item;
      return result;
    }, {});
  }
};

/**
 * 转换为数字
 * string
 */
export const toNumber = {
  string: (string) => {
    const number = Number(string.replace(/[^0-9]/ig, ''));

    if (isNaN(number)) {
      return 0;
    }

    return number;
  }
};

/**
 * 将数组按照指定长度拆分
 */
export function sliceArrayByLength(arr, length) {
  let newArr = [];
  for (let i = 0; i < arr.length; i += length) {
    newArr.push(arr.slice(i, i + length));
  }
  return newArr;
}


// ============================================================
// 业务强相关
// ============================================================

/**
 * 本地验证token，目的是确定是否需要登录
 *
 */
export function localVerifyToken() {
  // 已经在登录页面，直接返回
  if (history.location.pathname === '/auth/login') {
    return;
  }

  // 获取token
  const token = syncVarIterator.getter(localStorage.getItem(KEY_USER_SETTING), 'token');

  // 没有找到token对象，去登录
  if (token === null) {
    history.push('/auth/login');
  }
}

/**
 * 请求参数检测，会删除值为 null、undefined、'' 的key
 * defaultParams 默认参数
 * params 当前参数
 * query 是否是查询条件
 */
export function checkParams(defaultParams, params, query) {
  // 只取默认参数中有的参数，多余的忽略，值的类型不匹配则使用默认值
  const resultParams = Object.keys(defaultParams).reduce((result, key) => {
    result[key] = (params && params[key]) || defaultParams[key];
    return result;
  }, {});

  // 分页减一
  if (resultParams.pageindex !== undefined && resultParams.pageindex > 0) {
    resultParams.pageindex = resultParams.pageindex - 1;
  }

  // 指定返回查询条件
  if (query === true) {
    return checkObject.isEmpty(defaultParams) ? '' : '?' + queryString.stringify(resultParams);
  }

  return resultParams;
}

/**
 * 请求参数检测，会删除值为 null、undefined、'' 的key
 * defaultParams 默认参数
 * params 当前参数
 * query 是否是查询条件
 */
export function checkParamsV2(defaultParams, params, query) {
  const resultParams = Object.keys(defaultParams).reduce((prev, key) => {
    if (!checkIsBlank(params[key])) {
      prev[key] = params[key];
    } else if (!checkIsBlank(defaultParams[key])) {
      prev[key] = defaultParams[key];
    }
    return prev;
  }, {});

  // 指定返回查询条件
  if (query === true) {
    return checkObject.isEmpty(resultParams) ? "" : "?" + queryString.stringify(resultParams); //.toLowerCase();
  }

  return resultParams;
}

/**
 * 请求参数检测
 */
export function checkRPCParams(defaultParams, params, query) {
// 只取默认参数中有的参数，多余的忽略，值的类型不匹配则使用默认值
  const mergeParams = Object.assign({},defaultParams, params);

  const resultParams = Object.keys(mergeParams).filter(key => !checkIsBlank(mergeParams[key])).reduce((prev, key) => {
    prev[key] = mergeParams[key];
    return prev;
  }, {})

  // 指定返回查询条件
  if (query === true) {
    return checkObject.isEmpty(resultParams) ? "" : "?" + queryString.stringify(resultParams); //.toLowerCase();
  }

  return resultParams;
}

// 同步地址栏参数到redux
export function syncUrlParams(dispatch, namespace) {
  // 取得地址拦的搜索参数
  const search = queryString.parse(history.location.search);

  // 同步地址栏的搜索参数到redux
  if (dispatch && namespace) {
    dispatch({ type: `${namespace}/save`, payload: { keep: search } });
  }

  return search;
}

// 重载参数
export function pageParams(params, reset) {
  return reset ? { ...params } : (params && Object.assign({}, this.props.form.getFieldsValue(), params));
}

// 合并请求参数并更新地址栏
// 不应该直接在表单表格中设置默认值，而应该使用 defaultValue 参数
export function mergeParams(payload, defaultValue) {
  // 取得地址拦的搜索参数，在页面加载就已确认，下面的同步地址栏不会改变
  const search = window.location.hash.split('?')[1];
  const keep = queryString.parse(search);
  
  // 如果 payload 是 undefined 则以地址栏同步下来的数据为准，否则以页面为准
  const current = payload || keep;
  
  // 如果对应值是 undefined，使用默认值替换
  const replace = Object.keys(current).reduce((result, key) => {
    result[key] = (current[key] === undefined) ? (defaultValue && defaultValue[key]) : current[key];
    return result;
  }, {});

  // 合并
  const merge = Object.assign({}, defaultValue, replace);

  // 同步地址拦
  const searchString = queryString.stringify(merge);
  const searchConnect = searchString ? `?${searchString}` : '';
  window.history.replaceState(null, null, `/#${history.location.pathname}${searchConnect}${history.location.hash}`);

  return merge;
}

// 获取请求参数
export function getKeep() {
  if (!checkIsBlank(this.props.pagedata.keep) && Object.keys(this.props.pagedata.keep).length > 0) {
    return this.props.pagedata.keep;
  }
  return this.keep;
}

export const handleParams = {
  url: syncUrlParams,
  page: pageParams,
  merge: mergeParams,
  keep: getKeep,
};

export const checkIsBlank = obj => {
  if (obj === undefined || obj === null) {
    return true;
  }
  if (typeof obj === 'string' && '' === obj) {
    return true;
  }
  return false;
}


// ============================================================
// 设计模式
// ============================================================
/**
 * 同步变量迭代器
 *
 */
export const syncVarIterator = {
  getter: function (obj, key) {
    // 如果不存在obj则返回未定义
    if (!obj) {
      return undefined;
    }

    // 解析属性层次序列
    const keyArr = key.split('.');

    // 结果变量，暂时指向obj持有的引用，后续将可能被不断的修改
    let result = obj;

    // 迭代obj对象属性
    for (let i = 0; i < keyArr.length; i++) {
      // 如果第 i 层属性存在对应的值则迭代该属性值
      if (result[keyArr[i]] !== undefined) {
        result = result[keyArr[i]];
        // 如果不存在则返回未定义
      } else {
        return undefined;
      }
    }
    // 返回获取的结果
    return result;
  },
  setter: function (obj, key, val) {
    // 如果不存在obj则返回未定义
    if (!obj) {
      return false;
    }

    // 解析属性层次序列
    const keyArr = key.split('.');

    // 结果变量，暂时指向obj持有的引用，后续将可能被不断的修改
    let result = obj;
    let i = 0;

    // 迭代obj对象属性
    for (; i < keyArr.length - 1; i++) {
      // 如果第 i 层属性对应的值不存在，则定义为对象
      if (result[keyArr[i]] === undefined) {
        result[keyArr[i]] = {};
      }
      // 如果第 i 层属性对应的值不是对象（Object）的一个实例，则抛出错误
      if (!(result[keyArr[i]] instanceof Object)) {
        throw new Error('obj.' + keyArr.splice(0, i + 1).join('.') + 'is not Object');
      }
      // 迭代该层属性值
      result = result[keyArr[i]];
    }
    // 返回设置成功的属性值
    return result[keyArr[i]] = val;
  }
};

// ============================================================
// Dom
// ============================================================
// 获取指定class的父节点
export function getParents(element, className) {
  var returnParentElement = null;

  function getParentNode(element, className) {
    if(element && element.classList.contains(className) && element.tagName.toLowerCase() !== "body") {
      returnParentElement = element;
    } else {
      getParentNode(element.parentElement, className);
    }
  }
  getParentNode(element, className);

  return returnParentElement;
}
