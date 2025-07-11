// +----------------------------------------------------------------------
// | CRMEB [ CRMEB赋能开发者，助力企业发展 ]
// +----------------------------------------------------------------------
// | Copyright (c) 2016~2022 https://www.crmeb.com All rights reserved.
// +----------------------------------------------------------------------
// | Licensed CRMEB并不是自由软件，未经许可不能去掉CRMEB相关版权
// +----------------------------------------------------------------------
// | Author: CRMEB Team <admin@crmeb.com>
// +----------------------------------------------------------------------
import uploadFromComponent from './index.vue';
const goodListFrom = {};
goodListFrom.install = function (Vue, options) {
  const ToastConstructor = Vue.extend(uploadFromComponent);
  // 生成一个该子类的实例
  const instance = new ToastConstructor();
  instance.$mount(document.createElement('div'));
  document.body.appendChild(instance.$el);
  Vue.prototype.$modalActivityProduct = function (callback, handleNum, row, activityId, marketingType) {
    instance.visible = true;
    instance.callback = callback;
    instance.handleNum = handleNum; //多选还是单选
    instance.checked = row; // 选中的列表
    instance.activityId = activityId; //秒杀活动ID，商户端使用必传,秒杀使用
    instance.marketingType = marketingType; // 营销类型：0=基础商品,1=秒杀,2=拼团
  };
};
export default goodListFrom;
