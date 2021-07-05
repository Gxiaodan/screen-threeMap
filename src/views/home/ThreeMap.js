import * as d3 from "d3-geo";

// const THREE = window.THREE;

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Line2 } from "three/examples/jsm/lines/Line2";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";
import { AfterimagePass } from "three/examples/jsm/postprocessing/AfterimagePass.js";
import { FocusShader } from "three/examples/jsm/shaders/FocusShader.js";
import { MirrorShader } from "three/examples/jsm/shaders/MirrorShader.js";

import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/examples/jsm/renderers/CSS2DRenderer";

import { LineGeometry } from "three/examples/jsm/lines/LineGeometry";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import lineImg from "../../../public/assets/images/zdcs_icon.png";
import { util } from "./util";
// import { GeometryUtils } from 'three/examples/jsm/utils/GeometryUtils';
// 初始化一个场景
/**
   * {
    * canvasId: '', // canvasid
    * scenePos: { x: 0, y: 0, z: -8 }, // 场景位置
    * cameraConfig: { // camera配置
          fov: 10,
          aspect: window.innerWidth / (window.innerHeight - 600),
          near: 1,
          far: 1000,
          pos: { x: 190, y: 40, z: 50 }
        },
    * helperConfig: { isShow: true, length: 20 }, // 辅助坐标轴配置
    * mirrorConfig: { isShow: false, zIndex: 0 }, // 镜面配置
    * modelConfig: { // 主体网格配置（顶部配置和侧边配置）
    *   topModel:{opacity,color,map},
    *   sideModel:{opacity,color,map},zIndex:0,height
    * },
    * lineConfig: {color,width,opacity,zIndex},
    * lightConfig: {point:{pos:[],color}}
    * 
      animateConfig: {
        time: 30
      }
  * }
  * 
  * eg:{ 
        mapData, 
        canvasId: "canvas_content",
        scenePos:{ x: 0, y: 0, z: -8 },
        cameraConfig: {
          fov: 10,
          aspect: window.innerWidth / (window.innerHeight - 600),
          near: 1,
          far: 1000,
          pos: { x: 190, y: 40, z: 50 }
        },
        helperConfig: { isShow: true, length: 20 },
        mirrorConfig: { isShow: false, zIndex: 0 },
        modelConfig: {
          topModel:{opacity: 1,map: topImg},
          sideModel:{opacity: 1,map: sideImg},
          zIndex: 0,
          height: 1
        },
        lineConfig: {
          color: '#fff',
          width: 2,
          opacity: 0.6
        },
        lightConfig: {
          point:{
            pos:[100, 50, 100],
            color: '#fff'
          }
        }
      }
  * 
*/
export default class ThreeMap {
  constructor(set) {
    this.mapData = set.mapData;
    this.labelDatas = set.labelDatas;
    this.canvasId = set.canvasId;
    this.spritTest = null;
    this.scenePos = set.scenePos || { x: 0, y: 0, z: -8 };
    this.cameraConfig = set.cameraConfig || {
      fov: 10,
      aspect: window.innerWidth / (window.innerHeight - 600),
      near: 1,
      far: 1000,
      pos: { x: 190, y: 40, z: 50 },
    };
    this.helperConfig = set.helperConfig || { isShow: true, length: 20 };
    this.mirrorConfig = set.mirrorConfig || { isShow: false, zIndex: 0 };
    this.modelConfig = set.modelConfig || {
      topModel: { opacity: 1, map: "" },
      sideModel: { opacity: 1, map: "" },
      height: 1,
    };
    this.lineConfig = set.lineConfig || {
      color: "#fff",
      width: 2,
      opacity: 0.6,
    };
    this.lightConfig = set.lightConfig || {
      point: {
        pos: [100, 50, 100],
        color: "#ff0",
      },
    };
    this.animateConfig = set.animateConfig || {
      time: 30,
    };
    this.provinceName = "";
    this.isControl = set.isControl ? true : false;
    this.isFirst = true; // 控制label是否在有动画但地图不可动的情况下是否渲染，节省性能
    this.mapColors = ["#0684fd", "#006de0"];
    this.init();
  }

