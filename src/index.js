// 旧版本的Chrome：https://www.slimjet.com/chrome/google-chrome-old-version.php
// 禁止Chrome自动更新：https://blog.csdn.net/chenyufeng1991/article/details/78568919

/* TODO：按道理这是不需要的，目前只是为了能够让入口文件有异步加载的代码 */
import(/* webpackChunkName: "TempComponent" */ '@/components/TempComponent');

// 开源-组件
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
// 自研-组件
import { RouterWrapper } from '@/router';
// 自研-工具
import { localStorageV } from '@/utilities/base';
import { KEY_USER_SETTING, USER_DEFAULT_SETTING } from '@/constants/customer';
// 数据
import { store, addAsyncModel } from '@/store';
import { Global } from './Model';

/* 异步数据模型 */
addAsyncModel(Global);

// 设置用户默认设置
if (localStorageV.getItem(KEY_USER_SETTING) === null) {
  localStorageV.setItem(KEY_USER_SETTING, USER_DEFAULT_SETTING);
}

class IndexComponent extends React.Component {

  render() {
    return (
      <Provider store={store}>
        <RouterWrapper />
      </Provider>
    );
  }

}

ReactDOM.render(<IndexComponent />, document.getElementById('root'));
