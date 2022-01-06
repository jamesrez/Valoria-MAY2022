AFRAME.registerComponent('idle-anim', {
  init: function () {
    const mixer = this.el.components["animation-mixer"];
    const waitingForMixer = setInterval(() => {
      if(mixer.mixer.clipAction){
        clearInterval(waitingForMixer);
        mixer.mixer.clipAction(mixer.model.animations[0]).play();
      }
    }, 10)
  }
});

AFRAME.registerComponent('walk-anim', {
  init: function () {
    const mixer = this.el.components["animation-mixer"];
    const waitingForMixer = setInterval(() => {
      if(mixer.mixer.clipAction){
        clearInterval(waitingForMixer);
        mixer.mixer.clipAction(mixer.model.animations[2]).play();
      }
    }, 10)
  }
});

AFRAME.registerComponent('model', {
  init: function () {
    const waitingForModel = setInterval(() => {
      const model = this.el.getObject3D('mesh');
      if(model){
        clearInterval(waitingForModel)
        model.traverse((node) => {
          if (node.isMesh) {
            node.frustumCulled = false;
          }
        });
      }
    }, 10)
  }
});