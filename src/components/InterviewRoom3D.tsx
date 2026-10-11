import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export interface RoomProps {
  entered: boolean;
  motionPaused?: boolean;
  fallbackText?: string;
  speaker: 'interviewer' | 'buddy' | null;
  buddyOpen: boolean;
  recording: boolean;
  look: number;
  wordPulse: number;
}

// All room and character geometry is created locally: no asset downloads or services.
function buildRoom(scene: THREE.Scene) {
  const existingLights = new Set(scene.children);
  const materials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];
  const mat = (color: string, roughness = .8) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness });
    materials.push(m); return m;
  };
  const oak = mat('#b88a5b'), darkWood = mat('#5a4333'), wall = mat('#ddd8c9');
  const charcoal = mat('#263b3d'), metal = mat('#435459', .35), green = mat('#365b44');
  const cream = mat('#f2ecd9'), white = mat('#faf8ee'), glass = mat('#b3d2cd', .3);
  function mesh(parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number) {
    const result = new THREE.Mesh(geometry, material);
    result.position.set(x, y, z); result.castShadow = true; result.receiveShadow = true;
    parent.add(result); return result;
  }
  const box = (p: THREE.Object3D, m: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number) => mesh(p, new THREE.BoxGeometry(w, h, d), m, x, y, z);
  const ball = (p: THREE.Object3D, m: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number) => {
    const result = mesh(p, new THREE.SphereGeometry(1, 24, 18), m, x, y, z);
    result.scale.set(w, h, d); return result;
  };
  const rod = (p: THREE.Object3D, m: THREE.Material, a: number[], b: number[], radius: number) => {
    const start = new THREE.Vector3(...a as [number, number, number]);
    const end = new THREE.Vector3(...b as [number, number, number]);
    const delta = end.clone().sub(start);
    const result = mesh(p, new THREE.CylinderGeometry(radius, radius, delta.length(), 12), m, 0, 0, 0);
    result.position.copy(start.add(end).multiplyScalar(.5));
    result.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()); return result;
  };
  function sign(text: string, sub: string, x: number, y: number, z: number, width: number) {
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#203c3b'; ctx.fillRect(0, 0, 1024, 256);
    ctx.fillStyle = '#e6e8c9'; ctx.font = `500 ${text.length > 20 ? 44 : 60}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText(text, 512, 110);
    ctx.fillStyle = '#a9c3b7'; ctx.font = '25px sans-serif'; ctx.fillText(sub, 512, 173);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; textures.push(texture);
    const material = new THREE.MeshBasicMaterial({ map: texture }); materials.push(material);
    return mesh(scene, new THREE.PlaneGeometry(width, width / 4), material, x, y, z);
  }
  box(scene, mat('#a99b85'), 0, -.1, 0, 14, .2, 15);
  // Inlaid floor planks and a soft rug beneath the table.
  for (let x = -6; x <= 6; x += .65) box(scene, mat('#928570'), x, .006, 0, .012, .009, 13);
  box(scene, mat('#677b70'), 0, .016, .1, 6.1, .02, 5.1);
  box(scene, wall, -6, 2.4, 0, .2, 4.8, 13);
  box(scene, wall, 6, 2.4, 0, .2, 4.8, 13);
  box(scene, wall, 0, 4.7, 0, 12, .15, 13);
  box(scene, wall, 0, .48, -4.4, 12, .96, .15);
  box(scene, glass, 0, 2.65, -5.9, 12, 3.4, .08);
  for (let i = 0; i < 21; i++) {
    const h = .6 + ((i * 17) % 13) * .12;
    box(scene, mat(i % 2 ? '#8ba8aa' : '#78979d'), -5.8 + i * .57, .9 + h / 2, -5.65, .4, h, .28);
  }
  for (const x of [-5.6, -2.8, 0, 2.8, 5.6]) box(scene, charcoal, x, 2.6, -4.35, .07, 3.35, .09);
  box(scene, charcoal, 0, 1.05, -4.35, 12, .08, .1);
  box(scene, charcoal, 0, 4.2, -4.35, 12, .1, .1);
  box(scene, charcoal, 3.95, 2.55, -4.25, 2.3, 1.05, .08);
  sign('YOUR DREAM COMPANY', 'YOUR NEXT CHAPTER', 3.95, 2.58, -4.19, 2.05);
  // Warm wooden slats on the left and a low cabinet on the right.
  for (let i = 0; i < 12; i++) box(scene, oak, -5.1 + i * .14, 2.4, -4.15, .07, 3.35, .12);
  box(scene, darkWood, 4.1, .53, -3.55, 2.8, 1.05, .85);
  box(scene, oak, 4.1, 1.09, -3.55, 2.95, .09, .95);
  for (let i = 0; i < 5; i++) box(scene, i % 2 ? cream : green, 3.35 + i * .13, 1.32, -3.55, .09, .37 + i * .035, .25);
  function plant(x: number, z: number) {
    mesh(scene, new THREE.CylinderGeometry(.25, .19, .45, 24), cream, x, .25, z);
    rod(scene, darkWood, [x, .4, z], [x, 1.8, z], .028);
    for (let i = 0; i < 10; i++) {
      const angle = i * 2.4, y = .75 + i * .12;
      const leaf = ball(scene, green, x + Math.cos(angle) * .25, y, z + Math.sin(angle) * .25, .13, .36, .055);
      leaf.rotation.set(.5 * Math.sin(angle), angle, .55 * Math.cos(angle));
    }
  }
  plant(-4.35, -2.7); plant(5, -2.6);
  // Desk, stationery, laptop and water: small details establish a seated point of view.
  box(scene, oak, 0, 1.03, .15, 4.6, .16, 2.05);
  box(scene, darkWood, -1.8, .48, .15, .16, 1, 1.65);
  box(scene, darkWood, 1.8, .48, .15, .16, 1, 1.65);
  box(scene, charcoal, .87, 1.13, -.27, .9, .045, .65);
  const laptop = box(scene, metal, .87, 1.4, -.54, .9, .57, .035); laptop.rotation.x = -.18;
  ball(scene, cream, .87, 1.42, -.508, .05, .05, .01);
  box(scene, white, -.55, 1.13, -.2, .6, .025, .72);
  for (let i = 0; i < 5; i++) box(scene, mat('#c8c9ba'), -.55, 1.145, -.4 + i * .07, .4, .002, .008);
  rod(scene, charcoal, [-.15, 1.15, -.4], [-.15, 1.15, .03], .012);
  mesh(scene, new THREE.CylinderGeometry(.09, .08, .22, 24), cream, -1.4, 1.22, -.1);
  const handle = mesh(scene, new THREE.TorusGeometry(.075, .017, 8, 16), cream, -1.51, 1.23, -.1); handle.rotation.y = Math.PI / 2;
  box(scene, charcoal, .15, 1.14, .79, 1.1, .035, .26);
  const name = sign('ALEX MORGAN', 'TALENT & ENGINEERING', .15, 1.22, .94, .88); name.rotation.x = -.25;
  // Ceiling fixture.
  for (const x of [-2, 2]) {
    rod(scene, charcoal, [x, 4.6, -.1], [x, 3.6, -.1], .012);
    mesh(scene, new THREE.CylinderGeometry(.2, .42, .23, 24), charcoal, x, 3.5, -.1);
    const light = new THREE.PointLight('#ffe0a5', 7, 7, 2); light.position.set(x, 3.25, -.1); scene.add(light);
  }
  function character(x: number, z: number, isBuddy: boolean) {
    const root = new THREE.Group(); root.position.set(x, 0, z); scene.add(root);
    const skin = mat(isBuddy ? '#c48d65' : '#d8a47e');
    const hair = mat(isBuddy ? '#302720' : '#3b302b');
    const suit = mat(isBuddy ? '#799178' : '#304752');
    const trousers = mat('#283b40'), lips = mat('#704138');
    if (!isBuddy) {
      box(root, charcoal, 0, .76, -.12, .94, .14, .84);
      box(root, charcoal, 0, 1.3, -.43, .94, 1.15, .13);
    }
    for (const side of [-1, 1]) {
      if (!isBuddy) {
        rod(root, metal, [side * .35, .7, -.4], [side * .43, .05, -.43], .032);
        rod(root, metal, [side * .35, .7, .2], [side * .43, .05, .3], .032);
      }
      rod(root, trousers, [side * .2, .87, -.03], [side * .23, .77, .43], .13);
      rod(root, trousers, [side * .23, .77, .43], [side * .23, .17, .43], .1);
      ball(root, hair, side * .23, .12, .54, .13, .1, .24);
    }
    const torso = ball(root, suit, 0, 1.3, 0, .43, .53, .25);
    ball(root, cream, 0, isBuddy ? 1.59 : 1.48, .205, isBuddy ? .12 : .16, isBuddy ? .18 : .31, .045);
    if (!isBuddy) {
      box(root, mat('#b6875c'), 0, 1.43, .262, .065, .3, .022);
      for (const side of [-1, 1]) {
        const lapel = box(root, suit, side * .15, 1.51, .24, .16, .34, .025); lapel.rotation.z = side * -.28;
      }
    }
    mesh(root, new THREE.CylinderGeometry(.12, .14, .24, 16), skin, 0, 1.82, 0);
    const head = new THREE.Group(); head.position.set(0, 2.05, 0); root.add(head);
    ball(head, skin, 0, 0, 0, .3, .36, .27);
    for (const side of [-1, 1]) ball(head, skin, side * .3, -.015, 0, .065, .1, .065);
    if (isBuddy) {
      // Short sides and a swept quiff distinguish Sam from Alex's rounded fringe.
      ball(head, hair, 0, .22, -.09, .296, .145, .22);
      for (let i = 0; i < 3; i++) {
        const lock = ball(head, hair, -.12 + i * .095, .29 + i * .025, .055, .145, .085, .19);
        lock.rotation.z = -.35; lock.rotation.y = -.3;
      }
      for (const side of [-1, 1]) {
        ball(head, hair, side * .27, .12, -.035, .032, .115, .14);
        ball(head, mat('#db9e80'), side * .18, -.09, .21, .06, .028, .016);
      }
    } else {
      ball(head, hair, 0, .23, -.03, .305, .17, .26);
      for (let i = 0; i < 5; i++) ball(head, hair, -.23 + i * .105, .25 + Math.sin(i) * .025, .105, .095, .1, .13);
    }
    ball(head, skin, 0, -.01, .27, .065, .085, .075);
    const eyes: THREE.Mesh[] = [];
    for (const side of [-1, 1]) {
      eyes.push(ball(head, white, side * .115, .065, .236, .071, .043, .032));
      eyes.push(ball(head, hair, side * .112, .063, .264, .026, .028, .012));
      const brow = box(head, hair, side * .115, isBuddy ? .153 : .139, .246, .135, .026, .027); brow.rotation.z = side * (isBuddy ? .12 : -.1);
      if (!isBuddy) {
        const rim = mesh(head, new THREE.TorusGeometry(.081, .009, 8, 24), metal, side * .115, .062, .275); rim.scale.y = .75;
      }
    }
    if (!isBuddy) rod(head, metal, [-.035, .07, .278], [.035, .07, .278], .008);
    // A deformable mouth, teeth and lip line. Its opening follows speaking cadence.
    const mouth = ball(head, lips, 0, -.135, .245, .102, .012, .022);
    const teeth = ball(head, white, 0, -.123, .26, .075, .012, .008); teeth.visible = false;
    const smile = isBuddy ? mesh(head, new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-.103, -.115, .258), new THREE.Vector3(0, -.196, .276), new THREE.Vector3(.103, -.115, .258)
    ), 24, .011, 8, false), lips, 0, 0, 0) : null;
    if (isBuddy) mouth.visible = false;
    const hands: THREE.Group[] = [];
    for (const side of [-1, 1]) {
      const arm = new THREE.Group(); arm.position.set(side * .38, 1.57, 0); root.add(arm);
      rod(arm, suit, [0, 0, 0], [side * .09, -.36, .12], .115);
      rod(arm, suit, [side * .09, -.36, .12], [side * .02, -.4, .47], .092);
      ball(arm, skin, side * .02, -.4, .54, .09, .063, .13);
      hands.push(arm);
    }
    return { root, head, mouth, teeth, smile, eyes, hands, torso, isBuddy };
  }
  const interviewer = character(0, -1.45, false);
  const office = new THREE.Group();
  scene.children.filter(child => !existingLights.has(child)).forEach(child => office.add(child));
  scene.add(office);

  // Sam lives in a separate home set. Switching groups prevents the office from
  // appearing behind him or during the camera move back to the interview.
  const home = new THREE.Group(); scene.add(home); home.visible = false;
  const peach = mat('#e4c7ae'), upholstery = mat('#b97850'), cushion = mat('#ead9b6');
  box(home, mat('#b68f70'), 0, -.08, 0, 12, .16, 12);
  box(home, peach, 0, 2.5, -2.4, 12, 5, .2);
  box(home, mat('#cab8a3'), -5, 2.5, 0, .18, 5, 8);
  box(home, cream, 0, .12, -2.25, 12, .18, .08);
  box(home, mat('#d0b698'), -1, .02, 1, 4.5, .03, 3);
  for (let i = 0; i < 9; i++) box(home, cushion, -3 + i * .5, .04, 1, .035, .007, 3);
  // A roomy fabric sofa with contrasting cushions and wooden feet.
  box(home, upholstery, -1.1, .59, -.7, 2.85, .42, 1.18);
  box(home, upholstery, -1.1, 1.11, -1.13, 2.85, .95, .28);
  for (const x of [-2.52, .32]) {
    box(home, upholstery, x, .94, -.7, .22, .66, 1.24);
    box(home, darkWood, x, .2, -.7, .13, .4, .85);
  }
  for (const x of [-1.8, -.4]) box(home, mat('#ca8d66'), x, .82, -.61, 1.3, .15, .98);
  const pillow = box(home, cushion, -2.04, 1.11, -.89, .45, .43, .15); pillow.rotation.z = -.16;
  const pillow2 = box(home, mat('#738773'), -.18, 1.11, -.89, .44, .43, .15); pillow2.rotation.z = .2;
  const buddy = character(-1.1, -.54, true); home.add(buddy.root);
  // A framed affirmation, positioned above Sam rather than behind the help panel.
  box(home, darkWood, -1.1, 3.12, -2.22, 2.45, 1.16, .13);
  const quoteCanvas = document.createElement('canvas'); quoteCanvas.width = 1024; quoteCanvas.height = 480;
  const quote = quoteCanvas.getContext('2d')!;
  quote.fillStyle = '#fbefd9'; quote.fillRect(0, 0, 1024, 480);
  quote.strokeStyle = '#c09b68'; quote.lineWidth = 3; quote.strokeRect(28, 28, 968, 424);
  quote.textAlign = 'center'; quote.fillStyle = '#365345'; quote.font = '26px sans-serif'; quote.fillText('ONE STEP AT A TIME', 512, 128);
  quote.font = 'bold 88px Georgia'; quote.fillText('You can do it.', 512, 260);
  quote.font = '25px sans-serif'; quote.fillStyle = '#9b774f'; quote.fillText('Believe in the work you are doing.', 512, 355);
  const quoteTexture = new THREE.CanvasTexture(quoteCanvas); quoteTexture.colorSpace = THREE.SRGBColorSpace; textures.push(quoteTexture);
  const quoteMaterial = new THREE.MeshBasicMaterial({ map: quoteTexture }); materials.push(quoteMaterial);
  mesh(home, new THREE.PlaneGeometry(2.29, 1.03), quoteMaterial, -1.1, 3.12, -2.14);
  // Window, linen curtains, a reading lamp and a shelf make this a home, not an office.
  box(home, darkWood, -3.62, 2.54, -2.2, 1.62, 2.2, .12);
  box(home, mat('#b8d6d2'), -3.62, 2.54, -2.12, 1.45, 2.03, .035);
  box(home, cream, -3.62, 2.54, -2.08, .055, 2.03, .035);
  box(home, cream, -3.62, 2.54, -2.08, 1.45, .055, .035);
  for (const x of [-4.43, -2.83]) {
    rod(home, oak, [x, 3.78, -2], [x + .3, 3.78, -2], .025);
    for (let i = 0; i < 4; i++) mesh(home, new THREE.CylinderGeometry(.067, .085, 2.45, 12), cushion, x + i * .075, 2.5, -1.99);
  }
  rod(home, darkWood, [-2.85, .1, -.6], [-2.85, 2.33, -.6], .035);
  mesh(home, new THREE.CylinderGeometry(.27, .27, .07, 24), darkWood, -2.85, .07, -.6);
  mesh(home, new THREE.CylinderGeometry(.24, .4, .43, 32), cushion, -2.85, 2.38, -.6);
  const homeLight = new THREE.PointLight('#ffc184', 6, 7, 2); homeLight.position.set(-2.85, 2.12, -.6); home.add(homeLight);
  box(home, oak, 1.36, 1.15, -1.91, 1.15, 2.25, .45);
  for (const y of [.55, 1.18, 1.81]) {
    box(home, darkWood, 1.36, y, -1.62, 1.2, .055, .55);
    for (let i = 0; i < 5; i++) box(home, i % 2 ? green : cushion, .96 + i * .16, y + .2, -1.62, .105, .36, .25);
  }
  box(home, darkWood, -1.1, .46, 1.32, 1.75, .1, .76);
  for (const x of [-1.78, -.42]) box(home, oak, x, .22, 1.32, .09, .44, .5);
  box(home, green, -1.4, .535, 1.3, .46, .045, .32);
  mesh(home, new THREE.CylinderGeometry(.085, .07, .18, 24), cream, -.65, .6, 1.32);
  return { interviewer, buddy, office, home, dispose: () => {
    scene.traverse(object => { if (object instanceof THREE.Mesh) object.geometry.dispose(); });
    materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose());
  } };
}

export default function InterviewRoom3D(props: RoomProps) {
  const host = useRef<HTMLDivElement>(null);
  const live = useRef(props); live.current = props;
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' }); }
    catch { setFailed(true); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#b3c9c7');
    scene.fog = new THREE.Fog('#b3c9c7', 12, 28);
    scene.add(new THREE.HemisphereLight('#e5f1ef', '#84705a', 2.6));
    const sun = new THREE.DirectionalLight('#ffe7bc', 3.4); sun.position.set(-3, 7, 4); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024); sun.shadow.camera.left = -7; sun.shadow.camera.right = 7;
    sun.shadow.camera.top = 7; sun.shadow.camera.bottom = -7; sun.shadow.normalBias = .035; scene.add(sun);
    const fill = new THREE.DirectionalLight('#d0e9ee', 1.5); fill.position.set(3, 3, -4); scene.add(fill);
    const room = buildRoom(scene);
    const camera = new THREE.PerspectiveCamera(47, 1, .1, 40); camera.position.set(3.4, 2.8, 6.6);
    const target = new THREE.Vector3(0, 1.6, -1.4);
    const destination = new THREE.Vector3(); const destinationTarget = new THREE.Vector3();
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduced = media.matches;
    const motionChange = () => { reduced = media.matches; }; media.addEventListener('change', motionChange);
    const resize = () => { const { width, height } = container.getBoundingClientRect(); renderer.setSize(Math.max(width, 1), Math.max(height, 1)); camera.aspect = width / Math.max(height, 1); camera.updateProjectionMatrix(); };
    const observer = new ResizeObserver(resize); observer.observe(container); resize();
    let previous = 0, elapsed = 0, inView = true, lost = false, wasBuddy = false;
    const visibility = new IntersectionObserver(entries => { inView = entries[0].isIntersecting; }); visibility.observe(container);
    const onLost = (event: Event) => { event.preventDefault(); lost = true; setFailed(true); };
    const onRestored = () => { lost = false; setFailed(false); };
    renderer.domElement.addEventListener('webglcontextlost', onLost);
    renderer.domElement.addEventListener('webglcontextrestored', onRestored);
    renderer.setAnimationLoop((now: number) => {
      const dt = Math.min((now - previous) / 1000, .05); previous = now;
      if (lost || !inView || document.hidden) return;
      const motionReduced = reduced || !!live.current.motionPaused;
      if (!motionReduced) elapsed += dt;
      const state = live.current;
      const focusBuddy = state.buddyOpen;
      room.office.visible = !focusBuddy; room.home.visible = focusBuddy;
      const narrow = camera.aspect < 1;
      destination.set(...(focusBuddy ? [narrow ? -1.1 : 0, 2.3, 4.3] : !state.entered ? [3.4, 2.8, 6.6] : [0, 2.12, 3.5]) as [number, number, number]);
      destinationTarget.set(focusBuddy ? (narrow ? -1.1 : 0) : state.look * 1.8, focusBuddy ? 1.95 : 1.65, focusBuddy ? -.9 : -1.3);
      const blend = motionReduced || focusBuddy !== wasBuddy ? 1 : 1 - Math.exp(-dt * 2.6);
      wasBuddy = focusBuddy;
      camera.position.lerp(destination, blend); target.lerp(destinationTarget, blend); camera.lookAt(target);
      [room.interviewer, room.buddy].forEach((avatar, index) => {
        const speaking = state.speaker === (index ? 'buddy' : 'interviewer');
        const t = elapsed + index * 1.7;
        const cadence = .5 + .5 * Math.sin(t * 15 + state.wordPulse * .9);
        avatar.mouth.scale.y = speaking && !motionReduced ? .016 + cadence * .041 : .012;
        avatar.mouth.scale.x = speaking && !motionReduced ? .083 + cadence * .019 : .102;
        avatar.mouth.visible = !avatar.isBuddy || (speaking && !motionReduced);
        if (avatar.smile) avatar.smile.visible = !speaking || motionReduced;
        avatar.teeth.visible = speaking && !motionReduced;
        avatar.head.rotation.x = motionReduced ? 0 : Math.sin(t * (speaking ? 3.2 : 1.1)) * (speaking ? .045 : state.recording ? .025 : .008);
        avatar.head.rotation.z = motionReduced ? 0 : Math.sin(t * 1.3) * .022;
        avatar.head.rotation.y = index ? (narrow ? 0 : .16) : .02 * Math.sin(t * .5);
        const blink = !motionReduced && t % 4.7 > 4.52;
        avatar.eyes.forEach((eye, i) => { eye.scale.y = (i % 2 ? .028 : .043) * (blink ? .12 : 1); });
        avatar.torso.scale.y = .53 + (motionReduced ? 0 : Math.sin(t * 1.5) * .005);
        avatar.hands.forEach((hand, side) => {
          hand.rotation.x = speaking && !motionReduced ? -.12 - Math.max(0, Math.sin(t * 2.3 + side)) * .22 : 0;
          hand.rotation.z = speaking && !motionReduced ? Math.sin(t * 1.8 + side) * .07 : 0;
        });
      });
      renderer.render(scene, camera);
    });
    return () => {
      renderer.setAnimationLoop(null); observer.disconnect(); visibility.disconnect();
      media.removeEventListener('change', motionChange);
      renderer.domElement.removeEventListener('webglcontextlost', onLost); renderer.domElement.removeEventListener('webglcontextrestored', onRestored);
      room.dispose(); sun.shadow.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    };
  }, []);
  return <div className="room-renderer" ref={host} role="img" aria-label={`${props.buddyOpen ? 'Sam’s cozy home. Your smiling, clean-shaven buddy sits on a sofa beneath a framed quote: You can do it.' : '3D interview room at Your Dream Company. Alex is seated across the desk.'} ${props.speaker ? `${props.speaker} speaking.` : ''}`}>
    {failed && <div className="room-fallback"><span>◈</span><h3>Your interview room</h3><p>{props.fallbackText || '3D is unavailable on this device. You can still hear questions, ask your buddy, and record answers below.'}</p></div>}
  </div>;
}
