import ThreeMap from "./ThreeMap";
import img1 from "../../../public/assets/images/lightray.jpg";
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
      lightLineWidth: 2,
      opacity: 1,
    };
    this.flyDatas = set.flyDatas;
    this.borderLineConfig = set.borderLineConfig || { isShow: false };
    this.dataKeys = {};
    this.setDataKeys();
    this.colors = ["#fff", "#ff0"];
    this.colorIndex = 0;
    this.moveIndex = 0;
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
    this.flyGroup1 &&
      this.flyGroup1.children.forEach((d, index) => {
        let points = d.userData.points;
        let point = d.userData.points[this.moveIndex];
        /*
          面板移动？？？有问题
          d.position.set(point.x, point.y, point.z);
        */

        /*
         管道贴图移动动画
        */
        let moveLength =
          (points.length * this.flyLineConfig.moveLength) /
          this.flyLineConfig.pointLength;
        const pointsMove = points.slice(
          this.moveIndex,
          this.moveIndex + moveLength
        );
        const tubeMesh1 = this.createTube(
          pointsMove,
          this.modelConfig.barModel.map
        );
        tubeMesh1.userData = { index: index, points: points };
        this.flyGroup1.remove(d);
        this.flyGroup1.add(tubeMesh1);
        // 纯线段飞线动画
        // let moveLength = this.flyLineConfig.moveLength;
        // let moveIndex = (this.colorIndex * 3) % d.userData.positions.length;
        // d.geometry.setPositions(
        //   d.userData.positions.slice(moveIndex, moveIndex + moveLength)
        // );

        // 管道+贴图飞线动画

        // let colorList = [];
        // let value = d.userData.value
        // let max = d.userData.max
        // colorList = util.getRgb(
        //   this.flyLineConfig.colors,
        //   this.flyLineConfig.pointLength
        // );
        // const color = new THREE.Color("#fff");
        // let moveLength = this.flyLineConfig.moveLength;
        // let rgbArr = [];
        // for (let i = 0; i < Math.ceil(moveLength / 3); i++) {
        //   rgbArr.push(color.r, color.g, color.b);
        // }
        // colorList.splice(this.colorIndex * 3, moveLength, ...rgbArr);
        // d.geometry.setColors(colorList);
        // d.geometry.colorsNeedUpdate = true;
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
    this.moveIndex = this.moveIndex + 10;
    if (this.moveIndex > this.flyLineConfig.pointLength - 1) {
      this.moveIndex = 0;
    }
    this.testMesh.rotateZ(Math.PI / 2);
    this.testMesh.rotateZ(0.05);
    this.testMesh.rotation.z = (this.colorIndex * Math.PI) / 5;
  }, this.animateConfig.time);

  /**
   * @desc 绘制6边形
   */
  drawSixMesh(x, y, z, i, size = 20) {
    const geometry = new THREE.CircleGeometry(0.5, size);
    const material = new THREE.MeshBasicMaterial({ color: this.colors[i % 2] });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z + this.modelConfig.height + 0.1);
    return mesh;
  }

  /**
   * @desc 绘制6边线
   */
  drawSixLineLoop(x, y, z, i, r) {
    // 绘制六边型
    const geometry = new THREE.CircleGeometry(r, 20);
    const material = new THREE.MeshBasicMaterial({
      color: this.colors[i % 2],
      transparent: false,
    });
    geometry.vertices.shift();
    const line = new THREE.LineLoop(geometry, material);
    line.position.set(x, y, z + this.modelConfig.height + 0.1);
    return line;
  }

  /**
   * @desc 柱子
   */
  drawPlane(x, y, z, value, i) {
    const hei = value / 50;
    const geometry = new THREE.BoxGeometry(1, hei, 1, 4, 4, 4);
    let map = new THREE.TextureLoader().load(this.modelConfig.barModel.map);
    const material = new THREE.MeshBasicMaterial({
      map: map,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = 1.6;
    mesh.rotation.y = 0.5;
    mesh.position.set(x, y, z + this.modelConfig.height + hei / 2 + 0.1);
    return mesh;
  }

  /**
   * @desc 绘制光柱
   */
  drawLightBar(type) {
    const group = new THREE.Group();
    group.name = "六边体";
    const sixLineGroup = new THREE.Group();
    sixLineGroup.name = "六边线";
    this.labelDatas.forEach((d, i) => {
      const lnglat = this.dataKeys[d.name];
      // const lnglat = d.coordinates;
      const [x, y, z] = this.lnglatToMector(lnglat);

      // 绘制六边体
      group.add(this.drawSixMesh(x, y, z, i));

      // 绘制6边线
      sixLineGroup.add(this.drawSixLineLoop(x, y, z, i, 1));
      sixLineGroup.add(this.drawSixLineLoop(x, y, z, i, 0.7));

      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(0, 5);
      shape.lineTo(5, 5);
      shape.lineTo(5, 0);
      shape.lineTo(0, 0);

      const geometry = new THREE.ExtrudeGeometry(shape, {
        amount: 1, // 拉伸长度，默认100
        bevelEnabled: false, // 对挤出的形状应用是否斜角
        depth: 2,
      });
      var img2 = "./mapLine.png";
      const material0 = new THREE.MeshPhongMaterial({
        color: "#f00",
        transparent: true,
        opacity: 1,
      });
      const material1 = new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load(img2),
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide,
      });
      this.testMesh = new THREE.Mesh(geometry, [material0, material1]);
      this.testMesh.position.set(0, 0, 0);

      // const geometry1 = new THREE.SphereGeometry(3, 3, 3);
      // let mesh = new THREE.Mesh(geometry1, material0);
      // mesh.position.x = -10;
      // mesh.position.y = 10;
      // this.scene.add(mesh);

      // 绘制柱子
      const barMesh = this.drawPlane(x, y, z, d.value, i);
      group.add(barMesh);
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

  // 创建管道
  createTube(points, img) {
    // 管道实现外边缘效果
    const tubeCurve = new THREE.CatmullRomCurve3(points); // 曲线路径
    const texture = new THREE.TextureLoader().load(img);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping; // 每个都重复
    const tubeMaterial = new THREE.MeshBasicMaterial({
      // color: "#f5e669",
      transparent: true,
      opacity: 0.8,
      map: texture,
      polygonOffset: true,
      side: THREE.DoubleSide,
    });

    // 创建管道
    const tubeGeometry = new THREE.TubeGeometry(tubeCurve, 80, 0.2, 50, false); // p1：路径；p2:组成管道的分段数64；p3:管道半径1；p4:管道横截面的分段数8；

    const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
    return tubeMesh;
  }
  drawFlyLine() {
    const group = new THREE.Group(); // 底线
    const group1 = group.clone(); // 移动点
    const group2 = group.clone(); // 虚线
    const group3 = group.clone(); // 移动立方块
    const group4 = group.clone(); // 移动平面
    const group5 = group.clone(); // plane作为底线
    group.name = "飞线";
    const maxValue = Math.max(...this.flyDatas.map((item) => item.value));
    this.flyDatas.forEach((d, index) => {
      // 源和目标省份的经纬度
      const slnglat = this.dataKeys[d.source.name];
      const value = d.value;
      const z = 20;
      const [x1, y1, z1] = this.lnglatToMector(slnglat);
      let x2, y2, z2;
      let curve;
      if (d.target) {
        const tlnglat = this.dataKeys[d.target.name];
        [x2, y2, z2] = this.lnglatToMector(tlnglat);
        curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(x1, y1, z1 + this.modelConfig.height + 0.1),
          new THREE.Vector3((x1 + x2) / 2, (y1 + y2) / 2, z),
          new THREE.Vector3(x2, y2, z2 + this.modelConfig.height + 0.1)
        );
      } else
        curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(x1, y1, z1 + this.modelConfig.height + 0.1),
          new THREE.Vector3(d.curve[0].x, d.curve[0].y, d.curve[0].z),
          new THREE.Vector3(d.curve[1].x, d.curve[1].y, d.curve[1].z)
        );
      const points = curve.getPoints(this.flyLineConfig.pointLength - 1);
      const points1 = [];
      const geometry = new LineGeometry(); // Geometry 利用 Vector3 或 Color 存储了几何体的相关 attributes
      // geometry.vertices = points;
      const positions = [];
      // const colorList = [];
      points.forEach((p, i) => {
        positions.push(p.x, p.y, p.z);
        if (i % 5 == 0) {
          points1.push(p.x, p.y, p.z);
        }
        //  let color = new THREE.Color("#f00");
        // let color = new THREE.Color(0xffffff);
        // color.setHSL(p.x / 100 + 0.1, (  p.y * 20 ) / 300, 0.7);
        // colorList.push( color.r, color.g, color.b );
      });

      const pointsMove = points.slice(
        0,
        (points.length * this.flyLineConfig.moveLength) /
          this.flyLineConfig.pointLength
      );
      geometry.setPositions(positions);
      // geometry.setColors(
      //   util.getRgb(this.flyLineConfig.colors, this.flyLineConfig.pointLength)
      // );

      const material = new LineMaterial({
        // dashed: true,
        color: 0xff0000,
        // vertexColors: true, // 是否使用顶点着色 THREE.NoColors THREE.VertexColors THREE.FaceColors
        transparent: true,
        linewidth: this.flyLineConfig.width,
        // linecap: "butt", // 线两端的样式
        // linejoin: "round", // 线连接节点的样式
        opacity: this.flyLineConfig.opacity,
        // lights: false, // 材质是否受到光照的影响
        // clipShadows: true,
        // shadowSide: THREE.DoubleSide
      });
      material.resolution.set(window.innerWidth, window.innerHeight);
      const mesh = new Line2(geometry, material);
      // mesh.userData.value = value;
      // mesh.userData.max = maxValue;

      // 管道实现外边缘效果
      const tubeCurve = new THREE.CatmullRomCurve3(points); // 曲线路径
      // const tubeMaterial = new THREE.MeshBasicMaterial({
      //   color: "#f5e669",
      //   transparent: true,
      //   opacity: 0.3,
      //   polygonOffset: true,
      //   // side: THREE.DoubleSide,
      // });

      // // 创建管道
      const tubeGeometry = new THREE.TubeGeometry(
        tubeCurve,
        80,
        0.05,
        50,
        false
      ); // p1：路径；p2:组成管道的分段数64；p3:管道半径1；p4:管道横截面的分段数8；

      const tubeMesh1 = this.createTube(
        pointsMove,
        this.modelConfig.barModel.map
      );
      // tubeMesh.name = "飞线" + index;
      tubeMesh1.userData = { index: index, points: points };
      // 添加运动线条
      group1.add(tubeMesh1);
      var material111 = new THREE.MeshLambertMaterial({
        // color: 0x0000ff, //三角面颜色
        map: new THREE.TextureLoader().load(this.modelConfig.barModel.map),
      }); //材质对象
      var mesh111 = new THREE.Mesh(tubeGeometry, material111); //网格模型对象Mesh
      // group1.add(mesh111);
      // var geometry112 = new THREE.TubeGeometry(path, 100, 1, 25, false);
      var material112 = new THREE.MeshBasicMaterial({
        // color: 0x0000ff, //三角面颜色
        map: new THREE.TextureLoader().load(this.modelConfig.barModel.map),
        opacity: 0.5,
      }); //材质对象
      var mesh112 = new THREE.Mesh(tubeGeometry, material112); //网格模型对象Mesh

      const geometry1 = new LineGeometry(); // Geometry 利用 Vector3 或 Color 存储了几何体的相关 attributes
      geometry1.setColors(
        util.getRgb(
          ["rgb(255, 255, 255)", "rgb(0,0, 255)"],
          this.flyLineConfig.moveLength
        )
      );
      // geometry1.setPositions(positions.splice(0, 30));
      let material1 = material.clone();
      material1.opacity = 0.5;
      material1.linewidth = this.flyLineConfig.lightLineWidth;
      const mesh1 = new Line2(geometry1, material1);
      mesh1.userData.positions = positions;

      const geometryBox = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      const materialBox = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const cube = new THREE.Mesh(geometryBox, materialBox);
      cube.userData = { points: points };
      cube.position.set(points[0].x, points[0].y, points[0].z);
      group3.add(cube);

      const geometryPlant = new THREE.PlaneGeometry(5, 5, 5);
      geometryPlant.rotateX(Math.PI / 4);
      // geometryPlant.scale.x = 20;
      const materialPlant = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        side: THREE.DoubleSide,
        map: new THREE.TextureLoader().load(this.modelConfig.barModel.map),
      });
      const plant = new THREE.Mesh(geometryPlant, materialPlant);
      plant.userData = { points: points };
      plant.position.set(points[0].x, points[0].y, points[0].z);
      group4.add(plant);

      const groupL = group.clone(); // 平面拼接成的弧线
      points.forEach((p, index) => {
        if (index % 10 == 0) {
          plant.position.set(p.x, p.y, p.z);
          let plantC = plant.clone();
          plantC.geometry.scale = 4;
          plantC.geometry.rotateX(Math.PI / 4);
          plantC.geometry.rotateY(Math.PI / 4);
          plantC.geometry.rotateZ(Math.PI / 4);
          groupL.add(plantC);
        }
      });
      group5.add(groupL);

      group.add(mesh);
      // group.add(mesh112);
      // group1.add(mesh1);

      // 虚线练习
      const lineGeometry = new THREE.BufferGeometry();
      // const points01 = [];

      // const point = new THREE.Vector3();
      // const direction = new THREE.Vector3();

      // for (let i = 0; i < 6; i++) {
      //   direction.x += Math.random() - 0.5;
      //   direction.y += Math.random() - 0.5;
      //   direction.z += Math.random() - 0.5;
      //   // direction.normalize().multiplyScalar(10);
      //   direction.normalize().multiplyScalar(3);

      //   point.add(direction);
      //   points01.push(point.x, point.y, point.z);
      // }

      lineGeometry.setAttribute(
        "position",
        // new THREE.Float32BufferAttribute(points01, 3)
        new THREE.Float32BufferAttribute(points1, 3)
      );
      let object;
      const lineMaterial = new THREE.LineBasicMaterial({
        color: "#f00",
        transparent: true,
        linewidth: 5,
      });
      object = new THREE.LineSegments(lineGeometry, lineMaterial);
      object.material.opacity = 0.1;
      // object.position.x = Math.random() * 400 - 200;
      // object.position.y = Math.random() * 400 - 200;
      // object.position.z = Math.random() * 400 - 200;
      // object.rotateX = Math.random() + 1.5;
      // object.rotateY = Math.random() + 1.5;
      // object.rotateZ = Math.random() + 1.5;
      group2.add(object);
    });
    this.flyGroup = group;
    this.flyGroup1 = group1;
    // this.flyGroup1 = group3;
    // this.flyGroup1 = group4;
    // this.flyGroup1 = group5;
    // this.flyGroup.position.z = this.modelConfig.height + 0.1;
    this.flyGroup.position.z = 0.1;
    this.flyGroup1.position.z = 0.05;
    // 添加底线
    this.scene.add(this.flyGroup);
    // 添加移动点
    this.scene.add(this.flyGroup1);
    // 添加虚线
    // this.scene.add(group2);
    // this.selectedObjects.push(this.sflyGroup);
    // this.outlinePass.selectedObjects = this.selectedObjects;
    // this.composer.render();

    // var geometry = new THREE.BoxGeometry(20, 20, 20); //创建一个立方体几何对象Geometry
    // // 线条渲染模式
    // var material = new THREE.LineBasicMaterial({
    //   color: 0xff0000, //线条颜色
    // }); //材质对象
    // // 创建线模型对象   构造函数：Line、LineLoop、LineSegments
    // var line = new THREE.Line(geometry, material); //线条模型对象
    // this.scene.add(line);

    var geometry10 = new THREE.BoxGeometry(20, 20, 20);
    // 三角形面渲染模式
    var material10 = new THREE.MeshLambertMaterial({
      color: 0x0000ff, //三角面颜色
    }); //材质对象
    var mesh1 = new THREE.Mesh(geometry10, material10); //网格模型对象Mesh
    // this.scene.add(mesh1);

    //创建管道成型的路径(3D样条曲线)
    var path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-10, -50, -50),
      new THREE.Vector3(10, 0, 0),
      new THREE.Vector3(8, 50, 50),
      new THREE.Vector3(-5, 0, 100),
    ]);
    // path:路径   40：沿着轨迹细分数  2：管道半径   25：管道截面圆细分数
    // var geometry111 = new THREE.TubeGeometry(path, 40, 2, 25);
    // var material111 = new THREE.MeshLambertMaterial({
    //   // color: 0x0000ff, //三角面颜色
    //   map: new THREE.TextureLoader().load(this.modelConfig.barModel.map),
    // }); //材质对象
    // var mesh111 = new THREE.Mesh(geometry111, material111); //网格模型对象Mesh
    // this.scene.add(mesh111);

    // 创建多段线条的顶点数据
    var p1 = new THREE.Vector3(-85.35, -35.36);
    var p2 = new THREE.Vector3(-50, 0, 0);
    var p3 = new THREE.Vector3(0, 50, 0);
    var p4 = new THREE.Vector3(50, 0, 0);
    var p5 = new THREE.Vector3(85.35, -35.36);
    // 创建线条一：直线
    let line1 = new THREE.LineCurve3(p1, p2);
    // 重建线条2：三维样条曲线
    var curve = new THREE.CatmullRomCurve3([p2, p3, p4]);
    // 创建线条3：直线
    let line2 = new THREE.LineCurve3(p4, p5);
    var CurvePath = new THREE.CurvePath(); // 创建CurvePath对象
    CurvePath.curves.push(line1, curve, line2); // 插入多段线条
    //通过多段曲线路径创建生成管道
    //通过多段曲线路径创建生成管道，CCurvePath：管道路径
    var geometry112 = new THREE.TubeGeometry(path, 100, 1, 25, false);
    var material112 = new THREE.MeshBasicMaterial({
      // color: 0x0000ff, //三角面颜色
      map: new THREE.TextureLoader().load(this.modelConfig.barModel.map),
    }); //材质对象
    var mesh112 = new THREE.Mesh(geometry112, material112); //网格模型对象Mesh
    // this.scene.add(mesh112);
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
        const tubeMaterial = new THREE.MeshBasicMaterial({
          // map: this.texture,
          color: "#00fff5",
          shadowSide: THREE.BackSide,
          transparent: true,
          polygonOffset: true,
        });

        // 创建管道
        const tubeGeometry = new THREE.TubeGeometry(curve, 80, 0.08, 50, false); // p1：路径；p2:组成管道的分段数64；p3:管道半径1；p4:管道横截面的分段数8；

        const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);

        lineGroup.add(tubeMesh);
        // const lineMesh = this.drawLine(point, "#f00", 2);
        // lineGroup.add(lineMesh);
        meshGroup.add(mesh);
        mirrorGroup.add(mirrorMesh);
      });
    });

    meshGroup.position.z = this.modelConfig.height + 0.02;
    mirrorGroup.position.z = 0;
    mirrorGroup.position.x = 1;
    lineGroup.position.z = this.modelConfig.height;
    this.selectedObjects.push(lineGroup);
    this.outlinePass.selectedObjects = this.selectedObjects;
    this.composer.render();

    // this.scene.add(meshGroup);
    if (this.mirrorConfig.isShow) this.scene.add(mirrorGroup);
    if (this.borderLineConfig.isShow) this.scene.add(lineGroup);
  }
}
