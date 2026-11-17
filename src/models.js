import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const mat = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });

export const materials = {
  orange: mat(0xe7762a),
  skin: mat(0xe9b99e),
  hair: mat(0x74809e),
  temple: mat(0xc0c8d7),
  vest: mat(0x24749f, { flatShading: true }),
  shirt: mat(0xdfe6f1),
  black: mat(0x171925),
  white: mat(0xeaeada),
  tire: mat(0x1b1b24),
};

const trim = mat(0x303345);
const upholstery = mat(0x424758, { flatShading: true });
const brow = mat(0x50546a);
const crease = new THREE.MeshBasicMaterial({ color: 0xc38f7d });
const mouth = mat(0x612d31);
const seatBelt = mat(0x4d4d5c);
const glass = mat(0x45516e, { side: THREE.DoubleSide });
const redLens = mat(0xa22635);
const amberLens = mat(0xe7a85a);
const plate = mat(0xdabc5f);
const rim = mat(0xadb1ba);

export function box(parent, w, h, d, material, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

export function ellipsoid(parent, x, y, z, sx, sy, sz, material, detail = 12) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, detail, 10), material);
  mesh.position.set(x, y, z);
  mesh.scale.set(sx, sy, sz);
  parent.add(mesh);
  return mesh;
}

function quad(parent, vertices, material) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices.flat(), 3));
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  parent.add(mesh);
  return mesh;
}

function line(parent, points, radius, material) {
  const path = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)));
  parent.add(new THREE.Mesh(new THREE.TubeGeometry(path, 8, radius, 5), material));
}

// The head, hands and torso use the same coordinates in the cabin, mirror and crash shot.
export function makeGrandpa(startled = false) {
  const driver = new THREE.Group();
  ellipsoid(driver, 0, -.52, -.015, .295, .31, .155, materials.vest);
  ellipsoid(driver, 0, -.225, .01, .091, .135, .088, materials.skin);
  for (const side of [-1, 1]) {
    ellipsoid(driver, side * .24, -.43, .035, .105, .18, .105, materials.shirt);
    line(driver, [[side * .25, -.43, .07], [side * .34, -.59, .25], [side * .39, -.55, .46]], .075, materials.shirt);
    const hand = ellipsoid(driver, side * .39, -.55, .49, .081, .069, .067, materials.skin);
    hand.rotation.z = side * .42;
    const collar = box(driver, .1, .12, .023, materials.shirt, side * .047, -.325, .143);
    collar.rotation.z = side * .53;
  }
  const belt = box(driver, .085, .55, .025, seatBelt, .005, -.52, .149);
  belt.rotation.z = -.55;

  const face = ellipsoid(driver, 0, .126, .018, .23, .352, .198, materials.skin, 20);
  const positions = face.geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i);
    if (y < 0) positions.setX(i, positions.getX(i) * (1 + .33 * y));
  }
  face.geometry.computeVertexNormals();

  ellipsoid(driver, 0, .098, -.093, .219, .263, .146, materials.hair, 16);
  for (const side of [-1, 1]) {
    const hair = ellipsoid(driver, side * .188, .155, -.007, .062, .219, .121, materials.hair);
    hair.rotation.z = side * .17;
    ellipsoid(driver, side * .23, .022, .052, .049, .077, .054, materials.skin);
    for (let tuft = 0; tuft < 3; tuft++) {
      const y = .129 + tuft * .027;
      line(driver, [[side * .203, y, .104], [side * .218, y + .012, .098], [side * .231, y, .079]], .009, materials.temple);
    }
    const eyeY = .117;
    if (startled) ellipsoid(driver, side * .093, eyeY, .198, .043, .047, .019, materials.white);
    ellipsoid(driver, side * .093, eyeY - .006, .216, .018, .022, .006, materials.black);
    line(driver, [[side * .066, eyeY + .016, .212], [side * .093, eyeY + .022, .218], [side * .123, eyeY + .012, .203]], .008, materials.black);
    const browY = startled ? .217 : .177;
    line(driver, [[side * .059, browY, .207], [side * .095, browY + .011, .202], [side * .133, browY - .007, .183]], .017, brow);
    line(driver, [[side * .053, -.027, .199], [side * .082, -.068, .189], [side * .097, -.123, .157]], .006, crease);
  }
  for (const y of [.279, .309]) {
    const z = y > .30 ? .174 : .188;
    line(driver, [[-.105, y, z - .015], [0, y + .007, z + .013], [.105, y, z - .015]], .006, crease);
  }
  const nose = ellipsoid(driver, 0, .025, .204, .041, .079, .059, materials.skin);
  nose.rotation.x = -.24;
  if (startled) {
    const openMouth = ellipsoid(driver, 0, -.119, .155, .061, .077, .019, mouth);
    openMouth.rotation.x = -.48;
    ellipsoid(driver, 0, -.079, .176, .035, .013, .004, materials.white);
  } else {
    line(driver, [[-.047, -.104, .165], [0, -.093, .181], [.047, -.104, .165]], .008, mouth);
  }
  return driver;
}

