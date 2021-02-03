import ThreeMap from "./ThreeMap";
import img1 from "../../../public/assets/images/tra_icon.png";
import img2 from "../../../public/assets/images/lightray_yellow.jpg";
import throttle from "lodash.throttle";

import * as THREE from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import { Line2 } from "three/examples/jsm/lines/Line2";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry";

import { util } from "./util";

/**
   *flyLineConfig: {
      colors: ["rgb(245,127,127)", "rgb(255,0,0)", "rgb(245,127,127)"],
      pointLength: 90,// 控制流光速度;控制飞线分段数量；流光长度等属性
      moveLength: 30,
      width: 1,
      opacity:1
    }
   * 
  */
export default class ThreeMapLightBar extends ThreeMap {
  constructor(set) {
    super(set);
    this.flyLineConfig = set.flyLineConfig || {
      colors: ["rgb(245,127,127)", "rgb(255,0,0)", "rgb(245,127,127)"],
      pointLength: 90,
      moveLength: 30,
      width: 1,
      opacity: 1,
    };
    this.borderLineConfig = set.borderLineConfig || { isShow: false };
    this.dataKeys = {};
    this.setDataKeys();
    this.colors = ["#fff", "#ff0"];
    this.colorIndex = 0;
    this.textures = [
      new THREE.TextureLoader().load(img1),
      new THREE.TextureLoader().load(img2),
    ];

    let _this = this;
    new THREE.FileLoader().load("./assets/map/chinaBorderLine.json", function(
      data
    ) {
      const borderData = JSON.parse(data);
      _this.drawBorderMesh(borderData);
    });
  }

  // 设置键值
  setDataKeys() {
    this.mapData.features.forEach((d) => {
      // const { name, center } = d.properties;
      // if (name) this.dataKeys[name] = [...center];
      const { name, cp } = d.properties;
      if (name) this.dataKeys[name] = [...cp];
    });
    this.labelDatas.forEach((d) => {
      const { coordinates, name } = d;
      this.dataKeys[name] = [...coordinates];
    });

    console.log(this.dataKeys, "++++++++++++++");
  }

  /**
   * @desc 节流，防抖
   */
  doAnimate = throttle(() => {
    const ratio = this.colorIndex / this.flyLineConfig.pointLength;
    this.flyGroup &&
      this.flyGroup.children.forEach((d) => {
        let colorList = [];
        // let value = d.userData.value
        // let max = d.userData.max
        colorList = util.getRgb(
          this.flyLineConfig.colors,
          this.flyLineConfig.pointLength
        );
        const color = new THREE.Color("#fff");
        let moveLength = this.flyLineConfig.moveLength;
        let rgbArr = [];
        for (let i = 0; i < Math.ceil(moveLength / 3); i++) {
          rgbArr.push(color.r, color.g, color.b);
        }
        colorList.splice(this.colorIndex * 3, moveLength, ...rgbArr);
        d.geometry.setColors(colorList);
        d.geometry.colorsNeedUpdate = true;
      });

    this.sixLineGroup &&
      this.sixLineGroup.children.forEach((d) => {
        d.scale.set(1 + ratio, 1 + ratio, d.scale.z);
        d.material.opacity = 1 - ratio;
      });

    this.colorIndex++;
    if (this.colorIndex > this.flyLineConfig.pointLength - 1) {
      this.colorIndex = 0;
    }
    // this.testMesh.rotateZ(Math.PI / 2);
    // this.testMesh.rotateZ(0.05);
    // this.testMesh.rotation.z = (this.colorIndex * Math.PI) / 5;
  }, this.animateConfig.time);

