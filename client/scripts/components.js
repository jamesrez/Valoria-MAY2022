AFRAME.registerComponent('grid-anim', { 
  init: function () {
    var self = this;
    this.time = 0;
    this.animation = AFRAME.ANIME({
      targets: self.el.components.position.data,
      x: -38.3,
      autoplay: false,
      duration: 320,
      easing: "linear",
      loop: true,
      round: false,
      update: function (animation) {
        var value = animation.animatables[0].target;
        self.el.setAttribute('position', `${value.x} 0 0`);
      }
    });
    this.animation.began = true;
  },
  tick: function (t, dt) {
    this.time += dt;
    this.animation.tick(this.time);
  }
});

AFRAME.registerComponent('palm-anim', { 
  init: function () {
    var self = this;
    this.time = 0;
    this.animation = AFRAME.ANIME({
      targets: self.el.components.position.data,
      x: -30,
      autoplay: false,
      duration: 1998,
      easing: "linear",
      loop: true,
      round: false,
      update: function (animation) {
        var value = animation.animatables[0].target;
        self.el.setAttribute('position', `${value.x} -0.2 0`);
      }
    });
    this.animation.began = true;
  },
  tick: function (t, dt) {
    this.time += dt;
    this.animation.tick(this.time);
  }
});

AFRAME.registerComponent('jump-anim', { 
  init: function () {
    var self = this;
    this.time = 0;
    this.animation = AFRAME.ANIME({
      targets: self.el.components.position.data,
      y: 2.6,
      autoplay: false,
      duration: 500,
      easing: "easeInOutSine",
      direction: 'alternate',
      loop: 1,
      round: false,
      update: function (animation) {
        var value = animation.animatables[0].target;
        self.el.setAttribute('position', `${self.el.object3D.position.x} ${value.y} ${self.el.object3D.position.z}`);
      },
      complete: function(anim) {
        self.el.removeAttribute('jump-anim');
      }
    });
    this.animation.began = true;
  },
  tick: function (t, dt) {
    this.time += dt;
    this.animation.tick(this.time);
  }
});

AFRAME.registerComponent('read-controls', { 
  init: function () {
    var self = this;
    this.time = 0;
    this.controllers = {
      left: null,
      right: null
    }
    this.camera = document.querySelector('#dimCamera');
  },
  tick: function (t, dt) {
    if(!this.controllers.left && this.el.components['gamepad-controls']){
      let c = this.el.components['gamepad-controls'].system.controllers
      if(c.length > 1){
        this.controllers = {
          left: c[0].handedness == "left" ? c[0].gamepad : c[1].gamepad,
          right: c[1].handedness == "right" ? c[1].gamepad : c[0].gamepad,
        }
      }
    }
    if(this.controllers.right){
      //RIGHT THUMBSTICK PRESS
      if(this.controllers.right.buttons[3].pressed){
        if(!this.el.components['jump-anim']){
          this.el.setAttribute('jump-anim', true);
        }
      }
      //TURN RIGHT
      if(this.controllers.right.axes[2] > 0.5){
        const newRotationY = this.el.components['rotation'].data.y - 1;
        this.el.setAttribute('rotation', `0 ${newRotationY} 0`);
      }
      //TURN LEFT
      else if (this.controllers.right.axes[2] < -0.5){
        const newRotationY = this.el.components['rotation'].data.y + 1;
        this.el.setAttribute('rotation', `0 ${newRotationY} 0`);
      }
    }
  }
});

AFRAME.registerComponent('p2p-communication', {
  init: () => {
    var self = this;
    this.valoria = valoria;
    this.openChannels = {};
    this.peers = {};
    this.iFrame = 0;
    this.rig = document.querySelector('#cameraRig') || this.el;
    this.cam = document.querySelector('#dimCamera');
  },
  tick: (d, dt) => {
    this.iFrame += 1;
    if(this.iFrame === 10){
      const d = {
        pos: {
          x: this.rig.object3D.position.x + this.cam.object3D.position.x,
          y: this.rig.object3D.position.y + this.cam.object3D.position.y,
          z: this.rig.object3D.position.z + this.cam.object3D.position.z,
        },
        rot: {
          x: this.rig.object3D.rotation.x + this.cam.object3D.rotation.x,
          y: this.rig.object3D.rotation.y + this.cam.object3D.rotation.y,
          z: this.rig.object3D.rotation.z + this.cam.object3D.rotation.z,
        },
        event: "userPos"
      }
      if(this.valoria.dimension.peers){
        Object.keys(this.valoria.dimension.peers).forEach((socketId) => {
          if(!this.valoria.peerConns[socketId]) return;
          if(this.valoria.peerConns[socketId].datachannel.readyState == "open"){
            this.valoria.peerConns[socketId].datachannel.send(JSON.stringify(d));
          }
        })
      }
      if(this.rig.components['time-travel-record']){
        this.rig.components['time-travel-record'].movement.push(d);
      }
      this.iFrame = 0;
    }
  }
})

