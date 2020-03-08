import fetch from 'isomorphic-fetch';
import { localStorageV } from '@/utilities/base';
import { syncVarIterator } from '@/utilities/util';
import { KEY_USER_SETTING } from '@/constants/customer';
import { URL_AUTH_LOGIN } from '@/netapi/RestApiUrls';
import { Modal, Toast } from 'antd-mobile';

// 伪造返回结果
function ErrorJsonResult(error) {
  return {
    code: -999,
    message: error,
    data: ''
  };
}

// 拒绝登录
function RejectLoginResult() {
  return {
    code: -9999,
    message: '您取消了登录',
    data: ''
  };
}

// 登录
function login(options, login, password) {
  return new Promise((resolve) => {
    debugger;

    const loginOptions = {
      url: URL_AUTH_LOGIN,
      method: 'POST',
      data: JSON.stringify({
        account: login,
        password: password,
        tenantId: 1,
      }),
    };

    request(loginOptions).then((res) => {
      debugger;
      console.log(res);

      if (res.code === 0) {
        debugger;
  
        // 提交登录请求后，服务端返回正常，登录成功
  
        // 保存到本地存储
        localStorageV.setItem(KEY_USER_SETTING, Object.assign({ ...localStorageV.getItem(KEY_USER_SETTING) }, { token: res.data }));

        // 设置 token 以重新发起请求
        options.header['authorization'] = res.data;

        resolve();

        // 重新发起请求
        return request(options);
      } else {
        debugger;

        // 提交登录请求后，服务端返回正常，登录失败
        Toast.fail('登录失败，请确认您输入的信息正确后重试', 3);
      }
    });

  });
}

// 弹窗登录
function loginModal(options) {
  return new Promise((resolve, reject) => {
    Modal.prompt(
      'Login',
      'Please input login information',
      [
        {
          text: '取消',
          onPress: () => {
            debugger;

            // 拒绝登录，进入下一个流程
            reject('rejectLogin');
          },
        },
        {
          text: '确定',
          onPress: login.bind(null, options),
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
    // console.log(response);

    if (response.ok === true) {
      debugger;
      // 有几种情况会进入这里：
      // 1. 有 token 并且 token 未失效，服务端返回正常
      // 2. 无 token 时调用登录接口，服务端返回正常
      // 3. 重新发起请求，服务端返回正常

      // 这里主要完成返回值的转换
      return response.json();

    } else if (response.status === 401) {
      debugger;
      // 验证 token 失败
      throw '401';
      // return ErrorJsonResult('登录超时');

    } else if (response.status === 403) {
      debugger;
      // 弹窗登录
      // return ErrorJsonResult('没有权限');

    } else if (response.status === 404) {
      debugger;
      // console.log('地址错误: ' + options.url);
      // return ErrorJsonResult('服务地址错误');

    } else if (response.status === 500) {
      debugger;
      // console.log('服务错误: ' + options.url);
      // return ErrorJsonResult('服务错误');

    } else {
      debugger;
      // console.log('其他错误: ' + options.url);
      // return ErrorJsonResult('其他错误');
    }
  })
  .catch(error => {
    debugger;
    // console.log('网络故障时或请求被阻止: ' + options.url);
    return ErrorJsonResult('网络故障时或请求被阻止');
  })
}

// 请求入口
function requestV(options) {
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
      reject();
    }
  })
    /*
    .then((res) => {
      debugger;
      console.log(res);
      if (res.code == -1) { // TODO: 401
        throw '401';
      }
      return res;
    })
    */
    .catch((error) => {
      debugger;

      // 当无 token 时，弹窗登录
      if (token === undefined) {
        debugger;

        return loginModal(options);
      }



      console.log(error);
      // 尝试自动重新登录


      /*
      return Taro.login()
        .then((res) => {
          return request({
            url: `${URL_WX_LOGIN}?city=${city}&code=${res.code}`,
          });
        })
        .then((res) => {
          console.log(res);
          options.header['HOS-USER-TICKET'] = res.data.token;
          return request(options);
        });
      */
    })
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

      Toast.fail(res.message, 3000);
    })
    .catch((error) => {
      debugger;
      console.log(error);

      // 拒绝登录
      if (error === 'rejectLogin') {
        debugger;
        return RejectLoginResult();
      }
    });
}

const rpcService = {
  rGet: (url, extend) => {
    return requestV(Object.assign({ url }, { extend }, { method: 'GET' }));
  },
  rPost: (url, data, extend) => {
    return requestV(Object.assign({ url }, { extend }, { method: 'POST', data: JSON.stringify(data) }));
  },
  rPut: (url, data, extend) => {
    return requestV(Object.assign({ url }, { extend }, { method: 'PUT', data: JSON.stringify(data) }));
  },
  rDelete: (url, extend) => {
    return requestV(Object.assign({ url }, { extend }, { method: 'DELETE' }));
  },
};

