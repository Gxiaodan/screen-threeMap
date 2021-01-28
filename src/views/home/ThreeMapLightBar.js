import ThreeMap from "./ThreeMap";
import img1 from "../../../public/assets/images/tra_icon.png";
import img2 from "../../../public/assets/images/lightray_yellow.jpg";
import throttle from "lodash.throttle";

import * as THREE from "three";
import { Line2 } from "three/examples/jsm/lines/Line2";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry";

import { util } from "./util";

// const THREE = window.THREE;
export default class ThreeMapLightBar extends ThreeMap {
  constructor(set) {
    super(set);
    this.dataKeys = {};
    this.setDataKeys();
    this.colors = ["#fff", "#ff0", "#0f0"];
    this.colorIndex = 0;
    this.textures = [
      new THREE.TextureLoader().load(img1),
      new THREE.TextureLoader().load(img2),
    ];
    this.pointsLength = 70; // 控制流光速度;控制飞线分段数量；流光长度等属性
  }

  // 设置键值
  setDataKeys() {
    this.mapData.features.forEach((d) => {
      const { name, cp } = d.properties;
      this.dataKeys[name] = [...cp];
    });

    console.log(this.dataKeys);
  }

  /**
   * @desc 节流，防抖
   */
  doAnimate = throttle(() => {
    const ratio = this.colorIndex / this.pointsLength;
    this.flyGroup &&
      this.flyGroup.children.forEach((d) => {
        let colorList = [];
        // let value = d.userData.value
        // let max = d.userData.max
        colorList = util.getRgb(
          ["rgb(245,170,170)", "rgb(255,0,0)", "rgb(245,170,170)"],
          this.pointsLength
        );
        const color = new THREE.Color("#fff");
        colorList.splice(
          this.colorIndex * 3,
          9,
          color.r,
          color.g,
          color.b,
          color.r,
          color.g,
          color.b,
          color.r,
          color.g,
          color.b
        );
        d.geometry.setColors(colorList);
        d.geometry.colorsNeedUpdate = true;
      });

    this.sixLineGroup &&
      this.sixLineGroup.children.forEach((d) => {
        d.scale.set(1 + ratio, 1 + ratio, d.scale.z);
        d.material.opacity = 1 - ratio;
      });

    this.colorIndex++;
    if (this.colorIndex > this.pointsLength - 1) {
      this.colorIndex = 0;
    }
    // this.testMesh.rotateZ(Math.PI / 2);
    // this.testMesh.rotateZ(0.05);
    // this.testMesh.rotation.z = (this.colorIndex * Math.PI) / 5;
  }, 30);

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
   */
  drawFlyLine(data) {
    const group = new THREE.Group();
    group.name = "飞线";
    const maxValue = Math.max(...data.map((item) => item.value));
    data.forEach((d) => {
      // 源和目标省份的经纬度
      const slnglat = this.dataKeys[d.source.name];
      const tlnglat = this.dataKeys[d.target.name];
      const value = d.value;
      const z = 15;
      const [x1, y1, z1] = this.lnglatToMector(slnglat);
      const [x2, y2, z2] = this.lnglatToMector(tlnglat);
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(x1, y1, z1 + 1.1),
        new THREE.Vector3((x1 + x2) / 2, (y1 + y2) / 2 + 5, 10),
        new THREE.Vector3(10, -3, 14)
      );
      const points = curve.getPoints(this.pointsLength);
      const geometry = new LineGeometry(); // Geometry 利用 Vector3 或 Color 存储了几何体的相关 attributes
      // geometry.vertices = points;
      const positions = [];
      const colorList = [];
      points.forEach((p, i) => {
        positions.push(p.x, p.y, p.z);
        //  let color = new THREE.Color("#f00");
        // let color = new THREE.Color(0xffffff);
        // color.setHSL(p.x / 100 + 0.1, (  p.y * 20 ) / 300, 0.7);
        // colorList.push( color.r, color.g, color.b );
      });
      geometry.setPositions(positions);
      geometry.setColors(
        util.getRgb(
          ["rgb(245,127,127)", "rgb(255,0,0)", "rgb(245,127,127)"],
          this.pointsLength
        )
      );

      const material = new LineMaterial({
        dashed: false,
        // color: 0xffffff,
        vertexColors: true, // 是否使用顶点着色 THREE.NoColors THREE.VertexColors THREE.FaceColors
        transparent: true,
        linewidth: 1,
        linecap: "square", // 线两端的样式
        linejoin: "round", // 线连接节点的样式
        opacity: 1,
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
    this.scene.add(group);
  }
}
