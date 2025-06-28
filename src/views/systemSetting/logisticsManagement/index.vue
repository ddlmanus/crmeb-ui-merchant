<template>
  <div class="divBox">
    <el-card
      :bordered="false"
      shadow="never"
      class="ivu-mt"
      v-hasPermi="['merchant:shipping:templates:list']"
      :body-style="{ padding: 0 }"
    >
      <div class="padding-add">
        <el-form ref="form" inline :model="form" @submit.native.prevent label-position="right">
          <el-form-item label="关键字：">
            <el-input
              @keyup.enter.native="getDataList(1)"
              v-model="form.keywords"
              placeholder="请输入关键字"
              class="selWidth"
              size="small"
              clearable
            >
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="small" v-debounceClick="2000" @click="getDataList(1)">查询</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
    <el-card shadow="never" :bordered="false" class="box-card mt14" :body-style="{ padding: '20px' }">
      <el-button type="primary" size="small" @click="handleCreat" v-hasPermi="['merchant:express:relate']"
        >新增</el-button
      >
      <el-table v-loading="loading" :data="tableData.data" class="mt20" size="small">
        <el-table-column prop="id" label="ID" min-width="60" />
        <el-table-column label="物流公司名称" min-width="200" prop="name" :show-overflow-tooltip="true">
          <template slot-scope="{ row }">
            <span v-if="row.isDefault" class="font-color">[默认]</span>
            <span>{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="编码" min-width="150" prop="code" />
        <el-table-column label="状态" min-width="150" prop="createTime">
          <template slot-scope="scope">
            <el-switch
              v-if="checkPermi(['merchant:express:open:switch'])"
              v-model="scope.row.isOpen"
              :active-value="true"
              :inactive-value="false"
              active-text="开启"
              inactive-text="关闭"
              v-throttle="1000"
              :disabled="scope.row.isDefault"
              @change="handleStatusChange(scope.row)"
            ></el-switch>
            <div v-else>{{ scope.row.isOpen ? '开启' : '关闭' }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="address" fixed="right" width="120" label="操作">
          <template slot-scope="scope">
            <a @click="handleDelete(scope.row)" v-hasPermi="['merchant:express:delete']">删除</a>
            <template v-if="scope.row.isOpen && checkPermi(['merchant:express:default:switch'])">
              <el-divider direction="vertical"></el-divider>
              <a @click="handleSetDefault(scope.row)">{{ scope.row.isDefault ? '取消默认' : '设为默认' }}</a>
            </template>
          </template>
        </el-table-column>
      </el-table>
      <div class="block-pagination">
        <el-pagination
          background
          :page-sizes="$constants.page.limit"
          :page-size="tableData.limit"
          :current-page="tableData.page"
          layout="total, sizes, prev, pager, next, jumper"
          :total="tableData.total"
          @current-change="pageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <creat-express ref="craetExpressRef" @handlerSuccessSubmit="getDataList(1)" :datekey="datekey"></creat-express>
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

import * as logistics from '@/api/logistics.js';
import { checkPermi } from '@/utils/permission';
import { handleDeleteTable } from '@/libs/public';
import CreatExpress from './creatExpress.vue';
import { useLogisticsAllList } from '@/hooks/use-order'; // 权限判断函数
export default {
  name: 'ShippingTemplates',
  components: { CreatExpress },
  data() {
    return {
      form: {
        keywords: '',
        page: 1,
        limit: this.$constants.page.limit[0],
      },
      tableData: {
        data: [],
        total: 0,
      },
      loading: false,
      expressAllList: [],
      datekey: 0,
    };
  },
  created() {
    if (checkPermi(['merchant:express:search:page'])) this.getDataList(1);
    if (!localStorage.getItem('expressAllList')) this.getExpressList();
  },
  methods: {
    checkPermi,
    // 物流公司列表
    async getExpressList() {
      this.expressAllList = await useLogisticsAllList();
    },
    // 添加
    handleCreat() {
      this.datekey = +new Date();
      //this.$refs.craetExpressRef.dialogVisible = true;
    },
    // 分页
    pageChange(e) {
      this.page = e;
      this.getDataList();
    },
    handleSizeChange(e) {
      this.limit = e;
      this.getDataList();
    },
    //修改状态
    handleStatusChange(row) {
      logistics.expressOpenSwitchApi(row.id).then((res) => {
        this.$message.success('更新状态成功');
        this.getDataList();
      });
    },
    // 数据列表
    getDataList(num) {
      this.loading = true;
      this.form.page = num ? num : this.form.page;
      logistics
        .expressPageApi({
          keywords: encodeURIComponent(this.form.keywords),
          page: this.form.page,
          limit: this.form.limit,
        })
        .then((res) => {
          this.loading = false;
          this.tableData.data = res.list;
          this.tableData.total = res.total;
        })
        .catch(() => {
          this.loading = false;
        });
    },
    // 默认操作
    handleSetDefault(item) {
      logistics.expressDefaultAwitchApi(item.id).then((res) => {
        this.$message.success('操作成功');
        this.getDataList(1);
      });
    },
    // 删除
    handleDelete(item) {
      this.$modalSure('确定要删除此物流公司吗？').then(() => {
        logistics.expressDeleteApi(item.id).then((res) => {
          this.$message.success('删除成功');
          handleDeleteTable(this.tableData.data.length, this.form);
          this.getDataList();
        });
      });
    },
  },
};
</script>

<style scoped lang="scss"></style>
