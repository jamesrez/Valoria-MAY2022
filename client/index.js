let cameraRig;
let page;
let valorAmount;
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
  valorAmount = document.querySelector(".valorAmount");
  // page.click();
}

valoria.onJoin = async () => {
  let valorInterval = setInterval(async () => {
    try {
      const valor = await valoria.calculateValor(valoria.id);
      if(valor !== 0){
        valorAmount.textContent = `VALOR: ${+valor.toFixed(9)}`;
      } else {
        valorAmount.textContent = `VALOR: Connecting`;
      }
    } catch(e){
      console.log(e)
    }
  }, valoria.syncIntervalMs)

  valoria.dimension.onPeerJoin = (id) => {
    addPeerToScene(id);
  }
  valoria.dimension.onPeerLeave = (id) => {
    removePeerFromScene(id);
  }
  try {
    await valoria.joinDimension("Valoria"); 
    console.log("joined dimension: " + valoria.dimension.id)
  } catch(e){

  }
}

(async() => {
  try {
    await valoria.loadCredentials();
  } catch(e){

  }
})();
// function playMusic(){
//   document.querySelector("#radio").play();
// }