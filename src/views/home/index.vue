<template>
  <div class="container">
    <!-- <video class="bgvid" id="bgvid" autoplay muted loop>
      <source src="@/assets/img/bg.webm" type="video/webm" />
    </video> -->
    <div class="main-con">
      <div class="wheel-con">
        <div v-for="(item, index) in wheelData" :key="index" class="sub-tit" :class="{'active': index == curIndex, 'lastActive': (index + 1) % wheelData.length == curIndex}">
            <div v-if="index == curIndex || (index + 1) % wheelData.length == curIndex">
              <span class="place" >{{item.place}}</span>
              <span class="name">{{item.name}}</span>
              <span class="time">{{item.time}}</span>
            </div>
        </div>
      </div>
    </div>
    <div id="canvas_content" >
      <div id="dialogDiv">
        <div>省份&nbsp;:&nbsp;&nbsp;&nbsp;{{ provinceName }}</div>
      </div>
      <div id="hoverDiv">
        <div>省份&nbsp;:&nbsp;&nbsp;&nbsp;{{ provinceName }}</div>
      </div>
      <div id="totalDiv">
        <div class="num-con">
          <countTo :startVal='startVal' :endVal='endVal'></countTo>
          <div class="unit">元</div>
        </div>
      </div>
      <div v-for="(label, index) in labelDatas" :key="index" :id="label.id" class="fixed-label">
        <!-- <img src="@/assets/img/spanBg.png"> -->
        <!-- <img class="top_img" src="@/assets/img/spanBg.png"> -->
        {{label.name}}
      </div>
    </div>
    <!-- <div class="line-bg"></div> -->
  </div>
</template>
<script>
import * as THREE from 'three'
import './index.less'
import topImg from '@/assets/img/top.png'
import barImg from '@/assets/img/barImg.png'
import sideImg from '@/assets/img/side.png'
import lightSideImg from '@/assets/img/barSide.png'
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
      curIndex: 0,
      provinceName: '',
      wheelData: [
        { place: "西安市",   value: 3021896,   name: "高新区“一核四化”基层治理平台", time: "2020-07"},
        { place: "杭州市",   value: 2163352,   name: "市域治理“一核四化”杭州项目", time: "2020-11"},
        { place: "绍兴市",   value: 2092134,   name: "市域治理“一核四化”河桥项目", time: "2020-12"},
        { place: "上海市",   value: 2000093,   name: "青浦区环意赛精准时空保障系统", time: "2020-06"},
        { place: "和田市",   value: 2032612,   name: "新疆和田可视化系统", time: "2020-11"},
        { place: "徐州市",   value: 3213510,   name: "徐州市“国潮”音乐节治安防控系统", time: "2020-11"},
        { place: "遵义市",   value: 1512000,   name: "遵义社会治安防控实战应用平台", time: "2020-07"},
      ],
      labelDatas: [
        { name: '北京', value: 100, coordinates:[116.405285, 39.904989], id: "label-001"},
        { name: '徐州', value: 100, coordinates:[117.2, 34.26], id: "label-002"},
        { name: '遵义', value: 200, coordinates:[116.9, 27.7], id: "label-003"},
        { name: '和田', value: 250, coordinates:[79.94, 37.12], id: "label-004"},
        { name: '杭州', value: 150, coordinates:[120.19, 30.26], id: "label-005"},
        { name: '西安', value: 50, coordinates:[108.948024, 34.263161], id: "label-006"},
        { name: '上海', value: 73, coordinates:[121.472644, 31.231706], id: "label-007"}
      ],
       datas: [
        { name: '北京市', value: 100,  },
        { name: '新疆维吾尔自治区', value: 63 },
        { name: '陕西省', value: 83 },
        { name: '上海市', value: 73 }
      ],
      // flyDatas: [
      //   { source: { name: '北京' }, curve: [{x: -10, y: 8, z: 15}, {x: -10, y: -5, z: 25}], value: 150 },
      //   { source: { name: '西安' }, curve: [{x: -3, y: 0, z: 15}, {x: -10, y: -8, z: 25}], value: 60 },
      //   { source: { name: '上海' }, curve: [{x: 2, y: 16, z: 25}, {x: -10, y: -3, z: 25}], value: 70 },
      //   { source: { name: '徐州' }, curve: [{x: 2, y: 5, z: 22}, {x: -10, y: -6, z: 25}], value: 70 },
      //   { source: { name: '杭州' }, curve: [{x: 2, y: 10, z: 25}, {x: -10, y: -4, z: 25}], value: 70 },
      //   { source: { name: '遵义' }, curve: [{x: 2, y: 6, z: 18}, {x: -10, y: -7, z: 25}], value: 70 },
      //   { source: { name: '和田' }, curve: [{x: -25, y: -40, z: 10}, {x: -10, y: -10, z: 25}], value: 200}
      // ],
      flyDatas: [
        { source: { name: '北京' }, target: { name: '西安' }, value: 150 },
        // { source: { name: '上海' }, target: { name: '西安' },value: 70 },
        // { source: { name: '徐州' }, target: { name: '西安' },value: 70 },
        // { source: { name: '杭州' }, target: { name: '西安' }, value: 70 },
        // { source: { name: '遵义' }, target: { name: '西安' }, value: 70 },
        { source: { name: '和田' }, target: { name: '西安' }, value: 200}
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
        flyDatas: _this.flyDatas,
        isControl: true,
        labelDatas: _this.labelDatas,
        canvasId: "canvas_content",
        scenePos:{ x: -26.37, y: 5.39, z: -32.37 },
        cameraConfig: {
          fov: 10,
          aspect: window.innerWidth / (window.innerHeight),
          near: 1,
          far: 100000,
          pos: { x: 396, y: 12, z: 167 }
        },
        helperConfig: { isShow: true, length: 30 },
        mirrorConfig: { isShow: true},
        borderLineConfig: { isShow: false},
        modelConfig: {
          topModel:{opacity: 0.5,map: topImg},
          sideModel:{opacity: 1,map: sideImg},
          lightModel: {map: lightSideImg},
          height: 3,
          barModel: {map:barImg}
        },
        lineConfig: {
          color: '#00fff5',
          width: 1,
          opacity: 1
        },
        lightConfig: {
          point:{
            pos:[100, 20, 50],
            color: '#00f'
          }
        },
        flyLineConfig: {
          // colors: ["rgb(255,255,0)"],
          colors: ["rgb(241,241,122)",  "rgb(241,241,122)", "rgb(255,255,0)"],
          pointLength: 90,
          moveLength: 6,
          width: 2,
          lightLineWidth: 3,
          opacity: 1
        },
        animateConfig: {
          time: 5,
        }
      })
      
      _this.endVal = 18181185
      map.on('mouseFn', (e, g, p) => {
        const type = e.type
        if (type == 'mousemove') {
          // map.setLabelPos(g, 'mousemove', p)
          _this.provinceName = map.provinceName
          // map.setAreaColor(g);
        } else if (type == 'mouseup') {
          // map.setAreaColor(g)
          // map.setLabelPos(g, 'mouseup', p)
        }
      })
      map.mapFixedLabel()

      // 绘制光柱
      map.drawLightBar()

      // 绘制线条
      map.drawFlyLine()
    })
    setInterval(() => {
      this.curIndex =  (this.curIndex + 1) % this.wheelData.length      
    }, 2000);
  },
  created() {},
  methods: {}
}
</script>
