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

import render from '@/components/FormGenerator/components/render/render.js';

const ruleTrigger = {
  'el-input': 'blur',
  'el-input-number': 'blur',
  'el-select': 'change',
  'el-radio-group': 'change',
  'el-checkbox-group': 'change',
  'el-cascader': 'change',
  'el-time-picker': 'change',
  'el-date-picker': 'change',
  'el-rate': 'change',
};

function renderFrom(h) {
  const { formConfCopy } = this;
  return (
    <el-row gutter={formConfCopy.gutter}>
      <el-form
        size={formConfCopy.size}
        label-position={formConfCopy.labelPosition}
        disabled={formConfCopy.disabled}
        label-width={`${formConfCopy.labelWidth}px`}
        ref={formConfCopy.formRef}
        // model不能直接赋值 https://github.com/vuejs/jsx/issues/49#issuecomment-472013664
        props={{ model: this[formConfCopy.formModel] }}
        rules={this[formConfCopy.formRules]}
      >
        {renderFormItem.call(this, h, formConfCopy.fields)}
        {formConfCopy.formBtns && formBtns.call(this, h)}
      </el-form>
    </el-row>
  );
}

function formBtns(h) {
  return (
    <el-col>
      <el-form-item size="mini">
        <el-button type="primary" loading={this.loading} onClick={this.submitForm}>
          提交
        </el-button>
      </el-form-item>
    </el-col>
  );
}

function renderFormItem(h, elementList) {
  return elementList.map((scheme) => {
    const config = scheme.__config__;
    const layout = layouts[config.layout];
    if (layout) {
      return layout.call(this, h, scheme);
    }
    throw new Error(`没有与${config.layout}匹配的layout`);
  });
}

function renderChildren(h, scheme) {
  const config = scheme.__config__;
  if (!Array.isArray(config.children)) return null;
  return renderFormItem.call(this, h, config.children);
}

function setValue(event, config, scheme) {
  this.$set(config, 'defaultValue', event);
  this.$set(this[this.formConf.formModel], scheme.__vModel__, event);
}

function buildListeners(scheme) {
  const config = scheme.__config__;
  const methods = this.formConf.__methods__ || {};
  const listeners = {};

  // 给__methods__中的方法绑定this和event
  Object.keys(methods).forEach((key) => {
    listeners[key] = (event) => methods[key].call(this, event);
  });
  // 响应 render.js 中的 vModel $emit('input', val)
  listeners.input = (event) => setValue.call(this, event, config, scheme);

  return listeners;
}
const layouts = {
  colFormItem(h, scheme) {
    const config = scheme.__config__;
    const listeners = buildListeners.call(this, scheme);
    let labelWidth = config.labelWidth ? `${config.labelWidth}px` : null;
    if (config.showLabel === false) labelWidth = '0';
    if (config.tips && !config.tipsIsLink) {
      return (
        <el-col span={config.span}>
          <el-form-item label-width={labelWidth} prop={scheme.__vModel__} label={config.showLabel ? config.label : ''}>
            <el-tooltip effect="dark" placement="top-start" style="padding:10px 5px 0 0;">
              <i class="el-icon-warning-outline" />{' '}
              <div slot="content" style="max-width:400px;">
                {config.tipsDesc}
              </div>
            </el-tooltip>
            <render conf={scheme} {...{ on: listeners }} />
          </el-form-item>
        </el-col>
      );
    } else if (config.tips && config.tipsIsLink) {
      return (
        <el-col span={config.span}>
          <el-form-item label-width={labelWidth} prop={scheme.__vModel__} label={config.showLabel ? config.label : ''}>
            <el-tooltip effect="dark" placement="top-start" style="padding:10px 5px 0 0;">
              <i class="el-icon-warning-outline" />{' '}
              <div slot="content" style="max-width:400px;">
                <a href={config.tipsLink} target="_blank">
                  {config.tipsDesc}
                </a>
              </div>
            </el-tooltip>
            <render conf={scheme} {...{ on: listeners }} />
          </el-form-item>
        </el-col>
      );
    } else {
      return (
        <el-col span={config.span}>
          <el-form-item label-width={labelWidth} prop={scheme.__vModel__} label={config.showLabel ? config.label : ''}>
            <render conf={scheme} {...{ on: listeners }} />
          </el-form-item>
        </el-col>
      );
    }
  },
  rowFormItem(h, scheme) {
    let child = renderChildren.apply(this, arguments);
    if (scheme.type === 'flex') {
      child = (
        <el-row type={scheme.type} justify={scheme.justify} align={scheme.align}>
          {child}
        </el-row>
      );
    }
    return (
      <el-col span={scheme.span}>
        <el-row gutter={scheme.gutter}>{child}</el-row>
      </el-col>
    );
  },
};