  /**
   * @desc 初始化场景
   */
  init() {
    this.mapCon = document.getElementById(this.canvasId);
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();
    this.scene.background = new THREE.TextureLoader().load(
      this.modelConfig.topModel.map
    );
    // this.scene.fog = new THREE.Fog("#000", 480, 500);
    this.scene.position.set(this.scenePos.x, this.scenePos.y, this.scenePos.z);
    this.scene.scale.set(1.19, 1.04, 1);
    this.camera = new THREE.PerspectiveCamera(
      this.cameraConfig.fov,
      this.cameraConfig.aspect,
      this.cameraConfig.near,
      this.cameraConfig.far
    );
    this.mousePos = null;
    this.camera.lookAt(0, 0, 0);
    this.setCamera(this.cameraConfig.pos);
    this.setLight(this.lightConfig);
    this.initLabel();

    this.setHelper();
    this.drawMap();
    this.setRender();

    this.setControl();

    this.animate();

    // this.lineAnimate()
    this.mapCon.addEventListener("mouseup", this.mouseEvent.bind(this), false);
    this.mapCon.addEventListener(
      "mousemove",
      this.mouseEvent.bind(this),
      false
    );
    this.mapCon.addEventListener(
      "mousewheel",
      this.mousewheel.bind(this),
      false
    );
    window.addEventListener("resize", () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      this.camera.aspect = this.cameraConfig.aspect;
      this.camera.updateProjectionMatrix();
      this.labelRenderer.setSize(width, height);
      this.renderer.setSize(width, height);
    });
  }
  // 页面固定label添加
  mapFixedLabel() {
    // const arrowTexture = new THREE.TextureLoader().load(lineImg);
    // const material = new THREE.SpriteMaterial({
    //   map: arrowTexture,
    //   color: 0xffffff,
    // });
    // const arrow = new THREE.Sprite(material);
    // arrow.position.set(0, 0, 5);
    // this.scene.add(arrow);
    // const geometry = new THREE.BoxGeometry(6, 6, 6);
    // const materialb = new THREE.MeshStandardMaterial({
    //   map: new THREE.TextureLoader().load("./mapLine.png"),
    // });
    // let box = new THREE.Mesh(geometry, materialb);
    // box.position.set(0, 5, 10);
    // this.scene.add(box);

    for (let i = 0; i < this.labelDatas.length; i++) {
      let item = this.labelDatas[i];
      let labelDiv = document.getElementById(item.id);
      const labelCon = new CSS2DObject(labelDiv);
      let pos = this.lnglatToMector(item.coordinates);
      labelCon.position.set(pos[0], pos[1], pos[2] + 1.1);
      this.scene.add(labelCon);
    }
    this.labelRenderer.render(this.scene, this.camera);
  }

  // 初始化辅助div
  initLabel() {
    // 总数值div
    // this.totalDiv = document.getElementById("totalDiv");
    // const totalCon = new CSS2DObject(this.totalDiv);
    // totalCon.position.set(10, -3, 17);
    // this.scene.add(totalCon);

    // 获取页面上div
    this.dialogDiv = document.getElementById("dialogDiv");
    this.dialogLabel = new CSS2DObject(this.dialogDiv);
    this.dialogLabel.visible = false;
    this.scene.add(this.dialogLabel);

    this.hoverDiv = document.getElementById("hoverDiv");
    this.Hoverabel = new CSS2DObject(this.hoverDiv);
    this.Hoverabel.visible = false;
    this.scene.add(this.Hoverabel);

    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
    this.labelRenderer.domElement.style.position = "absolute";
    this.labelRenderer.domElement.style.top = "0px";
    this.labelRenderer.domElement.style.zIndex = 1;
    this.mapCon.appendChild(this.labelRenderer.domElement);
  }

  // 滚轮事件
  mousewheel(event) {
    const type = event.type;
    // console.log(type, "====================");
    event.preventDefault();
    // this.labelRenderer.domElement.style.display = "none";
  }

  /**
   * @desc 鼠标事件处理
   */
  mouseEvent(event) {
    const type = event.type;
    event.preventDefault();
    if (!this.raycaster) {
      this.raycaster = new THREE.Raycaster();
    }
    if (!this.mouse) {
      this.mouse = new THREE.Vector2();
    }
    if (!this.meshes) {
      this.meshes = [];
      this.group.children.forEach((g) => {
        g.children.forEach((mesh) => {
          this.meshes.push(mesh);
        });
      });
    }

    // 将鼠标位置归一化为设备坐标。x 和 y 方向的取值范围是 (-1 to +1)
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    // window.innerWidth / (window.innerHeight - 500)
    // 通过摄像机和鼠标位置更新射线
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // 计算物体和射线的焦点
    this.intersects = this.raycaster.intersectObjects(this.meshes);
    if (this.intersects.length > 0) {
      console.log(this.intersects, "======");
      // this.labelRenderer.domElement.style.display = "block";
      this.clickFunction(
        event,
        this.intersects[0].object.parent,
        this.intersects[0].point
      );
    } else {
      if (type == "mousemove") {
        this.Hoverabel.visible = false;
      } else if (type == "mouseup") {
        // 点击时选中信息清空
        // this.labelRenderer.domElement.style.display = "none";
        this.dialogLabel.visible = false;
        this.Hoverabel.visible = false;
        // this.clearColor(this.group.children);
      }
    }
  }
  /**
   * @desc 设置区域颜色
   */
  clearColor(group) {
    console.log(this.mapColors);
    group.forEach((gs) => {
      gs.children.forEach((mesh) => {
        if (mesh.material instanceof Array) {
          mesh.material.forEach((mat, index) => {
            mat.color.set(
              this.mapColors[index >= this.mapColors.length ? 0 : index]
            );
          });
        } else {
          mesh.material.color.set(this.mapColors[0]);
        }
      });
    });
  }
  setAreaColor(g, colors = ["#f00"]) {
    // 恢复颜色
    this.clearColor(g.parent.children);

    // 设置颜色
    g.children.forEach((mesh) => {
      if (mesh.material instanceof Array) {
        mesh.material.forEach((mat, index) => {
          mat.color.set(colors[index >= colors.length ? 0 : index]);
        });
      } else {
        mesh.material.color.set(colors[0]);
      }
      // mesh.material[0].color.set(color);
    });
  }

  setLabelPos(g, type, p) {
    // 设置提示框位置
    this.provinceName = g.data.properties.name;
    // let cpPos = this.lnglatToMector(g.data.properties.cp);
    const cpPos = p;
    // console.log(name, cpPos, "setPos==");
    if (type == "mouseup") {
      // this.dialogLabel.position.set( cpPos[0],cpPos[1],cpPos[2] );
      this.dialogLabel.position.set(
        cpPos.x,
        cpPos.y,
        cpPos.z - this.scenePos.z
      );
      this.dialogLabel.visible = true;
      console.log(g.data, "data========");
      console.log("mouseup========");
    } else {
      // this.Hoverabel.position.set( cpPos[0],cpPos[1],cpPos[2] );
      this.Hoverabel.position.set(cpPos.x, cpPos.y, cpPos.z - this.scenePos.z);
      // this.Hoverabel.position.set( this.mouse.x,this.mouse.y,0 );
      this.Hoverabel.visible = true;
    }
  }

  /**
   * @desc 绑定事件
   */
  on(eventName, func) {
    if (eventName === "mouseFn") {
      this.clickFunction = func;
    }
  }
  // 把经纬度转换成x,y,z 坐标
  coordinatesTrans(data) {
    data.features.forEach((d) => {
      d.vector3 = [];
      d.geometry.coordinates.forEach((coordinates, i) => {
        d.vector3[i] = [];
        coordinates.forEach((c, j) => {
          if (c[0] instanceof Array) {
            d.vector3[i][j] = [];
            c.forEach((cinner) => {
              const cp = this.lnglatToMector(cinner);
              d.vector3[i][j].push(cp);
            });
          } else {
            const cp = this.lnglatToMector(c);
            d.vector3[i].push(cp);
          }
        });
      });
    });
  }

  /* 绘制圆角矩形 */
  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.draw;
  }
  /* 创建字体精灵 */
  makeTextSprite(message, parameters) {
    if (parameters === undefined) parameters = {};

    var fontface = parameters.hasOwnProperty("fontface")
      ? parameters["fontface"]
      : "Arial";

    /* 字体大小 */
    var fontsize = parameters.hasOwnProperty("fontsize")
      ? parameters["fontsize"]
      : 18;

    /* 边框厚度 */
    var borderThickness = parameters.hasOwnProperty("borderThickness")
      ? parameters["borderThickness"]
      : 4;

    /* 边框颜色 */
    var borderColor = parameters.hasOwnProperty("borderColor")
      ? parameters["borderColor"]
      : { r: 0, g: 0, b: 0, a: 1.0 };

    /* 背景颜色 */
    var backgroundColor = parameters.hasOwnProperty("backgroundColor")
      ? parameters["backgroundColor"]
      : { r: 255, g: 255, b: 255, a: 1.0 };

    /* 创建画布 */
    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");

    /* 字体加粗 */
    context.font = "Bold " + fontsize + "px " + fontface;

    /* 获取文字的大小数据，高度取决于文字的大小 */
    var metrics = context.measureText(message);
    var textWidth = metrics.width / 2;

    /* 背景颜色 */
    context.fillStyle =
      "rgba(" +
      backgroundColor.r +
      "," +
      backgroundColor.g +
      "," +
      backgroundColor.b +
      "," +
      backgroundColor.a +
      ")";

    /* 边框的颜色 */
    context.strokeStyle =
      "rgba(" +
      borderColor.r +
      "," +
      borderColor.g +
      "," +
      borderColor.b +
      "," +
      borderColor.a +
      ")";
    context.lineWidth = borderThickness;

    /* 绘制圆角矩形 */
    this.roundRect(
      context,
      borderThickness / 2,
      borderThickness / 2,
      textWidth + borderThickness,
      fontsize * 1.4 + borderThickness,
      6
    );
    /* 字体颜色 */
    context.fillStyle = "rgba(0, 0, 0, 1.0)";
    context.fillText(message, borderThickness, fontsize + borderThickness);
    /* 背景图 */
    // context.drawImage('textures/planets/earth_atmos_4096.jpg',0,0,canvas.width,canvas.height);
    // const textureLoader = new THREE.TextureLoader();
    // let _context = context
    // textureLoader.load( 'textures/planets/earth_atmos_4096.jpg', function ( tex ) {

    //     _context.drawImage(tex,0,0,canvas.width,canvas.height);

    // } );

    /* 画布内容用于纹理贴图 */
    var texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;

    var spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    var sprite = new THREE.Sprite(spriteMaterial);

    console.log(sprite.spriteMaterial);

    /* 缩放比例 */
    sprite.scale.set(10, 5, 0);

    return sprite;
  }
  showSprite() {
    var sprite;
    let _this = this;
    this.makeTextPlaneMate2().then(function(m) {
      sprite = new THREE.Sprite(m);
      // sprite.position.set(145, 220, -135);
      sprite.position.set(0, 0, 15);
      sprite.scale.set(10, 5, 1);
      console.log(sprite, "sprite============");
      _this.spritTest = sprite;
      sprite.name = "spritTest";
      _this.scene.add(sprite.clone());
    });
  }
  makeTextPlaneMate2() {
    //绘制画布做为Sprite的材质
    var canvasText = document.createElement("canvas");
    canvasText.width = 300;
    var ctx = canvasText.getContext("2d");
    //添加背景图片，进行异步操作
    let _this = this;
    return new Promise((resolve, reject) => {
      let img = new Image();
      img.src = _this.modelConfig.topModel.map;
      //图片加载之后的方法
      img.onload = () => {
        //将画布处理为透明
        ctx.clearRect(200, 0, 300, 75);
        //绘画图片
        ctx.drawImage(img, 200, 0, 300, 75);
        resolve(_this.makeText(ctx, canvasText));
      };
      //图片加载失败的方法
      img.onerror = (e) => {
        reject(e);
      };
    });
  }
  makeText(ctx, canvas) {
    //画边框
    ctx.strokeStyle = "#000000";
    ctx.strokeRect(200, 0, 300, 75);
    //画线段
    ctx.beginPath();
    // ctx.moveTo(0, 75);
    // ctx.lineTo(20, 95);
    // ctx.lineTo(95, 95);
    // ctx.lineTo(150, 150);
    ctx.moveTo(0, 500);
    ctx.lineTo(100, 37);
    ctx.lineTo(200, 37);
    ctx.strokeStyle = "red";
    ctx.lineWidth = 20;
    ctx.stroke();
    //文字
    const x = 200;
    const y = 25;
    ctx.font = "30px Arial";
    ctx.fillText("这是一个标签展示文本", x, y);

    let texture = new THREE.CanvasTexture(canvas);
    let sprite = new THREE.SpriteMaterial({ map: texture });
    return sprite;
  }

  /**
   * @desc 绘制地图
   */
  drawMap() {
    if (!this.mapData) {
      console.error("this.mapData 数据不能是null");
      return;
    }
    this.coordinatesTrans(this.mapData);
    // 绘制地图模型
    const group = new THREE.Group();
    this.selectedObjects = [];
    group.name = "mapGroup";
    this.mapData.features.forEach((d, index) => {
      if (d.properties.name == "") return;
      const g = new THREE.Group(); // 用于存放每个地图模块。||省份
      g.data = d;
      d.vector3.forEach((points) => {
        // 多个面
        if (points[0][0] instanceof Array) {
          points.forEach((p) => {
            const mesh = this.drawModel(p);
            g.add(mesh);
          });
        } else {
          // 单个面
          const mesh = this.drawModel(points);
          g.add(mesh);
        }
      });
      group.add(g);
    });

    this.group = group; // 丢到全局去
    const lineGroup = this.drawLineGroup(
      this.mapData.features,
      this.lineConfig.color,
      this.lineConfig.width
    );
    lineGroup.position.z = this.modelConfig.height + 0.06;
    this.scene.add(lineGroup, this.group);

    //===============创建管道练习
    // const tubePoints = [
    //   new THREE.Vector3(-12.55, 10.47, 3.1),
    //   new THREE.Vector3(-7.61, 5.267, 10),
    //   new THREE.Vector3(-2.669, 0.061, 3.1),
    // ];

    // // CatmullRomCurve3创建一条平滑的三维样条曲线
    // const curve = new THREE.CatmullRomCurve3(tubePoints); // 曲线路径
    // const tubeMaterial = new THREE.MeshBasicMaterial({
    //   // map: this.texture,
    //   color: "#ff0",
    //   shadowSide: THREE.BackSide,
    //   transparent: true,
    //   polygonOffset: true,
    // });
    // // 创建管道
    // const tubeGeometry = new THREE.TubeGeometry(curve, 80, 0.08, 50, false); // p1：路径；p2:组成管道的分段数64；p3:管道半径1；p4:管道横截面的分段数8；

    // const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
    // this.scene.add(tubeMesh);
    // this.selectedObjects.push(tubeMesh);
    this._uniforms = {
      scale: { type: "f", value: -1.0 },
      bias: { type: "f", value: 1.0 },
      power: { type: "f", value: 1.3 },
      glowColor: { type: "c", value: new THREE.Color(0xffff00) },
      textureMap: {
        value: undefined,
      },
      repeat: {
        type: "v2",
        value: new THREE.Vector2(1.0, 1.0),
      },
      time: {
        value: 1.0,
      },
    };

    let tx = new THREE.TextureLoader().load(this.modelConfig.lightModel.map);
    tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
    this._uniforms.textureMap.value = tx;
    let materialFresnel = new THREE.ShaderMaterial({
      uniforms: this._uniforms,
      vertexShader: document.getElementById("vertexShader").textContent,
      fragmentShader: document.getElementById("fragmentShader").textContent,
      side: THREE.DoubleSide,
      // blending: THREE.AdditiveBlending,
      blending: THREE.NormalBlending,
      transparent: true,
      depthWrite: false,
    });

    // var materialFresnel = new THREE.ShaderMaterial({
    //   uniforms: {
    //     s: { type: "f", value: -1.0 },
    //     b: { type: "f", value: 1.0 },
    //     p: { type: "f", value: 2.0 },
    //     glowColor: { type: "c", value: new THREE.Color(0x00ffff) },
    //   },
    //   vertexShader: document.getElementById("vertexShader").textContent,
    //   fragmentShader: document.getElementById("fragmentShader").textContent,
    //   side: THREE.DoubleSide,
    //   blending: THREE.AdditiveBlending,
    //   transparent: true,
    //   // depthTest: false,
    //   color: "#f00",
    // });
    let geometry1 = new THREE.TorusKnotBufferGeometry(10, 3, 100, 32);
    var torusKnot = new THREE.Mesh(geometry1, [materialFresnel]);
    // this.scene.add(torusKnot);

    let option = {
      R: 20,
      H: 3,
      A: 20,
      img: this.modelConfig.lightModel.map,
    };

    const geometry = new THREE.CylinderGeometry(
      option.R,
      option.R,
      option.H,
      option.A
    );

    let sideTexture = new THREE.TextureLoader().load(option.img);
    sideTexture.wrapS = sideTexture.wrapT = THREE.RepeatWrapping;
    sideTexture.repeat.set(2, 1);
    this.cylinder = new THREE.Mesh(geometry, [
      new THREE.MeshBasicMaterial({
        map: sideTexture,
        color: "#0f0",
        side: THREE.DoubleSide,
        transparent: true,
      }),
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      }),
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      }),
    ]);
    this.cylinder.position.set(
      0,
      4,
      option.H / 2 + this.modelConfig.height + 0.02
    );
    this.cylinder.rotation.x = Math.PI / 2;
    this.scene.add(this.cylinder);

    const barGeometry = new THREE.SphereGeometry(
      option.R,
      50,
      50,
      0,
      Math.PI,
      0,
      Math.PI
    );
    // this.ballSphere = new THREE.Mesh(barGeometry, [
    //   new THREE.MeshBasicMaterial({
    //     map: sideTexture,
    //     // color: "#ce7112",
    //     // opacity: 0.8,
    //     depthTest: false,
    //     side: THREE.DoubleSide,
    //     transparent: true,
    //   }),
    // ]);
    this.ballSphere = new THREE.Mesh(barGeometry, [materialFresnel]);
    this.ballSphere.position.set(0, -10, this.modelConfig.height + 1);
    // this.ballSphere.rotation.x = Math.PI / 2;
    // this.ballSphere.layers.set(1);
    // this.selectedObjects.push(this.ballSphere);
    this.scene.add(this.ballSphere);

    // sprite精灵的应用
    var textured = new THREE.TextureLoader().load(
      this.modelConfig.lightModel.map
    );
    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");
    var spriteMaterial = new THREE.SpriteMaterial({
      // color: "#f00",
      map: textured,
    });
    // var spriteMaterial = new THREE.SpriteCanvasMaterial({
    //   // color: 0xffffff,
    //   map: textured,
    //   program: function(context) {
    //     context.beginPath();
    //     context.font = "bold 100px Arial";
    //     context.fillStyle = "#f00";
    //     context.transform(-1, 0, 0, 1, 0, 0);
    //     context.rotate(Math.PI);
    //     context.fillText("aaa", 0, 0);
    //   },
    // });
    var sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.set(0, 0, 20);
    // console.log(sprite);
    sprite.scale.x = 10;
    sprite.scale.y = 5;

    // this.scene.add(sprite);

    var spriteOrigin = this.makeTextSprite(" vector3(0, 0, 0) ", {
      fontsize: 20,
      borderColor: { r: 255, g: 0, b: 0, a: 0.4 } /* 边框黑色 */,
      backgroundColor: { r: 255, g: 255, b: 255, a: 0.9 } /* 背景颜色 */,
    });
    spriteOrigin.center = new THREE.Vector2(0, 0);
    this.scene.add(spriteOrigin);
    spriteOrigin.position.set(0, -5, 5);

    this.showSprite();
  }

  /*
  绘制linegroup
  */
  drawLineGroup(features, color, width) {
    const lineGroup = new THREE.Group();
    lineGroup.name = "lineGroup";
    this.textureGroup = [];
    features.forEach((d, index) => {
      d.vector3.forEach((points) => {
        // 多个面
        if (points[0][0] instanceof Array) {
          const p = points.reduce((pre, current) => {
            return pre.length > current.length ? pre : current;
          });
          // let maxLen = Math.max(...points.map(item => item.length))
          // points.forEach((p) => {
          if (p) {
            const lineMesh = this.drawLine(p, color, width);
            lineGroup.add(lineMesh);
            // const lineAniMesh = this.drawLineAnimate(p, width);
            // lineGroup.add(lineAniMesh);
          }
          // });
        } else {
          // 单个面
          const lineMesh = this.drawLine(points, color, width);
          lineGroup.add(lineMesh);
          // const lineAniMesh = this.drawLineAnimate(points, width);
          // lineGroup.add(lineAniMesh);
        }
      });
    });
    return lineGroup;
  }

  /**
   * @desc 绘制线条
   * @param {} points
   */
  drawLine(points, color, width) {
    const material = new LineMaterial({
      dashed: false,
      color: color,
      transparent: true,
      linewidth: width,
      linecap: "square", // 线两端的样式
      linejoin: "round", // 线连接节点的样式
      lights: false, // 材质是否受到光照的影响
      opacity: 1,
    });
    material.resolution.set(window.innerWidth, window.innerHeight);
    const geometry = new LineGeometry();
    const positions = [];
    points.forEach((d) => {
      const [x, y, z] = d;
      const point = new THREE.Vector3(x, y, z);
      positions.push(point.x, point.y, point.z);
    });
    geometry.setPositions(positions);

    const line = new Line2(geometry, material);
    line.fog = true;
    return line;
  }
  drawLineAnimate(points, width) {
    const texture = new THREE.TextureLoader().load(lineImg);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping; // 每个都重复
    /*
      水平和垂直方向纹理的包裹方式
      THREE.RepeatWrapping
      THREE.ClampToEdgeWrapping
      THREE.MirroredRepeatWrapping
    */
    texture.repeat.set(Math.ceil(points.length / 20), 1);
    texture.needsUpdate = true;
    this.textureGroup.push(texture);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide,
      transparent: true,
    });
    const pointList = [];
    points.forEach((d) => {
      const [x, y, z] = d;
      pointList.push(new THREE.Vector3(x, y, z + 0.1));
    });
    const curve = new THREE.CatmullRomCurve3(pointList);
    const geometry = new THREE.TubeBufferGeometry(
      curve,
      Math.ceil(points.length * 1.5),
      0.1
    ); // p1：路径；p2:组成管道的分段数64；p3:管道半径1；p4:管道横截面的分段数8；

    const line = new THREE.Mesh(geometry, material);
    return line;
  }

  /**
   * @desc 绘制地图模型 points 是一个二维数组 [[x,y], [x,y], [x,y]]
   */
  drawBorderModel(points, type) {
    const shape = new THREE.Shape();
    points.forEach((d, i) => {
      let [x, y] = d;
      if (i === 0) {
        shape.moveTo(x, y);
      } else if (i === points.length - 1) {
        shape.quadraticCurveTo(x, y, x, y);
      } else {
        shape.lineTo(x, y, x, y);
      }
    });
    let geometry;
    if (type == "mirror") {
      geometry = new THREE.ExtrudeBufferGeometry(shape, {
        amount: 0.01, // 拉伸长度，默认100
        bevelEnabled: false, // 对挤出的形状应用是否斜角
      });
      const WIDTH = window.innerWidth;
      const HEIGHT = window.innerHeight;
      const groundMirror = new Reflector(geometry, {
        clipBias: 0.003,
        textureWidth: WIDTH * window.devicePixelRatio,
        textureHeight: HEIGHT * window.devicePixelRatio,
      });
      return groundMirror;
    } else {
      geometry = new THREE.ExtrudeBufferGeometry(shape, {
        amount: 0.01, // 拉伸长度，默认100
        bevelEnabled: false, // 对挤出的形状应用是否斜角
      });
      const loader = new THREE.TextureLoader();
      const texture = loader.load(this.modelConfig.topModel.map);
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(0.011, 0.01);
      texture.offset.set(0.56, 0.62);
      // texture.anisotropy = 16;
      texture.rotation = -80;
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        // side: THREE.DoubleSide,
        opacity: 0.8,
      });
      const mesh = new THREE.Mesh(geometry, material);
      return mesh;
    }
  }
  drawModel(points) {
    const shape = new THREE.Shape();
    points.forEach((d, i) => {
      const [x, y] = d;
      if (i === 0) {
        shape.moveTo(x, y);
      } else if (i === points.length - 1) {
        shape.quadraticCurveTo(x, y, x, y);
      } else {
        shape.lineTo(x, y, x, y);
      }
    });

    const geometry = new THREE.ExtrudeBufferGeometry(shape, {
      amount: this.modelConfig.height, // 拉伸长度，默认100
      bevelEnabled: false, // 对挤出的形状应用是否斜角
      depth: 1,
    });
    const loader = new THREE.TextureLoader();
    const texture = loader.load(this.modelConfig.topModel.map);

    // it's necessary to apply these settings in order to correctly display the texture on a shape geometry

    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 0.01);
    texture.offset.set(0, 0.6);
    texture.rotation = -80;
    const material = new THREE.MeshBasicMaterial({
      color: "#068efd",
      // map: texture,
      // transparent: true,
      // side: THREE.DoubleSide,
      // opacity: this.modelConfig.topModel.opacity,
    });
    let sideTexture = new THREE.TextureLoader().load(
      this.modelConfig.sideModel.map
    );
    sideTexture.wrapS = sideTexture.wrapT = THREE.RepeatWrapping;
    // sideTexture.rotation = -175;
    sideTexture.offset.set(0, 1 - 1 / this.modelConfig.height);
    // sideTexture.center.set(0.5, 0.5);
    sideTexture.repeat.set(1, 1 / this.modelConfig.height);
    const material1 = new THREE.MeshBasicMaterial({
      map: sideTexture,
      // depthTest: false,
      // transparent: true,
      side: THREE.DoubleSide,
      opacity: this.modelConfig.sideModel.opacity,
    });
    const mesh = new THREE.Mesh(geometry, [material, material1]);
    mesh.position.z = 0;
    return mesh;
  }

  /**
   * @desc 经纬度转换成墨卡托投影
   * @param {array} 传入经纬度
   * @return array [x,y,z]
   */
  lnglatToMector(lnglat) {
    if (!this.projection) {
      this.projection = d3
        .geoMercator()
        .center([108.904496, 32.668849])
        .scale(80)
        .rotate(Math.PI / 4)
        .translate([0, 0]);
    }
    const [y, x] = this.projection([...lnglat]);
    const z = 0;
    return [x, y, z];
  }

  /**
   * @desc 动画
   */
  // lineAnimate(){
  //   // 一定要在此函数中调用
  //     if(this.texture) this.texture.offset.x -= 0.01
  //     requestAnimationFrame(this.lineAnimate)
  // }
  animate() {
    if (this.textureGroup) {
      this.textureGroup.forEach((texture) => {
        texture.offset.x -= 0.01;
      });
    }
    requestAnimationFrame(this.animate.bind(this));

    this.renderer.clear();
    this.camera.layers.set(1);
    this.composer.render();
    this.renderer.clearDepth(); // 清除深度缓存
    this.camera.layers.set(0);
    // let test = this.scene.children.filter(
    //   (item) => item.name == "spritTest"
    // )?.[0];
    // if (test && test.material.map.image.width > 10) {
    //   // test.material.map.image.width -= 0.01;
    //   test.material.map.image.width = 100;
    // }
    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
    // required if controls.enableDamping or controls.autoRotate are set to true
    // this.controls.update();
    // if ((!this.isControl && this.isFirst) || this.isControl) {
    //   this.labelRenderer.render(this.scene, this.camera);
    //   this.isFirst = false;
    // }
    this.doAnimate && this.doAnimate.bind(this)();
  }

  /**
   * @desc 设置控制器
   */
  setControl() {
    this.controls = new OrbitControls(
      this.camera,
      this.labelRenderer.domElement
    );
    this.controls.enabled = this.isControl;
    this.controls.target.set(this.scenePos.x, this.scenePos.y, this.scenePos.z);
    if (this.isControl) {
      this.controls.enablePan = true; // 邮件拖拽
      this.controls.enableZoom = true; // 滚轮缩放
      this.controls.enableRotate = true; // 左键旋转
      this.controls.minZoom = 0.5; // 缩放范围
      this.controls.maxZoom = 2.0;
      // 上下旋转范围
      // this.controls.minPolarAngle = Math.PI * (90 / 360);
      // this.controls.maxPolarAngle = Math.PI * (1 - 230 / 360);
      // ============================
      // this.controls.minPolarAngle = 0;
      // this.controls.maxPolarAngle = Math.PI * (1 / 2);
      // 左右旋转范围
      // this.controls.minAzimuthAngle = Math.PI * (70 / 180);
      // this.controls.maxAzimuthAngle = Math.PI * (120 / 180);
    }
    this.controls.update();
  }

  /**
   * @desc 相机
   */
  setCamera(set) {
    const { x, y, z } = set;
    this.camera.up.x = 0;
    this.camera.up.y = 0;
    this.camera.up.z = 1;
    this.camera.position.set(x, y, z);
    this.camera.lookAt(0, 0, 0);
  }

  /**
   * @desc 设置光线
   */
  setLight(config) {
    const directionalLight = new THREE.DirectionalLight(0xff0000, 1); // 平行光
    const pointLight = new THREE.PointLight(0xff0000); // 点光源
    pointLight.castShadow = true;
    directionalLight.castShadow = true;
    pointLight.position.set(-50, -15, 50);
    directionalLight.position.set(-20, -10, 30);
    // this.scene.add(pointLight);
    // this.scene.add(directionalLight);
    if (config.point) {
      var point = new THREE.PointLight(config.point.color);
      let pos = config.point.pos;
      point.position.set(pos[0], pos[1], pos[2]); // 点光源位置
      // this.scene.add(point); // 点光源添加到场景中
      // let point1 = point.clone();
      // point.position.set(-pos[0], -pos[1], pos[2]);
      // this.scene.add(point1);
    }

    // this.scene.add(new THREE.HemisphereLight(0xff0000, 0x000000)); // 半球光

    // RectAreaLightUniformsLib.init();

    const rectLight1 = new THREE.RectAreaLight(0xff0000, 5, 40, 1); // 平面光光源
    rectLight1.position.set(-30, -10, 20);
    // this.scene.add(rectLight1);

    // 创建一个点光源
    this._pointlight = new THREE.PointLight("red");
    this._pointlight.intensity = 20;
    this._pointlight.decay = 1;
    this._pointlight.distance = 2;
    this._pointlight.position.set(0, 0, 4);
    // this.scene.add(this._pointlight);
  }

  /**
   * @desc 设置渲染器
   */
  setRender() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.autoClear = false;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.renderer.setClearColor(0xffffff, 0.0);
    this.renderer.domElement.style.position = "absolute";
    // this.renderer.physicallyCorrectLights = true;
    this.mapCon.appendChild(this.renderer.domElement);
    // var tri = new THREE.ShaderPass(THREE.TriangleBlurShader, "texture");
    // tri.enabled = false;
    // this.composer = new EffectComposer(this.renderer);
    // const renderScene = new RenderPass(this.scene, this.camera);
    // this.composer.addPass(renderScene);
    // this.composer.render();
    this.composer = new EffectComposer(this.renderer);

    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    this.outlinePass = new OutlinePass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      this.scene,
      this.camera
    );
    this.composer.addPass(this.outlinePass);

    const params = {
      edgeStrength: 4,
      edgeGlow: 0.0,
      edgeThickness: 2.5,
      pulsePeriod: 0,
      rotate: false,
      usePatternTexture: false,
    };
    this.outlinePass.edgeStrength = params.edgeStrength;
    this.outlinePass.edgeGlow = params.edgeGlow;
    this.outlinePass.edgeThickness = params.edgeThickness;
    this.outlinePass.pulsePeriod = params.pulsePeriod;
    this.outlinePass.visibleEdgeColor.set("#ce7112");
    this.outlinePass.selectedObjects = this.selectedObjects;

    this.afterimagePass = new AfterimagePass(); // 物体运动时产生残影效果
    this.afterimagePass.uniforms["damp"].value = 0.98;
    // this.composer.addPass(this.afterimagePass);
    // this.composer.render();

    const bloomParams = {
      bloomStrength: 4, // 光晕强度
      bloomThreshold: 0, // 光晕阈值
      bloomRadius: 0, // 光晕半径
    };
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,
      0.4,
      0.85
    );
    bloomPass.threshold = bloomParams.bloomThreshold;
    bloomPass.strength = bloomParams.bloomStrength;
    bloomPass.radius = bloomParams.bloomRadius;
    this.composer.addPass(bloomPass);

    let effectFXAA = new ShaderPass(FXAAShader);
    effectFXAA.uniforms.resolution.value.set(
      1 / window.innerWidth,
      1 / window.innerHeight
    );
    this.composer.addPass(effectFXAA);

    let bokehPass = new BokehPass(this.scene, this.camera, {
      focus: 10.0,
      aperture: 2.5,
      maxblur: 0.01,

      // width: window.innerWidth,
      // height: window.innerHeight,
    });
    // this.composer.addPass(bokehPass);

    // 聚焦效果
    var focusShader = new ShaderPass(FocusShader);
    focusShader.uniforms["screenWidth"].value = window.innerWidth;
    focusShader.uniforms["screenHeight"].value = window.innerHeight;
    focusShader.uniforms["sampleDistance"].value = 0.07;
    // this.composer.addPass(focusShader);
    // 镜面效果
    // this.composer.addPass(new ShaderPass(MirrorShader));
  }

  /**
   * @desc 设置参考线
   */
  setHelper() {
    if (this.helperConfig.isShow) {
      const axesHelper = new THREE.AxisHelper(this.helperConfig.length);
      // axesHelper.position.z = 1;
      this.scene.add(axesHelper);
    }
  }

  // 清除方法
  dispose() {
    // this.bloomPass.dispose();
    // this.envMap.dispose();
    // this.skymap.dispose();
    // this.dracoLoader.dispose();
    // this.spriteMaterial.dispose();
    // this.sphereGeometry.dispose();
    // this.meshBasicMaterial.dispose();
    this.scene.dispose();
    this.controls.dispose();

    /*
    const data = this.$data;
      for (let i in data) {
        if (data.hasOwnProperty(i)) {
          if (data[i] && typeof data[i].dispose == "function") {
            data[i].dispose();
          }
        }
      }
    */
    // this.renderer.domElement 就是你的threejs的canvas Dom
    let gl = this.renderer.domElement.getContext("webgl");

    gl && gl.getExtension("WEBGL_lose_context").loseContext();
  }
}
