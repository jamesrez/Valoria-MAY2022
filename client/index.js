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
let swc;
let messageChannel;

if ('serviceWorker' in navigator) {
  try {
    if (swc) {
      navigator.serviceWorker.getRegistration(swc.scriptURL).then(function (sw) {
        if(sw){
          // navigator.serviceWorker.terminate();
          sw.unregister().then(unregResult => { 
            registerSW();
          })
        } else {
          registerSW()
        }
      })
    } else {
      const url = window.location.protocol + '//' + window.location.host + '/sw.js';
      navigator.serviceWorker.getRegistration(url).then(function (sw) {
        if (sw) {
          // navigator.serviceWorker.terminate();
          sw.unregister().then(() => {
            registerSW();
          });
        } else {
          registerSW();
        }
      });
    }
  } catch(e){
    registerSW();
  }
  
  function registerSW(){
    navigator.serviceWorker.register('sw.js').then(function(registration) {
      console.log('SW registration succeeded with scope:', registration.scope);
      let waitingForController = setInterval(() => {
        console.log(navigator.serviceWorker.controller);
        if(navigator.serviceWorker.controller?.postMessage){
          clearInterval(waitingForController)
          messageChannel = new MessageChannel();
          console.log("Sent port connect message to SW");
          console.log(navigator.serviceWorker.controller?.postMessage)
          swc = navigator.serviceWorker.controller;
          swc?.postMessage({
            event: 'Port connect',
          }, [messageChannel.port2]);
          messageChannel.port1.onmessage = async (event) => {
            const d = event.data;
            switch(d.event){
              case "Valoria setup":
                await handleValoriaSetup(swc, d.data);
                break;
              case "Valor calculation":
                await handleValorCalculation(swc, d.data);
                break;
              case "Connected to server":
                await handleConnectToServer(swc, d.data);
                break;
              case "Connect to peer":
                await connectToPeer(swc, d.data);
                break;
              case "Send p2p message":
                await sendP2PMessage(swc, d.data);
              case "Handle got rtc description":
                await handleGotRtcDescription(swc, d.data);
                break;
              case "Handle got rtc candidate":
                await handleGotRtcCandidate(swc, d.data);
                break;
              case "New peer in dimension":
                await handleNewPeerInDimension(swc, d.data);
                break;
              case "Peer has left dimension":
                await handlePeerHasLeftDimension(swc, d.data);
                break;
            }
    
          };
        }
      }, 10)
    }).catch(function(e) {
      console.log('SW registration failed with error:', e);
    });
  }

}


async function handleValoriaSetup(swc, data){
  return new Promise(async (res, rej) => {
    const v = data.valoria;
    Object.assign(valoria, v);
    valoria.connectToServer = async (url) => {
      return new Promise(async (res, rej) => {
        try {
          valoria.promises["Connected to server " + url] = {res, rej};
          swc?.postMessage({
            event: 'Connect to server',
            data: {url}
          }, [messageChannel.port2]);
        } catch(e){
          res()
        }
      })
    }
    let conns = Object.keys(valoria.conns);
    for(let i=0;i<conns.length;i++){
      if(conns[i].includes("valoria/peers/")) continue;
      valoria.conns[conns[i]].send = async (msg) => {
        try {
          swc?.postMessage({
            event: 'Send message to server',
            data: {
              msg,
              url: conns[i]
            }
          }, [messageChannel.port2]);
        } catch(e){

        }
      };
    }
    res();
  })
}

async function handleValorCalculation(swc, data){
  return new Promise(async (res, rej) => {
    if(!valorAmount) return res();
    const valor = data?.valor;
    if(valor && valor !== 0){
      valorAmount.textContent = `VALOR: ${+valor.toFixed(9)}`;
    } else {
      valorAmount.textContent = `VALOR: Connecting`;
    }
    res();
  })
}

async function connectedToServer(swc, data){
  if(!data.url) return;  
  if(valoria.promises["Connected to server " + data.url]){
    valoria.promises["Connected to server " + data.url].res();
  }
}

async function connectToPeer(swc, data){
  if(!data.url) return;  
  try {
    await valoria.connectToPeer(data.url)
    console.log("connected to peer: " + data.url);
  } catch(e){
    console.log(e)
  }
  swc.postMessage({event: "Connected to peer", data})
}

async function sendP2PMessage(swc, data){
  if(!data.url || !valoria.peers[data.url] || !data.msg) return;  
  try {
    await valoria.peers[data.url]?.datachannel.send(data.msg);
  } catch(e){
    console.log(e)
  }
}

async function handleGotRtcDescription(swc, data){
  console.log("HANDLE GOT RTC DESCRIPTION from sw.js");
  if(!data) return;  
  // console.log("Handling rtc description for " + data.ws);
  try {
    if(!valoria.conns[data.ws]?.Url) valoria.conns[data.ws].Url = data.ws;
    valoria.handleGotRtcDescription(valoria.conns[data.ws], data);
    if(valoria.peers[data.url]?.datachannel?.open){
      swc.postMessage({event: "Connected to peer", data})
    }
  } catch(e){
    console.log(e)
  }
}

async function handleGotRtcCandidate(swc, data){
  if(!data) return;  
  try {
    await valoria.handleGotRtcCandidate(swc, data)
  } catch(e){
    console.log(e)
  }
  // send({event: "Connected to peer", data})
}

async function handleNewPeerInDimension(swc, data){
  if(!data?.id) return;  
  addPeerToScene(data.id);
}

async function handlePeerHasLeftDimension(swc, data){
  if(!data?.id) return;  
  removePeerFromScene(data.id);
}


window.onload = async () => {
  page = document.querySelector(".page");
  cameraRig = document.querySelector('#cameraRig');
  valorAmount = document.querySelector(".valorAmount");
  // page.click();
}




// function playMusic(){
//   document.querySelector("#radio").play();
// }