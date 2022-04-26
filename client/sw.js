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
    if(setup){
      Port.postMessage({event: "Valoria setup", data: {valoria: JSON.parse(JSON.stringify(valoria))}});
    }
    console.log(Port)
  } else if(event.data && event.data.event == "Connected to peer"){
    handleConnectedPeer(event.data.data);
  }
});

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

let Port;
let count = 0;
let setup = false;
console.log("yo")
importScripts("valoria.js");  

valoria.onJoin = async () => {
  setup = true;
  console.log(Port)
  if(Port?.postMessage){
    Port.postMessage({event: "Valoria setup", data: {valoria: JSON.parse(JSON.stringify(valoria))}});
  }
  valoriaSent = true;
  let valorInterval = setInterval(async () => {
    const valor = await valoria.calculateValor(valoria.id);
    if(Port?.postMessage){
      Port.postMessage({event: "Valor calculation", data: {id: valoria.id, valor}});
    }
  }, valoria.syncIntervalMs)
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
  try {
    await valoria.loadCredentials();
  } catch(e){
    await valoria.generateCredentials();
  }
})();