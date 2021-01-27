import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
Vue.config.productionTip = false
import 'view-design/dist/styles/iview.css';
import {Row, Col} from 'view-design'
Vue.component('Row', Row)
Vue.component('Col', Col)
new Vue({
    router,
    store,
    render: h => h(App)
}).$mount('#app')
