self.addEventListener('install', function(event) {
  event.waitUntil(self.skipWaiting()); // Activate worker immediately
});

self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim()); // Become available to all pages
})

self.addEventListener("message", async (event) => {
  console.log(event);
  if (event.data && event.data.event === 'Port connect') {
    console.log("New port connected");
    
    Port = event.ports[0];
    if(valoria.ecdsa?.publicKey && valoria.isSetup){
      Port.postMessage({event: "Valoria setup", data: {valoria: JSON.parse(JSON.stringify(valoria))}});
    }
    console.log(Port)
    // Port.onDisconnect(() => {
    //   valoria.reset();
    //   Port = null;
    // })
  } else if(event.data && event.data.event == "Connected to peer"){
    handleConnectedPeer(event.data.data);
  } else if(event.data && event.data.event == "Connect to server"){
    handleConnectToServer(event.data.data);
  } else if(event.data && event.data.event == "Send message to server"){
    handleSendMessageToServer(event.data.data)
  }
});

self.addEventListener("disconnect", async (port) => {
  console.log("DISCONNECT FROM");
  console.log(port);
})

async function handleConnectedPeer(data){
  console.log("Handle New peer conencted!")
  console.log(data);
  // console.log(valoria.conns);
  if(!valoria.conns[data.url]) valoria.conns[data.url] = {};
  valoria.conns[data.url].send = (msg) => {
    if(!Port) return;
    Port.postMessage({event: "Send p2p message", data: {msg, url: data.url}});
  }
}

async function handleConnectToServer(data){
  if(!data.url) return;
  try {
    await valoria.connectToServer(data.url);
  } catch(e){

  }
  if(!Port) return;
  Port.postMessage({event: "Connected to server", data: {url: data.url}});
}

async function handleSendMessageToServer(data){
  if(!data.url || !data.msg || !valoria.conns[data.url]) return;
  valoria.conns[data.url].send(data.msg);
  if(!Port) return;
  Port.postMessage({event: "Connected to server", data: {url: data.url}});
}

let Port;
let count = 0;
let setup = false;
console.log("yo")
importScripts("valoria.js");  

valoria.onJoin = async () => {
  setup = true;
  console.log(Port)
  if(Port?.postMessage){
    const v = JSON.parse(JSON.stringify(valoria));
    delete v.ecdh.privateKey;
    delete v.ecdsa.privateKey;
    Port.postMessage({event: "Valoria setup", data: {valoria: v}});
  }
  valoriaSent = true;
  let valorInterval = setInterval(async () => {
    const valor = await valoria.calculateValor(valoria.id);
    if(Port?.postMessage){
      Port.postMessage({event: "Valor calculation", data: {id: valoria.id, valor}});
    }
  }, valoria.syncIntervalMs)

  valoria.dimension.onPeerJoin = (id) => {
    if(Port?.postMessage){
      Port.postMessage({event: "New peer in dimension", data: {id}});
    }
  }
  valoria.dimension.onPeerLeave = (id) => {
    if(Port?.postMessage){
      Port.postMessage({event: "Peer has left dimension", data: {id}});
    }
  }
  try {
    await valoria.joinDimension("Valoria"); 
    console.log("joined dimension: " + valoria.dimension.id)
  } catch(e){
    console.log(e);
  }

}

valoria.connectToPeer = async (url) => {
  return new Promise(async (res, rej) => {
    if(Port?.postMessage){
      Port.postMessage({event: "Connect to peer", data: {url}});
    }
    res()
  })
}

valoria.handleGotRtcDescription = async (ws, data) => {
  return new Promise(async (res, rej) => {
    if(!ws.Url) return res();
    data.ws = ws.Url;
    if(Port?.postMessage){
      Port.postMessage({event: "Handle got rtc description", data});
    }
    res();
  })
}

valoria.handleGotRtcCandidate = async (ws, data) => {
  if(Port?.postMessage){
    Port.postMessage({event: "Handle got rtc candidate", data});
  }
}

(async() => {
  if(!valoria.ecdsa?.publicKey || !valoria.isSetup){
    await valoria.reset();
    try {
      await valoria.loadCredentials();
    } catch(e){
      await valoria.generateCredentials();
    }
  }
})();