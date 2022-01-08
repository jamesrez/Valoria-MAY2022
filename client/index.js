let cameraRig;
let page;

window.onload = async () => {
  page = document.querySelector(".page");
  cameraRig = document.querySelector('#cameraRig');
  // page.click();
}

valoria.onJoin = async () => {
  console.log("SIGNED IN!");
  page.style.display = "none";
  controls.lock();
  await valoria.startMediaStream({audio: true, video: false});
  await valoria.joinDimension("Valoria");
}

// function playMusic(){
//   document.querySelector("#radio").play();
// }