function carShell(parent, levels, material) {
  const vertices = levels.flatMap(([y, width, rear, front, corner]) => [
    [-width + corner, y, rear], [-width, y, rear + corner],
    [-width, y, front - corner], [-width + corner, y, front],
    [width - corner, y, front], [width, y, front - corner],
    [width, y, rear + corner], [width - corner, y, rear],
  ]);
  const indices = [];
  for (let level = 0; level < levels.length - 1; level++) {
    for (let i = 0; i < 8; i++) {
      const a = level * 8 + i;
      const b = level * 8 + (i + 1) % 8;
      indices.push(a, b, a + 8, b, b + 8, a + 8);
    }
  }
  const top = vertices.length - 8;
  for (let i = 1; i < 7; i++) indices.push(top, top + i, top + i + 1);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices.flat(), 3));
  geometry.setIndex(indices);
  const surface = geometry.toNonIndexed();
  surface.computeVertexNormals();
  geometry.dispose();
  parent.add(new THREE.Mesh(surface, material));
}

export function makeCar(hatchback = false) {
  const car = new THREE.Group();
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(1, 24), new THREE.MeshBasicMaterial({
    color: 0x141824, transparent: true, opacity: .31, depthWrite: false,
  }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(.91, 1.87, 1);
  shadow.position.y = .028;
  car.add(shadow);
  const paint = hatchback ? materials.orange : mat(0x79444d);
  const roofRear = hatchback ? -1.23 : -.87;
  const sillRear = hatchback ? -1.56 : -1.29;
  const roofHeight = hatchback ? 1.87 : 1.57;
  const beltHeight = hatchback ? 1.17 : 1.02;
  carShell(car, [
    [.25, .72, -1.66, 1.72, .19],
    [.44, .86, -1.83, 1.86, .16],
    [.86, .86, -1.82, 1.84, .15],
    [beltHeight, .81, -1.67, 1.49, .18],
  ], paint);
  carShell(car, [
    [beltHeight - .02, .79, sillRear, 1.05, .12],
    [roofHeight, .70, roofRear, .46, .11],
    [roofHeight + .045, .62, roofRear + .09, .36, .1],
  ], paint);

  const windowLow = beltHeight + .05;
  const windowHigh = roofHeight - .055;
  quad(car, [[-.66, windowLow, 1.005], [.66, windowLow, 1.005], [.60, windowHigh, .525], [-.60, windowHigh, .525]], glass);
  quad(car, [[.66, windowLow, sillRear + .016], [-.66, windowLow, sillRear + .016], [-.60, windowHigh, roofRear - .033], [.60, windowHigh, roofRear - .033]], glass);
  for (const side of [-1, 1]) {
    for (const [rearLow, frontLow, rearHigh, frontHigh] of [
      [sillRear + .15, -.39, roofRear + .15, -.39],
      [-.31, .88, -.31, .34],
    ]) {
      quad(car, [[side * .79, windowLow, rearLow], [side * .79, windowLow, frontLow], [side * .714, windowHigh, frontHigh], [side * .714, windowHigh, rearHigh]], glass);
    }
    box(car, .035, .035, .16, trim, side * .855, beltHeight - .12, -.34);
    box(car, .15, .07, .09, trim, side * .84, beltHeight + .015, .71);
    ellipsoid(car, side * .96, beltHeight + .035, .70, .115, .055, .075, paint);
    for (const z of [-1.14, 1.15]) {
      for (const [radius, depth, material, offset] of [[.335, .22, materials.tire, .76], [.195, .03, rim, .88], [.075, .035, trim, .90]]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, 16), material);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(side * offset, .338, z);
        car.add(wheel);
      }
    }
    ellipsoid(car, side * .60, .74, 1.818, .207, .092, .041, materials.white);
    box(car, .145, hatchback ? .30 : .13, .045, redLens, side * .69, .79, -1.77).rotation.x = .22;
    box(car, .145, .061, .048, amberLens, side * .69, .667, -1.79);
  }
  box(car, 1.48, .12, .11, trim, 0, .38, 1.80);
  box(car, 1.48, .10, .11, trim, 0, .38, -1.765);
  box(car, .51, .11, .025, materials.black, 0, .70, 1.815);
  box(car, .32, .125, .032, materials.white, 0, .49, 1.86);
  box(car, .32, .125, .036, hatchback ? plate : materials.white, 0, .562, -1.827);
  if (hatchback) box(car, .115, .025, .035, rim, 0, .889, -1.802);
  return car;
}

const treeMaterial = mat(0xffffff, { vertexColors: true, flatShading: true });

function paintGeometry(geometry, hex) {
  const color = new THREE.Color(hex);
  const colors = new Float32Array(geometry.attributes.position.count * 3);
  for (let i = 0; i < colors.length; i += 3) color.toArray(colors, i);
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geometry;
}

