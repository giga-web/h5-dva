/* 开源-工具 */
import clone from 'clone';
/* 开源-组件 */
import React from 'react';
import { Router, Route, Switch, Redirect } from 'react-router-dom';
/* 自研-工具 */
import { history } from '@/store';
import { SYS_CSL_MST_MENU } from '@/constants/customer';
/* 自研-组件 */
import asyncRouter from '@/router/asyncRouter';
import Exception404 from '@/areas/shared/Exception/404';
/* 路由配置 */
// layoutRouters 布局路由 serverMenus 服务端菜单 tempMenus 临时菜单 nonMenuRouters 非菜单路由 childRouters 非菜单子路由
import { layoutRouters, tempMenus, nonMenuRouters, childRouters } from './config';


/* 自研-函数 */
// 从存储中取出的服务端菜单路由
function getServerMenus () {
  let serverMenus = [];

  try {
    const storageMenu = JSON.parse(localStorage.getItem(SYS_CSL_MST_MENU));
    if (storageMenu !== null) { serverMenus = storageMenu; }
  } catch(e) {
    console.log(e);
  }

  return serverMenus;
}
// 循环查找路由父级
function getRouteParent(route, routesIdMap) {
  const parent = routesIdMap[route.parentId];
  if (parent === undefined) {
    return;
  } else if (parent.url) {
    return parent;
  }
  // 循环查找
  return getRouteParent(parent, routesIdMap);
}

/* 逻辑 */
// 服务端菜单
const serverMenus = getServerMenus();

// 平面数据，全部数据，包含了路由项，为菜单分组而存在的项
const flatData = serverMenus.concat(layoutRouters).concat(tempMenus).concat(nonMenuRouters).concat(childRouters);

// 路由ID映射，为了得到路由树而存在
const routesIdMap = flatData.reduce((map, route) => {
  map[route.id] = route;
  return map;
}, {});

// 深度复制
const routesIdMapClone = clone(routesIdMap);

// 路由树
const routesTree = Object.keys(routesIdMapClone).reduce((tree, id) => {
  const route = routesIdMapClone[id];

  // 过滤了为菜单分组而存在的项
  if (Boolean(route.url) === false) {
    return tree;
  }

  // 循环查找路由父级，因为非路由不应该出现在路由树
  const parent = getRouteParent(route, routesIdMapClone);

  if (parent === undefined) {
    tree.push(route);
  } else if (parent.children === undefined) {
    parent.children = [route];
  } else {
    parent.children.push(route);
  }

  return tree;
}, []);

// 路由URL映射，为了异步路由查找加载信息而存在
export const routesUrlMap = flatData.reduce((map, route) => {
  // 过滤了为菜单分组而存在的项，剩下的就是需要渲染的路由
  if (route.url) {
    map[route.url] = route;
  }
  return map;
}, {});

// 路由包装组件
export class RouterWrapper extends React.Component {

  // 递归生成路由
  renderRoutes = (routesTree) => {
    return routesTree.map((route, index) => {
      if (route.children) {
        return (
          <Route
            key={index}
            path={route.url}
            render={(props) => {
              const ParentRoute = asyncRouter();
              return (
                <ParentRoute {...props} route={route}>
                  <Switch location={props.location}>
                    {route.redirect && <Redirect exact from={route.url} to={route.redirect} />}
                    {this.renderRoutes(route.children)}
                  </Switch>
                </ParentRoute>
              );
            }}
          />
        );
      } else {
        return (
          <Route
            key={index}
            path={route.url}
            // component={asyncRouter()}
            render={(props) => {
              const ChildRouter = asyncRouter();
              return (
                <ChildRouter {...props} route={route} />
              );
            }}
            exact
          />
        );
      }
    });
  }

  render() {
    return (
      <Router history={history}>
        <Switch>
          {this.renderRoutes(routesTree)}
          <Route render={Exception404} />
        </Switch>
      </Router>
    )
  }
}

/*
// 循环查找菜单父级
function getMenuParent(route, routesIdMap) {
  const parent = routesIdMap[route.parentId];
  if (parent === undefined) {
    return;
  } else if (['module', 'menu'].includes(parent.type)) {
    return parent;
  }
  // 循环查找
  return getRouteParent(parent, routesIdMap);
}

// 深度复制
const routesIdMapCloneToMenu = clone(routesIdMap);

// 菜单树
export const menuTree = Object.keys(routesIdMapCloneToMenu).reduce((tree, id) => {
  const route = routesIdMapCloneToMenu[id];

  // 过滤非菜单项
  if (['module', 'menu'].includes(route.type) === false) {
    return tree;
  }

  // 循环查找菜单父级
  const parent = getMenuParent(route, routesIdMapCloneToMenu);
  
  if (parent === undefined) {
    tree.push(route);
  } else if (parent.children === undefined) {
    parent.children = [route];
  } else {
    parent.children.push(route);
  }

  return tree;
}, []);
*/
