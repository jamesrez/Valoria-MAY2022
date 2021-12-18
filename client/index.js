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
  cameraRig.setAttribute('movement-controls', 'constrainToNavMesh: true;speed: 0.7;fly: true')
  cameraRig.setAttribute('read-controls', true);
  // cameraRig.setAttribute('p2p-communication', true);
  // await valoria.goToDimension("Valoria");
}

// function playMusic(){
//   document.querySelector("#radio").play();
// }