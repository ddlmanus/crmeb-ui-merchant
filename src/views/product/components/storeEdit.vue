<template>
  <div class="detailSection padBox">
    <el-form
      ref="formValidate"
      v-loading="loading"
      class="formValidate"
      :model="formValidate"
      @submit.native.prevent
      :rules="rules"
    >
      <el-form-item v-if="!stockEdit" label="商户商品分类：" prop="cateIds">
        <el-cascader
          v-model="formValidate.cateIds"
          :options="merProductClassify"
          :props="props2"
          clearable
          class="from-ipt-width"
          :show-all-levels="false"
        />
      </el-form-item>
      <el-form-item label="商品属性：" class="labeltop">
        <el-table :data="ManyAttrValue" class="tabNumWidth" size="small">
          <template v-if="manyTabDate">
            <el-table-column v-for="(item, iii) in manyTabDate" :key="iii" :label="manyTabTit[iii].title">
              <template slot-scope="scope">
                <span class="priceBox" v-text="scope.row[iii]" />
              </template>
            </el-table-column>
          </template>
          <el-table-column label="图片">
            <template slot-scope="scope">
              <div class="line-heightOne">
                <div v-if="scope.row.image" class="tabPic line-heightOne"><img :src="scope.row.image" /></div>
              </div>
            </template>
          </el-table-column>
          <el-table-column v-for="(item, iii) in attrValue" :key="iii" :label="formThead[iii].title">
            <template slot-scope="scope">
              <el-input
                v-if="
                  (formThead[iii].title === '售价（元）' || (formThead[iii].title === '库存' && productType < 5)) &&
                  !stockEdit
                "
                v-model.trim="scope.row[iii]"
                type="number"
                :min="0"
                class="priceBox"
                @keyup.native="keyupEvent(iii, scope.row[iii], scope.$index)"
              />
              <span v-else>{{ scope.row[iii] }}</span>
            </template>
          </el-table-column>
          <!--增加库存-->
          <el-table-column v-if="stockEdit && productType !== 6" label="增加库存" align="right" min-width="120">
            <template slot-scope="scope">
              <el-form-item class="all line-heightOne">
                <el-input-number v-model.trim="scope.row.stockAdd" :step="1" step-strictly :min="0" class="priceBox" />
              </el-form-item>
            </template>
          </el-table-column>
          <!--云盘链接设置-->
          <el-table-column v-if="!stockEdit && productType === 5" label="链接设置" align="right">
            <template slot-scope="scope">
              <el-form-item class="all">
                <a @click="editVirtually(scope.$index, scope.row)">编辑链接</a>
              </el-form-item>
            </template>
          </el-table-column>
          <!--管理卡密，卡密库跳转-->
          <el-table-column
            v-if="productType === 6 && checkPermi(['merchant:card:secret:page:list'])"
            :label="stockEdit ? '补充卡密' : '管理卡密'"
            align="right"
          >
            <template slot-scope="scope">
              <el-form-item class="all">
                <a @click="handlerToAddCdkey(scope.row)">补充卡密</a>
              </el-form-item>
            </template>
          </el-table-column>
          <!--修改卡密库-->
          <el-table-column
            v-if="!stockEdit && productType === 6 && checkPermi(['merchant:card:secret:page:list'])"
            label="卡密设置"
            align="right"
          >
            <template slot-scope="scope">
              <el-form-item class="all">
                <a @click="handlerEeditCdkey(scope.$index, scope.row)">{{ scope.row.cdkeyLibraryName }}</a>
              </el-form-item>
            </template>
          </el-table-column>
        </el-table>
      </el-form-item>
      <el-form-item v-if="(stockEdit && productType !== 6) || !stockEdit">
        <el-button type="primary" @click="onSubmit('formValidate')">{{
          loadingBtn ? '提交中 ...' : '确 定'
        }}</el-button>
      </el-form-item>
    </el-form>
    <!-- 添加云盘-->
    <add-cloud-disk
      ref="cloudDiskRef"
      :cloudDisk="cloudDisk"
      @handlerSubSuccess="handlerSubSuccessCloudDisk"
      @closeCloudDisk="closeCloudDisk"
    ></add-cloud-disk>

    <!-- 选择卡密库-->
    <cdkey-library
      ref="cdkeyLibrary"
      v-if="cdkeyLibraryInfo"
      :cdkeyLibraryInfo="cdkeyLibraryInfo"
      @handlerSubSuccess="handlerChangeCdkeyIdSubSuccess"
    ></cdkey-library>
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

