const subtle = window.crypto.subtle;
const initialServers = window.location.hostname == "localhost" ? [window.location.origin + "/"] : ["https://valoria.live/"];
const iceServers = [
  {url: "stun:stun.l.google.com:19302", urls: "stun:stun.l.google.com:19302"},
  {url: "stun:stun2.l.google.com:19302", urls: "stun:stun2.l.google.com:19302"},
  {url: "stun:stun3.l.google.com:19302", urls: "stun:stun3.l.google.com:19302"},
  {url: "stun:stun4.l.google.com:19302", urls: "stun:stu4.l.google.com:19302"},
  {url: "stun:stunserver.org", urls: "stun:stunserver.org"},
  {url: "stun:stun.voiparound.com", urls: "stun:stun.voiparound.com"},
  {url: "stun:stun.voipbuster.com", urls: "stun:stun.voipbuster.com"},
  {url: "stun:stun.voipstunt.com", urls: "stun:stun.voipstunt.com"},
];


class Valoria {
 
  constructor(){ 
    this.users = {};
    this.groups = [];
    this.conns = {};
    this.peers = {};
    this.promises = {};
    this.dimension = {};
    (async () => await this.setup())()
  }
  
  setup = async () => {
    // await this.loadAllGroups();
    this.user = new ValoriaUser();
    this.user.valoria = this;
    this.connectToServer(window.location.origin)
  }

  startMediaStream = async(opts) => {
    const self = this;
    return new Promise(async(res, rej) => {
      self.stream = await navigator.mediaDevices.getUserMedia(opts);
      res();
    })
  }

  loadAllGroups = async () => {
    return new Promise(async(res, rej) => {
      if(!initialServers || initialServers.length == 0) rej("No initial servers found.");
      let servers = [...initialServers];
      let askAmount = 10;
      let askCount = 0;
      let used = [];
      while(askCount < askAmount){
        if(servers.length < 1){
          break;
        }
        const url = servers[servers.length * Math.random() << 0];
        const groups = await this.askServerForGroups(url);
        used.push(url);
        this.groups = [...new Set(groups, this.groups)];
        servers = this.groups.flat();
        for(let i=0;i<used.length;i++){
          if(servers.indexOf(used) !== -1){
            servers.splice(servers.indexOf(used[i]), 1);
          }
        }
        askCount += 1;
      }
      res();
    })
  }

  askServerForGroups(url){
    const self = this;
    return new Promise(async(res, rej) => {
      await self.connectToServer(url);
      self.promises["Got groups from " + url] = {res, rej};
      self.conns[url].send(JSON.stringify({
        event: "Get groups"
      }));
    })
  }

  connectToServer(url){
    const self = this;
    return new Promise(async (res, rej) => {
      if(this.conns[url] && this.conns[url].readyState === WebSocket.OPEN){
        res();
      } else {
        if(!this.conns[url]) {
          let wsUrl = new URL("/", url);
          wsUrl.protocol = wsUrl.protocol.replace('http', 'ws');
          this.conns[url] = new WebSocket(wsUrl.href);
        } 
        this.conns[url].Url = url;
        this.conns[url].onopen = ( async () => {
          // heartbeat(this.conns[url]);
          try {
            await this.setupWS(this.conns[url]);
            res();
          } catch (e){
            console.log(e);
            res();
          }
        });
        this.conns[url].onerror = (error) => {
          console.log(error)
          rej(error);
        }
        // this.conns[url].on('ping', () => heartbeat(self.conns[url]));
        this.conns[url].onclose = function clear() {
          console.log("CLOSED")
          clearTimeout(self.conns[url].pingTimeout);
        };
      }
    })
  }

  setupWS = async (ws) => {
    const self = this;
    return new Promise(async(res, rej) => {
      ws.onmessage = async (e) => {
        const d = JSON.parse(e.data);
        switch (d.event) {
          // case 'Get pubkey':
          //   await self.handleGetPubKey(ws)
          //   break;
          // case 'Got pubkey':
          //   await self.handleGotPubKey(ws, d.data);
          //   break;
          case 'Got groups':
            await self.handleGotGroups(ws, d.data);
            break;
          // case 'Join group':
          //   await self.handleJoinGroupRequest(ws);
          //   break;
          // case 'Joined group':
          //   await self.handleJoinedGroup(ws, d.data);
          //   break;
          // case 'Sign verification token':
          //   await self.handleSignVerificationToken(ws, d.data);
          //   break;
          // case 'Verify token signature':
          //   await self.handleVerifyTokenSignature(ws, d.data);
          //   break;
          // case 'New server in group':
          //   await self.handleNewServerInGroup(ws, d.data);
          //   break;
          // case 'New group':
          //   await self.handleNewGroup(ws, d.data);
          //   break;
          // case 'New group found':
          //   await self.handleNewGroupFound(ws, d.data);
          //   break;
          // case "Ping":
          //   await self.handlePing(ws, d.data)
          //   break;
          // case "Pong":
          //   await self.handlePong(ws, d.data)
          //   break;
          // case "Time sync request":
          //   await self.handleSyncTimeRequest(ws, d.data)
          //   break;
          // case "Refer sync interval":
          //   await self.handleReferSyncInterval(ws, d.data)
          //   break;
          case "Joined dimension":
            await self.handleJoinedDimension(ws, d.data);
            break;
          case "New peer in dimension":
            await self.handleNewPeerInDimension(ws, d.data);
            break;
          case "Peer has left dimension":
            await self.handlePeerHasLeftDimension(ws, d.data);
            break;
          case "Got rtc description":
            self.handleGotRtcDescription(ws, d.data);
            break;
          case "Got rtc candidate":
            self.handleGotRtcCandidate(ws, d.data);
            break;
        }
      }
      res();
    })
  }

