let cameraRig;
let page;
let isMobile = false;
if( window.DeviceOrientationEvent && navigator.userAgent.match(/iPhone/i)
  || navigator.userAgent.match(/webOS/i)
  || navigator.userAgent.match(/Android/i)
  || navigator.userAgent.match(/iPad/i)
  || navigator.userAgent.match(/iPod/i)
  || navigator.userAgent.match(/BlackBerry/i)
  || navigator.userAgent.match(/Windows Phone/i)
){
  isMobile = true;
}

window.onload = async () => {
  page = document.querySelector(".page");
  cameraRig = document.querySelector('#cameraRig');
  // page.click();
}

valoria.onJoin = async () => {
  console.log("SIGNED IN!");
  page.style.display = "none";
  if(!isMobile){
    controls.lock();
  }
  valoria.dimension.onPeerJoin = (id) => {
    addPeerToScene(id);
  }
  valoria.dimension.onPeerLeave = (id) => {
    removePeerFromScene(id);
  }
  await valoria.joinDimension("Valoria");
}

// function playMusic(){
//   document.querySelector("#radio").play();
// }