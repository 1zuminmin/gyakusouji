import * as THREE from 'three';
import { CONFIG } from './config.js';
import { box, makeCar, makeTree, makeCockpit, materials } from './models.js';
export class World {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); this.renderer.autoClear = false;
    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color(0x8dbed1); this.scene.fog = new THREE.Fog(0xaecbd2, 90, 230);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x75826a, 2.5));
    const sun = new THREE.DirectionalLight(0xfff4d1, 2.6); sun.position.set(-30, 60, 15); this.scene.add(sun);
    this.camera = new THREE.PerspectiveCamera(65, 1, .1, 400);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x87a875 });
    box(this.scene, 700, .1, 700, groundMat, 0, -.16, -100);
    box(this.scene, 13, .1, 600, new THREE.MeshLambertMaterial({ color: 0x657376 }), 0, -.04, -120);
    for (const x of [-5.65, 5.65]) box(this.scene,.13,.012,600,materials.white,x,.02,-120);
    this.segments = [];
    for (let i=0;i<32;i++) {
      const s = new THREE.Group(); s.position.z = -i*10;
      for (const x of [-1.9, 1.9]) box(s,.12,.015,4.5,materials.white,x,.025,0);
      for (const side of [-1,1]) {
        box(s,.16,.16,10,materials.white,side*6.4,.83);
        box(s,.14,.15,10,materials.white,side*6.4,.56);
        box(s,.14,.85,.14,materials.white,side*6.4,.40);
        if (i%2===0) { const t=makeTree();t.position.set(side*(10+(i%3)),0,0);s.add(t); }
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
    this.player = makeCar(materials.orange,true);this.scene.add(this.player);this.player.visible=false;
    this.cockpitScene = new THREE.Scene();this.cockpitScene.add(new THREE.HemisphereLight(0xffffff,0x667075,2.5));const cabinSun=new THREE.DirectionalLight(0xffefd5,2);cabinSun.position.set(-3,5,4);this.cockpitScene.add(cabinSun);
    this.cabin = makeCockpit();this.cockpitScene.add(this.cabin.group);this.cabinCamera = new THREE.OrthographicCamera(-1,1,1,-1,.1,20);this.cabinCamera.position.set(0,0,5);
    this.resize();window.addEventListener('resize',()=>this.resize());
  }
  resize() {
    this.w=innerWidth;this.h=innerHeight;this.aspect=this.w/this.h;
    this.renderer.setSize(this.w,this.h,false);this.camera.aspect=this.aspect;this.camera.fov=this.aspect<1?78:62;this.camera.updateProjectionMatrix();
    // Vertical cabin framing is fixed; extra width reveals the passenger side on desktop.
    this.cabinCamera.left=-Math.max(1,this.aspect*1.03);this.cabinCamera.right=Math.max(1,this.aspect*1.03);this.cabinCamera.top=1;this.cabinCamera.bottom=-1;this.cabinCamera.updateProjectionMatrix();
    const edge=Math.max(1,this.aspect*1.03);this.cabin.driver.position.x=edge-.13;
    this.cabin.mirror.position.set(.10,.73,0);this.cabin.group.scale.x=1;
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
    this.scene.background.set(0x8dbed1).lerp(new THREE.Color(0xf17d9d),near*.40);
    this.scene.fog.color.copy(this.scene.background);
    this.player.visible=crashed&&elapsed>=CONFIG.crashCloseupMs;
    let cabin=true;
    if(crashed&&elapsed>=CONFIG.crashCloseupMs) {
      cabin=false;this.player.position.set(-.55,.05,2);this.player.rotation.set(.04,-.25,-.12);
      this.opponent.visible=true;this.opponent.position.set(.3,.04,-.8);this.opponent.rotation.y=.17;
      this.camera.position.set(7,7,10);this.camera.lookAt(0,.7,0);this.camera.rotation.z=.10;
    } else {
      this.opponent.rotation.y=0;
      this.camera.position.set(x,1.95,3.15);this.camera.lookAt(x*.7,1.55,-60);
      this.camera.rotation.z=-x*.016;
      this.cabin.group.rotation.z=-x*.022;
      this.cabin.wheel.rotation.z=-x*.12;
      if(crashed) {
        const k=Math.min(1,elapsed/320);this.cabin.group.scale.setScalar(1+k*1.5);this.cabin.group.position.set(-this.cabin.driver.position.x*k*2.4,.8*k,0);this.cabin.group.rotation.z=-.35*k;
      } else {this.cabin.group.scale.setScalar(1);this.cabin.group.position.set(0,0,0);}
    }
    this.renderer.clear();this.renderer.render(this.scene,this.camera);
    if(cabin){this.renderer.clearDepth();this.renderer.render(this.cockpitScene,this.cabinCamera);}
  }
}
