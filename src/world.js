import * as THREE from 'three';
import { CONFIG } from './config.js';
import { box, makeCar, makeTree, makeCockpit, makeCrashCockpit, makeGrandpa, materials } from './models.js';

function addCabinLights(scene) {
  scene.add(new THREE.HemisphereLight(0xfff4ec, 0x666e91, 2));
  const key = new THREE.DirectionalLight(0xffefdd, 1.65);
  key.position.set(-3, 5, 4);
  scene.add(key);
}

function makeMirrorReflection(renderer) {
  const target = new THREE.WebGLRenderTarget(352, 100);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x3e4259);
  addCabinLights(scene);
  const face = makeGrandpa();
  face.rotation.y = -.22;
  scene.add(face);
  const camera = new THREE.OrthographicCamera(-.41, .41, .117, -.117, .1, 5);
  camera.position.set(-.12, .136, 2);
  function drawReflection() {
    renderer.setRenderTarget(target);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
  }
  drawReflection();
  renderer.domElement.addEventListener('webglcontextrestored', drawReflection);
  return target;
}

export class World {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); this.renderer.autoClear = false;
    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color(0x90b6ed); this.scene.fog = new THREE.Fog(0x90b6ed, 90, 230);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x75826a, 2.5));
    const sun = new THREE.DirectionalLight(0xfff4d1, 2.6); sun.position.set(-30, 60, 15); this.scene.add(sun);
    this.camera = new THREE.PerspectiveCamera(65, 1, .1, 400);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x64864d });
    box(this.scene, 700, .1, 700, groundMat, 0, -.16, -100);
    box(this.scene, 13, .1, 600, new THREE.MeshLambertMaterial({ color: 0x4e5d85 }), 0, -.04, -120);
    for (const x of [-5.65, 5.65]) box(this.scene,.13,.012,600,materials.white,x,.02,-120);
    this.segments = [];
    for (let i=0;i<32;i++) {
      const s = new THREE.Group(); s.position.z = -i*10;
      for (const x of [-1.9, 1.9]) box(s,.12,.015,4.5,materials.white,x,.025,0);
      for (const side of [-1,1]) {
        box(s,.16,.16,10,materials.white,side*6.4,.83);
        box(s,.14,.15,10,materials.white,side*6.4,.56);
        box(s,.14,.85,.14,materials.white,side*6.4,.40);
        const tree = makeTree((i + (side === 1 ? 1 : 0)) % 3);
        tree.position.set(side * (9.5 + i % 3), 0, side * (i % 4));
        s.add(tree);
      }
      this.scene.add(s);this.segments.push(s);
    }
    // Low-poly hills and old highway signage.
    for(let i=0;i<16;i++) { const hill=new THREE.Mesh(new THREE.ConeGeometry(30+i%3*12,28,5),new THREE.MeshLambertMaterial({color:i%2?0x739a86:0x749b91}));hill.position.set((i%2?1:-1)*(65+i%4*12),0,-90-i*22);this.scene.add(hill); }
    const sign = new THREE.Group(); const green = new THREE.MeshLambertMaterial({color:0x286b56});
    box(sign,.18,8,.18,materials.white,-6.5,4);box(sign,12.8,.18,.18,materials.white,0,7.8);
    box(sign,4,1.75,.15,green,0,7.1);
    const c=document.createElement('canvas');c.width=512;c.height=224;const ctx=c.getContext('2d');ctx.fillStyle='#246952';ctx.fillRect(0,0,512,224);ctx.strokeStyle='#e8efdf';ctx.lineWidth=4;ctx.strokeRect(9,9,494,206);ctx.fillStyle='#fff9e4';ctx.textAlign='center';ctx.font='bold 58px sans-serif';ctx.fillText('東 京',256,83);ctx.font='25px sans-serif';ctx.fillText('TOKYO',256,126);ctx.font='bold 45px sans-serif';ctx.fillText('↓        ↓',256,187);
    const signFace = new THREE.Mesh(new THREE.PlaneGeometry(3.9,1.65),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c)}));signFace.position.set(0,7.1,.09);sign.add(signFace);sign.position.z=-90;this.scene.add(sign);
    this.opponent = makeCar();this.scene.add(this.opponent);
    this.player = makeCar(true);this.scene.add(this.player);this.player.visible=false;
    this.cockpitScene = new THREE.Scene();
    addCabinLights(this.cockpitScene);
    this.mirrorReflection = makeMirrorReflection(this.renderer);
    this.cabin = makeCockpit(this.mirrorReflection.texture);
    this.cockpitScene.add(this.cabin.group);
    this.crashCabin = makeCrashCockpit();
    this.cockpitScene.add(this.crashCabin);
    this.cabinCamera = new THREE.OrthographicCamera(-1,1,1,-1,.1,20);this.cabinCamera.position.set(0,0,5);
    this.resize();window.addEventListener('resize',()=>this.resize());
  }
  resize() {
    this.w=innerWidth;this.h=innerHeight;this.aspect=this.w/this.h;
    this.renderer.setSize(this.w,this.h,false);this.camera.aspect=this.aspect;this.camera.fov=this.aspect<1?78:62;this.camera.updateProjectionMatrix();
    const height = Math.max(1, .67 / this.aspect);
    const edge = height * this.aspect;
    this.cabinCamera.left = -edge;
    this.cabinCamera.right = edge;
    this.cabinCamera.top = height;
    this.cabinCamera.bottom = -height;
    this.cabinCamera.updateProjectionMatrix();
    this.cabin.group.scale.y = height;
    this.cabin.driverSide.position.x = edge - .09;
    // Keep the reflection below the distance display on short screens.
    const mirrorY = Math.min(.70, .88 - 272 / this.h);
    this.cabin.mirror.position.y = mirrorY;
    this.cabin.mirrorStem.scale.y = .88 - mirrorY - .102;
    this.cabin.mirrorStem.position.y = .102 + this.cabin.mirrorStem.scale.y / 2;
    this.cabin.pillars.forEach((pillar, index) => {
      pillar.position.x = (index === 0 ? -1 : 1) * (edge + .05);
    });
  }
  render(game, now, intro = false) {
    const crashed=game.mode==='crashed'||game.mode==='result';
    const elapsed=crashed?now-game.crashAt:0;
    const x=intro?0:game.offset(now);
    const roadTravel=intro?now*.010:game.distance||0;
    for(let i=0;i<this.segments.length;i++) this.segments[i].position.z=12-((i*10+320-roadTravel%320)%320);
    this.opponent.visible=!!game.car;
    if(game.car) this.opponent.position.set(0,0,3-(game.car.deadline-now)*game.car.speed/1000);
    const near=game.car&&!game.car.evaded?Math.max(0,1-(game.car.deadline-now)/1000):0;
    this.scene.background.set(0x90b6ed).lerp(new THREE.Color(0xf17d9d),near*.40);
    this.scene.fog.color.copy(this.scene.background);
    this.player.visible=crashed&&elapsed>=CONFIG.crashCloseupMs;
    const zoom = this.player.visible && this.aspect >= 1 ? 1.33 : 1;
    if (this.camera.zoom !== zoom) {
      this.camera.zoom = zoom;
      this.camera.updateProjectionMatrix();
    }
    let cabin=true;
    if(crashed&&elapsed>=CONFIG.crashCloseupMs) {
      cabin=false;this.player.position.set(-.69,.018,1.78);this.player.rotation.set(.012,Math.PI-.31,-.055);
      this.opponent.visible=true;this.opponent.position.set(.53,.015,-1.62);this.opponent.rotation.y=-.15;
      this.camera.position.set(5.9,6.4,9);this.camera.lookAt(0,.65,0);this.camera.rotation.z=-.12;
    } else {
      this.opponent.rotation.y=0;
      this.camera.position.set(x,1.95,3.15);this.camera.lookAt(x*.7,1.55,-60);
      this.camera.rotation.z=-x*.016;
      this.cabin.group.rotation.z=-x*.022;
      this.cabin.wheel.rotation.z=-x*.12;
      if (crashed) {
        const impact = Math.min(1, elapsed / CONFIG.crashCloseupMs);
        this.camera.position.y = 1.7;
        this.camera.lookAt(-42, 1.55, -42);
        this.camera.rotation.z = -.24 * impact;
        const scale = Math.max(1, this.cabinCamera.top * .88) * (1 + .20 * impact);
        this.crashCabin.scale.setScalar(scale);
        this.crashCabin.rotation.z = -.34 * impact;
      }
    }
    this.renderer.clear();this.renderer.render(this.scene,this.camera);
    if (cabin) {
      this.cabin.group.visible = !crashed;
      this.crashCabin.visible = crashed;
      this.renderer.clearDepth();
      this.renderer.render(this.cockpitScene, this.cabinCamera);
    }
  }
}
