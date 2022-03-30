const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer();
const GLTFLoader = new THREE.GLTFLoader();
const TextureLoader = new THREE.TextureLoader();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.xr.enabled = true;
// renderer.xr.setFramebufferScaleFactor(2.0);
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
      // model.lastAction.stop()
      model.lastAction?.fadeOut(0.2)
      model.activeAction.reset()
      model.activeAction.fadeIn(0.2)
      model.activeAction.play()
  }
}

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const controls = new THREE.PointerLockControls(camera, renderer.domElement);
let mobControls;
let touchControls;


// TEST INVERSE KINEMATICS FOR ARMS
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
let room;
let test;
let testIK;
let avatarIK;
let leftController;
let rightController;
(async () => {
  avatar = await loadModel('assets/default.glb');
  // avatar.traverse((node) => {
  //   if(node.isMesh){
  //     node.frustumCulled = true;
  //   }
  // })
  avatar.name = "Avatar";
  avatar.add(camera);
  avatar.add(listener);
  avatar.position.z = -0.5;
  avatar.ray = new THREE.Raycaster();
  avatar.ray.set(new THREE.Vector3(avatar.position.x, 0.3, avatar.position.z), new THREE.Vector3(0, -1, 0));

  if(renderer.xr.getController(0).position.x <= renderer.xr.getController(1).position.x){
    leftController = renderer.xr.getController( 0 );
    rightController = renderer.xr.getController( 1 );
  } else {
    leftController = renderer.xr.getController( 1 );
    rightController = renderer.xr.getController( 0 );
  }
  if(isMobile){
    mobControls = new THREE.DeviceOrientationControls(camera);
		touchControls = new TouchControls(world, camera, {
			speedFactor: 0.015,
			delta: 1,
			rotationFactor: 0.015,
			maxPitch: 55,
			hitTest: false,
			hitTestDistance: 40
		});
		touchControls.addToScene(scene);
    camera.position.z = -0.3
  }
 
  // const lcTransform = new THREE.TransformControls(camera, world);
  // lcTransform.attach(leftController);
  // scene.add(lcTransform)
  setModelAction(avatar, avatar.mixer.clipAction(avatar.animations[0]));

  avatar.attach(leftController);
  avatar.attach(rightController);
  avatarIK = new IKVR(avatar, leftController, rightController);
  // test = await loadModel('assets/default.glb');
  // test.position.x = 1;
  // test.position.y = 0.1;
  // test.position.z = -2.5;
  // test.rotation.y = 1.7;
  // testIK = new IKVR(test, lMovingTarget, rMovingTarget);
  // setModelAction(test, test.mixer.clipAction(test.animations[1]));
  // room = await loadModel('assets/room-fix.glb')
  // room.scale.x = 2
  // room.scale.y = 2
  // room.scale.z = 2
  // room.position.z = -2.5;
})();
camera.position.z = -0.35;
camera.position.y = 1.6;
const listener = new THREE.AudioListener();
camera.add(listener);

