// Constructor
const Effect = function() {
  this.canvas;
  this.renderer;
  this.scene;
  this.camera;
};

// 初期化っすよ
Effect.prototype.init = function() {
  this.canvas = document.getElementById('canvas');
  this.renderer = new THREE.WebGLRenderer({canvas});
  this.renderer.setClearColor(0x000000, 1);
  this.renderer.setSize(800, 800);

  this.scene = new THREE.Scene();

  this.camera = new THREE.PerspectiveCamera(45, 800 / 800, 1, 10000);
  this.camera.position.set(0, 0, 30);

  const light = new THREE.DirectionalLight(0xffffff);
  light.position.set(1, 1, 1);
  this.scene.add(light);
};

// mapつくるutil。たぶんここに書くべきではないが、大人には色々あるんだ。勘弁してくれ
Effect.prototype.generateMap = function(src) {
  return new THREE.TextureLoader().load(src);
};

// 玉製造
Effect.prototype.generateCube = function() {
  this.cubeMap = this.generateMap('textures/magma.png');
  this.cubeMap.wrapS = this.cubeMap.wrapT = THREE.RepeatWrapping;
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(2, 20, 20),
    new THREE.MeshBasicMaterial({map: this.cubeMap})
  );
  this.scene.add(mesh);
};

// オーラ作る
Effect.prototype.generateAura = function() {
  this.auraMap = this.generateMap('textures/aura.png');
  this.auraMap.wrapS = this.auraMap.wrapT = THREE.RepeatWrapping;
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(2.05, 20, 20),
    new THREE.MeshBasicMaterial({
      map: this.auraMap,
      blending: THREE.AdditiveBlending,
      transparent: true
    })
  );
  this.scene.add(mesh);
}

