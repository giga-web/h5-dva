import React from 'react';
import { Link } from 'react-router-dom';

import styles from './Login.less';

export default function LoginComponent() {
  return (
    <div className={styles.pageWarp}>
      <Link to="/">首页</Link>
    </div>
  );
}