renderer.setAnimationLoop(async () => {
	renderer.render( scene, camera );
  handleControls();
  handleXRControls();
  let delta = clock.getDelta();
  scene.traverse((node) => {
    // if(node.name == "Avatar" && node.ray){
    //   node.ray.set(new THREE.Vector3(node.position.x, node.position.y + 0.6, node.position.z), new THREE.Vector3(0, -1, 0));
    //   const intersects = node.ray.intersectObjects( scene.children );
    //   if(intersects[0]){
    //     if(intersects[0].object.type == "SkinnedMesh" && intersects[1]){
    //       node.position.y = intersects[1].point.y;
    //     } else {
    //       node.position.y = intersects[0].point.y;
    //     }
    //   }
    // }
    if(node.mixer) node.mixer.update(delta);

    // if(node.audio) node.audio.volume = Math.min(1, 1 / camera.position.distanceTo(node.position))


  })
  updateAvatarAnimation();
  updatePeerAvatarVolume();
  sendPeerUpdates();
  handleObjectsMoving();
  gridLoop();
  palmTrees();
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

const moveSpeed = 0.045;
function handleControls(){
  let direction;
  if(activeKeys["w"]){
    controls.moveForward(moveSpeed);
    // setModelAction(avatar, avatar.mixer.clipAction(avatar.animations[2]));
  }
  if(activeKeys["a"]){
    controls.moveRight(moveSpeed * -1);
    // setModelAction(avatar, avatar.mixer.clipAction(avatar.animations[2]));
  }
  if(activeKeys["s"]){
    controls.moveForward(moveSpeed * -1);
    // setModelAction(avatar, avatar.mixer.clipAction(avatar.animations[2]));
  }
  if(activeKeys["d"]){
    controls.moveRight(moveSpeed);
    // setModelAction(avatar, avatar.mixer.clipAction(avatar.animations[2]));
  }
  if(Object.keys(activeKeys).length == 0){
    // setModelAction(avatar, avatar.mixer.clipAction(avatar.animations[0]));
  }
  if(mobControls && mobControls.update){
    // avatar.rotation.y = camera.rotation.y;
    // camera.rotation.y = 0
    touchControls.update();
    mobControls.update();
    camera.rotation.x += 20 * (Math.PI / 180);
  } 
}

let session;
let vrSpeed = 0.05;
function handleXRControls(){
  session = renderer.xr.getSession();
  if(!session) return;
  camera.position.z = -0.3;
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
                    controls.moveRight(vrSpeed * -1);
                    // setModelAction(avatar, avatar.mixer.clipAction(avatar.animations[2]));
                  } else if(axes[i] > 0){
                    controls.moveRight(vrSpeed);
                    // setModelAction(avatar, avatar.mixer.clipAction(avatar.animations[2]));
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
                    controls.moveForward(vrSpeed);
                    // setModelAction(avatar, avatar.mixer.clipAction(avatar.animations[2]));
                  } else if(axes[i] > 0){
                    controls.moveForward(vrSpeed * -1);
                    // setModelAction(avatar, avatar.mixer.clipAction(avatar.animations[2]));
                  }
              } else {
                  // (data.axes[3] > 0) ? console.log('up on right thumbstick') : console.log('down on right thumbstick')
            
              }
          }
      } else {
          //axis below threshold - reset the speedFactor if it is greater than zero  or 0.025 but below our threshold
          // setModelAction(avatar, avatar.mixer.clipAction(avatar.animations[0]));
      }
    })
  }
}