export default rpcService;

// function request(options) {

//   // 请求头
//   const header = {
//     'Accept': 'application/json',
//     'Content-Type': 'application/json; charset=utf-8'
//   };

//   /*
//   // 获取会话标识
//   const sessionKey = localStorage.getItem(LOCALSTORAGEKEY_AUTHORIZATION);

//   // 附加会话标识到请求头
//   if (sessionKey) {
//     header[LOCALSTORAGEKEY_AUTHORIZATION] = sessionKey;
//   }
//   */

//   return fetch(options.url, {
//     // 必须和 header 的 'Content-Type' 匹配
//     body: options.data,
//     // *default, no-cache, reload, force-cache, only-if-cached
//     cache: 'no-cache',
//     // include, same-origin, *omit
//     credentials: 'include',
//     headers: header,
//     // *GET, POST, PUT, DELETE, etc.
//     method: options.method,
//     // no-cors, cors, *same-origin
//     // mode: 'no-cors',
//     // manual, *follow, error
//     redirect: 'follow',
//     // *client, no-referrer
//     referrer: 'no-referrer',
//   })
//   .then(response => {
//     // console.log(response);

//     if (response.ok === true) {
//       return response.json();
//     } else if (response.status === 401) {
//       history.push('/auth/login');
//       return ErrorJsonResult('登录超时');
//     } else if (response.status === 403) {
//       console.log('没有权限: ' + options.url);
//       // 弹窗登录
//       return ErrorJsonResult('没有权限');
//     } else if (response.status === 404) {
//       // console.log('地址错误: ' + options.url);
//       return ErrorJsonResult('服务地址错误');
//     } else if (response.status === 500) {
//       // console.log('服务错误: ' + options.url);
//       return ErrorJsonResult('服务错误');
//     } else {
//       // console.log('其他错误: ' + options.url);
//       return ErrorJsonResult('其他错误');
//     }
//   })
//   .catch(error => {
//     // console.log('网络故障时或请求被阻止: ' + options.url);
//     return ErrorJsonResult('网络故障时或请求被阻止');
//   })
// }

// const rpcService = {
//   rGet: (url, extend) => {
//     return request(Object.assign({ url }, extend, { method: 'GET' }));
//   },
//   rPost: (url, data) => {
//     return request(Object.assign({ url }, { method: 'POST', data: JSON.stringify(data) }));
//   },
//   rPut: (url, data) => {
//     return request(Object.assign({ url }, { method: 'PUT', data: JSON.stringify(data) }));
//   },
//   rDelete: (url, data) => {
//     return request(Object.assign({ url }, { method: 'DELETE' }));
//   },
// };

// export default rpcService;


// /* 开源 */
// import Taro from '@tarojs/taro';
// import querystring from 'query-string';
// /* 自研 */
// import { SVC_APP_KEY } from 'src/Constant';
// import { getAppAuthorization } from 'src/utilities/signature';


// // 伪造返回结果
// function ErrorJsonResult(error) {
//   return {
//     code: -999,
//     message: error,
//     data: '',
//   };
// }

// function request(options) {
//   const timestamp = new Date().getTime();

//   // 默认请求头
//   const header = {
//     'app_key': SVC_APP_KEY,
//     'timestamp': timestamp,
//     'authorization': getAppAuthorization(timestamp),
//     'Content-Type': 'application/json;charset=UTF-8',
//   };

//   // 传参来的请求头
//   if (options.header) {
//     Object.keys(options.header).map((key) => {
//       header[key] = options.header[key];
//     });
//   }

//   return Taro.request({
//     url: options.url,
//     data: options.data,
//     method: options.method,
//     header,
//   })
//     .then((response) => {
//       if (response.statusCode === 200) {
//         return response.data;
//       } else if (response.statusCode === 403) {
//         // 弹窗登录
//         // Taro.redirectTo({ url: '/areas/weapp/Auth/Index' });
//         return ErrorJsonResult('没有权限');
//       } else if (response.statusCode === 404) {
//         return ErrorJsonResult('地址错误');
//       } else if (response.statusCode === 500) {
//         return ErrorJsonResult('服务错误');
//       } else {
//         return ErrorJsonResult('其他错误');
//       }
//     })
//     .catch(() => {
//       return ErrorJsonResult('网络故障时或请求被阻止');
//     });
// }

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

// export default rpcService;
