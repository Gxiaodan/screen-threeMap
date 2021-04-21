import * as d3 from "d3-geo";

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Line2 } from "three/examples/jsm/lines/Line2";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";

import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/examples/jsm/renderers/CSS2DRenderer";

import { LineGeometry } from "three/examples/jsm/lines/LineGeometry";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import lineImg from "../../../public/assets/images/zdcs_icon.png";

export default class ThreeMap {
  constructor(set) {
    this.mapData = set.mapData;
    this.labelDatas = set.labelDatas;
    this.canvasId = set.canvasId;
    this.scenePos = set.scenePos || { x: 0, y: 0, z: -8 };
    this.sceneScale = set.sceneScale || { x: 1, y: 1, z: 1 };
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
    this.backgroundConfig = set.backgroundConfig || { color: "#000", map: "" };
    this.provinceName = "";
    this.isControl = set.isControl ? true : false;
    this.isFirst = true; // 控制label是否在有动画但地图不可动的情况下是否渲染，节省性能
    this.mapColors = ["#0684fd", "#006de0"];
    this.borderLineConfig = set.borderLineConfig || { isShow: false };
    this.dataKeys = {};
    this.setDataKeys();

    let _this = this;
    new THREE.FileLoader().load("./assets/map/shBorderLine.json", function(
      data
    ) {
      const borderData = JSON.parse(data);
      _this.drawBorderMesh(borderData);
    });
    this.init();
  }