let oAvatarPos = {
  x: null,
  z: null
}
function updateAvatarAnimation(){
  if(!avatar) return;
  if(!oAvatarPos.x) oAvatarPos.x = avatar.position.x;
  if(!oAvatarPos.z) oAvatarPos.z = avatar.position.z;
  if(
    oAvatarPos.x !== avatar.position.x || 
    oAvatarPos.z !== avatar.position.z
  ) {
    oAvatarPos.x = avatar.position.x;
    oAvatarPos.z = avatar.position.z;
    setModelAction(avatar, avatar.mixer.clipAction(avatar.animations[3]));
  } else {
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
        if(valoria.conns[peers[i]]){
          valoria.conns[peers[i]].send(JSON.stringify({
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
  if(peerAvatars[id]) return;
  peerAvatars[id] = await loadModel('assets/default.glb');
  peerAvatars[id].name = "Avatar";
  // peerAvatars[id].sound = new THREE.PositionalAudio(listener);
  setModelAction(peerAvatars[id], peerAvatars[id].mixer.clipAction(peerAvatars[id].animations[0]));
  valoria.conns[id].on("Movement", (data) => {
    if(
      Math.abs(data.position.x - peerAvatars[id].position.x) < 0.01 &&
      // Math.abs(data.position.y - peerAvatars[id].position.y) < 0.1 ||
      Math.abs(data.position.z - peerAvatars[id].position.z) < 0.01
    ) {
      setModelAction(peerAvatars[id], peerAvatars[id].mixer.clipAction(peerAvatars[id].animations[0]));
    } else {
      setModelAction(peerAvatars[id], peerAvatars[id].mixer.clipAction(peerAvatars[id].animations[3]));
    }
    objsMoving[id] = {
      entity: peerAvatars[id],
      data
    }
  })
  valoria.peers[id].onStream = (stream) => { 
    // document.getElementById('song').play();
    if(peerAvatars[id].audio) {
      peerAvatars[id].audio.remove();
    }
    let audio = document.createElement('audio');
    world.append(audio);
    // let audio = new Audio("assets/Raven_DigitalSunlight.mp3");
    // // audio.id = "audio-" + id;
    // audio.loop = true;
    // audio.preload = "auto";
    let audioStream = new MediaStream();
    stream.getAudioTracks().forEach(track => audioStream.addTrack(track));
    try {
      audio.srcObject = audioStream;
    } catch(e) {
      audio.src = URL.createObjectURL(audioStream);
    }
    peerAvatars[id].audio = audio;
    audio.play()
    // peerAvatars[id].sound = new THREE.PositionalAudio(listener);
    // peerAvatars[id].add(peerAvatars[id].sound);
    // peerAvatars[id].sound.setMaxDistance(20)
    // peerAvatars[id].sound.setMediaElementSource(audio)

    // audio.src = 
    // let audioStream = new MediaStream()
    // let aTracks = stream.getAudioTracks();
    // for(let i=0;i<aTracks.length;i++){
    //   audioStream.addTrack(aTracks[i]);
    // }
    // let source = new AudioContext().createMediaStreamSource(audioStream);

    // world.appendChild(audio);
    // audio.play();
    // peerAvatars[id].sound.autoplay = true;
    // peerAvatars[id].sound.loop = true;
    // peerAvatars[id].sound.setRefDistance(1);
    // peerAvatars[id].sound.setRolloffFactor(1);
    // peerAvatars[id].sound.setDistanceModel("exponential")
    // peerAvatars[id].sound.setRolloffFactor(10);
    // peerAvatars[id].sound.setDirectionalCone(180, 230, 0.1);
    


    // peerAvatars[id].audio = audio;

    // audio.pause();
    // peerAvatars[id].sound.setDirectionalCone(180, 230, 0.1);

  };
  if(valoria.peers[id].stream){
    valoria.peers[id].onStream(valoria.peers[id].stream);
  }
}

async function removePeerFromScene(id){
  if(peerAvatars[id]) {
    peerAvatars[id].clear();
    delete peerAvatars[id];
  }
}

async function updatePeerAvatarVolume(){
  const peers = Object.keys(peerAvatars);
  for(let i=0;i<peers.length;i++){
    if(!peerAvatars[peers[i]].audio) continue;
    let distSquared = avatar.position.distanceToSquared(
      peerAvatars[peers[i]].position
    );
    if (distSquared > 500) {
      peerAvatars[peers[i]].audio.volume = 0;
    } else {
      let volume = Math.min(1, 10 / distSquared);
      peerAvatars[peers[i]].audio.volume = volume;
    }
  }
}

world.onmousedown = () => {
  controls.lock();
}

const light = new THREE.AmbientLight();
light.intensity = 1.7;
light.position.y = 5;
scene.add(light)

const directionalLight = new THREE.DirectionalLight( 0xffffff, 2);
directionalLight.position.y = 10;
scene.add( directionalLight );

const bulb = new THREE.PointLight( 0xE735D5, 5, 3 );
bulb.position.set( 0, 2, -2.5 );
scene.add(bulb);

const skySphere = new THREE.SphereBufferGeometry(500, 300, 300);
const skyTexture = TextureLoader.load("assets/valoriacity.png");
const skyMat = new THREE.MeshBasicMaterial( { color: 0xffffff, side: THREE.BackSide, map: skyTexture } );
const skyBox = new THREE.Mesh( skySphere, skyMat );
skyBox.rotation.y = 90 * Math.PI / 180;
scene.add( skyBox );

const gridPlane = new THREE.PlaneBufferGeometry(200, 200, 350, 350);
const gridTexture = TextureLoader.load("assets/grid.png");
gridTexture.wrapS = THREE.RepeatWrapping;
gridTexture.wrapT = THREE.RepeatWrapping;
gridTexture.repeat.set(400, 400)
const gridMat = new THREE.MeshPhongMaterial({ color: 0xffffff, map: gridTexture, opacity: 0.77, transparent: true, })
const grid = new THREE.Mesh(gridPlane, gridMat);
grid.rotation.x = -90 * Math.PI / 180;
// grid.rotation.z = 2.4;
grid.scale.x = 2;
grid.scale.y = 2;
grid.scale.z = 2;
grid.position.y = 0;
scene.add(grid)
function gridLoop(){
  grid.position.z += 0.04;
  if(grid.position.z >= 1){
    grid.position.z = 0;
  }
}

// let gridWaveHeight = 0.2;
// const gridVertices = gridPlane.attributes.position;
// const myZs = []
// for (let i=0;i<gridVertices.count;i++) {
//   gridVertices.setZ(i, gridVertices.getZ(i) + Math.random() * gridWaveHeight - gridWaveHeight)
//   myZs.push(gridVertices.getZ(i))
// }
// let gridWaveCount = 0;
// function updateGridWave(){
//   for (let i=0;i<gridVertices.count;i++) {
//     const z = +gridVertices.getZ(i);
//     gridVertices.setZ(i, Math.sin( i + gridWaveCount * 0.000003) * (myZs[i] - (myZs[i] * 0.000001)));
//     gridVertices.needsUpdate = true;
//     gridWaveCount += 0.1
//   }
// }

let palms = []
let spawningPalms = true;
let ogPalm;
async function palmTreeSpawn(){
  console.log(spawningPalms);
  while(palms.length < 500){
    const palm = palms[0]?.clone() || await loadModel("assets/palm/QueenPalmTree.gltf");
    if(!palm.parent) scene.add(palm);
    palm.scale.x = 0.6;
    palm.scale.y = 0.6;
    palm.scale.z = 0.6;
    palm.position.x = Math.random() * ((avatar.position.x + 80) - (avatar.position.x - 80) + 1) + (avatar.position.x - 80);
    if(Math.abs(palm.position.x - avatar.position.x) < 2.5){
      palm.position.x <= avatar.position.x ? palm.position.x -= 2.5 : palm.position.x += 2.5;
    }
    palm.position.y = -0.2;
    palm.position.z = Math.random() * ((avatar.position.z + 20) - (avatar.position.z - 140) + 1) + (avatar.position.z - 140);
    palms.push(palm)
  }
  spawningPalms = false;
  console.log(spawningPalms);
}

palmTreeSpawn();

async function palmTrees(){
  if(palms.length < 500 && !spawningPalms){
    const palm = palms[0]?.clone() || await loadModel("assets/palm/QueenPalmTree.gltf");
    if(!palm.parent) scene.add(palm);
    palm.scale.x = 0.6;
    palm.scale.y = 0.6;
    palm.scale.z = 0.6;
    palm.position.x = Math.random() * ((avatar.position.x + 80) - (avatar.position.x - 80) + 1) + (avatar.position.x - 80);
    if(Math.abs(palm.position.x - avatar.position.x) < 2.5){
      palm.position.x <= avatar.position.x ? palm.position.x -= 2.5 : palm.position.x += 2.5;
    }
    palm.position.y = -0.2;
    palm.position.z = Math.random() * ((avatar.position.z - 70) - (avatar.position.z - 180) + 1) + (avatar.position.z - 180);
    palms.push(palm)

  }

  for(let i=0;i<palms.length;i++){
    palms[i].position.z += 0.04;
  }

  palms = palms.filter((p) => {
    if(p.position.z - avatar.position.z <= 50){
      return p
    } else {
      p.clear();
    }
  });
  

}


// video = document.createElement('video');
// video.setAttribute('autoplay', '');
// video.setAttribute('playsinline', '');
// video.setAttribute('loop', '');
// video.volume = 0.25;
// // video.setAttribute('crossorigin', 'anonymous');
// video.style.display = "none";
// world.append(video);
