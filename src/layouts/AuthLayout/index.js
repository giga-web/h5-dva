/* 开源-工具 */
/* 开源-组件 */
import React, { Fragment } from 'react';
import { Helmet } from 'react-helmet'; // 管理 document 的 head
/* 自研-工具 */
import { routesUrlMap } from '@/router';
/* 自研-组件 */
/* 自研-语言 */
/* 自研-样式 */
/* 自研-函数 */

// 文档标题
const getTitle = (pathname) => {
  const route = routesUrlMap[pathname];
  const name = route.name;
  return name;
}

const AuthLayout = props => {
  const { children, location } = props;

  const title = getTitle(location.pathname);

  return (
    <Fragment>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      {children}
    </Fragment>
  );
}

export default AuthLayout;
