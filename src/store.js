import window from 'global/window';

import isPlainObject from 'is-plain-object';
import invariant from 'invariant';
import warning from 'warning';

import { createStore, applyMiddleware, compose, combineReducers } from 'redux';
import * as saga from 'redux-saga';
import * as sagaEffects from 'redux-saga/effects'

import { createHashHistory } from 'history';

import Loading from '@/loading';

const createSagaMiddleware = saga.default;

const takeEvery = sagaEffects.takeEvery;
const takeLatest = sagaEffects.takeLatest;
const throttle = sagaEffects.throttle;

const { onEffect, extraReducers } = Loading();

const NAMESPACE_SEP = '/';
const isArray = Array.isArray.bind(Array);
const isFunction = o => typeof o === 'function';
const isAllFunction = (obj) => Object.keys(obj).every(key => isFunction(obj[key]));
const noop = () => {};

const onError = (err, extension) => {
  if (err) {
    if (typeof err === 'string') {
      err = new Error(err)
    }
    err.preventDefault = () => {
      err._dontReject = true;
    };
    throw new Error(err.stack || err);
  }
};

const prefix = function prefix(obj, namespace, type) {
  return Object.keys(obj).reduce((memo, key) => {
    // warning(
    //   key.indexOf(`${namespace}${NAMESPACE_SEP}`) !== 0,
    //   `[prefixNamespace]: ${type} ${key} should not be prefixed with namespace ${namespace}`,
    // );
    let newKey = `${key}`;
    // 没有前缀才添加前缀
    if (key.indexOf(`${namespace}${NAMESPACE_SEP}`) !== 0) {
      newKey = `${namespace}${NAMESPACE_SEP}${key}`;
    }
    memo[newKey] = obj[key];
    return memo;
  }, {});
}

const prefixType = function prefixType(type, model) {
  const prefixedType = `${model.namespace}${NAMESPACE_SEP}${type}`;
  const typeWithoutAffix = prefixedType.replace(/\/@@[^/]+?$/, '');
  if ((model.reducers && model.reducers[typeWithoutAffix])
    || (model.effects && model.effects[typeWithoutAffix])) {
    return prefixedType;
  }
  return type;
}

const prefixedDispatch = function prefixedDispatch(dispatch, model) {
  return (action) => {
    const { type } = action;
    invariant(type, 'dispatch: action should be a plain Object with type');
    warning(
      type.indexOf(`${model.namespace}${NAMESPACE_SEP}`) !== 0,
      `dispatch: ${type} should not be prefixed with namespace ${model.namespace}`,
    );
    return dispatch({ ...action, type: prefixType(type, model) });
  };
}

const getReducer = function getReducer(model) {
  const reducers = model.reducers || {};
  const stateDefault = model.state;

  return (state = stateDefault, action) => {
    const handlers = Object.keys(reducers).map((type) => {
      const actionType = type;
      return (state, action) => {
        const { type } = action;
        invariant(type, 'dispatch: action should be a plain Object with type');
        if (actionType === type) {
          return reducers[type](state, action);
        }
        return state;
      };
    });

    return handlers.reduce((p, r) => {
      return r(p, action);
    }, state);
  };
}

// getSaga start
const getSaga = function getSaga(model) {
  return function* () {
    for (const key in model.effects) {
      if (Object.prototype.hasOwnProperty.call(model.effects, key)) {
        const watcher = getWatcher(key, model.effects[key], model);
        const task = yield sagaEffects.fork(watcher);
        yield sagaEffects.fork(function*() {
          yield sagaEffects.take(`${model.namespace}/@@CANCEL_EFFECTS`);
          yield sagaEffects.cancel(task);
        });
      }
    }
  };
}

function getWatcher(key, Effect, model) {
  let effect = Effect;
  let type = 'takeEvery';
  let ms;

  if (isArray(Effect)) {
    effect = Effect[0];

    const opts = Effect[1];
    if (opts && opts.type) {
      type = opts.type;
      if (type === 'throttle') {
        invariant(
          opts.ms,
          'start: opts.ms should be defined if type is throttle'
        );
        ms = opts.ms;
      }
    }

    invariant(
      ['watcher', 'takeEvery', 'takeLatest', 'throttle'].indexOf(type) > -1,
      'start: effect type should be takeEvery, takeLatest, throttle or watcher'
    );
  }

  const sagaWithOnEffect = applyOnEffect(onEffect, sagaWithCatch, model, key);

  switch (type) {
    case 'watcher':
      return sagaWithCatch;
    case 'takeLatest':
      return function*() {
        yield takeLatest(key, sagaWithOnEffect);
      };
    case 'throttle':
      return function*() {
        yield throttle(ms, key, sagaWithOnEffect);
      };
    default:
      return function*() {
        yield takeEvery(key, sagaWithOnEffect);
      };
  }

  function* sagaWithCatch(...args) {
    const { __dva_resolve: resolve = noop, __dva_reject: reject = noop } =
      args.length > 0 ? args[0] : {};

    try {
      yield sagaEffects.put({ type: `${key}${NAMESPACE_SEP}@@start` });
      const ret = yield effect(...args.concat(createEffects(model)));
      yield sagaEffects.put({ type: `${key}${NAMESPACE_SEP}@@end` });
      resolve(ret);
    } catch (e) {
      onError(e, { key, effectArgs: args });
      if (!e._dontReject) {
        reject(e);
      }
    }
  }
}

