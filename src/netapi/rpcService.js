import fetch from 'isomorphic-fetch';
import { localStorageV } from '@/utilities/base';
import { syncVarIterator } from '@/utilities/util';
import { KEY_USER_SETTING } from '@/constants/customer';
import { URL_AUTH_LOGIN } from '@/netapi/RestApiUrls';
import { Modal, Toast } from 'antd-mobile';

/**
 * 约定：
 * 1. 没有统一提示（如：接口调用异常时的全局提示），所有的异常提示在页面内处理
 * 2. 调用时，当前页面应该有一个引导请求，通常如果一个页面的某个请求需要登录，此请求为引导请求
 * 3. 
 */

const errorMap = {
  LoginCancel: '登录取消',
  LoginError: '登录错误',
};

// 伪造返回结果
function MockResponse(error) {
  debugger;

  return {
    code: -999,
    message: error,
    data: errorMap[error],
  };
}

// 登录
function login(success, fail, login, password) {
  return new Promise((resolve, reject) => {
    debugger;

    const options = {
      url: URL_AUTH_LOGIN,
      method: 'POST',
      data: JSON.stringify({
        account: login,
        password: password,
        tenantId: 1,
      }),
    };

    request(options)
      .then((res) => {
        debugger;

        if (res.code === 0) {
          debugger;
    
          // 提交登录请求后，服务端返回正常，登录成功
    
          // 保存到本地存储
          localStorageV.setItem(KEY_USER_SETTING, Object.assign({ ...localStorageV.getItem(KEY_USER_SETTING) }, { token: res.data }));

          // 解决 -> 关闭弹窗
          resolve();

          // -> 登录成功回调
          success && success(res);

        } else {
          debugger;

          // 提交登录请求后，服务端返回正常，登录失败
          Toast.fail('登录失败，请确认您输入的信息正确后重试', 3);
        }
      })
      .catch((error) => {
        /*
        // 模式一：立即提示
        // 拒绝 -> 保持弹窗
        reject();
        // -> 提示
        Toast.fail('登录错误，请稍后重试', 3);
        */

        // 模式二：页面内提示
        // 解决 -> 关闭弹窗
        resolve();
        // -> 登录错误回调
        fail && fail(error);
      });

  });
}

// 弹窗登录
function loginModal(options) {
  return new Promise((resolve, reject) => {

    // 弹窗关闭后的回调
    const success = (res) => {
      debugger;
      resolve(res);
    };

    // 弹窗关闭后的回调
    const fail = (res) => {
      debugger;
      reject('LoginError');
    };

    Modal.prompt(
      'Login',
      'Please input login information',
      [
        {
          text: '取消',
          onPress: () => {
            debugger;

            // 拒绝登录，进入最后的 catch 块
            reject('LoginCancel');
          },
        },
        {
          text: '确定',
          onPress: login.bind(null, success, fail),
        },
      ],
      'login-password',
      null,
      ['Please input name', 'Please input password'],
    );

  });

}

// 请求封装
function request(options) {
  debugger;
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
    debugger;

    if (response.ok === true) {
      debugger;
      // 有几种情况会进入这里：
      // 1. 有 token 并且 token 未失效，服务端返回正常
      // 2. 无 token 时调用登录接口，服务端返回正常
      // 3. 重新发起请求，服务端返回正常

      // 这里主要完成返回值的转换
      return response.json();

    } else if ([401, 403].includes(response.status)) {
      debugger;

      throw 'InvalidToken';

    } else if ([404].includes(response.status)) {
      debugger;
      throw 'UrlError';

    } else if ([500].includes(response.status)) {
      debugger;
      throw 'serverError';

    } else {
      debugger;
      throw 'otherError';
    }
  })
  .catch(error => {
    debugger;

    // 有几种情况会进入这里：

    if (typeof error === 'string') {
      debugger;

      // 1. 接收上一个 then 的 throw 值，继续 throw
      throw error;

    } else {
      debugger;

      // 2. 网络错误或请求被阻止，如跨域
      throw error.message;
    }

  })
}

// 处理异常
function handleCatch(tag, options, error) {
  debugger;

  if (error === 'NoToken' || error === 'InvalidToken') {
    debugger;

    // 当 token 无效时，弹窗登录

    // 有几种情况会进入这里：
    // 1. 无 token 时
    // 2. 服务端返回值表明 token 无效时

    return loginModal()
      .then((res) => {
        debugger;

        // 设置 token 以重新发起请求
        options.header['authorization'] = syncVarIterator.getter(localStorageV.getItem(KEY_USER_SETTING), 'token');
        
        // 重新发起请求
        return request(options);
      });

  } else {
    debugger;

    return MockResponse(error);
  }

}

// 请求入口
function requestEntry(options) {
  debugger;
  const token = syncVarIterator.getter(localStorageV.getItem(KEY_USER_SETTING), 'token');

  // 头部
  const header = {
    authorization: token,
  };

  // 最终请求参数
  options = { ...options, header };

  return new Promise((resolve, reject) => {
    if (token) {
      debugger;
      // 当有 token 时，直接发起请求，过程中可能会有 token 失效的问题，这种情况将根据请求的结果进行处理
      resolve(request(options));
    } else {
      debugger;
      // 当无 token 时，转入下一个流程
      reject('NoToken');
    }
  })
    .catch(handleCatch.bind(null, 'catch01', options))
    /*
    .then((res) => {
      debugger;
      // 有几种情况会进入这里：
      // 1. 有 token 并且 token 未失效，服务端返回正常
      // 2. 无 token 时调用登录接口，服务端返回正常
      // 3. 重新发起请求，服务端返回正常

      // 这里主要完成报错的统一处理
      if (res.code === 0) {
        return res.data;
      }

      Toast.fail(res.message, 3);
    })*/
    .catch(handleCatch.bind(null, 'catch02', options));
}

const rpcService = {
  rGet: (url, extend) => {
    return requestEntry(Object.assign({ url }, { extend }, { method: 'GET' }));
  },
  rPost: (url, data, extend) => {
    return requestEntry(Object.assign({ url }, { extend }, { method: 'POST', data: JSON.stringify(data) }));
  },
  rPut: (url, data, extend) => {
    return requestEntry(Object.assign({ url }, { extend }, { method: 'PUT', data: JSON.stringify(data) }));
  },
  rDelete: (url, extend) => {
    return requestEntry(Object.assign({ url }, { extend }, { method: 'DELETE' }));
  },
};

export default rpcService;


// const rpcService = {
//   rGet: (url, extend) => {
//     return request(Object.assign({ url }, extend, { method: 'GET' }));
//   },
//   rPost: (url, data, extend) => {
//     let dataString = '';

//     if (extend && extend.header && extend.header['Content-Type'] === 'application/x-www-form-urlencoded') {
//       // 表单方式的值
//       dataString = querystring.stringify(data);
//     } else {
//       // JSON方式的值
//       dataString = JSON.stringify(data);
//     }

//     return request(Object.assign({ url }, extend, { method: 'POST', data: dataString }));
//   },
//   rPut: (url, data) => {
//     return request(Object.assign({ url }, { method: 'PUT', data: JSON.stringify(data) }));
//   },
//   rDelete: (url) => {
//     return request(Object.assign({ url }, { method: 'DELETE' }));
//   },
// };
