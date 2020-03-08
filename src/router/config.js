// 布局
export const layoutRouters = [
  {
		"id": 99,
		"parentId": 1,
		"name": "首页",
		"url": "/",
		"chunkName": "layoutsBaseLayout",
		"moduleId": "./src/layouts/BaseLayout/index.js",
		"icon": "",
		"redirect": "/index",
		"type": "layout"
  },
  {
		"id": 88,
		"parentId": 1,
		"name": "认证",
		"url": "/auth",
		"chunkName": "layoutsAuthLayout",
		"moduleId": "./src/layouts/AuthLayout/index.js",
		"icon": "",
		"redirect": "",
		"type": "layout"
  },
];

// 临时菜单路由
export const tempMenus = [
  
];

// 非菜单路由
export const nonMenuRouters = [
	{
    "id": 9999,
    "parentId": 99,
    "name": "首页",
    "url": "/index",
    "chunkName": "rootIndexIndex",
    "moduleId": "./src/areas/root/Index/Index.js",
    "icon": "",
    "redirect": "",
    "type": "menu"
  },
  {
		"id": 8888,
		"parentId": 88,
		"name": '登录',
		"url": '/auth/login',
		"chunkName": "sharedAuthLogin",
		"moduleId": "./src/areas/shared/Auth/Login.js",
		"icon": "",
		"redirect": "",
		"type": "page"
  },
];

// 非菜单-子路由
export const childRouters = [];