function createEffects(model) {
  const put = function put(action) {
    const { type } = action;
    assertAction(type, 'sagaEffects.put');
    return sagaEffects.put({ ...action, type: prefixType(type, model) });
  }

  put.resolve = function putResolve(action) {
    // https://github.com/redux-saga/redux-saga/issues/336
    const { type } = action;
    assertAction(type, 'sagaEffects.put.resolve');
    return sagaEffects.put.resolve({ ...action, type: prefixType(type, model) });
  }

  const take = function take(type) {
    if (typeof type === 'string') {
      assertAction(type, 'sagaEffects.take');
      return sagaEffects.take(prefixType(type, model));
    } else if (isArray(type)) {
      return sagaEffects.take(
        type.map(t => {
          if (typeof t === 'string') {
            assertAction(t, 'sagaEffects.take');
            return prefixType(type, model);
          }
          return t;
        })
      );
    } else {
      return sagaEffects.take(type);
    }
  }

  return { ...sagaEffects, put, take };

  function assertAction(type, name) {
    invariant(type, 'dispatch: action should be a plain Object with type');
    warning(
      type.indexOf(`${model.namespace}${NAMESPACE_SEP}`) !== 0,
      `[${name}] ${type} should not be prefixed with namespace ${
        model.namespace
      }`
    );
  }
}

function applyOnEffect(fn, effect, model, key) {
  effect = fn(effect, sagaEffects, model, key);
  return effect;
}
// getSaga end

const addSyncModel = function addSyncModel(m) {
  const { namespace, reducers, effects, subscriptions } = m;

  if (process.env.NODE_ENV !== 'production') {
    // namespace 必须被定义
    invariant(
      namespace,
      `addSyncModel namespace should be defined`,
    );
    // 并且是字符串
    invariant(
      typeof namespace === 'string',
      `addSyncModel namespace should be string, but got ${typeof namespace}`,
    );
    // 并且唯一
    // invariant(
    //   !modelsEx.some(m => m.namespace === namespace),
    //   `addSyncModel namespace should be unique`,
    // );
    // reducers 可以为空，PlainObject 或者数组
    if (reducers) {
      invariant(
        isPlainObject(reducers) || isArray(reducers),
        `addSyncModel reducers should be plain object or array, but got ${typeof reducers}`,
      );
      // 数组的 reducers 必须是 [Object, Function] 的格式
      invariant(
        !isArray(reducers) || (isPlainObject(reducers[0]) && isFunction(reducers[1])),
        `addSyncModel reducers with array should be [Object, Function]`,
      );
    }
    // effects 可以为空，PlainObject
    if (effects) {
      invariant(
        isPlainObject(effects),
        `addSyncModel effects should be plain object, but got ${typeof effects}`,
      );
    }
    if (subscriptions) {
      // subscriptions 可以为空，PlainObject
      invariant(
        isPlainObject(subscriptions),
        `addSyncModel subscriptions should be plain object, but got ${typeof subscriptions}`,
      );
      // subscription 必须为函数
      invariant(
        isAllFunction(subscriptions),
        `addSyncModel subscription should be function`,
      );
    }
  }

  // 确保只添加一次
  if (modelsEx.some(m => m.namespace === namespace)) {
    return m;
  }

  if (reducers) {
    if (isArray(reducers)) {
      m.reducers[0] = prefix(reducers[0], namespace, 'reducer');
    } else {
      m.reducers = prefix(reducers, namespace, 'reducer');
    }
  }

  if (effects) {
    m.effects = prefix(effects, namespace, 'effect');
  }

  modelsEx.push(m);
  
  return m;
}

const addAsyncModel = function addAsyncModel(m) {
  // 重复时直接返回
  if (m && modelsEx.some(t => t.namespace === m.namespace)) {
    return;
  }

  m = addSyncModel(m);

  store.asyncReducers[m.namespace] = getReducer(m);
  store.replaceReducer(combineReducers({ ...reducers, ...extraReducers, ...store.asyncReducers }));

  if (m.effects) {
    sagaMiddleware.run(getSaga(m));
  }

  if (m.subscriptions) {
    unlisteners[m.namespace] = runSubscription(m.subscriptions, m, patchHistory);
  }
}

const unlistenSubscription = function unlistenSubscription (namespace) {
  if (!unlisteners[namespace]) {
    return;
  }

  const { funcs, nonFuncs } = unlisteners[namespace];

  warning(
    nonFuncs.length === 0,
    `[removeModel] subscription should return unlistener function, check these subscriptions ${nonFuncs.join(', ')}`,
  );

  for (const unlistener of funcs) {
    unlistener();
  }

  delete unlisteners[namespace];
}

