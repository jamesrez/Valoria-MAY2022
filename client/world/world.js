AFRAME.registerComponent('walk-anim', {
  init: function () {
    const mixer = this.el.components["animation-mixer"];
    const waitingForMixer = setInterval(() => {
      if(mixer.mixer.clipAction){
        clearInterval(waitingForMixer);
        mixer.mixer.clipAction(mixer.model.animations[3]).play();
      }
    }, 10)
  }
});
