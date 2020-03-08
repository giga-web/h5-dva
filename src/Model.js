/* 命名空间(全局唯一) */
const namespacePrefix = 'global';


// ====================================================
// 全局
const GlobalState = {
  collapsed: false,
  notices: [
    {
      "id": "xxx1",
      "title": "Alipay",
      "logo": "antdpro/WdGqmHpayyMjiEhcKoVE.png",
      "description": "那是一种内在的东西，他们到达不了，也无法触及的",
      "updatedAt": "2020-01-23T07:34:23.443Z",
      "member": "科学搬砖组",
      "href": "",
      "memberLink": ""
    },
  ],
};

export const Global = {
  namespace: namespacePrefix,
  state: GlobalState,
  effects: {},
  reducers: {
    changeLayoutCollapsed(state, action) {
      return { ...state, collapsed: action.payload };
    },
  },
  subscriptions: {
    setup({ history }) {
      // return history.listen(({ pathname, search }) => {
      //   // 本地验证token
      //   localVerifyToken();
      // });
    },
  },
}
// ====================================================
