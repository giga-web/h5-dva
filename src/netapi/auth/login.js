import rpcService from '@/netapi/rpcService';
import { checkParams } from '@/utilities/util';

/* 接口地址 */
import { URL_AUTH_LOGIN } from '@/netapi/RestApiUrls';

/* 默认参数 */
const defaultParams = {
  account: 'super',
  password: '123456',
  tenantId: 1,
};

export async function rPostAuthLogin(params) {
  const response = await rpcService.rPost(URL_AUTH_LOGIN, checkParams(defaultParams, params));
  return response;
}
