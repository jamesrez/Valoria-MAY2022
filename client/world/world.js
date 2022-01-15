const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer();
const GLTFLoader = new THREE.GLTFLoader();
const TextureLoader = new THREE.TextureLoader();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.xr.enabled = true;
renderer.xr.setFramebufferScaleFactor(2.0);
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
      // toAction.setEffectiveTimeScale(t);
      //lastAction.stop()
      model.lastAction?.fadeOut(0.2)
      model.activeAction.reset()
      model.activeAction.fadeIn(0.2)
      model.activeAction.play()
  }
}

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const controls = new THREE.PointerLockControls(camera, renderer.domElement);
const mobControls = new THREE.DeviceOrientationControls(camera);

//INVERSE KINEMATICS FOR ARMS
// const lMovingTarget = new THREE.Mesh(new THREE.SphereGeometry(0.1), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
// const lTransformControls = new THREE.TransformControls(camera, world);
// lTransformControls.attach(lMovingTarget);
// scene.add(lMovingTarget)
// scene.add(lTransformControls)
// const rMovingTarget = new THREE.Mesh(new THREE.SphereGeometry(0.1), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
// const rTransformControls = new THREE.TransformControls(camera, world);
// rTransformControls.attach(rMovingTarget);
// scene.add(rMovingTarget)
// scene.add(rTransformControls)

let avatar;
let waluigi;
let room;
let test;
let testIK;
let avatarIK;
let leftController;
let rightController;
(async () => {
  avatar = await loadModel('assets/waluigi.glb');
  // avatar.traverse((node) => {
  //   if(node.isMesh){
  //     node.frustumCulled = true;
  //   }
  // })
  avatar.attach(camera);
  leftController = renderer.xr.getController( 1 );
  rightController = renderer.xr.getController( 0 );
  // const lcTransform = new THREE.TransformControls(camera, world);
  // lcTransform.attach(leftController);
  // scene.add(lcTransform)
  setModelAction(avatar, avatar.mixer.clipAction(avatar.animations[0]));

  avatar.attach(leftController);
  avatar.attach(rightController);
  avatarIK = new IKVR(avatar, leftController, rightController);
  // test = await loadModel('assets/waluigi.glb');
  // testIK = new IKVR(test, lMovingTarget, rMovingTarget);
  // setModelAction(test, test.mixer.clipAction(test.animations[0]));
})();
camera.position.z = -0.7;
camera.position.y = 1.6;
const listener = new THREE.AudioListener();
camera.add(listener);

