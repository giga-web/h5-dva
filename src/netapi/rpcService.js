/* 接口 */
import { URL_AUTH_LOGIN } from '@/netapi/RestApiUrls';
/* 开源-工具 */
import fetch from 'isomorphic-fetch';
import { queryString } from 'query-string';
/* 开源-组件 */
import { Toast } from 'antd-mobile';
/* 自研-工具 */
import { localStorageV } from '@/utilities/base';
import { syncVarIterator } from '@/utilities/util';
import { KEY_USER_SETTING } from '@/constants/customer';
/* 自研-组件 */
import PromptLogin from '@/components/Modal/Prompt/Login';

/**
 * 约定：
 * 1. 没有统一提示（如：接口调用异常时的全局提示），所有的异常提示在页面内处理
 * 2. 调用时，当前页面应该有一个引导请求，通常如果一个页面的某个请求需要登录，此请求为引导请求
 * 3. 
 */

// 白名单
const whiteList = [
  '/icbp-php-web/auth/login',
];

// 错误对应的意思
const errorMap = {
  LoginCancel: '登录取消',
  LoginError: '登录错误',
  UrlError: '地址错误',
  ServerError: '服务错误',
  OtherError: '其他错误',
};

// 错误时，伪造返回结果
function MockResponse(error) {
  // debugger;

  return {
    code: -999,
    message: error,
    data: errorMap[error] || '网络错误，请求被阻止',
  };
}

// 登录
function login(success, fail, login, password) {
  return new Promise((resolve, reject) => {
    // debugger;

    // 登录请求的参数
    const options = {
      url: URL_AUTH_LOGIN,
      method: 'POST',
      data: JSON.stringify({
        account: login,
        password: password,
        tenantId: 1,
      }),
    };

    // 发送登录请求
    request(options)
      .then((res) => {
        // debugger;

        // 登录请求响应成功
        if (res.code === 0) {
          // debugger;
    
          // 登录成功
          const token = res.data;

          // 保存到本地存储
          localStorageV.setItem(KEY_USER_SETTING, Object.assign({ ...localStorageV.getItem(KEY_USER_SETTING) }, { token }));

          // 解决 -> 关闭弹窗
          resolve();

          // -> 登录成功回调
          success && success(token);

        } else {
          // debugger;

          // 登录失败
          // 拒绝 -> 保持弹窗
          reject(res);
          // 提示
          Toast.fail('登录失败，请确认您输入的信息正确后重试', 3);
        }
      })
      .catch((error) => {
        // debugger;

        /*
        // 模式一：立即提示
        // 拒绝 -> 保持弹窗
        reject();
        // -> 提示
        Toast.fail('登录错误，请稍后重试', 3);
        */

        /**/
        // 模式二：页面内提示
        // 解决 -> 关闭弹窗
        resolve();
        // -> 登录错误回调
        fail && fail(error);
        /**/
      });

  });
}

// 弹窗登录
function loginModal(options) {
  return new Promise((resolve, reject) => {

    // 登录成功回调
    const success = (token) => {
      // debugger;

      // 设置 token 以重新发起请求
      options.header['authorization'] = token;
      
      // 重新发起请求
      resolve(request(options));
    };

    // 登录报错回调
    const fail = () => {
      // debugger;

      reject('LoginError');
    };

    // 显示弹窗
    PromptLogin({
      title: 'Login',
      message: 'Please input login information',
      callbackOrActions: [
        {
          text: '取消',
          onPress: () => {
            // debugger;

            // 拒绝登录，进入最后的 catch 块
            reject('LoginCancel');
          },
        },
        {
          text: '确定',
          onPress: login.bind(null, success, fail),
        },
      ],
      type: 'login-password',
      defaultValue: null,
      placeholders: ['Please input name', 'Please input password'],
      platform: 'ios',
    });

  });

}

// 请求封装
function request(options) {
  // debugger;
  return fetch(options.url, {
    // 必须和 header 的 'Content-Type' 匹配
    body: options.data,
    // *default, no-cache, reload, force-cache, only-if-cached
    cache: 'no-cache',
    // include, same-origin, *omit
    credentials: 'include',
    headers: options.header,
    // *GET, POST, PUT, DELETE, etc.
    method: options.method,
    // no-cors, cors, *same-origin
    // mode: 'no-cors',
    // manual, *follow, error
    redirect: 'follow',
    // *client, no-referrer
    referrer: 'no-referrer',
  })
  .then(response => {
    // debugger;

    if (response.ok === true) {
      // debugger;

      // 响应成功直接返回，不做统一提示
      // 可能的去处：
      // 1. 正常请求，直接返回到请求发起的地方
      // 2. 登录请求，去到发送登录请求的地方
      return response.json();

    } else if ([401, 403].includes(response.status)) {
      // debugger;

      throw 'InvalidToken';

    } else if ([404].includes(response.status)) {
      // debugger;
      throw 'UrlError';

    } else if ([500].includes(response.status)) {
      // debugger;
      throw 'ServerError';

    } else {
      // debugger;
      throw 'OtherError';
    }
  })
  .catch(error => {
    // debugger;

    // 这个 catch 存在的原因是，当网络错误或请求被阻止会直接进入这里。并且根据 error 的数据类型，统一返回字符串形式的错误

    if (typeof error === 'string') {
      // debugger;

      // 1. 接收上一个 then 的 throw 值，继续 throw
      throw error;

    } else {
      // debugger;

      // 2. 网络错误或请求被阻止，如跨域
      throw error.message;
    }

  })
}

// 处理异常
function handleCatch(tag, options, error) {
  // debugger;

  if (error === 'NoToken' || error === 'InvalidToken') {
    // debugger;

    // 需要登录
    return loginModal(options);

  } else {
    // debugger;

    // 返回模拟响应
    return MockResponse(error);
  }

}

// 请求入口
function requestEntry(options) {
  // debugger;

  // 请求头
  const header = {};

  // token
  let token = false;

  // 不包含在白名单中的请求
  if (whiteList.includes(options.url)) {
    token = true;

  } else {
    // 获取 token 值
    token = syncVarIterator.getter(localStorageV.getItem(KEY_USER_SETTING), 'token');

    // 设置
    header['authorization'] = token;
  }

  // 最终请求参数
  options = { ...options, header };

  return new Promise((resolve, reject) => {
    if (token) {
      // debugger;

      // 当有 token 时，直接发起请求，过程中可能会有 token 失效的问题，这种情况将根据请求的结果进行处理
      resolve(request(options));

    } else {
      // debugger;

      // 当无 token 时，进入 catch01 处，这也是 catch01 存在的原因
      reject('NoToken');
    }
  })
    .catch(handleCatch.bind(null, 'catch01', options))
    .catch(handleCatch.bind(null, 'catch02', options));
}

const rpcService = {
  rGet: (url, extend) => {
    return requestEntry(Object.assign({ url }, { extend }, { method: 'GET' }));
  },
  rPost: (url, data, extend) => {
    let dataString = '';

    if (extend && extend.header && extend.header['Content-Type'] === 'application/x-www-form-urlencoded') {
      // 表单方式的值
      dataString = queryString.stringify(data);
    } else {
      // JSON方式的值
      dataString = JSON.stringify(data);
    }

    return requestEntry(Object.assign({ url }, { extend }, { method: 'POST', data: dataString }));
  },
  rPut: (url, data, extend) => {
    return requestEntry(Object.assign({ url }, { extend }, { method: 'PUT', data: JSON.stringify(data) }));
  },
  rDelete: (url, extend) => {
    return requestEntry(Object.assign({ url }, { extend }, { method: 'DELETE' }));
  },
};

export default rpcService;