  /**
   * @desc 初始化场景
   */
  init() {
    this.mapCon = document.getElementById(this.canvasId);
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();
    const texture = this.backgroundConfig.map
      ? new THREE.TextureLoader().load(this.backgroundConfig.map)
      : new THREE.Color(this.backgroundConfig.color);
    this.scene.background = texture;
    // this.scene.fog = new THREE.Fog("#000", 480, 500);
    this.scene.position.set(this.scenePos.x, this.scenePos.y, this.scenePos.z);
    this.scene.scale.set(
      this.sceneScale.x,
      this.sceneScale.y,
      this.sceneScale.z
    );
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

    window.addEventListener("resize", () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // this.camera.aspect = this.cameraConfig.aspect;
      // this.camera.updateProjectionMatrix();
      this.labelRenderer.setSize(width, height);
      this.renderer.setSize(width, height);
    });
  }
  // 设置键值
  setDataKeys() {
    this.mapData.features.forEach((d) => {
      const { name, center } = d.properties;
      if (name) this.dataKeys[name] = [...center];
      // const { name, cp } = d.properties;
      // if (name) this.dataKeys[name] = [...cp];
    });
    this.labelDatas.forEach((d) => {
      const { coordinates, name } = d;
      this.dataKeys[name] = [...coordinates];
    });

    console.log(this.dataKeys, "++++++++++++++");
  }
  // 页面固定label添加
  mapFixedLabel() {
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
    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
    this.labelRenderer.domElement.style.position = "absolute";
    this.labelRenderer.domElement.style.top = "0px";
    this.labelRenderer.domElement.style.zIndex = 1;
    this.mapCon.appendChild(this.labelRenderer.domElement);
  }

  // 滚轮事件
  mousewheel(event) {
    event.preventDefault();
    console.log(this.controls, "this.controls");
  }

  /**
   * @desc 鼠标事件处理
   */
  mouseEvent(event) {
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
      this.clickFunction(
        event,
        this.intersects[0].object.parent,
        this.intersects[0].point
      );
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
          if (p) {
            const lineMesh = this.drawLine(p, color, width);
            lineGroup.add(lineMesh);
          }
        } else {
          // 单个面
          const lineMesh = this.drawLine(points, color, width);
          lineGroup.add(lineMesh);
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
      opacity: this.lineConfig.opacity,
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
    texture.repeat.set(0.01, 0.01);
    texture.offset.set(0.5, 0.4);
    texture.rotation = 0;
    const material = new THREE.MeshPhongMaterial({
      color: this.modelConfig.topModel.color,
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
        .center([121.448224, 31.229003])
        .scale(2500)
        .rotate(0)
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
    // if (this.textureGroup) {
    //   this.textureGroup.forEach((texture) => {
    //     texture.offset.x -= 0.01;
    //   });
    // }
    requestAnimationFrame(this.animate.bind(this));

    this.renderer.clear();
    this.camera.layers.set(1);
    this.composer.render();
    this.renderer.clearDepth(); // 清除深度缓存
    this.camera.layers.set(0);
    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
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
    if (this.isControl) {
      this.controls.enablePan = true; // 邮件拖拽
      this.controls.enableZoom = true; // 滚轮缩放
      this.controls.enableRotate = true; // 左键旋转
      // this.controls.minZoom = 0.5; // 缩放范围
      // this.controls.maxZoom = 2.0;
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
    this.camera.zoom = 3;
    this.camera.position.set(x, y, z);
    this.camera.lookAt(0, 0, 0);
  }

  /**
   * @desc 设置光线
   */
  setLight(config) {
    if (config.point) {
      var point = new THREE.PointLight(config.point.color);
      point.castShadow = true;
      let pos = config.point.pos;
      point.position.set(pos[0], pos[1], pos[2]); // 点光源位置
      this.scene.add(point); // 点光源添加到场景中
      // let point1 = point.clone();
      // point.position.set(-pos[0], -pos[1], -pos[2]);
      // this.scene.add(point1);
    }
  }

  /**
   * @desc 设置渲染器
   */
  setRender() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.autoClear = false;
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.renderer.domElement.style.position = "absolute";
    this.mapCon.appendChild(this.renderer.domElement);
    // 后期效果
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);
    let effectFXAA = new ShaderPass(FXAAShader);
    effectFXAA.uniforms.resolution.value.set(
      1 / window.innerWidth,
      1 / window.innerHeight
    );
    this.composer.addPass(effectFXAA);
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

  drawBorderMesh(borderData) {
    // 边界线和平面
    this.coordinatesTrans(borderData);
    let d = borderData.features[0];
    let meshGroup = new THREE.Group();
    let mirrorGroup = new THREE.Group();
    let lineGroup = new THREE.Group();

    d.vector3.forEach((points) => {
      points.forEach((point) => {
        const mesh = this.drawBorderModel(point);
        const mirrorMesh = this.drawBorderModel(point, "mirror");

        let tubeP = [];
        point.forEach((item) => {
          tubeP.push(new THREE.Vector3(item[0], item[1], item[2]));
        });
        // CatmullRomCurve3创建一条平滑的三维样条曲线
        const curve = new THREE.CatmullRomCurve3(tubeP); // 曲线路径
        const tubeMaterial = new THREE.MeshPhongMaterial({
          map: this.texture,
          // color: "#f00",
          shadowSide: THREE.BackSide,
          transparent: true,
          polygonOffset: true,
        });

        // 创建管道
        const tubeGeometry = new THREE.TubeGeometry(curve, 80, 0.01, 50, false); // p1：路径；p2:组成管道的分段数64；p3:管道半径1；p4:管道横截面的分段数8；

        const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);

        // lineGroup.add(tubeMesh);
        const lineMesh = this.drawLine(point, "#00fff5", 2);
        lineGroup.add(lineMesh);
        meshGroup.add(mesh);
        // mirrorMesh.layers.set(2);
        // mirrorGroup.add(mirrorMesh);
      });
    });

    meshGroup.position.z = this.modelConfig.height + 0.02;
    mirrorGroup.position.z = 0;
    mirrorGroup.position.x = 5;
    lineGroup.position.z = this.modelConfig.height + 0.1;

    // this.scene.add(meshGroup);
    if (this.mirrorConfig.isShow) this.scene.add(mirrorGroup);
    if (this.borderLineConfig.isShow) this.scene.add(lineGroup);
  }
}
