<template>
  <div class="iconBox">
    <el-input
      ref="search"
      v-model.trim="iconVal"
      placeholder="输入关键词搜索,注意全是英文"
      clearable
      style="width: 300px"
      @input="upIcon(iconVal)"
    />
    <div class="icons-container">
      <div class="grid">
        <div v-for="item of list" :key="item" @click="handleClipboard(generateElementIconCode(item), $event, item)">
          <el-tooltip placement="top">
            <div slot="content">
              {{ generateElementIconCode(item) }}
            </div>
            <div class="icon-item">
              <i :class="'el-icon-' + item" />
              <span>{{ item }}</span>
            </div>
          </el-tooltip>
        </div>
      </div>
    </div>
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
import elementIcons from '../js/element-icons';

export default {
  name: 'iconFrom',
  data() {
    return {
      elementIcons,
      iconVal: '',
      modals2: false,
      list: [],
    };
  },
  mounted() {
    this.list = this.elementIcons;
  },
  methods: {
    generateElementIconCode(symbol) {
      return `<i class="el-icon-${symbol}" />`;
    },
    handleClipboard(text, event, n) {
      this.iconChange(n);
      //  clipboard(text, event)
    },
    // 搜索
    upIcon(n) {
      const arrs = [];
      for (var i = 0; i < this.elementIcons.length; i++) {
        if (this.elementIcons[i].indexOf(n) !== -1) {
          arrs.push(this.elementIcons[i]);
          this.list = arrs;
        }
      }
    },
    iconChange(n) {
      this.$emit('getIcon', n);
      this.$msgbox.close();
    },
  },
};
</script>

<style lang="scss" scoped>
.icons-container {
  margin: 10px 20px 0;
  overflow: hidden;

  .grid {
    position: relative;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }

  .icon-item {
    margin: 10px 20px;
    text-align: center;
    width: 100px;
    float: left;
    font-size: 30px;
    color: #24292e;
    cursor: pointer;
  }

  span {
    display: block;
    font-size: 16px;
    margin-top: 10px;
  }

  .disabled {
    pointer-events: none;
  }
}
</style>
