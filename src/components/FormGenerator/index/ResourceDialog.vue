<template>
  <div>
    <el-dialog
      v-bind="$attrs"
      title="外部资源引用"
      width="600px"
      :close-on-click-modal="false"
      v-on="$listeners"
      @open="onOpen"
      @close="onClose"
    >
      <el-input
        v-for="(item, index) in resources"
        :key="index"
        v-model="resources[index]"
        class="url-item"
        placeholder="请输入 css 或 js 资源路径"
        prefix-icon="el-icon-link"
        clearable
      >
        <el-button slot="append" icon="el-icon-delete" @click="deleteOne(index)" />
      </el-input>
      <el-button-group class="add-item">
        <el-button plain @click="addOne('https://cdn.bootcss.com/jquery/1.8.3/jquery.min.js')"> jQuery1.8.3 </el-button>
        <el-button plain @click="addOne('https://unpkg.com/http-vue-loader')"> http-vue-loader </el-button>
        <el-button icon="el-icon-circle-plus-outline" plain @click="addOne('')"> 添加其他 </el-button>
      </el-button-group>
      <div slot="footer">
        <el-button @click="close"> 取消 </el-button>
        <el-button type="primary" @click="handelConfirm"> 确定 </el-button>
      </div>
    </el-dialog>
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

export default {
  components: {},
  inheritAttrs: false,
  props: ['originResource'],
  data() {
    return {
      resources: null,
    };
  },
  computed: {},
  watch: {},
  created() {},
  mounted() {},
  methods: {
    onOpen() {
      this.resources = this.originResource.length ? JSON.parse(JSON.stringify(this.originResource)) : [''];
    },
    onClose() {},
    close() {
      this.$emit('update:visible', false);
    },
    handelConfirm() {
      const results = this.resources.filter((item) => !!item) || [];
      this.$emit('save', results);
      this.close();
      if (results.length) {
        this.resources = results;
      }
    },
    deleteOne(index) {
      this.resources.splice(index, 1);
    },
    addOne(url) {
      if (this.resources.indexOf(url) > -1) {
        this.$message('资源已存在');
      } else {
        this.resources.push(url);
      }
    },
  },
};
</script>
<style lang="scss" scoped>
.add-item {
  margin-top: 8px;
}
.url-item {
  margin-bottom: 12px;
}
</style>