const treeGeometries = [0x366440, 0x46754a, 0x567e48].map((leafColor, variant) => {
  const trunk = new THREE.BoxGeometry(.33, 2.4, .33);
  const parts = [paintGeometry(trunk.toNonIndexed().translate(0, 1.2, 0), 0x6b5841)];
  trunk.dispose();
  for (const [x, y, z, width, height] of [
    [0, 3.3 + variant * .19, 0, 1.8, 2.35],
    [-1.05, 2.65, .13, 1.35, 1.65],
    [.96, 2.8, -.27, 1.42, 1.78],
  ]) {
    const crown = new THREE.IcosahedronGeometry(1, 0);
    crown.scale(width, height, width).rotateY(x + variant).translate(x, y, z);
    parts.push(paintGeometry(crown, leafColor));
  }
  const geometry = mergeGeometries(parts);
  parts.forEach(part => part.dispose());
  return geometry;
});

export function makeTree(variant = 0) {
  return new THREE.Mesh(treeGeometries[variant], treeMaterial);
}

function steeringWheel(x, y, z) {
  const wheel = new THREE.Group();
  wheel.position.set(x, y, z);
  wheel.add(new THREE.Mesh(new THREE.TorusGeometry(.39, .048, 8, 32), materials.black));
  box(wheel, .64, .067, .046, trim);
  box(wheel, .087, .31, .046, trim, 0, -.155);
  ellipsoid(wheel, 0, 0, .02, .143, .106, .054, materials.black);
  return wheel;
}

function roundedPanel(parent, w, h, radius, material, z) {
  const shape = new THREE.Shape();
  const x = w / 2;
  const y = h / 2;
  shape.moveTo(-x + radius, -y);
  shape.lineTo(x - radius, -y);
  shape.quadraticCurveTo(x, -y, x, -y + radius);
  shape.lineTo(x, y - radius);
  shape.quadraticCurveTo(x, y, x - radius, y);
  shape.lineTo(-x + radius, y);
  shape.quadraticCurveTo(-x, y, -x, y - radius);
  shape.lineTo(-x, -y + radius);
  shape.quadraticCurveTo(-x, -y, -x + radius, -y);
  const geometry = new THREE.ShapeGeometry(shape, 5);
  const uv = geometry.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / w + .5, uv.getY(i) / h + .5);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.z = z;
  parent.add(mesh);
}

export function makeCockpit(reflection) {
  const group = new THREE.Group();
  box(group, 12, .61, .45, upholstery, 0, -.955);
  ellipsoid(group, 0, -.66, .09, 5, .063, .29, materials.black);
  box(group, 12, .29, .23, trim, 0, 1.012, -.12);
  const pillars = [-1, 1].map(side => {
    const pillar = box(group, .095, 1.96, .15, materials.black, 0, .15, -.02);
    pillar.rotation.z = side * .18;
    return pillar;
  });

  const mirror = new THREE.Group();
  mirror.position.set(.01, .70, .045);
  const mirrorStem = box(mirror, .062, 1, .07, trim, 0, .21, -.02);
  roundedPanel(mirror, .75, .238, .064, new THREE.MeshBasicMaterial({ color: 0x212333 }), .025);
  roundedPanel(mirror, .716, .205, .049, new THREE.MeshBasicMaterial({ map: reflection }), .027);
  group.add(mirror);

  const driverSide = new THREE.Group();
  const wheel = steeringWheel(-.23, -.875, .31);
  wheel.rotation.x = -.18;
  driverSide.add(wheel);
  const driver = makeGrandpa();
  driver.position.set(.11, -.14, .78);
  driver.rotation.y = Math.PI - .26;
  driver.scale.setScalar(1.48);
  driverSide.add(driver);
  const headrest = ellipsoid(driverSide, .31, -.59, 1.09, .24, .33, .13, upholstery);
  headrest.rotation.z = -.09;
  group.add(driverSide);
  return { group, driverSide, mirror, mirrorStem, pillars, wheel };
}

export function makeCrashCockpit() {
  const group = new THREE.Group();
  box(group, 5, .49, .18, trim, 0, .925, -.32);
  box(group, 5, .77, .18, upholstery, 0, -.66, -.32);
  const frame = box(group, .135, 2.15, .19, materials.black, -.76, .01, -.14);
  frame.rotation.z = -.49;
  const passengerSeat = ellipsoid(group, .95, -.51, -.20, .33, .49, .16, upholstery);
  passengerSeat.rotation.z = -.12;
  ellipsoid(group, .93, -.14, -.15, .22, .19, .13, upholstery);
  ellipsoid(group, .015, -.13, -.21, .24, .36, .105, materials.black);

  const driver = makeGrandpa(true);
  driver.scale.setScalar(1.77);
  driver.position.y = -.075;
  group.add(driver);
  const wheel = steeringWheel(0, -1.05, .79);
  wheel.scale.setScalar(1.69);
  wheel.rotation.x = .21;
  group.add(wheel);
  return group;
}
