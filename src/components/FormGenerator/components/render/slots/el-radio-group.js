// +----------------------------------------------------------------------
// | CRMEB [ CRMEB赋能开发者，助力企业发展 ]
// +----------------------------------------------------------------------
// | Copyright (c) 2016~2024 https://www.crmeb.com All rights reserved.
// +----------------------------------------------------------------------
// | Licensed CRMEB并不是自由软件，未经许可不能去掉CRMEB相关版权
// +----------------------------------------------------------------------
// | Author: CRMEB Team <admin@crmeb.com>
// +----------------------------------------------------------------------

export default {
  options(h, conf, key) {
    const list = [];
    conf.__slot__.options.forEach((item) => {
      if (conf.__config__.optionType === 'button') {
        list.push(<el-radio-button label={item.value}>{item.label}</el-radio-button>);
      } else {
        list.push(
          <el-radio label={item.value} border={conf.border}>
            {item.label}
          </el-radio>,
        );
      }
    });
    return list;
  },
};
