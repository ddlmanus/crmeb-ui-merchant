<template>
  <div class="divBox">
    <el-card class="box-card" shadow="never" :bordered="false">
      <el-table :data="tableData.list" style="width: 100%" v-loading="listLoading">
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column prop="adminId" label="管理员id" width="80"></el-table-column>
        <el-table-column prop="adminAccount" label="管理员账号" width="120"></el-table-column>
        <el-table-column prop="status" label="操作状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status ? 'danger' : ''">{{ scope.row.status ? '异常' : '正常' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="description"
          label="接口描述"
          width="140"
          :show-overflow-tooltip="true"
        ></el-table-column>
        <el-table-column prop="createTime" label="操作时间" width="120" :show-overflow-tooltip="true"></el-table-column>
        <el-table-column prop="ip" label="主机地址" width="120" :show-overflow-tooltip="true"></el-table-column>
        <el-table-column prop="method" label="方法名称" width="180" :show-overflow-tooltip="true"></el-table-column>
        <el-table-column prop="url" label="请求URL" width="180" :show-overflow-tooltip="true"></el-table-column>
        <el-table-column prop="methodType" label="请求类型" width="100"></el-table-column>
        <el-table-column prop="requestMethod" label="请求方式" width="100"></el-table-column>
        <el-table-column
          prop="requestParam"
          label="请求参数"
          width="150"
          :show-overflow-tooltip="true"
        ></el-table-column>
        <el-table-column prop="result" label="返回参数" width="180" :show-overflow-tooltip="true"></el-table-column>
        <el-table-column prop="errorMsg" label="错误消息" width="180" :show-overflow-tooltip="true"></el-table-column>
      </el-table>
      <el-pagination
        background
        :page-sizes="$constants.page.limit"
        :page-size="tableFrom.limit"
        :current-page="tableFrom.page"
        layout="total, sizes, prev, pager, next, jumper"
        :total="tableData.total"
        @size-change="handleSizeChange"
        @current-change="pageChange"
      />
    </el-card>
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

import { sensitiveListApi } from '@/api/systemadmin';
import { checkPermi } from '@/utils/permission'; // 权限判断函数
export default {
  data() {
    return {
      tableData: {},
      tableFrom: {
        page: 1,
        limit: this.$constants.page.limit[0],
      },
      listLoading: false,
    };
  },
  mounted() {
    if (checkPermi(['merchant:log:sensitive:list'])) this.getLogList();
  },
  methods: {
    getLogList() {
      this.listLoading = true;
      sensitiveListApi(this.tableFrom).then((res) => {
        this.tableData = res;
        this.listLoading = false;
      });
    },
    handleSizeChange(val) {
      this.tableFrom.limit = val;
      this.getLogList();
    },
    pageChange(page) {
      this.tableFrom.page = page;
      this.getLogList();
    },
  },
};
</script>
