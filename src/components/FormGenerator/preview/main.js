// +----------------------------------------------------------------------
// | CRMEB [ CRMEB赋能开发者，助力企业发展 ]
// +----------------------------------------------------------------------
// | Copyright (c) 2016~2024 https://www.crmeb.com All rights reserved.
// +----------------------------------------------------------------------
// | Licensed CRMEB并不是自由软件，未经许可不能去掉CRMEB相关版权
// +----------------------------------------------------------------------
// | Author: CRMEB Team <admin@crmeb.com>
// +----------------------------------------------------------------------

import Vue from 'vue';
import { loadScriptQueue } from '@/utils/loadScript';
import Tinymce from '@/components/tinymce';

Vue.component('tinymce', Tinymce);

const $previewApp = document.getElementById('previewApp');
const childAttrs = {
  file: '',
  dialog: ' width="600px" class="dialog-width" v-if="visible" :visible.sync="visible" :modal-append-to-body="false" ',
};

window.addEventListener('message', init, false);

function buildLinks(links) {
  let strs = '';
  links.forEach((url) => {
    strs += `<link href="${url}" rel="stylesheet">`;
  });
  return strs;
}

function init(event) {
  if (event.data.type === 'refreshFrame') {
    const code = event.data.data;
    const attrs = childAttrs[code.generateConf.type];
    let links = '';

    if (Array.isArray(code.links) && code.links.length > 0) {
      links = buildLinks(code.links);
    }

    $previewApp.innerHTML = `${links}<style>${code.css}</style><div id="app"></div>`;

    if (Array.isArray(code.scripts) && code.scripts.length > 0) {
      loadScriptQueue(code.scripts, () => {
        newVue(attrs, code.js, code.html);
      });
    } else {
      newVue(attrs, code.js, code.html);
    }
  }
}

function newVue(attrs, main, html) {
  main = eval(`(${main})`);
  main.template = `<div>${html}</div>`;
  new Vue({
    components: {
      child: main,
    },
    data() {
      return {
        visible: true,
      };
    },
    template: `<div><child ${attrs}/></div>`,
  }).$mount('#app');
}