export default {
  data() {
    return {
      loading: true,
    };
  },
  components: {
    render,
  },
  props: {
    formConf: {
      type: Object,
      required: true,
    },
    formEditData: {
      type: Object,
    },
    isEdit: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    this.formConf.fields.forEach((conf) => {
      // 设置现有的数据
      const hasValueForEdit = this.formEditData[conf.__vModel__];
      if (hasValueForEdit) {
        conf.__config__.defaultValue = hasValueForEdit;
      }
      // 如果是el-select标签 判断数据后改变实现默认选中效果
      if (conf.__config__.tag === 'el-select' || conf.__config__.tag === 'el-radio-group') {
        const perValue = conf.__slot__.options.filter((option) => option.value == this.formEditData[conf.__vModel__]);
        if (perValue.length > 0) {
          // 有表单数据
          conf.__config__.defaultValue = perValue[0].value;
        }
      }
    });
    const data = {
      formConfCopy: JSON.parse(JSON.stringify(this.formConf)),
      [this.formConf.formModel]: {},
      [this.formConf.formRules]: {},
    };
    this.initFormData(data.formConfCopy.fields, data[this.formConf.formModel]);
    this.buildRules(data.formConfCopy.fields, data[this.formConf.formRules]);
    return data;
  },
  methods: {
    initFormData(componentList, formData) {
      componentList.forEach((cur) => {
        const config = cur.__config__;
        if (cur.__vModel__) formData[cur.__vModel__] = config.defaultValue;
        if (config.children) this.initFormData(config.children, formData);
      });
    },
    buildRules(componentList, rules) {
      componentList.forEach((cur) => {
        const config = cur.__config__;
        if (Array.isArray(config.regList)) {
          if (config.required) {
            const required = { required: config.required, message: cur.placeholder };
            if (Array.isArray(config.defaultValue)) {
              required.type = 'array';
              required.message = `请至少选择一个${config.label}`;
            }
            required.message === undefined && (required.message = `${config.label}不能为空`);
            config.regList.push(required);
          }
          rules[cur.__vModel__] = config.regList.map((item) => {
            item.pattern && (item.pattern = eval(item.pattern));
            item.trigger = ruleTrigger && ruleTrigger[config.tag];
            return item;
          });
        }
        if (config.children) this.buildRules(config.children, rules);
      });
    },
    resetForm() {
      this.$emit('resetForm', this.formConf);
      this.formConfCopy = JSON.parse(JSON.stringify(this.formConf));
      this.$refs[this.formConf.formRef].resetFields();
    },
    submitForm() {
      this.$refs[this.formConf.formRef].validate((valid) => {
        if (!valid) return false;
        this.loading = true;
        Object.assign(this[this.formConf.formModel], { id: this.formEditData.id });
        // 触发sumit事件
        this.$emit('submit', this[this.formConf.formModel]);
        this.loading = false;
        return true;
      });
    },
  },
  render(h) {
    return renderFrom.call(this, h);
  },
};
</script>
