<template>
  <el-dialog
    title="修改配送信息"
    :visible.sync="visible"
    width="540px"
    :before-close="handleClose"
    class="dialog-bottom"
  >
    <el-form ref="formItem" :model="formItem" label-width="75px" @submit.native.prevent :rules="rules">
      <SendFrom :formItem="formItem" :isShowBtn="false"></SendFrom>
    </el-form>
    <div slot="footer">
      <el-button size="mini" @click="handleClose">取消</el-button>
      <el-button
        :loading="loadingBtn"
        size="smalll"
        type="primary"
        @click="handleSubmit('formItem')"
        v-hasPermi="['merchant:order:invoice:update']"
        >提交</el-button
      >
    </div>
  </el-dialog>
</template>

<script>
import { useLogistics } from '@/hooks/use-order';
import { Debounce } from '@/utils/validate';
import { orderInvoiceUpdateApi } from '@/api/order';
import { postRules } from '@/views/order/default';
import SendFrom from './sendFrom';

export default {
  name: 'editDelivery',
  props: {
    visible: {
      type: Boolean,
      required: false,
    },
    editData: {
      type: Object,
      required: null,
    },
  },
  components: { SendFrom },
  data() {
    return {
      formItem: {
        carrierPhone: '',
        deliveryCarrier: '',
        deliveryMark: '',
        expressCode: '',
        expressNumber: '',
        id: 0,
      },
      rules: postRules,
      logistics: [],
      loadingBtn: false,
    };
  },
  watch: {
    visible: {
      handler: function (val) {
        if (val) this.getLogistics();
      },
      deep: true,
    },
    editData: {
      handler: function (val) {
        this.formItem = {
          ...this.editData,
          expressNumber: this.editData.expressNumber ? this.editData.expressNumber : this.editData.trackingNumber,
        };
      },
      deep: true,
    },
  },
  mounted() {
    if (this.visible) this.getLogistics();
  },
  methods: {
    handleClose() {
      this.$emit('onCloseVisible');
      this.formItem = {
        ...this.editData,
        expressNumber: this.editData.expressNumber ? this.editData.expressNumber : this.editData.trackingNumber,
      };
      this.$refs.formItem.resetFields();
    },
    handleSubmitSuccess() {
      this.$emit('onSubmitSuccess');
      this.loadingBtn = false;
      this.$refs.formItem.resetFields();
    },
    //物流公司
    async getLogistics() {
      const params = {
        keywords: '',
        page: 1,
        limit: 50,
        openStatus: true,
      };
      this.logistics = await useLogistics(params);
    },
    //提交
    handleSubmit: Debounce(function (name) {
      this.$refs[name].validate((valid) => {
        if (valid) {
          this.loadingBtn = true;
          const { carrierPhone, deliveryCarrier, deliveryMark, expressCode, expressNumber, id } = this.formItem;
          let data = {
            carrierPhone: carrierPhone,
            deliveryCarrier: deliveryCarrier,
            deliveryMark: deliveryMark,
            expressCode: expressCode,
            expressNumber: expressNumber,
            id: id,
          };
          orderInvoiceUpdateApi(data)
            .then((res) => {
              this.$message.success('修改发货单配送信息成功');
              this.handleSubmitSuccess();
            })
            .catch((res) => {
              this.loadingBtn = false;
            });
        }
      });
    }),
  },
};
</script>

<style scoped></style>
