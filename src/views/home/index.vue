<template>
  <div class="container">
    <video class="bgvid" id="bgvid" autoplay muted loop>
      <source src="@/assets/img/bg.webm" type="video/webm" />
    </video>
    <div id="canvas_content" />
    <div id="dialogDiv">
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
    <div v-for="(label, index) in labelDatas" :key="index" :id="label.id" class="fixed-label">{{label.name}}</div>
  </div>
</template>
<script>
import * as THREE from 'three'
import './index.less'
import topImg from '@/assets/img/top.png'
import sideImg from '@/assets/img/side.png'
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
      labelDatas: [
        { name: '北京', value: 100, coordinates:[116.405285, 39.904989], id: "label-001"},
        { name: '徐州', value: 100, coordinates:[117.2, 34.26], id: "label-002"},
        { name: '遵义', value: 100, coordinates:[116.9, 27.7], id: "label-003"},
        { name: '和田', value: 100, coordinates:[79.94, 37.12], id: "label-004"},
        { name: '杭州', value: 100, coordinates:[120.19, 30.26], id: "label-005"},
        { name: '西安', value: 83, coordinates:[108.948024, 34.263161], id: "label-006"},
        { name: '上海', value: 73, coordinates:[121.472644, 31.231706], id: "label-007"}
      ],
       datas: [
        { name: '北京市', value: 100,  },
        { name: '新疆维吾尔自治区', value: 63 },
        { name: '陕西省', value: 83 },
        { name: '上海市', value: 73 }
      ],
      flyDatas: [
        { source: { name: '北京' }, curve: [{x: -10, y: 10, z: 25}, {x: -10, y: -3, z: 40}], value: 150 },
        { source: { name: '西安' }, curve: [{x: -3, y: -7, z: 10}, {x: -10, y: -3, z: 40}], value: 60 },
        { source: { name: '上海' }, curve: [{x: 2, y: 16, z: 30}, {x: -10, y: -3, z: 40}], value: 70 },
        { source: { name: '徐州' }, curve: [{x: 2, y: 5, z: 30}, {x: -10, y: -3, z: 40}], value: 70 },
        { source: { name: '杭州' }, curve: [{x: 2, y: 10, z: 30}, {x: -10, y: -3, z: 40}], value: 70 },
        { source: { name: '遵义' }, curve: [{x: 2, y: 1, z: 10}, {x: -10, y: -3, z: 40}], value: 70 },
        { source: { name: '和田' }, curve: [{x: -25, y: -40, z: 10}, {x: -10, y: -3, z: 40}], value: 200}
      ]
    }
  },
  mounted() {
    const loader = new THREE.FileLoader()
    const _this = this
    loader.load('./assets/map/china.json', function(data) {
      const dataJson = JSON.parse(data)
      const mapData = util.decode(dataJson)
      // const mapData = JSON.parse(data)
      console.log(mapData)
      // _this.initMap(jsonData)
      const map = new ThreeMapLightBar({ 
        mapData, 
        labelDatas: _this.labelDatas,
        canvasId: "canvas_content",
        scenePos:{ x: 0, y: 0, z: -32.5 },
        cameraConfig: {
          fov: 10,
          aspect: window.innerWidth / (window.innerHeight),
          near: 1,
          far: 100000,
          pos: { x: 327, y: 42, z: 311 }
        },
        helperConfig: { isShow: false, length: 30 },
        mirrorConfig: { isShow: false},
        borderLineConfig: { isShow: false},
        modelConfig: {
          topModel:{opacity: 0.5,map: topImg},
          sideModel:{opacity: 1,map: sideImg},
          height: 3
        },
        lineConfig: {
          color: '#00fff5',
          width: 1,
          opacity: 1
        },
        lightConfig: {
          point:{
            pos:[100, 20, 50],
            color: '#fff'
          }
        },
        flyLineConfig: {
          colors: ["rgb(245,127,127)", "rgb(255,0,0)", "rgb(245,127,127)"],
          pointLength: 90,
          moveLength: 15,
          width: 2,
          opacity:1
        },
        animateConfig: {
          time: 20
        }
      })
      
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
      // map.mapFixedLabel()

      // 绘制光柱
      // map.drawLightBar(_this.labelDatas)

      // 绘制线条
      // map.drawFlyLine(_this.flyDatas)
    })
  },
  created() {},
  methods: {}
}
</script>
