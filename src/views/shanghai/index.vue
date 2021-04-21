<template>
  <div class="container">
    <div id="canvas_content" >
      <div v-for="(label, index) in labelDatas" :key="index" :id="label.id" class="fixed-label">
        <img src="@/assets/img/spanBg.png">
        {{label.name}}
      </div>
    </div>
  </div>
</template>
<script>
import * as THREE from 'three'
import topImg from '@/assets/img/top0.jpg'
import barImg from '@/assets/img/barImg.png'
import sideImg from '@/assets/img/side.png'
import lightSideImg from '@/assets/img/powerSide.jpg'
import ThreeMap from './ThreeMap.js'

export default {
  name: 'ThreeMap',
  components: {},
  data() {
    return {      
      labelDatas: [
        { name: '黄浦区', value: 100, coordinates:[121.490317, 31.222771], id: "label-001"},
        { name: '徐汇区', value: 100, coordinates:[121.43752, 31.179973], id: "label-002"},
        { name: '长宁区', value: 200, coordinates:[121.4222, 31.218123], id: "label-003"},
        { name: '静安区', value: 250, coordinates:[121.448224, 31.229003], id: "label-004"},
        { name: '普陀区', value: 150, coordinates:[121.392499, 31.241701], id: "label-005"},
        { name: '虹口区', value: 250, coordinates:[121.491832, 31.26097], id: "label-006"},
        { name: '杨浦区', value: 73, coordinates:[121.522797, 31.270755], id: "label-007"},
        { name: '闵行区', value: 250, coordinates:[121.375972, 31.111658], id: "label-008"},
        { name: '宝山区', value: 250, coordinates:[121.489934, 31.398896], id: "label-009"},
        { name: '嘉定区', value: 150, coordinates:[121.250333,31.383524], id: "label-010"},
        { name: '浦东新区', value: 250, coordinates:[121.567706, 31.245944], id: "label-011"},
        { name: '金山区', value: 73, coordinates:[121.330736, 30.724697], id: "label-012"},
        { name: '松江区', value: 250, coordinates:[121.223543, 31.03047], id: "label-013"},
        { name: '青浦区', value: 73, coordinates:[121.113021, 31.151209], id: "label-014"},
        { name: '奉贤区', value: 250, coordinates:[121.458472, 30.912345], id: "label-015"},
        { name: '崇明区', value: 73, coordinates:[121.397516, 31.626946], id: "label-016"}
      ],
      map: null
    }
  },
  mounted() {
    const loader = new THREE.FileLoader()
    const _this = this
    loader.load('./assets/map/sh.json', function(data) {
      // const dataJson = JSON.parse(data)
      // const mapData = util.decode(dataJson)
      const mapData = JSON.parse(data)
      console.log(mapData)
      // _this.initMap(jsonData)
      this.map = new ThreeMap({ 
        mapData, 
        isControl: true,
        labelDatas: _this.labelDatas,
        canvasId: "canvas_content",
        backgroundConfig: {
          color: "#ff0",
          map: topImg
        },
        scenePos:{ x: -26.37, y: 5.39, z: -32.37 },
        sceneScale:{ x: 1, y: 1, z: 1 },
        cameraConfig: {
          fov: 10,
          aspect: window.innerWidth / (window.innerHeight),
          near: 1,
          far: 100000,
          pos: { x: 396, y: 12, z: 167 }
        },
        helperConfig: { isShow: true, length: 30 },
        mirrorConfig: { isShow: false},
        borderLineConfig: { isShow: true},
        modelConfig: {
          topModel:{opacity: 1,map: topImg, color: "#00fff5"},
          sideModel:{opacity: 1,map: sideImg},
          lightModel: {map: lightSideImg},
          height: 2,
          barModel: {map:barImg}
        },
        lineConfig: {
          color: '#00fff5',
          width: 1,
          opacity: 1
        },
        lightConfig: {
          point:{
            pos:[30, 30, 30],
            color: '#fff'
          }
        }
      })
      
      this.map.on('mouseFn', (e, g, p) => {
        const type = e.type
        if (type == 'mousemove') {
          // 鼠标上移事件
        } else if (type == 'mouseup') {
          // 鼠标点击事件
          console.log(g.data, "data========");
          console.log("mouseup========");
        }
      })
      this.map.mapFixedLabel()
    })
  },
  created() {},
  beforeDestory(){
    this.map.dispose()
  },
  methods: {}
}
</script>
<style lang="less">
.fixed-label{
  padding: 2px 10px;
  margin-top: -36px;
  margin-left: 35px;
  color: #fff;
  font-size:14px;
  background:  url('~@/assets/img/label.png');
  background-size: cover;
  img{
    width: 80px;
    height: 40px;
    margin: 0 0 0 -60px;
    // background: #fff;
    position: absolute;
    &.top_img{
      margin-top: -10px;
    }
  }
}
</style>
