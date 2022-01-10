const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer();
const GLTFLoader = new THREE.GLTFLoader();
const TextureLoader = new THREE.TextureLoader();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.xr.enabled = true;
const world = document.querySelector('.world');
world.appendChild( renderer.domElement );
world.appendChild( VRButton.createButton( renderer ) );

const peerAvatars = {};

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
      gltf.scene.mixer = new THREE.AnimationMixer(gltf.scene);
      res(gltf.scene);
    });
  })
}

function setModelAction(model, toAction) {
  if (toAction != model.activeAction) {
      model.lastAction = model.activeAction
      model.activeAction = toAction
      //lastAction.stop()
      model.lastAction?.fadeOut(0.2)
      model.activeAction.reset()
      model.activeAction.fadeIn(0.2)
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
  setModelAction(avatar, avatar.mixer.clipAction(avatar.animations[0]));
  avatar.attach(camera);
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
  sendPeerUpdates();
  handleObjectsMoving();
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
  let direction;
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

let frame = 0;
async function sendPeerUpdates(){
  frame += 1;
  if(frame == 10){
    if(valoria.dimension?.peers){
      const peers = valoria.dimension?.peers;
      for(let i=0;i<peers.length;i++){
        if(valoria.peers[peers[i]] && valoria.peers[peers[i]]?.datachannel?.readyState == "open"){
          valoria.peers[peers[i]].datachannel.send(JSON.stringify({
            event: "Movement",
            data: {
              position: {x: avatar.position.x, y: avatar.position.y, z: avatar.position.z},
              quaternion: {w: avatar.quaternion.w, x: avatar.quaternion.x, y: avatar.quaternion.y, z: avatar.quaternion.z},
            }
          }))
        }
      }
    }
    frame = 0;
  }
}

let objsMoving = {};
let letters = ["x", "y", "z"];
function handleObjectsMoving(){
  for(let o in objsMoving){
    const obj = objsMoving[o];
    const ent = obj.entity;
    for(let v in obj.data){
      if(v == "quaternion") {
        const qv = obj.data.quaternion;
        let q = new THREE.Quaternion(qv.x, qv.y, qv.z, qv.w)
        ent.quaternion.slerp(q, 0.025);
      } else {
        for(let l in obj.data[v]){
          let dif = obj.data[v][l] - ent[v][l];
          if(typeof dif !== "number") continue;
          if(Math.abs(dif) < 0.01){
            ent[v][l] = obj.data[v][l];
          } else {
            let val = dif / 10;
            ent[v][l] += val;
            // if(ent[v][l] < obj.data[v][l]){
            // } else if(ent[v][l] > obj.data[v][l]){
            //   ent[v][l] -= val;
            // }
          }
        }
      }
    }
  }
}

async function addPeerToScene(id){
  peerAvatars[id] = await loadModel('assets/waluigi.glb');
  setModelAction(peerAvatars[id], peerAvatars[id].mixer.clipAction(peerAvatars[id].animations[0]));
  valoria.peers[id].on("Movement", (data) => {
    if(
      Math.abs(data.position.x - peerAvatars[id].position.x) < 0.01 &&
      // Math.abs(data.position.y - peerAvatars[id].position.y) < 0.1 ||
      Math.abs(data.position.z - peerAvatars[id].position.z) < 0.01
    ) {
      setModelAction(peerAvatars[id], peerAvatars[id].mixer.clipAction(peerAvatars[id].animations[0]));
    } else {
      setModelAction(peerAvatars[id], peerAvatars[id].mixer.clipAction(peerAvatars[id].animations[2]));
    }

    objsMoving[id] = {
      entity: peerAvatars[id],
      data
    }
  })
}

async function removePeerFromScene(id){
  if(peerAvatars[id]) peerAvatars[id].clear();
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

