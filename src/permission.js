// +----------------------------------------------------------------------
// | CRMEB [ CRMEB赋能开发者，助力企业发展 ]
// +----------------------------------------------------------------------
// | Copyright (c) 2016~2024 https://www.crmeb.com All rights reserved.
// +----------------------------------------------------------------------
// | Licensed CRMEB并不是自由软件，未经许可不能去掉CRMEB相关版权
// +----------------------------------------------------------------------
// | Author: CRMEB Team <admin@crmeb.com>
// +----------------------------------------------------------------------

import router from './router';
import store from './store';
import { Message } from 'element-ui';
import NProgress from 'nprogress'; // progress bar
import 'nprogress/nprogress.css'; // progress bar style
import { getToken, setToken } from '@/utils/auth'; // get token from cookie
import getPageTitle from '@/utils/get-page-title';
import Cookies from 'js-cookie';
import { getLoginInfo } from '@/libs/public';

NProgress.configure({ showSpinner: false }); // NProgress Configuration

const whiteList = ['/login', '/auth-redirect']; // no redirect whitelist

router.beforeEach(async (to, from, next) => {
  // start progress bar
  NProgress.start();
  // set page title
  document.title = getPageTitle(to.meta.title);
  if (to.query.token) {
    const { token, account, isSms, leftSquareLogo, leftTopLogo, realName } = to.query;
    getLoginInfo(to.query);
    await store.dispatch('user/getMenus');
    await store.dispatch('user/getInfo');
    await store.dispatch('settings/getFrontDomain');
    next();
    NProgress.done();
  } else {
    // determine whether the user has logged in
    const hasToken = getToken();
    if (hasToken) {
      if (to.path === '/login') {
        // if is logged in, redirect to the home page
        next({ path: '/' });
        NProgress.done();
      } else {
        const hasRoles = store.getters.roles && store.getters.roles.length > 0;
        if (hasRoles) {
          next();
        } else {
          try {
            if (hasToken) await store.dispatch('user/getInfo');
            next({ ...to, replace: true });
          } catch (error) {
            // remove token and go to login page to re-login
            await store.dispatch('user/resetToken');
            Message.error(error || 'Has Error');
            next(`/login?redirect=${to.path}`);
            NProgress.done();
          }
        }
      }
    } else {
      /* has no token*/
      if (whiteList.indexOf(to.path) !== -1) {
        // in the free login whitelist, go directly
        next();
      } else {
        // other pages that do not have permission to access are redirected to the login page.
        next(`/login?redirect=${to.path}`);
        NProgress.done();
      }
    }
  }
});

router.afterEach(() => {
  // finish progress bar
  NProgress.done();
});
