<template>
  <div class="divBox">
    <pages-header
      ref="pageHeader"
      :title="$route.params.id !== '0' ? (isDisabled ? '商品详情' : '编辑商品') : '添加商品'"
      backUrl="/product/list"
    ></pages-header>
    <el-card v-if="isCopy" class="mt14" shadow="never" :bordered="false">
      <div class="line-ht mb15">
        生成的商品默认是没有上架的，请手动上架商品！
        <span v-if="copyConfig.copyType && copyConfig.copyType == 1"
          >您当前剩余{{ copyConfig.copyNum }}条采集次数。
        </span>
        <el-link
          v-if="copyConfig.copyType && copyConfig.copyType != 1"
          type="primary"
          :underline="false"
          href="https://help.crmeb.net/crmeb_java/2103903"
          target="_blank"
          >如何配置密钥
        </el-link>
        <br />
        商品采集设置：设置 > 系统设置 > 第三方接口设置 >
        采集商品配置（如配置一号通采集，请先登录一号通账号，无一号通，请选择99Api设置）
      </div>
      <div class="mb15" v-if="copyConfig.copyType && copyConfig.copyType != 1">
        <el-radio-group v-model="form">
          <el-radio :label="1">淘宝</el-radio>
          <el-radio :label="2">京东</el-radio>
          <el-radio :label="3">苏宁</el-radio>
          <el-radio :label="4">拼多多</el-radio>
          <el-radio :label="5">天猫</el-radio>
        </el-radio-group>
      </div>
      <div :span="24" v-if="copyConfig.copyType">
        <el-input v-model.trim="url" placeholder="请输入链接地址" class="selWidth100" size="small">
          <el-button
            slot="append"
            icon="el-icon-search"
            @click="addProduct"
            size="small"
            v-hasPermi="['merchant:product:copy:product', 'merchant:product:import:product']"
          />
        </el-input>
      </div>
    </el-card>
    <el-card class="box-card mt14" :body-style="{ padding: '0 20px 20px' }" shadow="never" :bordered="false">
      <el-tabs class="list-tabs" v-model="currentTab">
        <el-tab-pane v-for="(item, index) in headTab" :key="index" :label="item.tit" :name="item.name"></el-tab-pane>
      </el-tabs>
      <el-form
        ref="formValidate"
        v-loading="fullscreenLoading"
        class="formValidate form-boder-padding"
        :rules="ruleValidate"
        :model="formValidate"
        label-width="108px"
        @submit.native.prevent
      >
        <el-row v-show="currentTab === '1'" :gutter="24">
          <!-- 商品信息-->
          <el-col v-bind="grid2">
            <el-form-item label="商品类型：" required>
              <div class="from-ipt-width el-input el-input--small" maxlength="249" disabled>
                <span class="el-input__inner">
                  {{ formValidate.type | productTpyeFilter }}
                </span>
              </div>
              <div class="from-tips">云盘商品、卡密商品不支持售后，一经出售，概不退换</div>
            </el-form-item>
          </el-col>
          <el-col v-bind="grid2">
            <el-form-item label="商品名称：" prop="name">
              <el-input
                class="from-ipt-width"
                v-model.trim="formValidate.name"
                maxlength="249"
                placeholder="请输入商品名称"
                :disabled="isDisabled"
              />
            </el-form-item>
          </el-col>
          <el-col v-bind="grid2">
            <el-form-item label="商户商品分类：" prop="cateIds">
              <el-cascader
                class="from-ipt-width"
                v-model="formValidate.cateIds"
                :options="merProductClassify"
                :props="props2"
                clearable
                :show-all-levels="false"
                :disabled="isDisabled"
              />
              <el-button
                v-if="checkPermi(['merchant:product:category:add']) && !isDisabled"
                class="ml15"
                @click="handleAddMenu({ id: 0, name: '顶层目录' })"
                >添加分类</el-button
              >
            </el-form-item>
          </el-col>
          <el-col v-bind="grid2">
            <el-form-item label="平台商品分类：" prop="categoryId">
              <el-cascader
                class="from-ipt-width"
                @change="onChangeCategory"
                v-model="formValidate.categoryId"
                :options="productClassify"
                :props="props1"
                filterable
                clearable
                :show-all-levels="false"
                :disabled="isDisabled"
              />
            </el-form-item>
          </el-col>
          <el-col v-bind="grid2">
            <el-form-item label="品牌：" prop="brandId">
              <el-select
                class="from-ipt-width"
                clearable
                filterable
                v-model="formValidate.brandId"
                v-selectLoadMore="selectLoadMore"
                :loading="loading"
                remote
                :disabled="isDisabled || !formValidate.categoryId"
                :remote-method="remoteMethod"
                placeholder="请选择品牌"
              >
                <el-option v-for="user in brandList" :key="user.id" :label="user.name" :value="user.id"> </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col v-bind="grid2">
            <el-form-item label="单位：" prop="unitName">
              <el-input
                v-model.trim="formValidate.unitName"
                placeholder="请输入单位"
                class="from-ipt-width"
                :disabled="isDisabled"
              />
            </el-form-item>
          </el-col>
          <el-col v-if="formValidate.type == 0" :xs="18" :sm="18" :md="18" :lg="12" :xl="12">
            <el-form-item label="运费模板：" prop="tempId">
              <el-select
                v-model="formValidate.tempId"
                placeholder="请选择"
                :disabled="isDisabled"
                class="from-ipt-width mr20"
              >
                <el-option v-for="item in shippingTemplates" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col v-bind="grid2">
            <el-form-item label="商品关键字：">
              <keyword
                @getLabelarr="getLabelarr"
                :labelarr="labelarr"
                class="from-ipt-width"
                :isDisabled="isDisabled"
              ></keyword>
              <div class="from-tips">用户可以根据关键字进行商品搜索</div>
            </el-form-item>
          </el-col>
          <el-col v-bind="grid2">
            <el-form-item label="商品简介：" prop="intro">
              <el-input
                class="from-ipt-width"
                v-model.trim="formValidate.intro"
                type="textarea"
                maxlength="250"
                :rows="3"
                placeholder="请输入商品简介"
                :disabled="isDisabled"
              />
              <div class="from-tips">通过公众号分享商品详情，会展示此简介信息</div>
            </el-form-item>
          </el-col>
          <el-col v-bind="grid2">
            <el-form-item label="商品封面图：" prop="image">
              <div class="upLoadPicBox acea-row" @click="modalPicTap('1')" :disabled="isDisabled">
                <div v-if="formValidate.image" class="pictrue"><img :src="formValidate.image" /></div>
                <div v-else class="upLoad">
                  <i class="el-icon-camera cameraIconfont" />
                </div>
              </div>
              <div class="from-tips" v-show="!isDisabled">建议尺寸：800*800px，上传小于500kb的图片</div>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="商品轮播图：" prop="sliderImages">
              <div class="acea-row">
                <div
                  v-for="(item, index) in formValidate.sliderImages"
                  :key="index"
                  class="pictrue"
                  draggable="true"
                  @dragstart="handleDragStart($event, item)"
                  @dragover.prevent="handleDragOver($event, item)"
                  @dragenter="handleDragEnter($event, item)"
                  @dragend="handleDragEnd($event, item)"
                >
                  <img :src="item" />
                  <i v-show="!isDisabled" class="el-icon-error btndel" @click="handleRemove(index)" />
                </div>
                <div
                  v-if="formValidate.sliderImages.length < 10 && !isDisabled"
                  class="upLoadPicBox"
                  @click="modalPicTap('2')"
                >
                  <div class="upLoad">
                    <i class="el-icon-camera cameraIconfont" />
                  </div>
                </div>
              </div>
              <div class="from-tips">建议尺寸：800*800px，上传小于500kb的图片；最多可上传10张图片，拖动可调整顺序</div>
            </el-form-item>
          </el-col>
          <el-col v-bind="grid2">
            <el-form-item label="保障服务：">
              <el-radio-group v-model="isShowGroup" @change="onchangeIsShow">
                <el-radio label="combination">使用保障服务组合</el-radio>
                <el-radio label="alone">单独设置保障服务</el-radio>
              </el-radio-group>
              <div class="acea-row row-middle mb5">
                <el-select
                  id="mySelect"
                  :key="multiples ? 'one' : 'two'"
                  class="from-ipt-width"
                  v-model="formValidate.guaranteeIdsList"
                  placeholder="请选择保障服务"
                  clearable
                  filterable
                  :multiple="multiples"
                  :disabled="isDisabled"
                  @change="changeGuarantee"
                >
                  <el-option
                    :value="item.id"
                    v-for="(item, index) in guaranteeNew"
                    :key="item.id"
                    :label="item.name"
                  ></el-option>
                </el-select>
              </div>
              <el-tag v-for="(item, index) in guaranteeName" :key="index" class="mr10">{{ item }}</el-tag>
            </el-form-item>
          </el-col>
          <el-col v-bind="grid2">
            <el-form-item label="主图视频：" prop="video_link">
              <div class="acea-row">
                <el-input
                  v-model="videoLink"
                  :disabled="isDisabled"
                  size="small"
                  class="from-ipt-width"
                  placeholder="请输入MP4格式的视频链接"
                >
                  <input ref="refid" type="file" style="display: none" />
                  <el-upload
                    class="upload-demo"
                    action
                    slot="append"
                    :http-request="handleUploadForm"
                    :before-upload="beforeAvatarUpload"
                    :headers="myHeaders"
                    :show-file-list="false"
                    :disabled="isDisabled"
                    multiple
                  >
                    <el-button :disabled="isDisabled" size="small">
                      {{ videoLink ? '确认添加' : '上传视频' }}</el-button
                    >
                  </el-upload>
                </el-input>
              </div>
              <div class="from-tips">请上传小于20M的视频</div>
              <div v-if="videoLink" class="iview-video-style">
                <video
                  class="from-ipt-width"
                  style="height: 100% !important; border-radius: 10px"
                  :src="videoLink"
                  controls="controls"
                >
                  您的浏览器不支持 video 标签。
                </video>
                <div class="mark" />
                <i class="el-icon-delete iconv" @click="delVideo" />
              </div>
            </el-form-item>
          </el-col>
        </el-row>
        <!-- 商品规格-->
        <el-row v-show="currentTab === '2'" :gutter="24">
          <el-col :span="24">
            <el-form-item label="商品规格：" props="specType">
              <el-radio-group
                v-model="formValidate.specType"
                @change="onChangeSpec(formValidate.specType)"
                :disabled="isDisabled"
              >
                <el-radio :label="false" class="radio">单规格</el-radio>
                <el-radio :label="true">多规格</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="佣金设置：" props="isSub">
              <el-radio-group v-model="formValidate.isSub" :disabled="isDisabled">
                <el-radio :label="true" class="radio">单独设置</el-radio>
                <el-radio :label="false">默认设置</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="会员商品：" required>
              <el-radio-group v-model="formValidate.isPaidMember" :disabled="isDisabled">
                <el-radio :label="true" class="radio">是</el-radio>
                <el-radio :label="false">否</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <!-- 多规格添加-->
          <el-col v-if="formValidate.specType && !isDisabled" :span="24" class="noForm">
            <el-form-item label="选择规格：" prop="">
              <div class="acea-row">
                <el-select v-model="formValidate.selectRule" style="width: 600px">
                  <el-option v-for="item in ruleList" :key="item.id" :label="item.ruleName" :value="item.id" />
                </el-select>
                <el-button type="primary" class="ml20" @click="confirm">确认</el-button>
                <el-button @click="addRule">添加规格</el-button>
              </div>
            </el-form-item>
            <el-form-item v-if="formValidate.attr.length">
              <div class="from-tips mb5">规格值支持拖拽排序,调整默认选中的规格</div>
              <div v-for="(item, index) in formValidate.attr" :key="index">
                <div v-if="item.attrValue && item.attrValue.length">
                  <div class="acea-row row-middle">
                    <span class="mr5">{{ item.attrName }}</span
                    ><i class="el-icon-circle-close" @click="handleRemoveAttr(index)" />
                  </div>
                  <div class="acea-row row-middle">
                    <div
                      v-for="(j, indexn) in item.attrValue"
                      :key="indexn"
                      draggable="true"
                      @dragstart="handleDragStart($event, j)"
                      @dragover.prevent="handleDragOver($event, j)"
                      @dragenter="handleDragEnter($event, j, index)"
                      @dragend="handleDragEnd($event, j)"
                    >
                      <el-tag
                        closable
                        size="medium"
                        :disable-transitions="false"
                        class="mb5 mr10 pointer"
                        @close="handleClose(item.attrValue, indexn)"
                      >
                        {{ j }}
                      </el-tag>
                    </div>
                    <el-input
                      v-if="item.inputVisible"
                      ref="saveTagInput"
                      placeholder="按回车键添加"
                      v-model.trim="item.attrValue.attrsVal"
                      class="input-new-tag"
                      size="small"
                      @keyup.enter.native="createAttr(item.attrValue.attrsVal, index)"
                    />
                    <el-button v-else class="button-new-tag" size="small" @click="showInput(item)">+ 添加</el-button>
                  </div>
                </div>
              </div>
            </el-form-item>
            <div class="acea-row">
              <el-form-item label="规格：">
                <el-input v-model.trim="formDynamic.attrsName" placeholder="请输入规格" style="width: 255px" />
              </el-form-item>
              <el-form-item label="规格值：" label-width="90px">
                <el-input v-model.trim="formDynamic.attrsVal" placeholder="请输入规格值" style="width: 254px" />
              </el-form-item>
              <el-form-item label-width="0px">
                <el-button class="ml20" size="small" type="primary" @click="createAttrName">确定</el-button>
              </el-form-item>
            </div>
          </el-col>
          <!-- 批量设置-->
          <el-col v-if="formValidate.attr.length > 0 && formValidate.specType && !isDisabled" :span="24" class="noForm">
            <el-form-item label="批量设置：">
              <el-alert title="价格设置范围 0.01~999999.99" type="info"> </el-alert>
              <el-table :data="oneFormBatch" border class="tabNumWidth" size="small">
                <el-table-column label="图片" width="80" align="center">
                  <template slot-scope="scope">
                    <div class="upLoadPicBox" @click="modalPicTap('1', 'pi')">
                      <div v-if="scope.row.image" class="pictrue tabPic"><img :src="scope.row.image" /></div>
                      <div v-else class="upLoad tabPic">
                        <i class="el-icon-camera cameraIconfont" />
                      </div>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column v-if="formValidate.isSub" label="一级返佣(%)" min-width="120" align="center">
                  <template slot-scope="scope">
                    <el-input
                      maxlength="6"
                      v-model.trim="scope.row.brokerage"
                      min="0"
                      :max="scope.row.price"
                      class="priceBox"
                      @keyup.native="keyupEventBrokerage('brokerage', scope.$index, 1)"
                    />
                  </template>
                </el-table-column>
                <el-table-column v-if="formValidate.isSub" label="二级返佣(%)" min-width="120" align="center">
                  <template slot-scope="scope">
                    <el-input
                      maxlength="6"
                      v-model.trim="scope.row.brokerageTwo"
                      min="0"
                      :max="scope.row.price"
                      class="priceBox"
                      @keyup.native="keyupEventBrokerage('brokerageTwo', scope.$index, 1)"
                    />
                  </template>
                </el-table-column>
                <el-table-column
                  v-for="(item, iii) in attrValue"
                  :key="iii"
                  :label="formThead[iii].title"
                  min-width="160"
                  align="center"
                >
                  <template slot-scope="scope">
                    <el-input
                      v-if="iii === 'barCode'"
                      v-model="scope.row[iii]"
                      maxlength="40"
                      type="test"
                      class="priceBox"
                      :readonly="false"
                    />
                    <el-input-number
                      v-else
                      v-model.trim="scope.row[iii]"
                      :min="iii === 'stock' ? 0 : 0.01"
                      :max="
                        formValidate.isPaidMember && iii === 'vipPrice' ? Number(scope.row.price) - 0.01 : 999999.99
                      "
                      :disabled="isDisabled || (iii === 'stock' && formValidate.type == 6 ? true : false)"
                      :step="iii === 'stock' ? 1 : 0.01"
                      controls-position="right"
                      step-strictly
                    ></el-input-number>
                  </template>
                </el-table-column>
                <template v-if="formValidate.isSub"> </template>
                <el-table-column label="操作" width="70" align="center">
                  <template>
                    <a class="submission" @click="batchAdd">批量添加</a>
                  </template>
                </el-table-column>
              </el-table>
            </el-form-item>
          </el-col>
          <el-col :xl="24" :lg="24" :md="24" :sm="24" :xs="24">
            <!-- 单规格表格-->
            <el-form-item v-if="formValidate.specType === false">
              <el-alert title="价格设置范围 0.01~999999.99" type="info"> </el-alert>
              <el-table :data="OneattrValue" border class="tabNumWidth" size="small">
                <el-table-column label="图片" width="77" align="center">
                  <template slot-scope="scope">
                    <div class="upLoadPicBox" @click="modalPicTap('1', 'dan', 'pi')">
                      <div v-if="scope.row.image" class="pictrue tabPic"><img :src="scope.row.image" /></div>
                      <div v-else class="upLoad tabPic">
                        <i class="el-icon-camera cameraIconfont" />
                      </div>
                    </div>
                  </template>
                </el-table-column>
                <template v-if="formValidate.isSub">
                  <el-table-column label="一级返佣(%)" min-width="120" align="center">
                    <template slot-scope="scope">
                      <el-input
                        maxlength="6"
                        :disabled="isDisabled"
                        v-model.trim="scope.row.brokerage"
                        min="0"
                        class="priceBox"
                        @keyup.native="keyupEventBrokerage('brokerage', scope.$index, 2)"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column label="二级返佣(%)" min-width="120" align="center">
                    <template slot-scope="scope">
                      <el-input
                        maxlength="6"
                        :disabled="isDisabled"
                        v-model.trim="scope.row.brokerageTwo"
                        min="0"
                        class="priceBox"
                        @keyup.native="keyupEventBrokerage('brokerageTwo', scope.$index, 2)"
                      />
                    </template>
                  </el-table-column>
                </template>
                <el-table-column
                  v-for="(item, iii) in attrValue"
                  :key="iii"
                  :label="formThead[iii].title"
                  min-width="160"
                  align="center"
                >
                  <template slot-scope="scope">
                    <el-input
                      v-if="iii === 'barCode'"
                      :disabled="isDisabled"
                      v-model="scope.row[iii]"
                      maxlength="40"
                      type="test"
                      class="priceBox"
                      :readonly="false"
                    />
                    <el-input-number
                      v-else
                      v-model.trim="scope.row[iii]"
                      :disabled="isDisabled || (iii === 'stock' && formValidate.type == 6 ? true : false)"
                      :min="iii === 'stock' ? 0 : 0.01"
                      :max="
                        formValidate.isPaidMember && iii === 'vipPrice' ? Number(scope.row.price) - 0.01 : 999999.99
                      "
                      :step="iii === 'stock' ? 1 : 0.01"
                      controls-position="right"
                      step-strictly
                    ></el-input-number>
                  </template>
                </el-table-column>
                <template v-if="formValidate.type == 5">
                  <el-table-column label="云盘设置" min-width="120" align="center">
                    <template slot-scope="scope">
                      <el-button v-if="!scope.row.expand" size="small" @click="handleAddVirtually(0, 'OneattrValue', 1)"
                        >添加链接</el-button
                      >
                      <el-button
                        v-else
                        class="seeCatMy pointer"
                        type="text"
                        size="small"
                        @click="seeVirtually(OneattrValue[0], 'OneattrValue', 0, 1)"
                        >已设置</el-button
                      >
                    </template>
                  </el-table-column>
                </template>
                <template v-if="formValidate.type == 6">
                  <el-table-column label="卡密设置" min-width="120" align="center">
                    <template slot-scope="scope">
                      <el-button
                        v-if="!scope.row.cdkeyId"
                        size="small"
                        @click="handleAddVirtually(0, 'OneattrValue', 2)"
                        >添加卡密</el-button
                      >
                      <el-button
                        v-else
                        type="text"
                        class="seeCatMy pointer"
                        @click="seeVirtually(OneattrValue[0], 'OneattrValue', 0, 2)"
                        >{{ scope.row.cdkeyLibraryName }}</el-button
                      >
                    </template>
                  </el-table-column>
                </template>
              </el-table>
            </el-form-item>
            <el-form-item label="全部sku：" v-if="$route.params.id && showAll">
              <el-button type="default" @click="showAllSku()" :disabled="isDisabled">展示</el-button>
            </el-form-item>
            <!-- 多规格表格-->
            <el-form-item
              v-if="formValidate.attr.length > 0 && formValidate.specType"
              label="商品属性："
              class="labeltop"
              :class="isDisabled ? 'disLabel' : 'disLabelmoren'"
            >
              <el-alert title="价格设置范围 0.01~999999.99" type="info"> </el-alert>
              <el-table :data="ManyAttrValue" border class="tabNumWidth" size="small">
                <template v-if="manyTabDate">
                  <el-table-column
                    v-for="(item, iii) in manyTabDate"
                    :key="iii"
                    :label="manyTabTit[iii].title"
                    min-width="100"
                    align="center"
                  >
                    <template slot-scope="scope">
                      <span class="priceBox" v-text="scope.row[iii]" />
                    </template>
                  </el-table-column>
                </template>
                <el-table-column label="图片" width="80" align="center">
                  <template slot-scope="scope">
                    <div class="upLoadPicBox" @click="modalPicTap('1', 'duo', scope.$index)">
                      <div v-if="scope.row.image" class="pictrue tabPic"><img :src="scope.row.image" /></div>
                      <div v-else class="upLoad tabPic">
                        <i class="el-icon-camera cameraIconfont" />
                      </div>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column v-if="formValidate.isSub" label="一级返佣(%)" min-width="120" align="center">
                  <template slot-scope="scope">
                    <el-input
                      :disabled="isDisabled"
                      v-model.trim="scope.row.brokerage"
                      maxlength="6"
                      min="0"
                      class="priceBox"
                      @keyup.native="keyupEventBrokerage('brokerage', scope.$index, 3)"
                    />
                  </template>
                </el-table-column>
                <el-table-column v-if="formValidate.isSub" label="二级返佣(%)" min-width="120" align="center">
                  <template slot-scope="scope">
                    <el-input
                      maxlength="6"
                      :disabled="isDisabled"
                      v-model.trim="scope.row.brokerageTwo"
                      min="0"
                      class="priceBox"
                      @keyup.native="keyupEventBrokerage('brokerageTwo', scope.$index, 3)"
                    />
                  </template>
                </el-table-column>
                <el-table-column
                  v-for="(item, iii) in attrValue"
                  :key="iii"
                  :label="formThead[iii].title"
                  min-width="160"
                  align="center"
                >
                  <template slot-scope="scope">
                    <el-input
                      v-if="iii === 'barCode'"
                      :disabled="isDisabled"
                      v-model="scope.row[iii]"
                      maxlength="40"
                      type="test"
                      class="priceBox"
                      :readonly="false"
                    />
                    <el-input-number
                      v-else
                      v-model.trim="scope.row[iii]"
                      :disabled="isDisabled || (iii === 'stock' && formValidate.type == 6 ? true : false)"
                      :min="iii === 'stock' ? 0 : 0.01"
                      :max="
                        formValidate.isPaidMember && iii === 'vipPrice' ? Number(scope.row.price) - 0.01 : 999999.99
                      "
                      :step="iii === 'stock' ? 1 : 0.01"
                      controls-position="right"
                      step-strictly
                    ></el-input-number>
                  </template>
                </el-table-column>
                <template v-if="formValidate.isSub"></template>
                <template v-if="formValidate.type == 5">
                  <el-table-column label="云盘设置" min-width="120" align="center">
                    <template slot-scope="scope">
                      <el-button
                        v-if="!scope.row.expand"
                        size="small"
                        @click="handleAddVirtually(scope.$index, 'ManyAttrValue', 1)"
                        >添加链接</el-button
                      >
                      <el-button
                        v-else
                        class="seeCatMy pointer"
                        type="text"
                        size="small"
                        @click="seeVirtually(ManyAttrValue[scope.$index], 'ManyAttrValue', scope.$index, 1)"
                        >已设置</el-button
                      >
                    </template>
                  </el-table-column>
                </template>
                <template v-if="formValidate.type == 6">
                  <el-table-column label="卡密设置" min-width="120" align="center">
                    <template slot-scope="scope">
                      <el-button
                        v-if="!scope.row.cdkeyId"
                        size="small"
                        @click="handleAddVirtually(scope.$index, 'ManyAttrValue', 2)"
                        >添加卡密</el-button
                      >
                      <el-button
                        v-else
                        type="text"
                        class="seeCatMy pointer"
                        @click="seeVirtually(ManyAttrValue[scope.$index], 'ManyAttrValue', scope.$index, 2)"
                        >{{ scope.row.cdkeyLibraryName }}</el-button
                      >
                    </template>
                  </el-table-column>
                </template>
                <el-table-column v-if="!isDisabled" key="3" label="操作" width="70" align="center">
                  <template slot-scope="scope">
                    <a class="submission" @click="delAttrTable(scope.$index)">删除</a>
                  </template>
                </el-table-column>
              </el-table>
            </el-form-item>
          </el-col>
        </el-row>
        <!-- 商品详情-->
        <el-row v-show="currentTab === '3' && !isDisabled">
          <el-col :span="24">
            <el-form-item label="商品详情：">
              <Tinymce v-model.trim="formValidate.content" :key="htmlKey"></Tinymce>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row v-show="currentTab === '3' && isDisabled">
          <el-col :span="24">
            <el-form-item label="商品详情：">
              <div v-html="formValidate.content || '无'"></div>
            </el-form-item>
          </el-col>
        </el-row>
        <!-- 其他设置-->
        <el-row v-show="currentTab === '4'">
          <el-form-item label="关联表单：">
            <el-select
              :disabled="isDisabled"
              class="from-ipt-width"
              v-model="formValidate.systemFormId"
              placeholder="请选择关联表单"
              clearable
              filterable
            >
              <el-option
                :value="item.id"
                v-for="(item, index) in systemFormList"
                :key="index.id"
                :label="item.formName"
              ></el-option>
            </el-select>
            <el-button
              size="small"
              class="ml15"
              v-if="checkPermi(['merchant:system:form:add']) && !isDisabled"
              @click="handlerCreatFrom(0, 'add')"
              >添加表单</el-button
            >
            <el-button
              size="small"
              class="ml15"
              v-if="checkPermi(['merchant:system:form:add']) && !isDisabled"
              @click="getSystemFormList"
              >刷新</el-button
            >
            <div class="from-tips mb5">
              用户购买此商品时，必须填写关联表单中设置的字段内容才能够进行订单支付，例如：部分商品购买必须填写身份证号、预约时间等
            </div>
            <div class="from-tips mb15 colorPrompt">注：关联系统表单之后，该商品则不可进行「加入购物车」操作</div>
            <div class="item" v-if="formValidate.systemFormId">
              <div class="acea-row row-middle">
                <div>
                  <iframe
                    :src="`https://${frontDomain}/pages/goods/systemIframe/index?id=${formValidate.systemFormId}`"
                    style="width: 350px; height: 500px"
                    frameborder="0"
                  />
                </div>
              </div>
            </div>
          </el-form-item>
          <el-form-item v-if="formValidate.type == 2" label="用户申请退款：">
            <el-switch
              :disabled="isDisabled"
              v-model="formValidate.refundSwitch"
              :active-value="true"
              :inactive-value="false"
              active-text="开启"
              inactive-text="关闭"
              :width="35"
            >
            </el-switch>
            <div class="from-tips">开启之后用户可进行退款申请；关闭之后仅支持商家直接退款，用户不能申请退款</div>
          </el-form-item>
          <el-form-item label="配送方式：" v-if="formValidate.type == 0" prop="deliveryMethodList">
            <el-checkbox-group v-model="formValidate.deliveryMethodList" :disabled="isDisabled">
              <el-checkbox label="1">商家配送</el-checkbox>
              <el-checkbox label="2">到店自提</el-checkbox>
            </el-checkbox-group>
            <div class="from-tips mb5">
              请先配置店铺地址之后，再开启到店自提；若店铺统一关闭到店自提功能，商品配送方式选中到店自提，用户购买不支持到店自提！
            </div>
            <div class="from-tips mb5 colorPrompt">注：店铺统一关闭到店自提功能，该商品必须选中「商家配送」</div>
          </el-form-item>
          <el-form-item label="排序：">
            <el-input-number
              v-model.trim="formValidate.sort"
              :min="1"
              :max="9999"
              placeholder="请输入排序"
              @keyup.native="proving1"
              :disabled="isDisabled"
            />
          </el-form-item>
          <div class="acea-row">
            <el-form-item label="赠送优惠券：" class="proCoupon">
              <div class="from-tips mb14">用户购买商品后赠送的优惠券</div>
              <div class="acea-row">
                <el-tag
                  v-for="(tag, index) in formValidate.coupons"
                  :key="index"
                  class="mr10 mb10"
                  :closable="!isDisabled"
                  :disable-transitions="false"
                  @close="handleCloseCoupon(tag)"
                >
                  {{ tag.name }}
                </el-tag>
                <span class="mr15" v-if="formValidate.couponIds == null">无</span>
                <el-button v-if="!isDisabled" size="small" class="mr15" @click="addCoupon">选择优惠券</el-button>
              </div>
            </el-form-item>
          </div>
        </el-row>
        <el-form-item>
          <el-button v-if="Number(currentTab) > 1" class="submission priamry_border" @click="handleSubmitUp"
            >上一步</el-button
          >
          <el-button v-show="Number(currentTab) < 4" class="priamry_border" @click="handleSubmitNest('formValidate')"
            >下一步</el-button
          >
          <el-button
            v-show="(currentTab === '3' || $route.params.id) && !isDisabled"
            type="primary"
            class="submission"
            @click="handleSubmit('formValidate')"
            :loading="loadingBtn"
            v-if="checkPermi(['merchant:product:update'])"
            >保存</el-button
          >
          <el-button
            v-show="
              !isDisabled &&
              this.productSwitch &&
              (($route.params.id > 0 && this.formValidate.auditStatus > 0) || $route.params.id == 0)
            "
            type="primary"
            class="submission"
            @click="handleSubmitAndAudit('formValidate')"
            :loading="loadingBtn"
            v-if="checkPermi(['merchant:product:update'])"
            >保存并提审</el-button
          >
        </el-form-item>
      </el-form>
    </el-card>

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
      :cdkeyLibraryInfo="cdkeyLibraryInfo"
      @handlerSubSuccess="handlerChangeCdkeyIdSubSuccess"
    ></cdkey-library>

    <!-- 添加商品分类-->
    <el-dialog
      title="创建商品分类"
      :visible.sync="editDialogConfig.visible"
      destroy-on-close
      :close-on-click-modal="false"
      width="540px"
      class="dialog-bottom"
    >
      <edit
        v-if="editDialogConfig.visible"
        :prent="editDialogConfig.prent"
        :is-create="editDialogConfig.isCreate"
        :edit-data="editDialogConfig.data"
        :biztype="editDialogConfig.biztype"
        :all-tree-list="merProductClassify"
        @hideEditDialog="hideEditDialog"
      />
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

