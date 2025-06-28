import { validatePhone } from '@/utils/toolsValidate';

export const postRules = {
  expressCode: [{ required: true, message: '请选择快递公司', trigger: 'change' }],
  expressNumber: [{ required: true, message: '请输入快递单号', trigger: 'blur' }],
  deliveryCarrier: [{ required: true, message: '请输入配送人员', trigger: 'blur' }],
  carrierPhone: [{ required: true, validator: validatePhone, trigger: 'blur' }],
  isSplit: [{ required: true, message: '请选择分单发货', trigger: 'change' }],
};