  handleGotGroups(ws, data){
    const self = this;
    return new Promise(async( res, rej) => {
      if(self.promises["Got groups from " + ws.Url]){
        self.promises["Got groups from " + ws.Url].res(data)
      }
      res();
    })
  }

  joinDimension(id){
    const self = this;
    return new Promise(async (res, rej) => {
      const url = Object.keys(self.conns)[0];
      alert("JOINING DIMENSION " + id + " via " + url);
      self.promises["Joined " + id + " dimension"] = {res, rej};
      self.conns[url].send(JSON.stringify({
        event: "Join dimension",
        data: {
          id: id
        }
      }));
    })
  }

  handleJoinedDimension(ws, data){
    const self = this;
    return new Promise(async (res, rej) => {
      self.peers = {};
      const peers = data.peers;
      self.dimension = {
        id: data.dimension,
        peers,
        onPeerJoin: self.dimension.onPeerJoin || (() => {}),
        onPeerLeave: self.dimension.onPeerLeave || (() => {}),
        ws
      }
      for(let i=0;i<peers.length;i++){
        self.connectToPeer(peers[i]);
        self.dimension.onPeerJoin(peers[i]);
      }
      if(self.promises["Joined " + data.dimension + " dimension"]){
        self.promises["Joined " + data.dimension + " dimension"].res();
      }
      res();
    });
  }

  handleNewPeerInDimension(ws, data){
    const self = this;
    return new Promise(async (res, rej) => {
      if(data.dimension !== self.dimension.id || !data.peer) return;
      self.connectToPeer(data.peer);
      self.dimension.peers.push(data.peer);
      self.dimension.onPeerJoin(data.peer);
      res();
    });
  }

  handlePeerHasLeftDimension(ws, data){
    const self = this;
    return new Promise(async (res, rej) => {
      if(data.dimension !== self.dimension.id || !data.peer) return;
      self.dimension.peers.splice(self.dimension.peers.indexOf(data.peer), 1);
      self.dimension.onPeerLeave(data.peer);
      delete self.peers[data.peer];
      res();
    });
  }

  async connectToPeer(id){
    const self = this;
    if(!self.peers[id]){
      self.peers[id] = new RTCPeerConnection({iceServers});
      self.peers[id].callbacks = {};
      self.peers[id].on = (event, cb) => {
        self.peers[id].callbacks[event] = cb;
      }
      self.peers[id].onStream = self.peers[id].onStream || (() => {});
      self.peers[id].makingOffer = false;
      self.peers[id].ignoreOffer = false;
      self.peers[id].isSRDAnswerPending = false;
      self.peers[id].datachannel = self.peers[id].createDataChannel("Data");
      self.peers[id].datachannel.onopen = () => {
        self.peers[id].datachannel.onmessage = (e) => {
          if(!e || !e.data) return;
          const data = JSON.parse(e.data);
          const event = data.event;
          if(typeof self.peers[id].callbacks[event] == "function"){
            self.peers[id].callbacks[event](data.data);
          } 
        };
      };
      self.stream.getTracks().forEach(track => self.peers[id].addTrack(track, self.stream));
      self.peers[id].onicecandidate = ({candidate}) =>  {
        if(!candidate) return;
        self.dimension.ws.send(JSON.stringify({
          event: "Send rtc candidate",
          data: {
            candidate,
            id
          }
        }));
      }
      self.peers[id].onnegotiationneeded = async options => {
        if(!self.peers[id]) return;
        try {
          self.peers[id].makingOffer = true;
          await self.peers[id].setLocalDescription();
          self.dimension.ws.send(JSON.stringify({
            event: "Send rtc description",
            data: {
              desc: self.peers[id].localDescription,
              id
            }
          }));
        } catch (err) {
          console.error(err);
        } finally {
          self.peers[id].makingOffer = false;
        }
      };
      self.peers[id].oniceconnectionstatechange = () => {
        if (self.peers[id] && self.peers[id].iceConnectionState === "failed") {
          self.peers[id].restartIce();
        }
      };
      self.peers[id].ontrack = (e) => {
        self.peers[id].stream = e.streams[0];
        self.peers[id].onStream(e.streams[0]);
      }
    }
  }

