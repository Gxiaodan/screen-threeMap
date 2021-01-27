<template>
  <div class="container">
    <div id="canvas_content" />
    <div id="testDiv">
      <div>省份&nbsp;:&nbsp;&nbsp;&nbsp;{{ provinceName }}</div>
    </div>
    <div id="hoverDiv">
      <div>省份&nbsp;:&nbsp;&nbsp;&nbsp;{{ provinceName }}</div>
    </div>
    <div id="totalDiv">
      <div class="num-con">
        <countTo :startVal='startVal' :endVal='endVal' :duration='6000'></countTo>
      </div>
    </div>
  </div>
</template>
<script>
import * as THREE from 'three'
import './index.less'

import ThreeMapLightBar from './ThreeMapLightBar.js'
import ThreeMap from './ThreeMap.js'
import { util } from './util'
import countTo from 'vue-count-to';
export default {
  name: 'ThreeMap',
  components: {countTo},
  data() {
    return {
      startVal: 0,
      endVal: 0,
      provinceName: '',
      datas: [
        { name: '海南省', value: 60 },
        { name: '北京市', value: 100 },
        { name: '山东省', value: 80 },
        { name: '海南省', value: 100 },
        { name: '四川省', value: 100 },
        { name: '台湾', value: 70 },
        { name: '黑龙江省', value: 80 },
        { name: '湖北省', value: 70 },
        { name: '内蒙古自治区', value: 50 },
        { name: '西藏自治区', value: 50 },
        { name: '新疆维吾尔自治区', value: 63 },
        { name: '甘肃省', value: 63 },
        { name: '陕西省', value: 83 },
        { name: '上海市', value: 73 },
        { name: '福建省', value: 63 },
        { name: '广东省', value: 53 },
        { name: '云南省', value: 43 },
        { name: '辽宁省', value: 63 },
        { name: '青海省', value: 90 }
      ],
      flyDatas: [
        // { source: { name: '海南省' }, target: { name: '四川省' }, value: 100 },
        { source: { name: '北京市' }, target: { name: '四川省' }, value: 150 },
        // { source: { name: '山东省' }, target: { name: '四川省' }, value: 120 },
        // { source: { name: '台湾' }, target: { name: '四川省' }, value: 80 },
        // { source: { name: '黑龙江省' }, target: { name: '四川省' }, value: 40 },
        { source: { name: '陕西省' }, target: { name: '四川省' }, value: 60 },
        {
          source: { name: '上海市' },
          target: { name: '四川省' },
          value: 70
        },
        // {
        //   source: { name: '西藏自治区' },
        //   target: { name: '四川省' },
        //   value: 10
        // },
        {
          source: { name: '新疆维吾尔自治区' },
          target: { name: '四川省' },
          value: 200
        },
        // { source: { name: '青海省' }, target: { name: '四川省' }, value: 20 }
      ]
    }
  },
  mounted() {
    const loader = new THREE.FileLoader()
    const _this = this
    loader.load('./assets/map/china.json', function(data) {
      const dataJson = JSON.parse(data)
      const mapData = util.decode(dataJson)
      console.log(mapData)
      // _this.initMap(jsonData)
      const map = new ThreeMapLightBar({ mapData })
      
      _this.endVal = 18181116
      map.on('mouseFn', (e, g, p) => {
        const type = e.type
        if (type == 'mousemove') {
          map.setLabelPos(g, 'mousemove', p)
          _this.provinceName = map.provinceName
          // map.setAreaColor(g);
        } else if (type == 'mouseup') {
          // map.setAreaColor(g)
          map.setLabelPos(g, 'mouseup', p)
        }
      })

      // 绘制光柱
      map.drawLightBar(_this.datas)

      // 绘制线条
      map.drawFlyLine(_this.flyDatas)
    })
  },
  created() {},
  methods: {}
}
</script>

<style lang="less">

.container{
  width: 100%;
  height: calc(100vh);
  background: url('~@/assets/img/bg_img.jpg');
  position: relative;

  .canvas_content{
    position: absolute;
  }
  #totalDiv{
    width: 600px;
    height: 200px;
    // background: #146279;
    left: 0px;
    top: -400px;
    .num-con{
      font-size: 80px;
      font-weight: bold;
      text-align: center;
      margin-top: 30px;
      &>span{
        display: block;
        background-image: -webkit-linear-gradient(bottom, red, #fd8403, yellow);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        -webkit-box-reflect: below -40px -webkit-gradient(linear,left top,left bottom,from(rgba(0,0,0,0)),to(rgba(0,0,0, 0.5)));
      }
    }
  }
}
</style>
