// +----------------------------------------------------------------------
// | CRMEB [ CRMEB赋能开发者，助力企业发展 ]
// +----------------------------------------------------------------------
// | Copyright (c) 2016~2024 https://www.crmeb.com All rights reserved.
// +----------------------------------------------------------------------
// | Licensed CRMEB并不是自由软件，未经许可不能去掉CRMEB相关版权
// +----------------------------------------------------------------------
// | Author: CRMEB Team <admin@crmeb.com>
// +----------------------------------------------------------------------

import Layout from '@/layout';

const staffRouter = {
  path: '/staff',
  component: Layout,
  redirect: '/staff/index',
  name: 'Staff',
  meta: {
    title: '用户',
    icon: 'clipboard',
  },
  children: [
    {
      path: 'index',
      component: () => import('@/views/staff/admin/index'),
      name: 'StaffIndex',
      meta: { title: '员工管理', icon: '' },
    },
  ],
};

export default staffRouter;