  async handleGotRtcDescription(ws, data){
    const self = this;
    const description = data.desc;
    const id = data.id;
    const polite = data.polite;
    if(!self.peers[id]){
      self.peers[id] = new RTCPeerConnection({iceServers});
      self.peers[id].callbacks = {};
      self.peers[id].on = (event, cb) => {
        self.peers[id].callbacks[event] = cb;
      }
      self.peers[id].onStream = self.peers[id].onStream || (() => {});
      self.peers[id].makingOffer = false;
      self.peers[id].ignoreOffer = false;
      self.peers[id].isSRDAnswerPending = false;
      self.stream.getTracks().forEach(track => self.peers[id].addTrack(track, self.stream));
      self.peers[id].ontrack = (e) => {
        self.peers[id].stream = e.streams[0];
        self.peers[id].onStream(e.streams[0]);
      }
      self.peers[id].onicecandidate = ({candidate}) =>  {
        if(!candidate) return;
        self.dimension.ws.send(JSON.stringify({
          event: "Send rtc candidate",
          data: {
            candidate,
            id
          }
        }));
      }
    }
    self.peers[id].ondatachannel = (event) => {
      self.peers[id].datachannel = event.channel;
      self.peers[id].datachannel.onopen = () => {
        self.peers[id].datachannel.onmessage = (e) => {
          if(!e || !e.data) return;
          const data = JSON.parse(e.data);
          const event = data.event;
          if(typeof self.peers[id].callbacks[event] == "function"){
            self.peers[id].callbacks[event](data.data);
          } 
        };
      };
    };
    try {
      if (description) {
        const offerCollision = (description.type == "offer") &&
                             (self.peers[id].makingOffer || self.peers[id].signalingState != "stable");
        self.peers[id].ignoreOffer = !polite && offerCollision;
        if (self.peers[id].ignoreOffer) {
          return;
        }
        self.peers[id].isSRDAnswerPending = description.type == 'answer';
        await self.peers[id].setRemoteDescription(description);
        self.peers[id].isSRDAnswerPending = false;
        if (description.type == "offer") {
          await self.peers[id].setLocalDescription();
          self.dimension.ws.send(JSON.stringify({
            event: "Send rtc description",
            data: {
              desc: self.peers[id].localDescription,
              id: id
            }
          }));
        }
      }
    } catch(err) {
      console.error(err);
    }
  }

  async handleGotRtcCandidate(ws, data){
    const self = this;
    if(!self.peers[data.id]) return;
    try {
      if(!data.candidate) return;
      await self.peers[data.id].addIceCandidate(data.candidate)
    } catch (e) {
    }
  }

  // async onIceCandidate(pc, event) {
  //   try {

  //     await (getOtherPc(pc));
  //   } catch (e) {
  //   }
  // }
  


}

class ValoriaUser {
  constructor(id, password){
    this.id =  id;
    this.verified = false;
    this.ecdsa = {
      publicKey: null,
      privateKey: null,
    };
    this.ecdh = {
      publicKey: null,
      privateKey: null,
    };
    this.valoria = null;
    if(id && password){
      (async() => await this.signIn(id, password))()
    }
  }

  signIn = async (id, password) => {
    return new Promise(async(res, rej) => {
      res();
    })
  }

