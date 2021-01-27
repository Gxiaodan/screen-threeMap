<template>
  <div
    id="canvasContent"
    ref="canvasContent"
    class="canvas_content"
    @mousemove="mouseMoveHandler"
    @mousedown="mouseUpHandler"
    @mouseup="mouseUpHandler"
  ></div>
</template>
<script>
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
// import Stats from "three/examples/js/libs/stats.min";
// import {AxesHelper} from "three/src/helpers/AxesHelper"

export default {
  name: "Three3D",
  data() {
    return {
      canvasWidth: 0,
      canvasHeight: 0,
      scene: null,
      camera: null,
      renderer: null,
      raycaster: null,
      mouse: null,
      clickPosition: {},
      stats: null,
      starLites: [],
      spriteArray: [],
      enableClickSprite: [],
      animateFlag: true,
    };
  },
  methods: {
    initCenterBall() {
      // // 定义太阳材质
      // let sunTexture = THREE.ImageUtils.loadTexture(
      //     require("@/assets/home/centerBall.png")
      // );
      //
      // let centerBall = new THREE.Mesh(
      //     new THREE.SphereGeometry(20, 40, 40),
      //     new THREE.MeshLambertMaterial({
      //         map: sunTexture,
      //     })
      // );
      // centerBall.position.set(0, 0, 0);
      // this.scene.add(centerBall);

      let centerBall = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: THREE.ImageUtils.loadTexture(
            require("@/assets/home/centerBallTitle.png")
          ),
          depthTest: false,
        })
      );
      this.spriteArray.push(centerBall);
      this.enableClickSprite.push({
        starLite: centerBall,
        uuid: centerBall.uuid,
        url: window.$config.centerBallUrl,
        name: "党建引领",
      });
      centerBall.scale.set(52, 15, 0);
      centerBall.position.set(0, -32, 0);
      this.scene.add(centerBall);
    },
    initStarLite(
      starLiteSize,
      distance,
      direction,
      x,
      y,
      rotation,
      speed,
      lineColor,
      imgUrl,
      hrefUrl,
      index,
      name
    ) {
      let ringLine = null;
      if (index % 2 == 0) {
        //线条
        let ringGeometry = new THREE.RingGeometry(
          distance,
          distance + 0.01,
          80,
          1
        );
        //边缘集合体
        let edgesGeometry = new THREE.EdgesGeometry(ringGeometry);
        ringLine = new THREE.LineSegments(
          edgesGeometry,
          new THREE.LineDashedMaterial({
            color: 0xffffff,
            dashSize: 5,
            gapSize: 5,
            linewidth: 1,
          })
        );
        ringLine.computeLineDistances();
      }

      // //几何体
      let centerMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0, 0, 0),
        new THREE.MeshLambertMaterial({
          color: 0x00ff00,
          transparent: true,
          opacity: 0,
        })
      );
      let starLite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: THREE.ImageUtils.loadTexture(imgUrl),
          depthTest: false,
        })
      );
      starLite.renderOrder = 9999;
      this.spriteArray.push(starLite);
      this.enableClickSprite.push({
        starLite: starLite,
        uuid: starLite.uuid,
        url: hrefUrl,
        name: name,
      });
      starLite.scale.x = starLiteSize;
      starLite.scale.y = starLiteSize;
      starLite.scale.z = 1;
      starLite.position.set(distance + 1, 0, 0);

      var geometry = new THREE.RingGeometry(
        distance - 0.6,
        distance + 0.6,
        80,
        8,
        Math.PI * 1.3
      );
      var geometry2 = new THREE.RingGeometry(
        distance - 0.8,
        distance + 0.8,
        80,
        8,
        Math.PI * 1.3
      );
      var material = new THREE.MeshPhongMaterial({
        color: 0xf5fcff,
        specular: 0xffffff,
        shininess: 30,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 1,
      });
      var material2 = new THREE.MeshPhongMaterial({
        color: 0xf5fcff,
        specular: 0xffffff,
        shininess: 30,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 1,
      });
      var mesh = new THREE.Mesh(geometry, material);
      var mesh2 = new THREE.Mesh(geometry2, material2);
      mesh.rotation.set(rotation.x, rotation.y, rotation.z);
      //this.scene.add(mesh);
      mesh2.rotation.set(rotation.x, rotation.y, rotation.z);
      //this.scene.add(mesh2);
      //this.scene.add(ringLine);
      var pivotPoint = new THREE.Object3D();
      pivotPoint.add(starLite);
      //pivotPoint.add(mesh);

      //if (index % 2 == 0) {
      //pivotPoint.add(ringLine);
      //}

      centerMesh.add(pivotPoint);
      centerMesh.position.set(x, y, 0);
      centerMesh.rotation.set(rotation.x, rotation.y, rotation.z);
      this.scene.add(centerMesh);
      return {
        starLite: centerMesh,
        speed: speed,
        uuid: starLite.uuid,
        url: hrefUrl,
        name: name,
      };
    },
    initAllStarLites() {
      let data = window.$config.starLites;
      data.map((item, index) => {
        item.imgUrl = require("@/assets/home/" + item.imgUrl);
        this.starLites.push(
          this.initStarLite(
            item.size,
            item.distance,
            item.direction,
            item.x,
            item.y,
            item.rotation,
            item.speed,
            item.lineColor,
            item.imgUrl,
            item.hrefUrl,
            index,
            item.name
          )
        );
      });
    },
    init() {
      this.canvasWidth = window.innerWidth;
      this.canvasHeight = window.innerHeight;
      let dom = document.getElementById("canvasContent");
      dom.addEventListener("mousedown", this.mouseDownHandler, true);
      this.scene = new THREE.Scene();

      this.camera = new THREE.PerspectiveCamera(
        35,
        this.canvasWidth / this.canvasHeight,
        0.01,
        3000
      );
      this.camera.position.set(0, 0, 300);
      this.camera.lookAt(0, 0, 0);

      //自然光
      let ambientLight = new THREE.AmbientLight(0xefe2e2); // soft white light
      this.scene.add(ambientLight);

      this.raycaster = new THREE.Raycaster();
      this.mouse = new THREE.Vector2();
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.setSize(this.canvasWidth, this.canvasHeight);
      this.$refs.canvasContent.append(this.renderer.domElement);
      //let orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
      //orbitControls.enablePan = false//简直右键移动操作
      this.render();
      this.initCenterBall();
      this.initAllStarLites();
    },
    render() {
      //this.stats.begin();
      if (this.animateFlag) {
        this.starLites.map((item) => {
          if (item.direction == "right") {
            item.starLite.rotation.z += item.speed;
          } else {
            item.starLite.rotation.z -= item.speed;
          }
        });
      }
      requestAnimationFrame(this.render);
      this.renderer.render(this.scene, this.camera);
      //this.stats.end();
    },
    resizeHandler() {
      this.canvasWidth = window.innerWidth;
      this.canvasHeight = window.innerHeight;
      // 重新初始化尺寸
      this.camera.aspect = this.canvasWidth / this.canvasHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.canvasWidth, this.canvasHeight);
    },
    getUrlSplit(url) {
      let split = "?";
      if (url.indexOf("?") != -1) {
        split = "&";
      }
      return split;
    },
    mouseUpHandler(event) {
      let vm = this;
      event.preventDefault();
      if (
        vm.clickPosition.x == event.clientX &&
        vm.clickPosition.y == event.clientY
      ) {
        vm.mouse.x = (event.clientX / vm.canvasWidth) * 2 - 1;
        vm.mouse.y = -(event.clientY / vm.canvasHeight) * 2 + 1;
        vm.raycaster.setFromCamera(vm.mouse, vm.camera);
        // 计算物体和射线的焦点
        let intersects = vm.raycaster.intersectObjects(vm.spriteArray, true);
        if (intersects.length) {
          vm.enableClickSprite.forEach(function(item) {
            // if (item.uuid == intersects[0].object.uuid) {
            //   let params = vm.$route.query;
            //   if (item.name == "党建引领") {
            //     window.open(item.url);
            //   } else {
            //     let url = item.url;
            //     let split = "";
            //     if (item.name == "综合执法") {
            //       vm.$emit("showSupervise");
            //       return;
            //     } else if (item.name == "监督指挥") {
            //       if (params.keyReport) {
            //         split = vm.getUrlSplit(url);
            //         url = url + split + "keyReport=" + params.keyReport;
            //       }
            //       if (params.isZhenZhihui) {
            //         split = vm.getUrlSplit(url);
            //         url = url + split + "isZhenZhihui=" + params.isZhenZhihui;
            //       }
            //     } else if (item.name == "便民服务") {
            //       vm.$emit("showServer");
            //       return;
            //     } else {
            //       if (params.userId) {
            //         split = vm.getUrlSplit(url);
            //         url = url + split + "userId=" + params.userId;
            //       }
            //       if (params.sessionId) {
            //         split = vm.getUrlSplit(url);
            //         url = url + split + "sessionId=" + params.sessionId;
            //       }
            //       if (params.thirdToken) {
            //         split = vm.getUrlSplit(url);
            //         url = url + split + "thirdToken=" + params.thirdToken;
            //       }
            //       if (params.invalidUrl) {
            //         split = vm.getUrlSplit(url);
            //         url = url + split + "invalidUrl=" + params.invalidUrl;
            //       }
            //     }
            //     window.location.href = url;
            //   }
            // }
          });
        }
      }
    },
    mouseDownHandler(event) {
      this.clickPosition = { x: event.clientX, y: event.clientY };
    },
    mouseMoveHandler(event) {
      event.preventDefault();
      let vm = this;
      this.mouse.x = (event.clientX / this.canvasWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / this.canvasHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);
      // 计算物体和射线的焦点
      let intersects = this.raycaster.intersectObjects(this.spriteArray, true);
      if (intersects.length) {
        vm.starLites.forEach(function(item) {
          if (item.uuid == intersects[0].object.uuid) {
            vm.animateFlag = false;
          }
        });
      } else {
        this.animateFlag = true;
      }
    },
  },
  mounted() {
    window.addEventListener("resize", this.resizeHandler);
    this.init();
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.resizeHandler);
  },
};
</script>
<style scoped>
.three3d {
  position: relative;
  width: 100%;
  height: 100%;
}

.canvas_content {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
}
</style>