// gloを作る
Effect.prototype.generateGlo = function() {
  const map = this.generateMap('textures/glo.png');
  const material = new THREE.SpriteMaterial({
    map: map,
    color: 0xffffff,
    blending: THREE.AdditiveBlending,
    transparent: true
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.multiplyScalar(10);
  this.scene.add(sprite);
};

// スパーーーーーーーーーーーック
Effect.prototype.generateSpark = function() {
  const geometry = new THREE.PlaneGeometry(0.15, 2);

  const map = this.generateMap('textures/Burst01.png');
  map.wrapS = map.wrapT = THREE.RepeatWrapping;

  const material = new THREE.MeshBasicMaterial({
    map: map,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 0.5
  });

  this.sparkMesh = new THREE.Mesh(geometry, material);
  this.sparkMesh.position.y = Math.random() * 150;
  this.sparkMesh.rotation.y = Math.random() * 2;
  this.sparkMesh.sparkSpeed = Math.random() * 0.2 + 0.2;
  this.sparkMesh.update = function() {
    this.position.y -= this.sparkSpeed;
    this.material.opacity -= 0.5;
    if (this.position.y < 0) {
      this.position.y = 6;
      this.material.opacity = 0.5;
    }
  };
  this.scene.add(this.sparkMesh);

  return this.sparkMesh;
}

// イングロー
Effect.prototype.generateInGlow = function() {
  var geometry = new THREE.SphereGeometry(2.07, 20, 20);

  var material = new THREE.ShaderMaterial({
    uniforms: {
      glowColor: {type: 'c', value: new THREE.Color(0x96ecff)},
      viewVector: {type: 'v3', value: this.camera.position}
    },
    vertexShader  : `
      uniform vec3 viewVector;    // カメラ位置
      varying float opacity;      // 透明度
      void main() {
        // 頂点法線ベクトル x
        vec3 nNomal = normalize(normal);
        vec3 nViewVec = normalize(viewVector);
        // 透明度
        opacity = dot(nNomal, nViewVec);
        // 反転
        opacity = 1.0 - opacity;
        // お決まり
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
        uniform vec3 glowColor;
        varying float opacity;
        void main()
        {
          gl_FragColor = vec4(glowColor, opacity);
        }
      `,
    side: THREE.FrontSide,
    blending: THREE.AdditiveBlending,
    transparent: true
  });

  var mesh = new THREE.Mesh(geometry, material);
  this.scene.add(mesh);
}

var Flare = function() {
  this.speed = Math.random() * 0.05 + 0,01;
  this.topRadius = 6;
  this.bottomRadius = 2;
  this.diameter = this.topRadius - this.bottomRadius;
  this.offset = new THREE.Vector2();
  this.randomRatio = Math.random() + 1;

  this.geometry = new THREE.CylinderGeometry(this.topRadius, this.bottomRadius, 0, 30, 3, true);
  var loader = new THREE.TextureLoader();
  this.map = loader.load('textures/aura.png');
  this.map.wrapS = this.map.wrapT = THREE.RepeatWrapping;
  this.map.repeat.set(10, 10);

  this.material = this.createMaterial();

  this.mesh = new THREE.Mesh(this.geometry, this.material);
}

Flare.prototype.createMaterial = function() {
  let material = new THREE.ShaderMaterial({
    uniforms      : {
      map        : {
        type : 't',
        value: this.map
      },
      offset     : {
        type : 'v2',
        value: this.offset
      },
      opacity    : {
        type : 'f',
        value: 0.15
      },
      innerRadius: {
        type : 'f',
        value: this.bottomRadius
      },
      diameter   : {
        type : 'f',
        value: this.diameter
      }
    },
    vertexShader  : `
      varying vec2 vUv;       // フラグメントシェーダーに渡すUV座標
      varying float radius;   // フラグメントシェーダーに渡す半径
      uniform vec2 offset;    // カラーマップのズレ位置
      void main()
      {
        // 本来の一からuvをずらす
        vUv = uv + offset;
        // 中心から頂点座標までの距離
        radius = length(position);
        // 3次元上頂点座標を画面上の二次元座標に変換(お決まり)
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D map;      // テクスチャ
      uniform float opacity;      // 透明度
      uniform float diameter;     // ドーナツの太さ
      uniform float innerRadius;  // 内円の半径
      varying vec2 vUv;           // UV座標
      varying float radius;       // 中心ドットまでの距離
      const float PI = 3.1415926; // 円周率
      void main() {
        // UVの位置からテクスチャの色を取得
        vec4 tColor = texture2D(map, vUv);
        // 描画位置がドーナツの幅の何割の位置になるか
        float ratio = (radius - innerRadius) / diameter;
        float opacity = opacity * sin(PI * ratio);
        // ベースカラー
        vec4 baseColor = (tColor + vec4(0.0, 0.0, 0.3, 1.0));
        // 透明度を反映させる
        gl_FragColor = baseColor * vec4(1.0, 1.0, 1.0, opacity);
      }
    `,
    side          : THREE.DoubleSide,
    blending      : THREE.AdditiveBlending,
    depthTest     : false,
    transparent   : true
  });
  return material;
}

Flare.prototype.update = function() {
  this.offset.x += 0.004 * this.randomRatio;
  this.offset.y -= 0.015 * this.randomRatio;
}

window.onload = function() {

  var effect = new Effect();
  effect.init();
  effect.generateCube();
  effect.generateAura();
  effect.generateGlo();
  effect.generateInGlow();

  // スパーク作る
  const sparkList = [];
  const sparkNum = 50;
  const perAngle = 360 / sparkNum;
  for (let i=0; i<sparkNum; i++) {
    let rad = perAngle * i * Math.PI / 180;
    let spark = effect.generateSpark();
    spark.rotation.x = 360 * Math.sin(rad);
    spark.rotation.z = rad;
    sparkList.push(spark);
  }

  // フレア作る
  const flareList = [];
  const flareNum = 10;
  const perAngleFlare = 360 / flareNum;
  for (let i=0; i<flareNum; i++) {
    let rad = perAngleFlare * i * Math.PI / 180;
    let flare = new Flare();
    flare.mesh.rotation.x = rad;
    flare.mesh.rotation.y = rad;
    flare.mesh.rotation.z = rad / 2;
    effect.scene.add(flare.mesh);
    flareList.push(flare);
  }

  // れんだー
  const tick = () => {
    requestAnimationFrame(tick);
    // cubeを動かす
    effect.cubeMap.offset.x += 0.005;
    effect.cubeMap.offset.y += 0.005;
    // auraもうごかしちゃう
    effect.auraMap.offset.x -= 0.005;
    effect.auraMap.offset.y -= 0.005;
    // スパーク
    sparkList.forEach(s => s.update());

    flareList.forEach(s => s.update());

    effect.renderer.render(effect.scene, effect.camera);
  };

  tick();
};