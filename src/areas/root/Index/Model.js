/* 接口 */
import { rGetOrgPositionDivisions } from '@/netapi/org/positiondivisions';

/* 命名空间(全局唯一) */
const namespacePrefix = 'Index/Index';

// ====================================================
// 部门划分
const IndexState = {};

export const Index = {
  namespace: namespacePrefix,

  state: IndexState,

  effects: {
    *rGet({ payload }, { call, put }) {
      const response = yield call(rGetOrgPositionDivisions, payload);
      if (response === undefined) { return; }

      yield put({ type: 'save', payload: response.data });
    },
  },

  reducers: {
    clear() { return IndexState; },
    save(state, { payload }) {
      return {
        ...state,
        ...payload,
      };
    }
  }
};
// ====================================================