// 目前这个方法不应该使用，会有问题
// 就算你 CANCEL_EFFECTS 了 saga，saga 中的数据依然存在
// 他会影响 store 中的 inputState，而产生报错（虽然只在开发环境报错）
// 目前使用 clean 来做数据的清理
const removeModel = function removeModel (namespace) {
  // Delete reducers
  delete store.asyncReducers[namespace];
  delete reducers[namespace];
  store.replaceReducer(combineReducers({ ...reducers, ...extraReducers, ...store.asyncReducers }));

  store.dispatch({ type: '@@dva/UPDATE' });

  // Cancel effects
  store.dispatch({ type: `${namespace}/@@CANCEL_EFFECTS` });

  // Unlisten subscrioptions
  unlistenSubscription(namespace);

  // Delete model from modelsEx
  modelsEx = modelsEx.filter(model => model.namespace !== namespace);
};

const runSubscription = function runSubscription(subs, model, patchHistory) {
  const funcs = [];
  const nonFuncs = [];

  for (const key in subs) {
    if (Object.prototype.hasOwnProperty.call(subs, key)) {
      const sub = subs[key];
      const unlistener = sub({
        dispatch: prefixedDispatch(store.dispatch, model),
        history: patchHistory,
      }, onError);
      if (isFunction(unlistener)) {
        funcs.push(unlistener);
      } else {
        nonFuncs.push(key);
      }
    }
  }

  return { funcs, nonFuncs };
}



const history = createHashHistory();
const patchHistory = (function patchHistory(history) {
  const oldListen = history.listen;
  history.listen = function patchListen (callback) {
    callback(history.location);
    return oldListen.call(history, callback);
  };
  return history;
})(history);

// 用于保存 models
let modelsEx = [];

// 内部 model，在进行 unmodel 时更新 state
addSyncModel({
  namespace: '@@dva',
  state: 0,
  reducers: {
    UPDATE(state) {
      return state + 1;
    },
  },
});

// 加载全部 models
// try {
//   require('./models/index').default.forEach((item, index) => {
//     addSyncModel(item.default);
//   });
// } catch (e) {
//   console.log(e);
// }

// 用于保存 sagas
const sagas = [];

// 用于保存 reducers
const reducers = {};

// 根据 models 得到 reducers 和 sagas
for (const m of modelsEx) {
  reducers[m.namespace] = getReducer(m);
  if (m.effects) {
    sagas.push(getSaga(m));
  }
}

// 所有 redux 中间件
const sagaMiddleware = createSagaMiddleware();
const promiseMiddleware = () => {
  return (next) => {
    return (action) => {
      const { type } = action;

      if (isEffect(type)) {
        return new Promise((resolve, reject) => {
          next({
            __dva_resolve: resolve,
            __dva_reject: reject,
            ...action,
          });
        });
      } else {
        return next(action);
      }

      function isEffect(type) {
        if (!type || typeof type !== 'string') {
          return false;
        }
        const [namespace] = type.split(NAMESPACE_SEP);
        const model = modelsEx.filter(m => m.namespace === namespace)[0];
        if (model) {
          if (model.effects && model.effects[type]) {
            return true;
          }
        }
        return false;
      }
    }
  }
};
const middlewares = [ promiseMiddleware, sagaMiddleware];

// 开发者工具
let devtools;
if (process.env.NODE_ENV !== 'production' && window.__REDUX_DEVTOOLS_EXTENSION__) {
  devtools = window.__REDUX_DEVTOOLS_EXTENSION__;
} else {
  devtools = () => noop => noop;
}

// 所有 redux 增强
const enhancers = [applyMiddleware(...middlewares), devtools(window.__REDUX_DEVTOOLS_EXTENSION__OPTIONS)];
/*
const enhancers = [applyMiddleware(...middlewares), devtools({
  actionSanitizer: (action) => {
    // console.log(action);
    return (
      action.type === 'FILE_DOWNLOAD_SUCCESS' && action.data ?
      { ...action, data: '<<LONG_BLOB>>' } : action
    );
  },
  stateSanitizer: (state) => {
    // console.log(state);
    return state.data ? { ...state, data: '<<LONG_BLOB>>' } : state;
  }
})];
*/

// 创建 store
const store = createStore(combineReducers({ ...reducers, ...extraReducers }), compose(...enhancers));

// 运行 action 监听器，等待 dispatch 符合规则的 action 执行关联的函数
sagas.forEach(sagaMiddleware.run);

// 运行订阅，并保存取消订阅的引用
const unlisteners = {};
for (const model of modelsEx) {
  if (model.subscriptions) {
    unlisteners[model.namespace] = runSubscription(model.subscriptions, model, patchHistory);
  }
}

// 扩展 store - 用于保存异步 reduxs
store.asyncReducers = {};

export {
  store,
  removeModel,
  addAsyncModel,
  patchHistory as history,
}
