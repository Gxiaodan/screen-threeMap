class Utils {
  /**
   * 地图数据解码
   */
  decode(json) {
    if (!json.UTF8Encoding) {
      return json;
    }
    let encodeScale = json.UTF8Scale;
    if (!encodeScale) {
      encodeScale = 1024;
    }
    const features = json.features;

    features.forEach((feature) => {
      const geometry = feature.geometry;
      const coordinates = geometry.coordinates;
      const encodeOffsets = geometry.encodeOffsets;
      coordinates.forEach((coordinate, c) => {
        if (geometry.type === "Polygon") {
          coordinates[c] = this.decodePolygon(
            coordinate,
            encodeOffsets[c],
            encodeScale
          );
        } else if (geometry.type === "MultiPolygon") {
          coordinate.forEach((polygon, c2) => {
            coordinate[c2] = this.decodePolygon(
              polygon,
              encodeOffsets[c][c2],
              encodeScale
            );
          });
        }
      });
    });
    // Has been decoded
    json.UTF8Encoding = false;
    return json;
  }

  /**
   * @desc 解码
   */
  decodePolygon(coordinate, encodeOffsets, encodeScale) {
    const result = [];
    let prevX = encodeOffsets[0];
    let prevY = encodeOffsets[1];

    for (let i = 0; i < coordinate.length; i += 2) {
      let x = coordinate.charCodeAt(i) - 64;
      let y = coordinate.charCodeAt(i + 1) - 64;
      // ZigZag decoding
      x = (x >> 1) ^ -(x & 1);
      y = (y >> 1) ^ -(y & 1);
      // Delta deocding
      x += prevX;
      y += prevY;

      prevX = x;
      prevY = y;
      // Dequantize
      result.push([x / encodeScale, y / encodeScale]);
    }
    return result;
  }

  // 飞线等线条渐变色转换方法
  getRgb(rgbs, n) {
    const rgb1 = this.rgba2arr(rgbs[0]);
    const rgb2 = this.rgba2arr(rgbs[1] ? rgbs[1] : rgbs[0]);
    const rgb3 = this.rgba2arr(rgbs[2] ? rgbs[2] : rgbs[1] ? rgbs[1] : rgbs[0]);
    const colors = [];
    for (let i = 0; i < n; i++) {
      let r, g, b;
      // if (i < n / 2) {
      r = rgb1[0] + ((rgb2[0] - rgb1[0]) / n) * i;
      g = rgb1[1] + ((rgb2[1] - rgb1[1]) / n) * i;
      b = rgb1[2] + ((rgb2[2] - rgb1[2]) / n) * i;
      // } else {
      //   r = rgb2[0] + ((rgb3[0] - rgb2[0]) / n) * i;
      //   g = rgb2[1] + ((rgb3[1] - rgb2[1]) / n) * i;
      //   b = rgb2[2] + ((rgb3[2] - rgb2[2]) / n) * i;
      // }
      colors.push(r / 255, g / 255, b / 255);
      // colors.push({ r: r / 255, g: g / 255, b: b / 255 });
    }

    return colors;
  }

  rgba2arr(color, normalized = false) {
    let ret = [];
    const colorStr = color.split("(")[1].split(")")[0];
    if (colorStr) {
      ret = colorStr.split(",");
      ret = ret.map((item) => {
        return Number.parseFloat(item, 2);
      });
    }

    if (normalized) {
      ret = ret.map((item) => {
        return (item = +item / 255);
      });
    }
    return ret;
  }
  // 高斯模糊算法
  gaussBlur(imgData) {
    var pixes = imgData.data;
    var width = imgData.width;
    var height = imgData.height;
    var gaussMatrix = [],
      gaussSum = 0,
      x,
      y,
      r,
      g,
      b,
      a,
      i,
      j,
      k,
      len;

    var radius = 10;
    var sigma = 5;

    a = 1 / (Math.sqrt(2 * Math.PI) * sigma);
    b = -1 / (2 * sigma * sigma);
    //生成高斯矩阵
    for (i = 0, x = -radius; x <= radius; x++, i++) {
      g = a * Math.exp(b * x * x);
      gaussMatrix[i] = g;
      gaussSum += g;
    }

    //归一化, 保证高斯矩阵的值在[0,1]之间
    for (i = 0, len = gaussMatrix.length; i < len; i++) {
      gaussMatrix[i] /= gaussSum;
    }
    //x 方向一维高斯运算
    for (y = 0; y < height; y++) {
      for (x = 0; x < width; x++) {
        r = g = b = a = 0;
        gaussSum = 0;
        for (j = -radius; j <= radius; j++) {
          k = x + j;
          if (k >= 0 && k < width) {
            //确保 k 没超出 x 的范围
            //r,g,b,a 四个一组
            i = (y * width + k) * 4;
            r += pixes[i] * gaussMatrix[j + radius];
            g += pixes[i + 1] * gaussMatrix[j + radius];
            b += pixes[i + 2] * gaussMatrix[j + radius];
            // a += pixes[i + 3] * gaussMatrix[j];
            gaussSum += gaussMatrix[j + radius];
          }
        }
        i = (y * width + x) * 4;
        // 除以 gaussSum 是为了消除处于边缘的像素, 高斯运算不足的问题
        // console.log(gaussSum)
        pixes[i] = r / gaussSum;
        pixes[i + 1] = g / gaussSum;
        pixes[i + 2] = b / gaussSum;
        // pixes[i + 3] = a ;
      }
    }
    //y 方向一维高斯运算
    for (x = 0; x < width; x++) {
      for (y = 0; y < height; y++) {
        r = g = b = a = 0;
        gaussSum = 0;
        for (j = -radius; j <= radius; j++) {
          k = y + j;
          if (k >= 0 && k < height) {
            //确保 k 没超出 y 的范围
            i = (k * width + x) * 4;
            r += pixes[i] * gaussMatrix[j + radius];
            g += pixes[i + 1] * gaussMatrix[j + radius];
            b += pixes[i + 2] * gaussMatrix[j + radius];
            // a += pixes[i + 3] * gaussMatrix[j];
            gaussSum += gaussMatrix[j + radius];
          }
        }
        i = (y * width + x) * 4;
        pixes[i] = r / gaussSum;
        pixes[i + 1] = g / gaussSum;
        pixes[i + 2] = b / gaussSum;
      }
    }
    return imgData;
  }
}

export const util = new Utils();
