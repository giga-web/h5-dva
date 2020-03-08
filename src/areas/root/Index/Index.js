/* 开源-组件 */
import React from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
/* 自研-工具 */
import { handleParams } from '@/utilities/util';
/* 数据 */
import { store, addAsyncModel } from '@/store';
import { Index } from './Model';
/* 相对路径-样式 */
import styles from './Index.less';

/* 异步数据模型 */
addAsyncModel(Index);

/* 变量(方便使用) */
const { namespace } = Index;
const { dispatch } = store;

class IndexComponent extends React.Component {

  constructor(props) {
    super(props);

    // 同步地址拦到redux
    this.keep = handleParams.url(dispatch, namespace);

    this.state = {};
  }

  componentDidMount() {
    this.initData();
  }

  componentWillUnmount() {
    dispatch({ type: namespace + '/clean' });
  }

  initData = () => {
    dispatch({ type: namespace + '/rGet' });
  }

  render() {
    return (
      <div className={styles.pageWarp}>
        <Link to="/auth/login">登录</Link>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    pagedata: Object.assign({ ...state[namespace] }, {
      loading: state.loading.models[namespace],
    }),
  };
}

export default connect(mapStateToProps)(IndexComponent);