  create = async (password) => {
    const self = this;
    return new Promise(async(res, rej) => {
      self.ecdsa = await window.crypto.subtle.generateKey(
        {name: "ECDSA", namedCurve: "P-384"}, true, ["sign", "verify"]
      );
      self.ecdh = await window.crypto.subtle.generateKey(
        {name: "ECDH", namedCurve: "P-384"}, true, ["deriveKey", "deriveBits"]
      );
      const ecdsaPubHash = await crypto.subtle.digest("SHA-256", await window.crypto.subtle.exportKey("raw", self.ecdsa.publicKey));
      this.id = buf2hex(ecdsaPubHash).substr(24, 64)
      const ecdsaSalt = window.crypto.getRandomValues(new Uint8Array(16))
      const ecdsaIv = window.crypto.getRandomValues(new Uint8Array(12))
      const ecdhSalt = window.crypto.getRandomValues(new Uint8Array(16))
      const ecdhIv = window.crypto.getRandomValues(new Uint8Array(12));
      self.secret = await arrayBufferToBase64(window.crypto.getRandomValues(new Uint8Array(32)));
      const encryptKey = await window.crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password + self.secret),
        {name: "PBKDF2"},
        false,
        ["deriveBits", "deriveKey"]
      );
      let ecdhToSave = {}
      let ecdsaToSave = {}
      const ecdsaPrivWrapped = await wrapCryptoKeyGCM(self.ecdsa.privateKey, ecdsaSalt, encryptKey, ecdsaIv);
      ecdsaToSave.publicKey = await arrayBufferToBase64(await window.crypto.subtle.exportKey("raw", self.ecdsa.publicKey));
      ecdsaToSave.privateKey = JSON.stringify({
        wrapped : ecdsaPrivWrapped,
        salt: await arrayBufferToBase64(ecdsaSalt),
        iv: await arrayBufferToBase64(ecdsaIv)
      });
      const ecdhPrivWrapped = await wrapCryptoKeyGCM(self.ecdh.privateKey, ecdhSalt, encryptKey, ecdhIv);
      ecdhToSave.publicKey = await arrayBufferToBase64(await window.crypto.subtle.exportKey("raw", self.ecdh.publicKey));
      ecdhToSave.privateKey = JSON.stringify({
        wrapped : ecdhPrivWrapped,
        salt: await arrayBufferToBase64(ecdhSalt),
        iv: await arrayBufferToBase64(ecdhIv)
      });
      sessionStorage.setItem('valoria-user-secret', password + self.secret);
      // const group =  self.valoria.groups[jumpConsistentHash(self.id, self.valoria.groups.length)];
      // const url = group[group.length * Math.random() << 0];
      // console.log("SAVE USER TO " + url);
      res(self);
    })
  }

}

async function arrayBufferToBase64(buffer){
  return new Promise((res, rej) => {
    var blob = new Blob([buffer])
    var reader = new FileReader();
    reader.onload = function(event){
      var base64 = event.target.result.split(',')[1]
      res(base64);
    };
    reader.readAsDataURL(blob);
  })
}

function base64ToArrayBuffer(base64) {
  var binary_string = window.atob(base64);
  var len = binary_string.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

function buf2hex(buffer) {
  return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}

async function wrapCryptoKeyGCM(keyToWrap, salt, encryptKey, iv) {
  return new Promise(async (res, rej) => {
    // get the key encryption key
    const wrappingKey = await window.crypto.subtle.deriveKey(
      {
        "name": "PBKDF2",
        salt: salt,
        "iterations": 100000,
        "hash": "SHA-256"
      },
      encryptKey,
      { "name": "AES-GCM", "length": 256},
      true,
      [ "wrapKey", "unwrapKey" ]
    );
    const wrappedKey = await window.crypto.subtle.wrapKey(
      "jwk",
      keyToWrap,
      wrappingKey,
      {
        name: "AES-GCM",
        iv: iv
      }
    );
    const base64 = await arrayBufferToBase64(wrappedKey);
    res(base64);
  })
}

const mean = (array) => array.reduce((a, b) => a + b) / array.length;
const variance = (array) => array.length < 2 ? 0 : array.map(x => Math.pow(x - mean(array), 2)).reduce((a, b) => a + b) / (array.length - 1);
const std = (array) => Math.sqrt(variance(array));

function simpleHash(str){
  var hash = 0;
  if (str.length == 0) {
      return hash;
  }
  for (var i = 0; i < str.length; i++) {
      var char = str.charCodeAt(i);
      hash = ((hash<<10)-hash)+char;
      hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

function jumpConsistentHash(key, numBuckets) {
  let keyBigInt = BigInt(simpleHash(key));
  let b = -1n;
  let j = 0n;
  while (j < numBuckets) {
      b = j;
      keyBigInt = (keyBigInt * 2862933555777941757n) % (2n ** 64n) + 1n;
      j = BigInt(Math.floor((Number(b) + 1) * Number(1n << 31n) / Number((keyBigInt >> 33n) + 1n)));
  }
  return (Number(b));
}

async function digestMessage(message) {
  return new Promise(async (res, rej) => {
    const msgUint8 = new TextEncoder().encode(message);                           // encode as (utf-8) Uint8Array
    const hashBuffer = await subtle.digest('SHA-256', msgUint8);           // hash the message
    const hashArray = Array.from(new Uint8Array(hashBuffer));                     // convert buffer to byte array
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
    res(hashHex);
  });
}

function heartbeat(ws) {
  clearTimeout(ws.pingTimeout);
  ws.pingTimeout = setTimeout(() => {
    ws.close();
  }, 3500);
}

window.valoria = new Valoria();