  /**
   * @desc 绘制6边形
   */
  drawSixMesh(x, y, z, i, size = 5) {
    const geometry = new THREE.CircleGeometry(0.5, size);
    const material = new THREE.MeshBasicMaterial({ color: this.colors[i % 2] });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z + 1.1);
    return mesh;
  }

  /**
   * @desc 绘制6边线
   */
  drawSixLineLoop(x, y, z, i) {
    // 绘制六边型
    const geometry = new THREE.CircleGeometry(0.7, 6);
    const material = new THREE.MeshBasicMaterial({
      color: this.colors[i % 2],
      transparent: true,
    });
    geometry.vertices.shift();
    const line = new THREE.LineLoop(geometry, material);
    line.position.set(x, y, z + 1.1);
    return line;
  }

  /**
   * @desc 柱子
   */
  drawPlane(x, y, z, value, i) {
    const hei = value / 20;
    const geometry = new THREE.PlaneGeometry(1, hei);
    // var shape = new THREE.CircleGeometry(1, 1);
    // const geometry = new THREE.ExtrudeGeometry(shape, {
    //   amount: 1, // 拉伸长度，默认100
    //   bevelEnabled: false, // 对挤出的形状应用是否斜角
    //   depth: 1
    // });
    const material = new THREE.MeshBasicMaterial({
      map: this.textures[i % 2], // 颜色贴图
      depthTest: false, // 是否在渲染此材质时启用深度测试
      transparent: true,
      color: this.colors[i % 2],
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, // 在使用此材质显示对象时要使用何种混合
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.position.set(x, y, z + 1.1);
    plane.position.set(x, y, z + 1.1 + hei / 2);
    plane.rotation.x = Math.PI / 2;
    plane.rotation.z = Math.PI;
    const plane2 = plane.clone();
    plane2.rotation.y = Math.PI / 2;
    return [plane, plane2];
    // return [plane];
  }

  /**
   * @desc 绘制光柱
   */
  drawLightBar(data, type) {
    const group = new THREE.Group();
    group.name = "六边体";
    const sixLineGroup = new THREE.Group();
    sixLineGroup.name = "六边线";
    data.forEach((d, i) => {
      const lnglat = this.dataKeys[d.name];
      const [x, y, z] = this.lnglatToMector(lnglat);

      // 绘制六边体
      group.add(this.drawSixMesh(x, y, z, i));
      // 绘制6边线
      sixLineGroup.add(this.drawSixLineLoop(x, y, z, i));

      // const shape = new THREE.Shape();
      // shape.moveTo(0, 0);
      // shape.lineTo(0, 5);
      // shape.lineTo(5, 5);
      // shape.lineTo(5, 0);
      // shape.lineTo(0, 0);

      // const geometry = new THREE.ExtrudeGeometry(shape, {
      //   amount: 1, // 拉伸长度，默认100
      //   bevelEnabled: false, // 对挤出的形状应用是否斜角
      //   depth: 2,
      // });
      // var img2 = "./mapLine.png";
      // const material0 = new THREE.MeshPhongMaterial({
      //   color: "#f00",
      //   transparent: true,
      //   opacity: 1,
      // });
      // const material1 = new THREE.MeshBasicMaterial({
      //   map: new THREE.TextureLoader().load(img2),
      //   transparent: true,
      //   opacity: 1,
      //   side: THREE.DoubleSide,
      // });
      // this.testMesh = new THREE.Mesh(geometry, [material0, material1]);
      // this.testMesh.position.set(0, 10, 5);

      // const geometry1 = new THREE.SphereGeometry(3, 3, 3);
      // let mesh = new THREE.Mesh(geometry1, material0);
      // mesh.position.x = -10;
      // mesh.position.y = 10;
      // this.scene.add(mesh);

      // 绘制柱子
      const [plane1, plane2] = this.drawPlane(x, y, z, d.value, i);
      group.add(plane2);
      group.add(plane1);
    });

    this.sixLineGroup = sixLineGroup;
    if (type == "bar") {
      this.scene.add(group);
    } else if (type == "line") {
      this.scene.add(sixLineGroup);
    } else {
      this.scene.add(group);
      this.scene.add(sixLineGroup);
    }
  }

  /**
   * @desc 绘制飞线
   * flyLineConfig: {
   *  color: ["rgb(245,127,127)", "rgb(255,0,0)", "rgb(245,127,127)"],
   * opacity: 1,
   *
   * }
   */
  drawFlyLine(data) {
    const group = new THREE.Group();
    group.name = "飞线";
    const maxValue = Math.max(...data.map((item) => item.value));
    data.forEach((d) => {
      // 源和目标省份的经纬度
      const slnglat = this.dataKeys[d.source.name];
      const value = d.value;
      const z = 10;
      const [x1, y1, z1] = this.lnglatToMector(slnglat);
      let x2, y2, z2;
      let curve;
      if (d.target) {
        const tlnglat = this.dataKeys[d.target.name];
        [x2, y2, z2] = this.lnglatToMector(tlnglat);
        curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(x1, y1, z1 + 1.1),
          new THREE.Vector3((x1 + x2) / 2, (y1 + y2) / 2, z),
          new THREE.Vector3(x2, y2, z2 + 1.1)
        );
      } else
        curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(x1, y1, z1 + 1.1),
          new THREE.Vector3(d.curve[0].x, d.curve[0].y, d.curve[0].z),
          new THREE.Vector3(d.curve[1].x, d.curve[1].y, d.curve[1].z)
        );
      const points = curve.getPoints(this.flyLineConfig.pointLength);
      const geometry = new LineGeometry(); // Geometry 利用 Vector3 或 Color 存储了几何体的相关 attributes
      // geometry.vertices = points;
      const positions = [];
      // const colorList = [];
      points.forEach((p) => {
        positions.push(p.x, p.y, p.z);
        //  let color = new THREE.Color("#f00");
        // let color = new THREE.Color(0xffffff);
        // color.setHSL(p.x / 100 + 0.1, (  p.y * 20 ) / 300, 0.7);
        // colorList.push( color.r, color.g, color.b );
      });
      geometry.setPositions(positions);
      geometry.setColors(
        util.getRgb(this.flyLineConfig.colors, this.flyLineConfig.pointLength)
      );

      const material = new LineMaterial({
        dashed: false,
        // color: 0xffffff,
        vertexColors: true, // 是否使用顶点着色 THREE.NoColors THREE.VertexColors THREE.FaceColors
        transparent: true,
        linewidth: this.flyLineConfig.width,
        linecap: "square", // 线两端的样式
        linejoin: "round", // 线连接节点的样式
        opacity: this.flyLineConfig.opacity,
        lights: false, // 材质是否受到光照的影响
        // clipShadows: true,
        // shadowSide: THREE.DoubleSide
      });
      material.resolution.set(window.innerWidth, window.innerHeight);
      const mesh = new Line2(geometry, material);
      mesh.userData.value = value;
      mesh.userData.max = maxValue;
      group.add(mesh);
    });
    this.flyGroup = group;
    // this.flyGroup.position.z = this.modelConfig.height + 0.1;
    this.flyGroup.position.z = 0.1;
    this.scene.add(this.flyGroup);
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
        const lineMesh = this.drawLine(point, "#f00", 2);
        lineGroup.add(lineMesh);
        meshGroup.add(mesh);
        mirrorGroup.add(mirrorMesh);
      });
    });

    meshGroup.position.z = this.modelConfig.height + 0.01;
    mirrorGroup.position.z = 0;
    mirrorGroup.position.x = 1;
    lineGroup.position.z = this.modelConfig.height + 0.2;

    this.scene.add(meshGroup);
    if (this.mirrorConfig.isShow) this.scene.add(mirrorGroup);
    if (this.borderLineConfig.isShow) this.scene.add(lineGroup);
  }
}
