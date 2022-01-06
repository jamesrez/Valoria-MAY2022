const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer();
const GLTFLoader = new THREE.GLTFLoader();
const TextureLoader = new THREE.TextureLoader();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.xr.enabled = true;
const world = document.querySelector('.world');
world.appendChild( renderer.domElement );
world.appendChild( VRButton.createButton( renderer ) );

const clock = new THREE.Clock();

async function loadModel(url){
  return new Promise(async (res, rej) => {
    GLTFLoader.load(url, (gltf) => {
      scene.add(gltf.scene);
      gltf.scene.traverse((node) => {
        if(node.isMesh){
          node.frustumCulled = false;
        }
      })
      gltf.scene.animations = gltf.animations;
      res(gltf.scene);
    });
  })
}

function setModelAction(model, toAction) {
  if (toAction != model.activeAction) {
      model.lastAction = model.activeAction
      model.activeAction = toAction
      //lastAction.stop()
      model.lastAction?.fadeOut(1)
      model.activeAction.reset()
      // model.activeAction.fadeIn(1)
      model.activeAction.play()
  }
}

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const controls = new THREE.PointerLockControls(camera, renderer.domElement)
let avatar;
let waluigi;
let room;
(async () => {
  avatar = await loadModel('assets/waluigi.glb');
  avatar.traverse((node) => {
    if(node.isMesh){
      node.frustumCulled = true;
    }
  })
  avatar.mixer = new THREE.AnimationMixer(avatar);
  setModelAction(avatar, avatar.mixer.clipAction(avatar.animations[0]));
  avatar.attach(camera);
  waluigi = await loadModel('assets/waluigi.glb');
  waluigi.mixer = new THREE.AnimationMixer(waluigi);
  setModelAction(waluigi, waluigi.mixer.clipAction(waluigi.animations[0]));
})();
camera.position.z = -0.7;
camera.position.y = 1.6;

renderer.setAnimationLoop(async () => {
	renderer.render( scene, camera );
  handleControls();
  let delta = clock.getDelta();
  scene.traverse((node) => {
    if(node.mixer) node.mixer.update(delta);
  })
});

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
}

const activeKeys = {};
document.addEventListener('keydown', (event) => {
  activeKeys[event.key] = true;
});

document.addEventListener('keyup', (event) => {
  delete activeKeys[event.key];
});

const moveSpeed = 0.03;
function handleControls(){
  if(activeKeys["w"]){
    controls.moveForward(moveSpeed);
    setModelAction(avatar, avatar.mixer.clipAction(avatar.animations[2]));
  }
  if(activeKeys["a"]){
    controls.moveRight(moveSpeed * -1);
    setModelAction(avatar, avatar.mixer.clipAction(avatar.animations[2]));
  }
  if(activeKeys["s"]){
    controls.moveForward(moveSpeed * -1);
    setModelAction(avatar, avatar.mixer.clipAction(avatar.animations[2]));
  }
  if(activeKeys["d"]){
    controls.moveRight(moveSpeed);
    setModelAction(avatar, avatar.mixer.clipAction(avatar.animations[2]));
  }
  if(Object.keys(activeKeys).length == 0){
    setModelAction(avatar, avatar.mixer.clipAction(avatar.animations[0]));
  }
}

world.onmousedown = () => {
  controls.lock();
}


const light = new THREE.AmbientLight();
light.intensity = 3;
light.position.y = 5;
scene.add(light)

const skySphere = new THREE.SphereGeometry(500, 300, 300);
const skyTexture = TextureLoader.load("assets/valoriacity.png");
const skyMat = new THREE.MeshBasicMaterial( { color: 0xffffff, side: THREE.BackSide, map: skyTexture } );
const skyBox = new THREE.Mesh( skySphere, skyMat );
skyBox.rotation.y = 90 * Math.PI / 180;
scene.add( skyBox );

const gridPlane = new THREE.PlaneGeometry(100, 100);
const gridTexture = TextureLoader.load("assets/grid.png");
gridTexture.wrapS = THREE.RepeatWrapping;
gridTexture.wrapT = THREE.RepeatWrapping;
gridTexture.repeat.set(200, 200)
const gridMat = new THREE.MeshPhongMaterial({ color: 0xffffff, map: gridTexture, opacity: 0.77, transparent: true, })
const grid = new THREE.Mesh(gridPlane, gridMat);
grid.rotation.x = -90 * Math.PI / 180;
grid.scale.x = 2;
grid.scale.y = 2;
grid.scale.z = 2;
scene.add(grid)

