import rpcService from '@/netapi/rpcService';
import { checkParams } from '@/utilities/util';

/* 接口地址 */
import { URL_ORG_POSITION_DIVISIONS } from '@/netapi/RestApiUrls';

/* 默认参数 */
const defaultParams = {
  pageindex: 0,
  pagesize: 20,
};

export async function rGetOrgPositionDivisions(params) {
  const response = await rpcService.rGet(URL_ORG_POSITION_DIVISIONS + checkParams(defaultParams, params, true));
  return response;
}
