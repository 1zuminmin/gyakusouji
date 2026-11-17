import * as THREE from 'three';
const mat = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, flatShading: true, ...extra });
export const materials = { orange: mat(0xed762d), navy: mat(0x192e50), skin: mat(0xe7b692), hair: mat(0xd5d7d2), vest: mat(0x2b618f), shirt: mat(0xf4f0df), black: mat(0x19232a), glass: mat(0x8cbdc7), white: mat(0xeaeada), tire: mat(0x192124) };
export function box(parent, w, h, d, material, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material); mesh.position.set(x, y, z); parent.add(mesh); return mesh;
}
export function ellipsoid(parent, x, y, z, sx, sy, sz, material, detail = 10) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, detail, 8), material); m.position.set(x, y, z); m.scale.set(sx, sy, sz); parent.add(m); return m;
}
export function makeGrandpa() {
  const g = new THREE.Group();
  ellipsoid(g, 0, -.47, 0, .33, .4, .19, materials.vest);
  ellipsoid(g, -.23, -.42, .02, .13, .25, .15, materials.shirt);
  ellipsoid(g, .23, -.42, .02, .13, .25, .15, materials.shirt);
  box(g, .12, .16, .16, materials.skin, 0, -.15, 0);
  ellipsoid(g, 0, .06, 0, .225, .29, .22, materials.skin);
  ellipsoid(g, .025, .255, -.025, .215, .13, .20, materials.hair);
  ellipsoid(g, .2, .06, 0, .052, .09, .06, materials.skin);
  ellipsoid(g, -.18, .02, .025, .065, .09, .07, materials.skin);
  // Face points toward windshield (-z); left profile remains visible from behind.
  ellipsoid(g, -.055, .025, -.23, .063, .065, .08, materials.skin);
  box(g, .09, .025, .012, materials.hair, -.095, .14, -.195);
  box(g, .053, .018, .014, materials.black, -.095, .095, -.207);
  box(g, .10, .012, .018, materials.black, -.06, -.075, -.198);
  const arm = box(g, .10, .12, .43, materials.shirt, -.25, -.44, -.22); arm.rotation.x = -.2;
  ellipsoid(g, -.25, -.38, -.43, .07, .06, .08, materials.skin);
  return g;
}
export function makeCar(color = materials.navy, driver = false) {
  const g = new THREE.Group();
  box(g, 1.75, .65, 3.55, color, 0, .65);
  box(g, 1.57, .65, 1.85, color, 0, 1.27, .12);
  box(g, 1.38, .49, .025, materials.glass, 0, 1.30, 1.065);
  box(g, 1.38, .49, .025, materials.glass, 0, 1.30, -.825);
  for (const side of [-1, 1]) {
    box(g, .025, .46, 1.55, materials.glass, side * .8, 1.3, .12);
    for (const z of [-1.12, 1.12]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(.37, .37, .22, 10), materials.tire);
      wheel.rotation.z = Math.PI / 2; wheel.position.set(side * .88, .38, z); g.add(wheel);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(.19, .19, .23, 8), materials.white);
      hub.rotation.z = Math.PI / 2; hub.position.copy(wheel.position); g.add(hub);
    }
    box(g, .36, .19, .03, materials.white, side * .56, .74, 1.79);
    box(g, .27, .15, .03, mat(0xc82e29), side * .62, .73, -1.79);
  }
  box(g, 1.80, .12, .15, materials.white, 0, .40, 1.81);
  box(g, .40, .15, .04, materials.white, 0, .58, 1.80);
  box(g, .55, .15, .04, materials.black, 0, .83, 1.81);
  if (driver) { const d = makeGrandpa(); d.scale.setScalar(1.05); d.position.set(.43, 1.17, .15); g.add(d); }
  return g;
}
export function makeTree() {
  const g = new THREE.Group();
  box(g, .4, 3, .4, mat(0x75644c), 0, 1.5);
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(2.3, 0), mat(0x4f8856)); crown.position.y = 4; crown.scale.set(1, 1.35, 1); g.add(crown);
  return g;
}
export function makeCockpit() {
  const g = new THREE.Group();
  const dash = box(g, 2.7, .65, .50, materials.black, 0, -.78, 0); dash.rotation.x = .18;
  box(g, 2.5, .055, .58, materials.orange, 0, -.47, -.12);
  for (const x of [-.67, -.17, .36]) { box(g, .3, .07, .02, mat(0x080e12), x, -.65, .28); for (let j=0;j<4;j++) box(g, .24, .004, .025, mat(0x566066), x, -.68+j*.016, .3); }
  box(g, .37, .21, .04, mat(0x060e12), .47, -.67, .32);
  for (const x of [.38, .55]) { const dial = new THREE.Mesh(new THREE.CircleGeometry(.07, 20), mat(0x233e43)); dial.position.set(x, -.64, .35); g.add(dial); const needle = box(g,.006,.05,.01,materials.white,x,-.63,.36); needle.rotation.z=-.6; }
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(.225, .025, 7, 24), materials.black); wheel.position.set(.48, -.70, .52); wheel.rotation.x = -.20; g.add(wheel);
  box(g, .40, .035, .035, materials.black, .48, -.70, .53);
  box(g, .035, .22, .035, materials.black, .48, -.81, .53);
  // A-pillars and ceiling frame, with room for the road in the center.
  for (const side of [-1, 1]) { const pillar = box(g, .09, 1.65, .11, mat(0xb8b3a1), side * 1.04, .18, -.05); pillar.rotation.z = side * -.15; }
  box(g, 2.7, .15, .2, mat(0xb8b3a1), 0, 1.03, -.1);
  const mirror = new THREE.Group();
  box(mirror, .035, .20, .035, materials.black, 0, .11, 0);
  box(mirror, .47, .18, .055, materials.black, 0, 0, .01);
  box(mirror, .43, .14, .02, mat(0xb2c4bb), 0, 0, .045);
  box(mirror, .26, .08, .012, materials.skin, .04, -.005, .06);
  for (const x of [-.035, .10]) { box(mirror,.065,.015,.015,materials.hair,x,.025,.075); ellipsoid(mirror,x,-.002,.08,.027,.013,.01,materials.white); ellipsoid(mirror,x,-.002,.09,.009,.012,.006,materials.black); }
  g.add(mirror);
  const driver = makeGrandpa(); driver.position.set(.94, -.31, .7); driver.rotation.y = 1.8; driver.scale.setScalar(1.20); g.add(driver);
  return { group: g, driver, mirror, dash, wheel };
}
