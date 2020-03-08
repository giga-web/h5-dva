import { namespace } from './config';


// ====================================================
// 个人设置
export const KEY_USER_SETTING = namespace + '_' + 'usersetting';
export const USER_DEFAULT_SETTING = {
  city: {
    defaultCity: '深圳',
    selectedCity: undefined,
    locationCity: undefined,
  },
  token: undefined,
};
// ====================================================


// ====================================================
// 菜单
export const SYS_CSL_MST_MENU = namespace + '_' + 'menu';
// ====================================================


// ====================================================
// 页面标题
export const PAGE_TITLE = namespace + '_' + 'K-SaaS';
// ====================================================
