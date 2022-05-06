self.addEventListener('install', function(event) {
  event.waitUntil(self.skipWaiting()); // Activate worker immediately
});

self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim()); // Become available to all pages
})

self.addEventListener('message', async (event) => {
  if (event.data && event.data.event === 'Port connect') {
    console.log("New port connected from the default messager lol?");
  }
});

let broadcast = new BroadcastChannel('valoria-worker');
//self.addEventListener("message", 
broadcast.onmessage = async (event) => {
  // console.log(event);
  if (event.data && event.data.event === 'Port connect') {
    console.log("New port connected");
    
    // Port = event.ports[0];
    if(valoria.ecdsa?.publicKey && valoria.isSetup){
      broadcast.postMessage({event: "Valoria setup", data: {valoria: JSON.parse(JSON.stringify(valoria))}});
    }
    // console.log(Port)
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
  } else if(event.data && event.data.event == "Get valoria"){
    broadcast.postMessage({event: "Got valoria", data: {valoria: JSON.parse(JSON.stringify(valoria))}});
  } else if(event.data && event.data.event == "Join dimension"){
    handleJoinDimension(event.data.data)
  }
};

async function handleConnectedPeer(data){
  console.log("Handle New peer conencted!")
  console.log(data);
  // console.log(valoria.conns);
  if(!valoria.conns[data.url]) valoria.conns[data.url] = {};
  valoria.conns[data.url].send = (msg) => {
    broadcast.postMessage({event: "Send p2p message", data: {msg, url: data.url}});
  }
}

async function handleConnectToServer(data){
  if(!data.url) return;
  try {
    await valoria.connectToServer(data.url);
  } catch(e){

  }
  broadcast.postMessage({event: "Connected to server", data: {url: data.url}});
}

async function handleSendMessageToServer(data){
  console.log("Must send message to server lol");
  console.log(data);
  if(!data.url || !data.msg) return;
  try {
    await valoria.connectToServer(data.url);
    valoria.conns[data.url].send(data.msg);
  } catch(e){
    console.log(e)
  }
}

async function handleJoinDimension(data){
  if(!data.id) return;
  try {
    await valoria.joinDimension(data.id);
    broadcast.postMessage({event: "Joined dimension", data: {dimension: JSON.parse(JSON.stringify(valoria.dimension))}});
  } catch(e){
    console.log(e)
  }
}

// let Port;
let count = 0;
let setup = false;
console.log("yo")
importScripts("valoria.js");  

valoria.onJoin = async () => {
  setup = true;
  const v = JSON.parse(JSON.stringify(valoria));
  delete v.ecdh.privateKey;
  delete v.ecdsa.privateKey;
  broadcast.postMessage({event: "Valoria setup", data: {valoria: v}});
  valoriaSent = true;
  let valorInterval = setInterval(async () => {
    const valor = await valoria.calculateValor(valoria.id);
    broadcast.postMessage({event: "Valor calculation", data: {id: valoria.id, valor}});
  }, valoria.syncIntervalMs)

  valoria.dimension.onPeerJoin = (id) => {
    broadcast.postMessage({event: "New peer in dimension", data: {id}});
  }
  valoria.dimension.onPeerLeave = (id) => {
    broadcast.postMessage({event: "Peer has left dimension", data: {id}});
  }
  // try {
  //   await valoria.joinDimension("Valoria"); 
  //   for(let i=0;i<valoria.dimension?.peers?.length;i++){
  //     broadcast.postMessage({event: "New peer in dimension", data: {id}});
  //   }
  //   console.log("joined dimension: " + valoria.dimension.id)
  // } catch(e){
  //   console.log(e);
  // }

}

valoria.connectToPeer = async (url) => {
  return new Promise(async (res, rej) => {
    broadcast.postMessage({event: "Connect to peer", data: {url}});
    res()
  })
}

valoria.handleGotRtcDescription = async (ws, data) => {
  return new Promise(async (res, rej) => {
    if(!ws.Url) return res();
    data.ws = ws.Url;
    broadcast.postMessage({event: "Handle got rtc description", data});
    res();
  })
}

valoria.handleGotRtcCandidate = async (ws, data) => {
  if(!ws.Url) return res();
  data.ws = ws.Url;
  broadcast.postMessage({event: "Handle got rtc candidate", data});
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