<template>
  <div class="components-container">
    <category-list :biztype="constants.categoryType[0]" />
  </div>
</template>

<script>
// +----------------------------------------------------------------------
// | CRMEB [ CRMEB赋能开发者，助力企业发展 ]
// +----------------------------------------------------------------------
// | Copyright (c) 2016~2024 https://www.crmeb.com All rights reserved.
// +----------------------------------------------------------------------
// | Licensed CRMEB并不是自由软件，未经许可不能去掉CRMEB相关版权
// +----------------------------------------------------------------------
// | Author: CRMEB Team <admin@crmeb.com>
// +----------------------------------------------------------------------

import categoryList from '@/components/Category/list';
export default {
  components: { categoryList },
  data() {
    return {
      constants: this.$constants,
    };
  },
};
</script>

<style scoped></style>