AFRAME.registerComponent('moveto-anim', { 
  schema: {
    data: {type: "string"}
  },
  init: function () {
    var self = this;
    this.time = 0;
    console.log(self.data);
    if(!self.data.data) return;
    self.data = JSON.parse(self.data.data);
    this.animation = AFRAME.ANIME({
      targets: {
        posX: self.el.object3D.position.x,
        posY: self.el.object3D.position.y,
        posZ: self.el.object3D.position.z,
        rotX: self.el.object3D.rotation.x,
        rotY: self.el.object3D.rotation.y,
        rotZ: self.el.object3D.rotation.z
      },
      posX: self.data.pos.x,
      posY: self.data.pos.y,
      posZ: self.data.pos.z,
      rotX: self.data.rot.x,
      rotY: self.data.rot.y,
      rotZ: self.data.rot.z,
      autoplay: false,
      duration: 200,
      easing: "linear",
      round: false,
      update: function (animation) {
        var value = animation.animatables[0].target;
        console.log(value.posX);
        self.el.setAttribute('position', `${value.posX} ${value.posY} ${value.posZ}`);
        self.el.object3D.rotation.x = value.rotX;
        self.el.object3D.rotation.y = value.rotY;
        self.el.object3D.rotation.z = value.rotZ;
      },
      complete: function(anim) {
        self.el.removeAttribute('moveto-anim');
      }
    });
    this.animation.began = true;
  },
  tick: function (t, dt) {
    this.time += dt;
    this.animation.tick(this.time);
  }
});

AFRAME.registerComponent('time-travel-record', { 
  schema: {
    enabled: {type: "boolean"}
  },
  init: function () {
    var self = this;
    this.data = {
      audio: null,
      s3: null
    };
    this.second = Math.floor(Date.now() / 1000);
    this.frame = 0;
    this.movement = [];
    this.recording = false;
    this.recorder = null;
    this.socket = null;
  },
  tick: function (t, dt) {
    if(!this.recording && this.data.audio){
      this.recording = true;
      this.recorder = new MediaRecorder(this.data.audio);
      var reader = new FileReader();
      var chunkIndex = 0;
      this.recorder.start()
    }
    this.frame += 1;
    if(this.frame === 60 && this.recorder.state !== "inactive"){
      let thisTtr = this;
      const sec = this.second;
      const movement = this.movement;
      this.recorder.ondataavailable = function(e) {
        var reader = new FileReader();
        reader.onload = function() {
          const dataUrl = reader.result;
          if(thisTtr.data.s3){
            let prefix = "things/" + AWS.config.credentials.identityId + "/";
            prefix += "time/" + thisTtr.data.socket.id + "/";
            const rid = Math.round((Math.random() * 10000000000))
            let name = `${prefix}time-${socket.dimId}-${socket.roomNum}-${rid}-${sec}`;
            let key = name + ".json";
            const data = JSON.stringify({
              movement,
              audio: dataUrl
            });
            thisTtr.data.s3.upload({Body: data, Key: key, Bucket: "valoria"}, async (err, data) => {
              if(err) console.log(err);
              thisTtr.data.socket.emit("New Time Record", {
                second: sec,
                path: key
              });
            })
          }
        };
        reader.readAsDataURL(e.data);
      }
      this.recorder.stop();
      this.second += 1;
      this.frame = 0;
      this.movement = [];
      this.recorder.start()
    }
  }
});


AFRAME.registerComponent('time-travel-play', { 
  schema: {
    enabled: {type: "boolean"},
    times: {type: "string"}
  },
  init: async function () {
    var self = this;
    this.times = JSON.parse(this.data.times);
    this.timeData = (await axios.get(this.times[0].path)).data;
    this.frame = 0;
  },
  tick: async function (t, dt) {
    if(this.frame == 0 && this.timeData && this.times.length > 0){
      const audio = this.timeData.audio;
      this.times.shift();
      this.el.setAttribute("moveto-anim", `data: ${JSON.stringify(this.timeData.movement[0])}`);
      this.timeData.movement.shift();
      this.el.querySelector('.userSound').setAttribute('src', audio);
      this.timeData = (await axios.get(this.times[0].path)).data;
    }
    if(!this.el.components["moveto-anim"] && this.timeData && this.timeData.movement.length > 0){
      this.el.setAttribute("moveto-anim", `data: ${JSON.stringify(this.timeData.movement[0])}`);
      this.timeData.movement.shift();
    }
    this.frame += 1;
    if(this.frame == 60){
      this.frame = 0;
    }
  }
});