import Tinymce from '@/components/Tinymce/index';
import {
  brandListApi,
  productGuaranteeApi,
  templateListApi,
  productCreateApi,
  productDetailApi,
  productUpdateApi,
  productCouponListApi,
  guaranteeListApi,
  copyConfigApi,
  copyProductApi,
  importProductApi,
} from '@/api/product';
import { Debounce } from '@/utils/validate';
import { mapGetters, mapState } from 'vuex';
import { checkPermi } from '@/utils/permission'; // 权限判断函数
import addCdkey from '@/views/product/components/addCdkey.vue';
import addCloudDisk from '@/views/product/components/addCloudDisk.vue';
import { uploadImage } from '@/utils/ZBKJIutil';
import { getToken } from '@/utils/auth';
import { productTpyeFilter } from '@/filters';
import CdkeyLibrary from '@/views/product/components/cdkeyLibrary.vue';
import edit from '@/components/Category/edit.vue';
import { productAuditSwitchInfoApi } from '@/api/merchant';
import { systemFormPageApi } from '@/api/systemForm';
import { useProduct } from '@/hooks/use-product';
const { handlerCreatFromUse } = useProduct();
const defaultObj = {
  image: '',
  sliderImages: [],
  sliderImage: '',
  name: '',
  intro: '',
  keyword: '',
  cateIds: [], // 商品分类id
  cateId: null, // 商品分类id传值
  unitName: '',
  sort: 0,
  isShow: false,
  tempId: '',
  attrValue: [
    {
      image: '',
      price: 0.01,
      vipPrice: 0.01,
      cost: 0.01,
      otPrice: 0.01,
      stock: 0,
      barCode: '',
      weight: 0,
      volume: 0,
      brokerage: 0,
      brokerageTwo: 0,
      cdkeyId: null,
      cdkeyLibraryName: '',
      expand: '',
    },
  ],
  attr: [],
  selectRule: '',
  isSub: false,
  isPaidMember: false,
  content: '',
  specType: false,
  id: undefined,
  couponIds: [],
  coupons: [],
  categoryId: 0,
  guaranteeIds: '',
  guaranteeIdsList: null,
  brandId: '',
  type: 0, // 商品类型
  isAutoSubmitAudit: false, //是否自动提审
  isAutoUp: false, //是否自动上架
  deliveryMethodList: ['1'],
  deliveryMethod: '',
  systemFormId: null,
  refundSwitch: true,
};
const objTitle = {
  price: {
    title: '售价（元）',
  },
  vipPrice: {
    title: '会员价（元）',
  },
  cost: {
    title: '成本价（元）',
  },
  otPrice: {
    title: '原价（元）',
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
};
export default {
  name: 'ProductProductAdd',
  directives: {
    // 计算是否滚动到最下面
    selectLoadMore: {
      bind(el, binding) {
        // 获取element-ui定义好的scroll盒子
        const SELECTWRAP_DOM = el.querySelector('.el-select-dropdown .el-select-dropdown__wrap');
        SELECTWRAP_DOM.addEventListener('scroll', function () {
          const condition = this.scrollHeight - this.scrollTop <= this.clientHeight;
          if (condition) {
            binding.value();
          }
        });
      },
    },
  },
  components: { edit, CdkeyLibrary, addCdkey, Tinymce, addCloudDisk },
  data() {
    return {
      frontDomain: localStorage.getItem('frontDomain'),
      htmlKey: 0,
      headTab: [
        { tit: '商品信息', name: '1' },
        { tit: '规格库存', name: '2' },
        { tit: '商品详情', name: '3' },
        { tit: '其他设置', name: '4' },
      ],
      form: 2,
      url: '',
      copyConfig: {},
      labelarr: [],
      isDisabled: this.$route.params.isDisabled === '1' ? true : false,
      isCopy: this.$route.params.isCopy === '1' ? true : false, //是否是采集
      props2: {
        children: 'childList',
        label: 'name',
        value: 'id',
        multiple: true,
        emitPath: false,
        checkStrictly: true,
      },
      props1: {
        children: 'childList',
        label: 'name',
        value: 'id',
        multiple: false,
        emitPath: false,
      },
      tabs: [],
      fullscreenLoading: false,
      props: { multiple: true },
      active: 0,
      OneattrValue: [Object.assign({}, defaultObj.attrValue[0])], // 单规格
      ManyAttrValue: [Object.assign({}, defaultObj.attrValue[0])], // 多规格
      ruleList: [],
      merCateList: [], // 商户分类筛选
      shippingList: [], // 运费模板
      formThead: Object.assign({}, objTitle),
      formValidate: Object.assign({}, defaultObj),
      formDynamics: {
        ruleName: '',
        ruleValue: [],
      },
      tempData: {
        page: 1,
        limit: 9999,
      },
      manyTabTit: {},
      manyTabDate: {},
      grid2: {
        xl: 24,
        lg: 24,
        md: 24,
        sm: 24,
        xs: 24,
      },
      // 规格数据
      formDynamic: {
        attrsName: '',
        attrsVal: '',
      },
      isBtn: false,
      manyFormValidate: [],
      currentTab: '1',
      isChoice: '',
      grid: {
        xl: 24,
        lg: 24,
        md: 24,
        sm: 24,
        xs: 24,
      },
      ruleValidate: {
        name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
        categoryId: [{ required: true, message: '请选择平台商品分类', trigger: 'change' }],
        cateIds: [{ required: true, message: '请选择商户商品分类', trigger: 'change', type: 'array', min: '1' }],
        unitName: [{ required: true, message: '请输入单位', trigger: 'blur' }],
        intro: [{ required: true, message: '请输入商品简介', trigger: 'blur' }],
        tempId: [{ required: true, message: '请选择运费模板', trigger: 'change' }],
        image: [{ required: true, message: '请上传商品图', trigger: 'change' }],
        sliderImages: [{ required: true, message: '请上传商品轮播图', type: 'array', trigger: 'change' }],
        specType: [{ required: true, message: '请选择商品规格', trigger: 'change' }],
        brandId: [{ required: true, message: '请选择商品品牌', trigger: 'change' }],
        deliveryMethodList: [{ required: true, message: '请选择配送方式', type: 'array', trigger: 'change' }],
      },
      attrInfo: {},
      tableFrom: {
        page: 1,
        limit: 9999,
        keywords: '',
      },
      tempRoute: {},
      keyNum: 0,
      isAttr: false,
      showAll: false,
      guaranteeList: [],
      brandList: [],
      search: {
        limit: this.$constants.page.limit[0],
        page: 1,
        cid: '',
        brandName: '',
      },
      totalPage: 0,
      total: 0,
      loading: false,
      loadingBtn: false,
      isShowGroup: 'alone',
      guaranteeGroupList: [],
      guaranteeNew: [],
      guaranteeName: [],
      multiples: true,
      productClassify: [], //平台商品分类
      productType: [
        { tit: '普通商品', id: 0, tit2: '实体货物' },
        { tit: '云盘商品', id: 5, tit2: '同一链接发货' },
        { tit: '卡密商品', id: 6, tit2: '不同充值码发货' },
      ],

      carMytabIndex: 0,
      carMytabName: '',
      cloudDisk: '', //云盘地址
      upload: {
        videoIng: false, // 是否显示进度条；
      },
      videoLink: '', //视频地址
      progress: 10, // 进度条默认0
      myHeaders: { 'X-Token': getToken() },
      cdkeyId: null, //卡密库id
      cdkeyLibraryInfo: null, //卡密库对象
      editDialogConfig: {
        visible: false,
        isCreate: 0, // 0=创建，1=编辑
        prent: {}, // 父级对象
        data: {},
        biztype: { name: '产品分类', value: 1, shortName: '产品' }, // 统一主业务中的目录类型
      }, //商品分类
      isSwitch: false, //商户开关
      productSwitch: false, //商品是否需要审核 true需要审核，false免审
    };
  },
  beforeRouteUpdate(to, from, next) {
    this.bus.$emit('onTagsViewRefreshRouterView', this.$route.path);
    next();
  },
  computed: {
    visitedViews() {
      return this.$store.state.tagsView.visitedViews;
    },
    ...mapState({
      systemFormList: (state) => state.mobildConfig.systemFormList,
    }),
    ...mapGetters(['adminProductClassify', 'merProductClassify', 'productBrand', 'shippingTemplates']),
    attrValue() {
      const obj = Object.assign({}, defaultObj.attrValue[0]);
      delete obj.image;
      delete obj.brokerage;
      delete obj.brokerageTwo;
      delete obj.cdkeyId;
      delete obj.expand;
      delete obj.cdkeyLibraryName;
      if (!this.formValidate.isPaidMember) {
        delete obj.vipPrice;
      } else {
        obj.vipPrice = Object.assign({}, defaultObj.attrValue[0]).vipPrice;
      }
      if (this.formValidate.type === 5) {
        delete obj.volume;
        delete obj.weight;
      }
      if (this.formValidate.type === 6) {
        delete obj.volume;
        delete obj.weight;
      }
      return obj;
    },
    oneFormBatch() {
      return [
        {
          image: '',
          price: 0,
          cost: 0,
          otPrice: 0,
          stock: 0,
          weight: 0,
          volume: 0,
          brokerage: 0,
          brokerageTwo: 0,
          cdkeyId: null,
          cdkeyLibraryName: '',
          expand: '',
          vipPrice: 0,
        },
      ];
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
    this.formValidate.type = Number(this.$route.params.productType); //商品类型
    this.tempRoute = Object.assign({}, this.$route);
    if (parseFloat(this.$route.params.id) > 0 && this.formValidate.specType) {
      this.$watch('formValidate.attr', this.watCh);
    }
    if (this.isCopy && checkPermi(['merchant:plat:product:brand:cache:list'])) this.getCopyConfig();
  },
  mounted() {
    this.formValidate.sliderImages = [];
    if (checkPermi(['merchant:plat:product:category:cache:tree']))
      this.$store.dispatch('product/getAdminProductClassify');
    if (!localStorage.getItem('merProductClassify') && checkPermi(['merchant:product:category:cache:tree']))
      this.$store.dispatch('product/getMerProductClassify');
    if (checkPermi(['merchant:plat:product:brand:cache:list'])) this.$store.dispatch('product/getMerProductBrand');
    if (!localStorage.getItem('shippingTemplates')) this.$store.dispatch('product/getShippingTemplates');
    if (checkPermi(['merchant:plat:product:guarantee:list'])) this.getProductGuarantee();
    if (checkPermi(['merchant:product:guarantee:group:list'])) this.getGuaranteeGroupList();
    if (!localStorage.getItem('systemFormList') && checkPermi(['merchant:system:form:page'])) this.getSystemFormList();
    this.setTagsViewTitle();
    if (this.$route.params.id && this.$route.params.id != 0) {
      if (checkPermi(['merchant:product:info'])) this.getInfo();
    }
    this.productClassify = this.addDisabled(this.adminProductClassify);
    this.getProductAuditSwitchInfo();
  },
  methods: {
    checkPermi,
    //创建、编辑表单
    handlerCreatFrom(id, type) {
      handlerCreatFromUse(id, type);
    },
    //系统表单数据
    async getSystemFormList() {
      const { list } = await systemFormPageApi({ page: 1, limit: 999 });
      this.$store.commit('mobildConfig/SET_SystemForm', list);
      localStorage.setItem('systemFormList', JSON.stringify(list));
    },
    //获取商户端商户商品审核开关信息
    getProductAuditSwitchInfo() {
      productAuditSwitchInfoApi().then(async (res) => {
        this.isSwitch = res.isSwitch;
        this.productSwitch = res.productSwitch;
      });
    },
    //添加商品分类
    handleAddMenu(rowData) {
      this.editDialogConfig.isCreate = 0;
      this.editDialogConfig.prent = rowData;
      this.editDialogConfig.data = {};
      this.editDialogConfig.visible = true;
    },
    hideEditDialog() {
      this.editDialogConfig.prent = {};
      this.editDialogConfig.type = 0;
      this.editDialogConfig.visible = false;
      setTimeout(() => {
        this.$store.dispatch('product/getMerProductClassify');
      }, 200);
    },
    //视频上传前
    beforeAvatarUpload(file) {
      const isJPG = file.type === 'video/mp4';
      const isLt2M = file.size / 10240 / 10240 < 2;

      if (!isJPG) {
        this.$message.error('上传视频只能是 mp4 格式!');
      }
      if (!isLt2M) {
        this.$message.error('上传视频不能超过 20MB!');
      }
      return isJPG && isLt2M;
    },
    // 上传
    async handleUploadForm(param) {
      const formData = new FormData();
      const data = {
        model: 'product',
        pid: 0,
      };
      let loading = this.$loading({
        lock: true,
        text: '上传中，请稍候...',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)',
      });
      formData.append('multipart', param.file);
      try {
        let res = await uploadImage(formData, data);
        this.upload.videoIng = true;
        this.videoLink = res.url;
        this.progress = 100;
        loading.close();
      } catch (e) {
        loading.close();
      }
    },
    // 删除视频；
    delVideo() {
      this.$set(this, 'videoLink', '');
    },
    //清空卡密
    virtualListClear() {
      // this.$set(this[this.carMytabName][this.carMytabIndex], 'cdkey', []);
      this[this.carMytabName][this.carMytabIndex].cdkeyId = [];
    },
    //添加倒入卡密的值
    changeVirtual(e) {
      this.virtualList = this.virtualList.concat(e);
    },
    closeCloudDisk() {
      this.$refs.cloudDiskRef.cloudDiskShow = false;
    },
    //确认保存云盘链接
    handlerSubSuccessCloudDisk(e) {
      this.cloudDisk = e;
      this[this.carMytabName][this.carMytabIndex].expand = JSON.parse(JSON.stringify(e));
      this.$refs.cloudDiskRef.cloudDiskShow = false;
    },

    //查看已设置的虚拟商品
    seeVirtually(data, name, index, type) {
      this.carMytabName = name;
      this.carMytabIndex = index;
      if (type === 1) {
        this.cloudDisk = data.expand;
        this[this.carMytabName][this.carMytabIndex].expand = data.expand;
        this.$refs.cloudDiskRef.cloudDiskShow = true;
      } else {
        this.cdkeyLibraryInfo = {
          id: data.cdkeyId,
          name: data.cdkeyLibraryName,
        };
        this.$refs.cdkeyLibrary.cdkeyShow = true;
      }
    },
    // 添加虚拟链接
    handleAddVirtually(index, name, type) {
      this.carMytabIndex = index;
      this.carMytabName = name;
      //this.virtualListClear();
      if (type === 1) {
        this.cloudDisk = '';
        this.$refs.cloudDiskRef.cloudDiskShow = true;
      } else {
        this.cdkeyLibraryInfo = {};
        this.$refs.cdkeyLibrary.cdkeyShow = true;
      }
    },
    //选择卡密库回调
    handlerChangeCdkeyIdSubSuccess(row) {
      this[this.carMytabName][this.carMytabIndex].cdkeyLibraryName = row.name;
      this[this.carMytabName][this.carMytabIndex].cdkeyId = row.id;
      this[this.carMytabName][this.carMytabIndex].stock = row.stock;
    },
    //限制平台商品分类只能选择第三级
    addDisabled(dropdownList) {
      const list = [];
      try {
        dropdownList.forEach((e, index) => {
          let e_new = {
            id: e.id,
            name: e.name,
            level: e.level,
            pid: e.pid,
            isShow: e.isShow,
          };
          if (!e.childList && (e.level === 1 || e.level === 2)) {
            e_new = { ...e_new, disabled: true };
          }
          if (e.childList) {
            const childList = this.addDisabled(e.childList);
            e_new = { ...e_new, childList: childList };
          }
          list.push(e_new);
        });
      } catch (error) {
        return [];
      }
      return list;
    },
    // 生成商品表单
    addProduct() {
      if (this.url) {
        this.formValidate.content = '';
        this.loading = true;
        this.isAttr = true;
        this.copyConfig.copyType == 1
          ? copyProductApi({ url: this.url })
              .then((res) => {
                this.getData(res.info, 'copy');
                this.loading = false;
              })
              .catch(() => {
                this.loading = false;
              })
          : importProductApi({ url: this.url, form: this.form })
              .then((res) => {
                this.getData(res.info, 'copy');
                this.loading = false;
              })
              .catch(() => {
                this.loading = false;
              });
      } else {
        this.$message.warning('请输入链接地址！');
      }
    },
    /**
     * 复制商品转图片路径
     * @param sliderImage轮播图, attrValue规格
     */
    async getShopImg(sliderImage, attrValue) {
      let imgList = [...JSON.parse(sliderImage)];
      attrValue.map((item) => imgList.push(item.image));
      let attrs = [...new Set(imgList)];
      let ShopImg = [];
      attrs.map((item) => {
        ShopImg.push({
          key: item,
          img: item,
        });
      });
      let result = await this.getShopImgUpload(ShopImg, []);
      this.formValidate.images = this.formValidate.images.map((item, index) => {
        if (result[index].key && item === result[index].key) {
          return result[index].img;
        } else {
          this.formValidate.images.splice(index, 1);
        }
      });
      this.ManyAttrValue.map((item, index) => {
        result.map((items, index) => {
          if (items.key && item.image === items.key) {
            return (item.image = items.img);
          }
          // else {
          //   this.ManyAttrValue.splice(index, 1);
          // }
        });
      });
      this.fullscreenLoading = false;
    },
    async getShopImgUpload(attrs, arr) {
      for (const key in attrs) {
        let res = await this.getImgData(attrs[key].img || attrs[key].sattDir);
        arr.push({
          key: attrs[key].img || attrs[key].imgsattDir,
          img: res,
        });
      }
      return arr;
    },
    /**
     * 复制商品图片路径请求接口
     * @param imgUrl
     * @returns {Promise<any>}
     */
    getImgData(imgUrl) {
      return new Promise((resolve, reject) => {
        shopImgUploadApi({
          imgUrl: imgUrl,
          respType: 1,
          uploadType: 1,
        }).then((res) => {
          if (res.errcode > 0) {
            this.fullscreenLoading = false;
            this.$message.error(res.errmsg);
            resolve('');
          } else {
            resolve(res.img_info.temp_img_url);
          }
        });
      });
    },
    getCopyConfig() {
      copyConfigApi().then((res) => {
        this.copyConfig = res;
      });
    },
    changeGuarantee(val) {
      if (val) {
        this.guaranteeName = [];
        if (this.isShowGroup === 'combination') {
          let guaranteeGroupids = [];
          this.guaranteeGroupList
            .filter((item) => item.id === val)[0]
            .guaranteeList.map((item) => item.isShow && guaranteeGroupids.push(item.gid));
          this.formValidate.guaranteeIds = guaranteeGroupids.toString();
          this.guaranteeList.map((item) => {
            guaranteeGroupids.map((j) => {
              if (item.id === j) this.guaranteeName.push(item.name);
            });
          });
        }
      } else {
        this.guaranteeName = [];
        this.$set(this.formValidate, 'guaranteeIdsList', null);
      }
    },
    //选择保障服务模式
    onchangeIsShow() {
      this.multiples = !this.multiples;
      this.guaranteeName = [];
      this.formValidate.guaranteeIds = '';
      if (this.isShowGroup === 'combination') {
        this.guaranteeNew = this.guaranteeGroupList;
        this.$set(this.formValidate, 'guaranteeIdsList', '');
      } else {
        this.$set(this.formValidate, 'guaranteeIdsList', []);
        this.guaranteeNew = this.guaranteeList;
      }
    },
    // 服务组合列表
    getGuaranteeGroupList() {
      guaranteeListApi().then((res) => {
        this.guaranteeGroupList = res;
      });
    },
    getLabelarr(attr) {
      this.labelarr = attr;
    },
    changeNodes(data) {
      if (data.length > 0) {
        for (var i = 0; i < data.length; i++) {
          if (!data[i].childList || data[i].childList.length < 1) {
            data[i].childList = undefined;
          } else {
            this.changeNodes(data[i].childList);
          }
        }
      }
      return data;
    },
    // 保障服务列表
    getProductGuarantee() {
      productGuaranteeApi().then((res) => {
        this.guaranteeList = res.filter((item) => item.isShow);
        this.guaranteeNew = this.guaranteeList;
      });
    },

    onChangeCategory() {
      this.formValidate.brandId = '';
      this.brandList = [];
      this.getbrandList();
      this.brandList.push({ name: '其他', id: 0 });
    },
    // 下拉加载更多
    selectLoadMore() {
      this.search.page = this.search.page + 1;
      if (this.search.page > this.totalPage) return;
      this.getbrandList(); // 请求接口
    },
    // 远程搜索
    remoteMethod(query) {
      this.loading = true;
      this.search.brandName = query;
      this.search.page = 1;
      setTimeout(() => {
        this.loading = false;
        this.getbrandList(); // 请求接口
      }, 200);
    },
    // 品牌列表
    getbrandList() {
      this.search.cid = this.formValidate.categoryId;
      brandListApi(this.search).then((res) => {
        this.totalPage = res.totalPage;
        this.total = res.total;
        this.brandList = this.brandList.concat(res.list);
      });
    },
    //返佣输入
    keyupEventBrokerage(val, index, num) {
      switch (num) {
        case 1:
          this.oneFormBatch[index][val] =
            this.oneFormBatch[index][val] > 0 ? parseInt(this.oneFormBatch[index][val]) : 0;
          break;
        case 2:
          this.OneattrValue[index][val] =
            this.OneattrValue[index][val] > 0 ? parseInt(this.OneattrValue[index][val]) : 0;
          break;
        default:
          this.ManyAttrValue[index][val] =
            this.ManyAttrValue[index][val] > 0 ? parseInt(this.ManyAttrValue[index][val]) : 0;
      }
    },
    proving1(e) {
      this.formValidate.sort = e.target.value.replace(/[^\.\d]/g, '');
      this.formValidate.sort = e.target.value.replace('.', '');
    },
    handleCloseCoupon(tag) {
      this.isAttr = true;
      this.formValidate.coupons.splice(this.formValidate.coupons.indexOf(tag), 1);
      this.formValidate.couponIds.splice(this.formValidate.couponIds.indexOf(tag.id), 1);
    },
    addCoupon() {
      const _this = this;
      this.$modalCoupon(
        'wu',
        (this.keyNum += 1),
        this.formValidate.coupons,
        function (row) {
          _this.formValidate.couponIds = [];
          _this.formValidate.coupons = row;
          row.map((item) => {
            _this.formValidate.couponIds.push(item.id);
          });
        },
        '',
      );
    },
    setTagsViewTitle() {
      if (this.$route.params.id && this.$route.params.id != 0) {
        const title = this.isDisabled ? '商品详情' : '编辑商品';
        const route = Object.assign({}, this.tempRoute, { title: `${title}-${this.$route.params.id}` });
        this.$store.dispatch('tagsView/updateVisitedView', route);
      } else {
        if (this.isCopy) {
          const title = '采集商品';
          const route = Object.assign({}, this.tempRoute, { title: `${title}` });
          this.$store.dispatch('tagsView/updateVisitedView', route);
        }
      }
    },
    watCh(val) {
      const tmp = {};
      const tmpTab = {};
      this.formValidate.attr.forEach((o, i) => {
        tmp[o.attrName] = { title: o.attrName };
        tmpTab[o.attrName] = '';
      });
      this.ManyAttrValue = this.attrFormat(val);
      if (this.formValidate.attrValue) {
        this.ManyAttrValue.forEach((val, index) => {
          const key = Object.values(val.attrValue).sort().join('/');
          if (this.attrInfo[key]) this.ManyAttrValue[index] = this.attrInfo[key];
        });
        this.attrInfo = [];
        this.ManyAttrValue.forEach((val) => {
          this.attrInfo[Object.values(val.attrValue).sort().join('/')] = val;
        });
      }

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
                      price: 0.01,
                      cost: 0.01,
                      otPrice: 0.01,
                      barCode: '',
                      stock: 0,
                      weight: 0,
                      volume: 0,
                      brokerage: 0,
                      brokerageTwo: 0,
                      cdkeyId: null,
                      cdkeyLibraryName: '',
                      expand: '',
                      vipPrice: 0,
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
                price: 0.01,
                cost: 0.01,
                otPrice: 0.01,
                stock: 0,
                barCode: '',
                weight: 0,
                volume: 0,
                brokerage: 0,
                brokerageTwo: 0,
                cdkeyId: null,
                cdkeyLibraryName: '',
                expand: '',
                attrValue: { [v['attrName']]: vv },
                vipPrice: 0,
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
    // 添加规则；
    addRule() {
      const _this = this;
      this.$modalAttr(this.formDynamics, function () {
        _this.productGetRule();
      });
    },
    // 选择规格
    onChangeSpec(num) {
      this.isAttr = true;
      if (num) {
        this.productGetRule();
        if (this.$route.params.id != 0) this.formValidate.attr = [];
      }
    },
    // 选择属性确认
    confirm() {
      this.isAttr = true;
      if (!this.formValidate.selectRule) {
        return this.$message.warning('请选择属性');
      }
      const data = [];
      this.ruleList.forEach((item) => {
        if (item.id === this.formValidate.selectRule) {
          item.ruleValue.forEach((i) => {
            data.push({
              attrName: i.value,
              attrValue: i.detail,
            });
          });
        }
        this.formValidate.attr = data;
      });
    },
    // 获取商品属性模板；
    productGetRule() {
      templateListApi(this.tableFrom).then((res) => {
        const list = res.list;
        for (var i = 0; i < list.length; i++) {
          list[i].ruleValue = JSON.parse(list[i].ruleValue);
        }
        this.ruleList = list;
      });
    },
    showInput(item) {
      this.$set(item, 'inputVisible', true);
    },
    // 删除表格中的属性
    delAttrTable(index) {
      this.ManyAttrValue.splice(index, 1);
    },
    // 批量添加
    batchAdd() {
      for (const val of this.ManyAttrValue) {
        if (this.oneFormBatch[0].image) this.$set(val, 'image', this.oneFormBatch[0].image);
        if (this.oneFormBatch[0].price > 0) this.$set(val, 'price', this.oneFormBatch[0].price);
        if (this.oneFormBatch[0].cost > 0) this.$set(val, 'cost', this.oneFormBatch[0].cost);
        if (this.oneFormBatch[0].otPrice > 0) this.$set(val, 'otPrice', this.oneFormBatch[0].otPrice);
        if (this.oneFormBatch[0].barCode) this.$set(val, 'barCode', this.oneFormBatch[0].barCode);
        if (this.oneFormBatch[0].stock > 0) this.$set(val, 'stock', this.oneFormBatch[0].stock);
        if (this.oneFormBatch[0].weight > 0) this.$set(val, 'weight', this.oneFormBatch[0].weight);
        if (this.oneFormBatch[0].volume > 0) this.$set(val, 'volume', this.oneFormBatch[0].volume);
        if (this.oneFormBatch[0].brokerage > 0) this.$set(val, 'brokerage', this.oneFormBatch[0].brokerage);
        if (this.oneFormBatch[0].brokerageTwo > 0) this.$set(val, 'brokerageTwo', this.oneFormBatch[0].brokerageTwo);
        if (this.oneFormBatch[0].vipPrice > 0) this.$set(val, 'vipPrice', this.oneFormBatch[0].vipPrice);
      }
    },
    // 添加按钮
    addBtn() {
      this.clearAttr();
      this.isBtn = true;
    },
    clearAttr() {
      this.isAttr = true;
      this.formDynamic.attrsName = '';
      this.formDynamic.attrsVal = '';
    },
    // 删除规格
    handleRemoveAttr(index) {
      this.isAttr = true;
      this.formValidate.attr.splice(index, 1);
      this.manyFormValidate.splice(index, 1);
    },
    // 删除属性
    handleClose(item, index) {
      item.splice(index, 1);
    },
    // 添加规则名称
    createAttrName() {
      this.isAttr = true;
      if (this.formDynamic.attrsName && this.formDynamic.attrsVal) {
        const data = {
          attrName: this.formDynamic.attrsName,
          attrValue: [this.formDynamic.attrsVal],
        };
        this.formValidate.attr.push(data);
        var hash = {};
        this.formValidate.attr = this.formValidate.attr.reduce(function (item, next) {
          /* eslint-disable */
          hash[next.attrName] ? '' : (hash[next.attrName] = true && item.push(next));
          return item;
        }, []);
        this.clearAttr();
        this.isBtn = false;
      } else {
        this.$message.warning('请添加完整的规格！');
      }
    },
    // 添加属性
    createAttr(num, idx) {
      if (!num) return this.$message.warning('请添加属性');
      this.isAttr = true;
      if (num) {
        this.formValidate.attr[idx].attrValue.push(num);
        var hash = {};
        this.formValidate.attr[idx].attrValue = this.formValidate.attr[idx].attrValue.reduce(function (item, next) {
          /* eslint-disable */
          hash[next] ? '' : (hash[next] = true && item.push(next));
          return item;
        }, []);
        this.formValidate.attr[idx].inputVisible = false;
      } else {
      }
    },
    //点击展示所有多规格属性
    showAllSku() {
      if (this.isAttr == false) {
        this.isAttr = true;
        if (this.formValidate.specType && this.isAttr) this.watCh(this.formValidate.attr); //重要！！！
      } else if (this.isAttr == true) {
        this.isAttr = false;
        this.getInfo();
      }
    },
    getData(res, type) {
      let info = res;
      this.formValidate.content = '';
      this.formValidate = {
        ...info,
        image: this.$selfUtil.setDomain(info.image),
        sliderImages: JSON.parse(info.sliderImage),
        cateIds: info.cateId ? info.cateId.split(',') : [], // 商品分类id
        sort: info.sort ? info.sort : 0,
        attr: info.attr ? info.attr : [],
        attrValue: info.attrValue ? info.attrValue : [],
        isSub: info.isSub ? info.isSub : false,
        content: info.content ? this.$selfUtil.replaceImgSrcHttps(info.content) : '',
        id: info.id ? info.id : 0,
        coupons: info.coupons ? info.coupons : [],
        couponIds: info.couponIds ? info.couponIds : [],
        type: info.type ? info.type : Number(this.$route.params.productType),
        guaranteeIdsList: info.guaranteeIds ? info.guaranteeIds.split(',').map(Number) : [], //保障服务
        isPaidMember: info.isPaidMember ? info.isPaidMember : false,
        deliveryMethodList: info.deliveryMethod ? info.deliveryMethod.split(',') : ['1'],
        systemFormId: info.systemFormId ? info.systemFormId : null,
        refundSwitch: type === 'add' ? info.refundSwitch : true
      };
      this.htmlKey++;
      this.labelarr = info.keyword ? info.keyword.split(',') : [];
      if (this.formValidate.categoryId) {
        this.getbrandList();
        this.brandList.push({ name: '其他', id: 0 });
      }
      if (this.formValidate.couponIds) {
        productCouponListApi().then((res) => {
          let ids = this.formValidate.couponIds.toString();
          let arr = res;
          let obj = {};
          for (let i in arr) {
            obj[arr[i].id] = arr[i];
          }
          let strArr = ids.split(',');
          let newArr = [];
          for (let item of strArr) {
            if (obj[item]) {
              newArr.push(obj[item]);
            }
          }
          this.$set(this.formValidate, 'coupons', newArr); //在编辑回显时，让返回数据中的优惠券id，通过接口匹配显示,
        });
      }

      let imgs = JSON.parse(info.sliderImage);
      let imgss = [];
      Object.keys(imgs).map((i) => {
        imgss.push(this.$selfUtil.setDomain(imgs[i]));
      });
      this.formValidate.sliderImages = [...imgss];
      if (this.getFileType(this.formValidate.sliderImages[0]) == 'video') {
        //如果返回数据轮播图的第一张是视频，就将其赋值给videoLink做渲染，同时将其在轮播图中删除
        this.$set(this, 'videoLink', this.formValidate.sliderImages[0]);
        this.formValidate.sliderImages.splice(0, 1);
      }
      if (info.specType) {
        this.productGetRule(); //加载商品规格选项
        if (info.attrValue) {
          this.formValidate.attr = info.attr.map((item) => {
            return {
              attrName: item.attrName,
              attrValue: item.attrValues.split(','),
            };
          });
          this.ManyAttrValue = info.attrValue;
          this.ManyAttrValue.forEach((val) => {
            val.image = this.$selfUtil.setDomain(val.image);
            val.attrValue = JSON.parse(val.attrValue);
            this.attrInfo[Object.values(val.attrValue).sort().join('/')] = val;
            val.brokerage = val.brokerage || 0;
            val.brokerageTwo = val.brokerageTwo || 0;
            val.vipPrice = val.vipPrice || 0;
          });
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
          if (this.formValidate.attr.length) {
            this.oneFormBatch[0].image = this.$selfUtil.setDomain(info.image);
            this.formValidate.attr = info.attr.map((item) => {
              return {
                attrName: item.attrName,
                attrValue: JSON.parse(item.attrValues),
              };
            });
          }
        }
      } else {
        this.OneattrValue = info.attrValue;
      }
    },
    // 详情
    getInfo() {
      this.fullscreenLoading = true;
      productDetailApi(this.$route.params.id)
        .then(async (res) => {
          // this.isAttr = true;
          this.getData(res, 'add');
          this.fullscreenLoading = false;
        })
        .catch((res) => {
          this.fullscreenLoading = false;
        });
    },
    handleRemove(i) {
      this.formValidate.sliderImages.splice(i, 1);
    },
    // 点击商品图
    modalPicTap(tit, num, i, status) {
      const _this = this;
      if (_this.isDisabled) return;
      this.$modalUpload(
        function (img) {
          if (!img) return;
          if (tit === '1' && !num) {
            _this.formValidate.image = img[0].sattDir;
            _this.OneattrValue[0].image = img[0].sattDir;
          }
          if (tit === '2' && !num) {
            if (img.length > 10) return this.$message.warning('最多选择10张图片！');
            if (img.length + _this.formValidate.sliderImages.length > 10)
              return this.$message.warning('最多选择10张图片！');
            img.map((item) => {
              _this.formValidate.sliderImages.push(item.sattDir);
            });
          }
          if (tit === '1' && num === 'dan') {
            _this.OneattrValue[0].image = img[0].sattDir;
          }
          if (tit === '1' && num === 'duo') {
            _this.ManyAttrValue[i].image = img[0].sattDir;
          }
          if (tit === '1' && num === 'pi') {
            _this.oneFormBatch[0].image = img[0].sattDir;
          }
        },
        tit,
        'content',
      );
    },
    // 上一步
    handleSubmitUp() {
      this.currentTab = (Number(this.currentTab) - 1).toString();
    },
    // 下一步
    handleSubmitNest(name) {
      this.$refs[name].validate((valid) => {
        if (valid) {
          this.currentTab = (Number(this.currentTab) + 1).toString();
        } else {
          if (
            !this.formValidate.name ||
            !this.formValidate.categoryId ||
            !this.formValidate.keyword ||
            !this.formValidate.unitName ||
            !this.formValidate.intro ||
            !this.formValidate.image ||
            !this.formValidate.sliderImages ||
            !this.formValidate.deliveryMethodList.length
          ) {
            this.$message.warning('请填写完整商品信息！');
          }
        }
      });
    },
    //保存接口数据更新
    getFromData() {
      if (this.formValidate.specType && this.formValidate.attr.length < 1)
        return this.$message.warning('请填写多规格属性！');
      this.formValidate.cateId = this.formValidate.cateIds.join(',');
      this.formValidate.keyword = this.labelarr.join(',');
      if (!this.formValidate.systemFormId) this.formValidate.systemFormId = 0;
      if (this.videoLink) {
        //如果有视频主图，将视频链接插入到轮播图第一的位置
        this.formValidate.sliderImages.unshift(this.videoLink);
      }
      this.formValidate.sliderImage = JSON.stringify(this.formValidate.sliderImages);
      this.formValidate.deliveryMethod = this.formValidate.deliveryMethodList.join(',');
      if (this.isShowGroup === 'alone') this.formValidate.guaranteeIds = this.formValidate.guaranteeIdsList.join(',');
      if (this.formValidate.specType) {
        this.formValidate.attrValue = this.ManyAttrValue;
        this.formValidate.attr = this.formValidate.attr.map((item) => {
          return {
            attrName: item.attrName,
            id: item.id,
            attrValue: item.attrValue,
            attrValues: item.attrValue.join(','),
          };
        });
        for (var i = 0; i < this.formValidate.attrValue.length; i++) {
          let attrValues = this.formValidate.attrValue[i].attrValue;
          this.$set(this.formValidate.attrValue[i], 'attrValue', JSON.stringify(attrValues)); //
          delete this.formValidate.attrValue[i].value0;
        }
      } else {
        this.formValidate.attr = [
          {
            attrName: '规格',
            attrValues: '默认',
            id: parseFloat(this.$route.params.id) > 0 ? this.formValidate.attr[0].id : 0,
          },
        ];
        this.OneattrValue.map((item) => {
          this.$set(item, 'attrValue', JSON.stringify({ 规格: '默认' }));
        });
        this.formValidate.attrValue = this.OneattrValue;
      }
      if (this.formValidate.type != 0) this.formValidate.tempId = 0;
    },
    //是否自动上架
    automaticListing() {
      this.$confirm(this.productSwitch ? '审核通过之后是否自动上架？' : '操作之后是否自动上架？', '提示', {
        confirmButtonText: '上架',
        cancelButtonText: '不用了',
        type: 'warning',
        closeOnClickModal: false,
        distinguishCancelAndClose: true,
        customClass: 'deleteConfirm',
      })
        .then(() => {
          this.formValidate.isAutoUp = true;
          this.postData();
        })
        .catch((action) => {
          if (action === 'cancel') {
            this.formValidate.isAutoUp = false;
            this.postData();
            // 调用取消按钮的方法
          } else if (action === 'close') {
            // 调用关闭按钮的方法
          }
        });
    },
    //保存并审核
    handleSubmitAndAudit(name) {
      this.$refs[name].validate((valid) => {
        if (valid) {
          this.getFromData();
          this.formValidate.isAutoSubmitAudit = true;
          this.automaticListing();
        } else {
          if (
            !this.formValidate.name ||
            !this.formValidate.cateId ||
            !this.formValidate.keyword ||
            !this.formValidate.unitName ||
            !this.formValidate.intro ||
            !this.formValidate.image ||
            !this.formValidate.sliderImages
          ) {
            this.$message.warning('请填写完整商品信息！');
          }
        }
      });
    },
    // 保存
    handleSubmit(name) {
      this.$refs[name].validate((valid) => {
        if (valid) {
          this.getFromData();
          //免审商品，保存的时候弹出上架弹窗，条件：店铺开启 && 店铺免审
          if (this.isSwitch && !this.productSwitch) {
            this.formValidate.isAutoSubmitAudit = false;
            this.automaticListing();
          } else {
            this.formValidate.isAutoUp = false;
            this.formValidate.isAutoSubmitAudit = false;
            this.postData();
          }
        } else {
          if (
            !this.formValidate.name ||
            !this.formValidate.cateId ||
            !this.formValidate.keyword ||
            !this.formValidate.unitName ||
            !this.formValidate.intro ||
            !this.formValidate.image ||
            !this.formValidate.sliderImages
          ) {
            this.$message.warning('请填写完整商品信息！');
          }
        }
      });
    },
    // 新增保存数据
    postData() {
      this.loadingBtn = true;
      parseFloat(this.$route.params.id) > 0
        ? productUpdateApi(this.formValidate)
            .then(async (res) => {
              this.$message.success('编辑成功');
              setTimeout(() => {
                this.$router.push({ path: '/product/list' });
              }, 500);
              this.closeSelectedTag();
              this.loadingBtn = false;
            })
            .catch((res) => {
              this.loadingBtn = false;
              for (var i = 0; i < this.formValidate.attrValue.length; i++) {
                let attrValues = this.formValidate.attrValue[i].attrValue;
                this.$set(this.formValidate.attrValue[i], 'attrValue', JSON.parse(attrValues));
              }
              if (this.formValidate.specType) this.ManyAttrValue = this.formValidate.attrValue;
            })
        : productCreateApi(this.formValidate)
            .then(async (res) => {
              this.$message.success('新增成功');
              setTimeout(() => {
                this.$router.push({ path: '/product/list' });
              }, 500);
              this.closeSelectedTag();
              this.loadingBtn = false;
            })
            .catch((res) => {
              this.loadingBtn = false;
              for (var i = 0; i < this.formValidate.attrValue.length; i++) {
                let attrValues = this.formValidate.attrValue[i].attrValue;
                this.$set(this.formValidate.attrValue[i], 'attrValue', JSON.parse(attrValues));
              }
              if (this.formValidate.specType) this.ManyAttrValue = this.formValidate.attrValue;
            });
    },
    isActive(route) {
      return route.path === this.$route.path;
    },
    closeSelectedTag() {
      let that = this;
      that.$store.dispatch('tagsView/delView', that.$route).then(({ visitedViews }) => {
        if (that.isActive(that.$route)) {
          that.toLastView(visitedViews, that.$route);
        }
      });
    },
    toLastView(visitedViews, view) {
      const latestView = visitedViews.slice(-1)[0];
      if (latestView) {
        this.$router.push(latestView.fullPath);
      } else {
        // now the default is to redirect to the home page if there is no tags-view,
        // you can adjust it according to your needs.
        if (view.name === 'Dashboard') {
          // to reload home page
          this.$router.replace({ path: '/redirect' + view.fullPath });
        } else {
          this.$router.push('/');
        }
      }
    },
    // 表单验证
    validate(prop, status, error) {
      if (status === false) {
        this.$message.warning(error);
      }
    },
    // 移动
    handleDragStart(e, item) {
      if (!this.isDisabled) this.dragging = item;
    },
    handleDragEnd(e, item) {
      if (!this.isDisabled) this.dragging = null;
    },
    handleDragOver(e) {
      if (!this.isDisabled) e.dataTransfer.dropEffect = 'move';
    },
    handleDragEnter(e, item, index) {
      if (!this.isDisabled) {
        e.dataTransfer.effectAllowed = 'move';
        if (item === this.dragging) {
          return;
        }
        const newItems =
          index || index === 0 ? [...this.formValidate.attr[index].attrValue] : [...this.formValidate.sliderImages];
        const src = newItems.indexOf(this.dragging);
        const dst = newItems.indexOf(item);
        newItems.splice(dst, 0, ...newItems.splice(src, 1));
        if (index || index === 0) {
          this.formValidate.attr[index].attrValue = newItems;
        } else {
          this.formValidate.sliderImages = newItems;
        }
      }
    },
    getFileType(fileName) {
      // 后缀获取
      let suffix = '';
      // 获取类型结果
      let result = '';
      try {
        const flieArr = fileName.split('.');
        suffix = flieArr[flieArr.length - 1];
      } catch (err) {
        suffix = '';
      }
      // fileName无后缀返回 false
      if (!suffix) {
        return false;
      }
      suffix = suffix.toLocaleLowerCase();
      // 图片格式
      const imglist = ['png', 'jpg', 'jpeg', 'bmp', 'gif'];
      // 进行图片匹配
      result = imglist.find((item) => item === suffix);
      if (result) {
        return 'image';
      }
      // 匹配 视频
      const videolist = ['mp4', 'm2v', 'mkv', 'rmvb', 'wmv', 'avi', 'flv', 'mov', 'm4v'];
      result = videolist.find((item) => item === suffix);
      if (result) {
        return 'video';
      }
      // 其他 文件类型
      return 'other';
    },
  },
};
</script>
<style scoped lang="scss">
.perW50 {
  width: 80%;
}
.line-ht {
  line-height: 28px;
}
.el-icon-warning {
  position: relative;
  top: 9px;
  left: 17px;
}
.disLabel {
  ::v-deepel-form-item__label {
    margin-left: 36px !important;
  }
}
.disLabelmoren {
  ::v-deepel-form-item__label {
    margin-left: 120px !important;
  }
}
.color-item {
  height: 30px;
  line-height: 30px;
  padding: 0 10px;
  color: #fff;
  margin-right: 10px;
}
.color-list .color-item.blue {
  background-color: #1e9fff;
}
.color-list .color-item.yellow {
  background-color: rgb(254, 185, 0);
}
.color-list .color-item.green {
  background-color: #009688;
}
.color-list .color-item.red {
  background-color: #ed4014;
}

.noLeft {
  ::v-deepel-form-item__content {
    margin-left: 0 !important;
  }
}
.tabNumWidth {
  ::v-deep .el-input-number--medium {
    width: 121px !important;
  }
  ::v-deep .el-input-number__increase {
    width: 20px !important;
    font-size: 12px !important;
  }
  ::v-deep .el-input-number__decrease {
    width: 20px !important;
    font-size: 12px !important;
  }
  ::v-deep .el-input-number--medium .el-input__inner {
    padding-left: 25px !important;
    padding-right: 25px !important;
  }
  ::v-deep thead {
    line-height: normal !important;
  }
  ::v-deep .el-table .cell {
    line-height: normal !important;
  }
}
.selWidth100 {
  width: 100%;
}
.selWidthd {
  width: 300px;
}
.input-new-tag {
  width: 150px;
  margin-left: 10px;
  vertical-align: bottom;
}
.pictrue {
  width: 60px;
  height: 60px;
  border: 1px dotted rgba(0, 0, 0, 0.1);
  margin-right: 10px;
  position: relative;
  cursor: pointer;
  img {
    width: 100%;
    height: 100%;
  }
  video {
    width: 100%;
    height: 100%;
  }
}
.btndel {
  position: absolute;
  z-index: 1;
  width: 20px !important;
  height: 20px !important;
  left: 46px;
  top: -4px;
}
.labeltop {
  ::v-deepel-form-item__label {
    float: none !important;
    display: inline-block !important;
    width: auto !important;
  }
}
.iview-video-style {
  width: 460px;
  height: 180px;
  border-radius: 10px;
  background-color: #707070;
  margin-top: 10px;
  position: relative;
  overflow: hidden;
}

.iview-video-style .iconv {
  color: #fff;
  line-height: 180px;
  width: 50px;
  height: 50px;
  display: inherit;
  font-size: 26px;
  position: absolute;
  top: -74px;
  left: 50%;
  margin-left: -25px;
}

.iview-video-style .mark {
  position: absolute;
  width: 100%;
  height: 30px;
  top: 0;
  background-color: rgba(0, 0, 0, 0.5);
  text-align: center;
}
</style>
