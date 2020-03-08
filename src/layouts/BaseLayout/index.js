/* 开源-工具 */
/* 开源-组件 */
import React, { Fragment } from 'react';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet'; // 管理 document 的 head
/* 自研-工具 */
import { routesUrlMap } from '@/router';
/* 自研-组件 */
/* 自研-图片 */
/* 自研-样式 */
// import styles from './index.m.less';

/* 自研-函数 */
// 文档标题
const getTitle = (pathname) => {
  const route = routesUrlMap[pathname];
  const name = route.name;
  return name;
}

const BaseLayout = props => {
  const { children, location, collapsed } = props;
  
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

function mapStateToProps({ global }) {
  return {
    collapsed: global.collapsed
  };
}

export default connect(mapStateToProps)(BaseLayout);