renderer.setAnimationLoop(async () => {
	renderer.render( scene, camera );
  handleControls();
  let delta = clock.getDelta();
  scene.traverse((node) => {
    if(node.mixer) node.mixer.update(delta);
  })
  sendPeerUpdates();
  handleObjectsMoving();
  updateGridWave();
  handleXRControls();
  if(testIK){
    testIK.update();
  }
  if(avatarIK){
    avatarIK.update();
  }
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
  mobControls.update();
}

let session;
let vrAction = "still";
function handleXRControls(){
  session = renderer.xr.getSession();
  if(!session) return;
  for(let source of session.inputSources){
    if(!source || !source.gamepad || !source.handedness) continue;
    let axes = source.gamepad.axes.slice(0);
    axes.forEach((value, i) => {
      //handlers for thumbsticks
      //if thumbstick axis has moved beyond the minimum threshold from center, windows mixed reality seems to wander up to about .17 with no input
      if (Math.abs(value) > 0.2) {
          //set the speedFactor per axis, with acceleration when holding above threshold, up to a max speed
          if (i == 2) {
              //left and right axis on thumbsticks
              if (source.handedness == "left") {
                  // (data.axes[2] > 0) ? console.log('left on left thumbstick') : console.log('right on left thumbstick')
                  if(axes[i] < 0){
                    controls.moveRight(moveSpeed * -1);
                    if(vrAction !== "left"){
                      vrAction = "left"
                      setModelAction(avatar, avatar.mixer.clipAction(avatar.animations[2]));
                    }
                  } else if(axes[i] > 0){
                    controls.moveRight(moveSpeed);
                    if(vrAction !== "right"){
                      vrAction = "right"
                      setModelAction(avatar, avatar.mixer.clipAction(avatar.animations[2]));
                    }
                  }
              } else {
                if(axes[i] < 0){
                  avatar.rotation.y += 0.03;
                } else if (axes[i] > 0){
                  avatar.rotation.y -= 0.03;
                }
                  // (data.axes[2] > 0) ? console.log('left on right thumbstick') : console.log('right on right thumbstick')
                  // dolly.rotateY(-THREE.Math.degToRad(data.axes[2]));
              }
          }
          if (i == 3) {
              //up and down axis on thumbsticks
              if (source.handedness == "left") {
                  // (data.axes[3] > 0) ? console.log('up on left thumbstick') : console.log('down on left thumbstick')
                  if(axes[i] < 0){
                    controls.moveForward(moveSpeed);
                    if(vrAction !== "forward"){
                      vrAction = "forward"
                      setModelAction(avatar, avatar.mixer.clipAction(avatar.animations[2]));
                    }
                  } else if(axes[i] > 0){
                    controls.moveForward(moveSpeed * -1);
                    if(vrAction !== "backward"){
                      vrAction = "backward"
                      setModelAction(avatar, avatar.mixer.clipAction(avatar.animations[2]));
                    }
                  }
              } else {
                  // (data.axes[3] > 0) ? console.log('up on right thumbstick') : console.log('down on right thumbstick')
            
              }
          }
      } else {
          //axis below threshold - reset the speedFactor if it is greater than zero  or 0.025 but below our threshold
          if(vrAction !== "still"){
            vrAction = "still"
            setModelAction(avatar, avatar.mixer.clipAction(avatar.animations[0]));
          }
      }
    })
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
  peerAvatars[id].sound = new THREE.PositionalAudio(listener);
  peerAvatars[id].add(peerAvatars[id].sound);
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
  valoria.peers[id].onStream = (stream) => {
    console.log("GOT STREAM");
    console.log(stream)
    let audio = document.createElement('audio');
    audio.autoplay = true;
    try {
      audio.srcObject = stream;
    } catch(e) {
      audio.src = URL.createObjectURL(stream);
    }
    world.appendChild(audio);
    audio.play();
    peerAvatars[id].sound.autoplay = true;
    peerAvatars[id].sound.setMediaElementSource(audio);
    // peerAvatars[id].sound.play();

  };
  if(valoria.peers[id].stream){
    valoria.peers[id].onStream(valoria.peers[id].stream);
  }
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

const gridPlane = new THREE.PlaneGeometry(100, 100, 200, 200);
const gridTexture = TextureLoader.load("assets/grid.png");
gridTexture.wrapS = THREE.RepeatWrapping;
gridTexture.wrapT = THREE.RepeatWrapping;
gridTexture.repeat.set(200, 200)
const gridMat = new THREE.MeshPhongMaterial({ color: 0xffffff, map: gridTexture, opacity: 0.77, transparent: true, })
const grid = new THREE.Mesh(gridPlane, gridMat);
grid.rotation.x = -90 * Math.PI / 180;
grid.rotation.z = 2.4;
grid.scale.x = 2;
grid.scale.y = 2;
grid.scale.z = 2;
grid.position.y = -0.5;
scene.add(grid)
let gridWaveHeight = 0.03;
const gridVertices = gridPlane.attributes.position;
const myZs = []
for (let i=0;i<gridVertices.count;i++) {
  gridVertices.setZ(i, gridVertices.getZ(i) + Math.random() * gridWaveHeight - gridWaveHeight)
  myZs.push(gridVertices.getZ(i))
}
let gridWaveCount = 0;
function updateGridWave(){
  for (let i=0;i<gridVertices.count;i++) {
    const z = +gridVertices.getZ(i);
    gridVertices.setZ(i, Math.sin( i + gridWaveCount * 0.0000033) * (myZs[i] - (myZs[i] * 0.00001)));
    gridVertices.needsUpdate = true;
    gridWaveCount += 0.1
  }
}