import { productDetailApi, productStockAddApi, productFreeEditApi } from '@/api/product';
import { mapGetters } from 'vuex';
import { checkPermi } from '@/utils/permission'; // 权限判断函数
import CdkeyLibrary from '@/views/product/components/cdkeyLibrary.vue';
import addCloudDisk from '@/views/product/components/addCloudDisk.vue';
const defaultObj = {
  cateIds: [], // 商品分类id
  cateId: null, // 商品分类id传值
  attrValue: [
    {
      image: '',
      price: 0,
      cost: 0,
      otPrice: 0,
      vipPrice: 0,
      stock: 0,
      weight: 0,
      volume: 0,
      brokerage: 0,
      brokerageTwo: 0,
    },
  ],
  attr: [],
  specType: false,
};
const objTitle = {
  price: {
    title: '售价（元）',
  },
  cost: {
    title: '成本价（元）',
  },
  otPrice: {
    title: '原价（元）',
  },
  vipPrice: {
    title: '会员价（元）',
  },
  stock: {
    title: '库存',
  },
  barCode: {
    title: '商品编号',
  },
  weight: {
    title: '重量（KG）',
  },
  volume: {
    title: '体积(m³)',
  },
  brokerage: {
    title: '一级返佣(%)',
  },
  brokerageTwo: {
    title: '二级返佣(%)',
  },
  stockAdd: {
    title: '增加库存',
  },
};
export default {
  name: 'edit',
  components: { addCloudDisk, CdkeyLibrary },
  props: {
    //id
    productId: {
      type: Number || String,
      default: 0 || '',
    },
    //编辑库存true，免审编辑false
    stockEdit: {
      type: Boolean,
      default: false,
    },
    //类型
    productType: {
      type: Number || String,
      default: 0 || '',
    },
    //佣金设置是否单独设置
    isSub: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      props2: {
        children: 'childList',
        label: 'name',
        value: 'id',
        multiple: true,
        emitPath: false,
        checkStrictly: true,
      },
      rules: {
        cateIds: [{ required: true, message: '请选择商户商品分类', trigger: 'change', type: 'array', min: '1' }],
        stockAdd: [{ required: true, message: '请输入库存', trigger: 'blur' }],
      },
      formValidate: Object.assign({}, defaultObj),
      formThead: Object.assign({}, objTitle),
      isAttr: false,
      ManyAttrValue: [
        {
          image: '',
          price: 0,
          cost: 0,
          otPrice: 0,
          vipPrice: 0,
          stock: 0,
          weight: 0,
          volume: 0,
          stockAdd: 0,
        },
      ], // 多规格
      manyTabTit: {},
      manyTabDate: {},
      loading: false,
      attrInfo: {},
      loadingBtn: false,
      cloudDisk: '', //云盘地址
      virtuallyIndex: 0, //索引
      cdkeyLibraryInfo: {}, //卡密库对象
    };
  },
  computed: {
    ...mapGetters(['merProductClassify']),
    attrValue() {
      const obj = Object.assign({}, defaultObj.attrValue[0]);
      delete obj.image;
      if (this.productType === 5) {
        delete obj.stock;
        delete obj.volume;
        delete obj.weight;
      }
      if (this.productType === 6) {
        delete obj.volume;
        delete obj.weight;
      }
      if (!this.isSub) {
        delete obj.brokerage;
        delete obj.brokerageTwo;
      }
      return obj;
    },
  },
  watch: {
    'formValidate.attr': {
      handler: function (val) {
        if (this.formValidate.specType && this.isAttr) this.watCh(val); //重要！！！
      },
      immediate: false,
      deep: true,
    },
  },
  created() {
    this.tempRoute = Object.assign({}, this.$route);
    if (this.formValidate.specType) {
      this.$watch('formValidate.attr', this.watCh);
    }
  },
  mounted() {
    this.getInfo();
  },
  methods: {
    checkPermi,
    // 补充卡密
    handlerToAddCdkey(row) {
      const { href } = this.$router.resolve({
        path: `/product/cdkey/creatCdkey/${row.cdkeyId}/${row.cdkeyLibraryName}`,
      });
      window.open(href);
    },
    //编辑卡密
    handlerEeditCdkey(index, data) {
      this.cdkeyLibraryInfo = {
        id: data.cdkeyId,
        name: data.cdkeyLibraryName,
      };
      this.ManyAttrValue[index].expand = data.expand;
      this.virtuallyIndex = index;
      this.$refs.cdkeyLibrary.cdkeyShow = true;
    },
    //选择卡密库回调
    handlerChangeCdkeyIdSubSuccess(row) {
      this.ManyAttrValue[this.virtuallyIndex].cdkeyLibraryName = row.name;
      this.ManyAttrValue[this.virtuallyIndex].cdkeyId = row.id;
    },
    //编辑云盘链接
    editVirtually(index, data) {
      this.ManyAttrValue[index].expand = data.expand;
      this.virtuallyIndex = index;
      this.cloudDisk = data.expand;
      this.$refs.cloudDiskRef.cloudDiskShow = true;
    },
    //确认提交云盘链接
    handlerSubSuccessCloudDisk(e) {
      this.cloudDisk = e;
      this.ManyAttrValue[this.virtuallyIndex].expand = JSON.parse(JSON.stringify(e));
      this.$refs.cloudDiskRef.cloudDiskShow = false;
    },
    closeCloudDisk() {
      this.$refs.cloudDiskRef.cloudDiskShow = false;
    },
    keyupEvent(key, val, index) {
      this.$forceUpdate();
      const regex = /^\d{1,6}(\.\d{1,2})?$/;
      const re = /^\D*([0-9](\d{1,5}(\.\d{1,2})?))?.*$/;
      // var re = /^\D*([0-9]\d*\.?\d{0,2})?.*$/;
      this.ManyAttrValue[index][key] =
        key === 'stock'
          ? parseInt(val)
          : regex.test(val)
          ? val
          : this.$set(this.ManyAttrValue[index], key, val.toString().replace(re, '$1'));
    },
    onSubmit(formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          if (this.stockEdit) {
            let data = [];
            let stockAdd = '';
            this.formValidate.attrValue.forEach((val, index) => {
              stockAdd = val.stockAdd;
            });
            if (!stockAdd && stockAdd !== 0) return this.$message.warning('增加库存不能为空');
            this.formValidate.attrValue.forEach((val, index) => {
              data.push({
                id: val.id,
                stock: val.stockAdd ? val.stockAdd : 0,
              });
            });
            productStockAddApi({
              attrValueList: data,
              id: this.productId,
            })
              .then((res) => {
                this.$message.success('操作成功');
                this.$emit('subSuccess');
                this.loadingBtn = false;
              })
              .catch((res) => {
                this.loadingBtn = false;
              });
          } else {
            let data = [];
            this.formValidate.cateId = this.formValidate.cateIds.join(',');
            this.formValidate.attrValue.forEach((val, index) => {
              data.push({
                id: val.id,
                stock: val.stock,
                price: val.price,
                expand: val.expand,
                cdkeyId: val.cdkeyId,
              });
            });
            productFreeEditApi({
              attrValue: data,
              id: this.productId,
              cateId: this.formValidate.cateId,
            })
              .then((res) => {
                this.$message.success('操作成功');
                this.$emit('subSuccess');
                this.loadingBtn = false;
              })
              .catch((res) => {
                this.loadingBtn = false;
              });
          }
        } else {
          return false;
        }
      });
    },
    watCh(val) {
      const tmp = {};
      const tmpTab = {};
      this.formValidate.attr.forEach((o, i) => {
        tmp[o.attrName] = { title: o.attrName };
        tmpTab[o.attrName] = '';
      });
      this.ManyAttrValue = this.attrFormat(val);
      this.ManyAttrValue.forEach((val, index) => {
        const key = Object.values(val.attrValue).sort().join('/');
        if (this.attrInfo[key]) this.ManyAttrValue[index] = this.attrInfo[key];
      });
      this.attrInfo = [];
      this.ManyAttrValue.forEach((val) => {
        this.attrInfo[Object.values(val.attrValue).sort().join('/')] = val;
      });
      this.manyTabTit = tmp;
      this.manyTabDate = tmpTab;
      this.formThead = Object.assign({}, this.formThead, tmp);
    },
    attrFormat(arr) {
      let data = [];
      const res = [];
      return format(arr);
      function format(arr) {
        if (arr.length > 1) {
          arr.forEach((v, i) => {
            if (i === 0) data = arr[i]['attrValue'];
            const tmp = [];
            if (!data) return;
            data.forEach(function (vv) {
              arr[i + 1] &&
                arr[i + 1]['attrValue'] &&
                arr[i + 1]['attrValue'].forEach((g) => {
                  const rep2 = (i !== 0 ? '' : arr[i]['attrName'] + '_') + vv + '$&' + arr[i + 1]['attrName'] + '_' + g;
                  tmp.push(rep2);
                  if (i === arr.length - 2) {
                    const rep4 = {
                      image: '',
                      price: 0,
                      cost: 0,
                      otPrice: 0,
                      vipPrice: 0,
                      barCode: '',
                      stock: 0,
                      weight: 0,
                      volume: 0,
                      brokerage: 0,
                      brokerageTwo: 0,
                      stockAdd: 0,
                    };
                    rep2.split('$&').forEach((h, k) => {
                      const rep3 = h.split('_');
                      if (!rep4['attrValue']) rep4['attrValue'] = {};
                      rep4['attrValue'][rep3[0]] = rep3.length > 1 ? rep3[1] : '';
                    });
                    for (let attrValueKey in rep4.attrValue) {
                      rep4[attrValueKey] = rep4.attrValue[attrValueKey];
                    }
                    res.push(rep4);
                  }
                });
            });
            data = tmp.length ? tmp : [];
          });
        } else {
          const dataArr = [];
          arr.forEach((v, k) => {
            v['attrValue'].forEach((vv, kk) => {
              dataArr[kk] = v['attrName'] + '_' + vv;
              res[kk] = {
                image: '',
                price: 0,
                cost: 0,
                otPrice: 0,
                vipPrice: 0,
                stock: 0,
                barCode: '',
                weight: 0,
                volume: 0,
                brokerage: 0,
                brokerageTwo: 0,
                stockAdd: 0,
                attrValue: { [v['attrName']]: vv },
              };
              for (let attrValueKey in res[kk].attrValue) {
                res[kk][attrValueKey] = res[kk].attrValue[attrValueKey];
              }
            });
          });
          data.push(dataArr.join('$&'));
        }
        return res;
      }
    },
    // 详情
    getInfo() {
      this.loading = true;
      productDetailApi(this.productId)
        .then(async (res) => {
          this.isAttr = true;
          let info = res;
          info.attrValue.forEach((val) => {
            val.stockAdd = 0;
          });
          this.formValidate = {
            attr: info.attr,
            attrValue: info.attrValue,
            specType: info.specType,
            cateIds: info.cateId.split(','), // 商品分类id
            cateId: info.cateId, // 商品分类id传值
          };
          if (info.specType) {
            this.formValidate.attr = info.attr.map((item) => {
              return {
                attrName: item.attrName,
                attrValue: item.attrValues.split(','),
              };
            });
            info.attrValue.forEach((val) => {
              val.image = this.$selfUtil.setDomain(val.image);
              val.attrValue = JSON.parse(val.attrValue);
              this.attrInfo[Object.values(val.attrValue).sort().join('/')] = val;
            });
            this.ManyAttrValue = info.attrValue;
            /***多规格商品如果被删除过sku，优先展示api返回的数据,否则会有没有删除的错觉***/
            let manyAttr = this.attrFormat(this.formValidate.attr);
            if (manyAttr.length !== this.ManyAttrValue.length) {
              this.$set(this, 'showAll', true);
              this.isAttr = false;
            } else {
              this.isAttr = true;
            }
            /*******/
            const tmp = {};
            const tmpTab = {};
            this.formValidate.attr.forEach((o, i) => {
              // tmp['value' + i] = { title: o.attrName }
              // tmpTab['value' + i] = ''
              tmp[o.attrName] = { title: o.attrName };
              tmpTab[o.attrName] = '';
            });

            // 此处手动实现后台原本value0 value1的逻辑
            this.formValidate.attrValue.forEach((item) => {
              for (let attrValueKey in item.attrValue) {
                item[attrValueKey] = item.attrValue[attrValueKey];
              }
            });

            this.manyTabTit = tmp;
            this.manyTabDate = tmpTab;
            this.formThead = Object.assign({}, this.formThead, tmp);
          } else {
            this.ManyAttrValue = info.attrValue;
          }
          this.loading = false;
        })
        .catch((res) => {
          this.loading = false;
        });
    },
  },
};
</script>

<style scoped lang="scss">
::v-deep .el-table__cell:first-child .cell,
::v-deep .el-table__cell:last-child .cell {
  padding-left: 20px !important;
  padding-right: 20px !important;
}
::v-deep .tabNumWidth {
  .el-form-item {
    margin-bottom: 0 !important;
  }
}
::v-deep .el-table__cell {
  padding: 0 !important;
}
.pictrue {
  border: none;
}
</style>
