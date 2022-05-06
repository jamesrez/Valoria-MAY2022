let cameraRig;
let page;
let valorAmount;
let isMobile = false;
let promises = {};
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
let sw;
let broadcast = new BroadcastChannel('valoria-worker');
broadcast.onmessage = async (event) => {
  const d = event.data;
  switch(d.event){
    case "Valoria setup":
      await handleValoriaSetup(d.data);
      break;
    case "Valor calculation":
      await handleValorCalculation(d.data);
      break;
    case "Connected to server":
      await handleConnectedToServer(d.data);
      break;
    case "Connect to peer":
      await connectToPeer(d.data);
      break;
    case "Send p2p message":
      await sendP2PMessage(d.data);
    case "Handle got rtc description":
      await handleGotRtcDescription(d.data);
      break;
    case "Handle got rtc candidate":
      await handleGotRtcCandidate(d.data);
      break;
    case "Joined dimension":
      await handleJoinedDimension(d.data);
      break;
    case "New peer in dimension":
      await handleNewPeerInDimension(d.data);
      break;
    case "Peer has left dimension":
      await handlePeerHasLeftDimension(d.data);
      break;
    case "Got valoria":
      promises["Got valoria"]?.res(d.data?.valoria);
      delete promises["Got valoria"];
      break;
  }
};

window.onload = async () => {
  page = document.querySelector(".page");
  cameraRig = document.querySelector('#cameraRig');
  valorAmount = document.querySelector(".valorAmount");
  if ('serviceWorker' in navigator) {
    try {
      const url = window.location.protocol + '//' + window.location.host + '/sw.js';
      navigator.serviceWorker.getRegistration(url).then(function (reg) {
        if (reg) {
          reg.unregister().then(() => {
            registerSW();
          });
        } else {
          registerSW();
        }
      });
    } catch(e){
      registerSW();
    }
    
    function registerSW(){
      navigator.serviceWorker.register('sw.js').then(function(reg) {
        sw = reg.active;
  
        let swLoading = setInterval(() => {
          if(reg.active){
            clearInterval(swLoading);
            sw = reg.active;
            sw.postMessage({
              event: 'Port connect',
            });
          }
        }, 10)
  
        console.log('SW registration succeeded with scope:', reg.scope);
        broadcast.postMessage({
          event: 'Port connect',
        });
      }).catch(function(e) {
        console.log('SW registration failed with error:', e);
      });
    }
  }
}



async function handleValoriaSetup(data){
  return new Promise(async (res, rej) => {
    const v = data.valoria;
    Object.assign(valoria, v);

    valoria.joinDimension = async (id) => {
      return new Promise(async (res, rej) => {
        try {
          valoria.promises["Joined dimension " + id] = {res, rej};
          broadcast.postMessage({
            event: 'Join dimension',
            data: {id}
          });
        } catch(e){

        }
      });
    }

    valoria.connectToServer = async (url) => {
      return new Promise(async (res, rej) => {
        try {
          valoria.promises["Connected to server " + url] = {res, rej};
          broadcast.postMessage({
            event: 'Connect to server',
            data: {url}
          });
          valoria.conns[url].send = async (msg) => {
            console.log("sending to server " + url);
            try {
              broadcast.postMessage({
                event: 'Send message to server',
                data: {
                  msg,
                  url
                }
              });
            } catch(e){
              console.log(e);
            }
          };
        } catch(e){
          console.log(e);
          res()
        }
      })
    }

    let conns = Object.keys(valoria.conns);
    for(let i=0;i<conns.length;i++){
      if(conns[i].includes("valoria/peers/")) continue;
      valoria.conns[conns[i]].send = async (msg) => {
        console.log("sending to server " + conns[i]);
        try {
          broadcast.postMessage({
            event: 'Send message to server',
            data: {
              msg,
              url: conns[i]
            }
          });
        } catch(e){
          console.log(e)
        }
      };
    }

    try {
      await valoria.joinDimension("Valoria");
      for(let i=0;i<valoria.dimension?.peers?.length;i++){
        addPeerToScene(valoria.dimension?.peers[i])
      }
    } catch(e){
      console.log(e)
    }
  
    res();
  })
}

async function handleValorCalculation(data){
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

async function handleConnectedToServer(data){
  if(!data.url) return;  
  if(valoria.promises["Connected to server " + data.url]){
    valoria.promises["Connected to server " + data.url].res();
  }
}

async function connectToPeer(data){
  if(!data.url) return;  
  try {
    //IF NOT SETUP YET
    if(!valoria.url){
      let v = await new Promise(async (res, rej) => {
        promises["Got valoria"] = {res, rej};
        broadcast.postMessage({event: "Get valoria"});
      })
      Object.assign(valoria, v);
      valoria.connectToServer = async (url) => {
        return new Promise(async (res, rej) => {
          try {
            valoria.promises["Connected to server " + url] = {res, rej};
            broadcast.postMessage({
              event: 'Connect to server',
              data: {url}
            });
            valoria.conns[url].send = async (msg) => {
              try {
                broadcast.postMessage({
                  event: 'Send message to server',
                  data: {
                    msg,
                    url
                  }
                });
              } catch(e){
      
              }
            };
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
            broadcast.postMessage({
              event: 'Send message to server',
              data: {
                msg,
                url: conns[i]
              }
            });
          } catch(e){
  
          }
        };
      }
    }

    await valoria.connectToPeer(data.url)
    console.log("connected to peer: " + data.url);
  } catch(e){
    console.log(e)
  }
  broadcast.postMessage({event: "Connected to peer", data})
}

async function sendP2PMessage(data){
  if(!data.url || !valoria.peers[data.url] || !data.msg) return;  
  try {
    await valoria.peers[data.url]?.datachannel.send(data.msg);
  } catch(e){
    console.log(e)
  }
}

async function handleGotRtcDescription(data){
  console.log("HANDLE GOT RTC DESCRIPTION from sw.js");
  if(!data) return;  
  // console.log("Handling rtc description for " + data.ws);
  try {
    if(valoria.conns[data.ws]) valoria.conns[data.ws].Url = data.ws;
    valoria.handleGotRtcDescription(valoria.conns[data.ws], data);
    if(valoria.peers[data.url]?.datachannel?.open){
      broadcast.postMessage({event: "Connected to peer", data})
    }
  } catch(e){
    console.log(e)
  }
}

async function handleGotRtcCandidate(data){
  if(!data) return;  
  console.log(data);
  try {
    if(valoria.conns[data.ws]) valoria.conns[data.ws].Url = data.ws;
    await valoria.handleGotRtcCandidate(valoria.conns[data.ws], data)
  } catch(e){
    console.log(e)
  }
  // send({event: "Connected to peer", data})
}

async function handleJoinedDimension(data){
  if(valoria.promises["Joined dimension " + data.dimension.id]){
    if(!data.dimension?.joined){
      valoria.promises["Joined dimension " + data.dimension.id].rej();
    } else {
      Object.assign(valoria.dimension, data.dimension);
      valoria.promises["Joined dimension " + data.dimension.id].res();
    }
  }
}

async function handleNewPeerInDimension(data){
  if(!data?.id) return;  
  await valoria.connectToPeer(data.id);
  addPeerToScene(data.id);
}

async function handlePeerHasLeftDimension(data){
  if(!data?.id) return;  
  removePeerFromScene(data.id);
}
