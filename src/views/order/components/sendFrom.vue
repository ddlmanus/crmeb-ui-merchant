<template>
  <div>
    <el-form-item v-if="formItem.deliveryType === 'express'" label="快递公司：" prop="expressCode">
      <el-select v-model="formItem.expressCode" filterable :style="isShowBtn ? 'width: 82%' : 'width:100%'">
        <el-option v-for="(item, i) in express" :value="item.code" :key="i" :label="item.name"></el-option>
      </el-select>
      <el-button
        v-show="isShowBtn"
        style="margin-left: 24px"
        type="primary"
        size="small"
        @click="handleCreat"
        v-hasPermi="['merchant:express:relate']"
        >设置物流公司</el-button
      >
    </el-form-item>
    <el-form-item v-if="formItem.deliveryType === 'express'" label="快递单号：" prop="expressNumber">
      <el-input v-model.trim="formItem.expressNumber" placeholder="请输入快递单号"></el-input>
    </el-form-item>
    <el-form-item v-if="formItem.deliveryType === 'noNeed'" label="发货备注：">
      <el-input
        v-model.trim="formItem.deliveryMark"
        show-word-limit
        :autosize="{ minRows: 4 }"
        maxlength="250"
        type="textarea"
        placeholder="请输入备注信息，最多可输入250字"
      ></el-input>
    </el-form-item>
    <el-form-item v-if="formItem.deliveryType === 'merchant'" label="配送人员：" prop="deliveryCarrier">
      <el-input v-model.trim="formItem.deliveryCarrier" placeholder="请输入配送人员"></el-input>
    </el-form-item>
    <el-form-item v-if="formItem.deliveryType === 'merchant'" label="手机号码：" prop="carrierPhone">
      <el-input v-model.trim="formItem.carrierPhone" placeholder="请输入配送人员手机号码"></el-input>
    </el-form-item>
    <!--物流公司-->
    <creat-express ref="craetExpressRef" @handlerSuccessSubmit="getList"></creat-express>
  </div>
</template>

<script>
import CreatExpress from '@/views/systemSetting/logisticsManagement/creatExpress.vue';
import { useLogistics } from '@/hooks/use-order';
export default {
  name: 'sendFrom',
  components: { CreatExpress },
  data() {
    return {
      express: [],
    };
  },
  props: {
    formItem: {
      type: Object,
      default: null,
    },
    isShowBtn: {
      type: Boolean,
      default: false,
    },
  },
  mounted() {
    this.getList();
  },
  methods: {
    // 添加
    handleCreat() {
      if (!localStorage.getItem('expressAllList')) this.$refs.craetExpressRef.getExpressList();
      this.$refs.craetExpressRef.dialogVisible = true;
    },
    // 物流公司列表
    async getList() {
      const params = {
        keywords: '',
        page: 1,
        limit: 50,
        openStatus: true,
      };
      this.express = await useLogistics(params);
      this.express.map((item) => {
        if (item.isDefault && !this.formItem.id) this.formItem.expressCode = item.code;
      });
    },
  },
};
</script>

<style scoped></style>
