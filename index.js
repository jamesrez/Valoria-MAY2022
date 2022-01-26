const isLocal = process.env.PORT ? false : true;
const http = require('http');
const fs = require('fs');
const express = require('express');
const Port = process.env.PORT || 3000;
const crypto = require('crypto');
const subtle = crypto.webcrypto.subtle;
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

class Server {
  constructor(port){
    this.app = express();
    this.server = http.Server(this.app);
    this.port = port;
    this.wss = new WebSocket.Server({ server: this.server });
    this.conns = {};
    this.promises = {};
    this.ECDSA = {publicKey: null, privateKey: null};
    this.ECDH = {publicKey: null, privateKey: null};
    this.dimensions = {};
    const self = this;
    this.wss.on('connection', async (ws) => {
      await self.setupWS(ws);
    })
    if(isLocal){
      this.url = 'ws://localhost:' + port;
    } else {
      this.app.use(async (req, res, next) => {
        next();
        if(!self.url){
          const url = "ws://" + req.get('host') + "/";
          try {
            await this.connectToServer(url);
            await this.verifyIsSelf(url);
            self.url = url;
            await this.setup();
          } catch(e){

          }
        }
      });
    }
    this.setupRoutes();
    this.server.listen(port, () => {
      console.log("Server started on port " + port);
    })
  }

  setup = async () => {
    const self = this;
    let pathUrl = self.url.replace(/\//g, "");
    self.pathUrl = pathUrl.replace(/\:/g, "");
    self.path = `${__dirname}/data/servers/${self.pathUrl}/`;
    fs.mkdirSync(self.path, {recursive: true});
    try {
      await this.loadCredentials()
    } catch(e){
      await this.generateCredentials();
    }
    const heartbeatInterval = setInterval(() => {
      self.wss.clients.forEach(function each(ws) {
        if (ws.isAlive === false) {
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 2500);
    self.wss.on('close', function close() {
      clearInterval(heartbeatInterval);
    });
    console.log(self.url + " is setup");
  }

  setupRoutes = async () => {
    const self = this;
    const app = self.app;
    app.use(express.static('client'));
    app.set('views', 'client')
    app.set('view engine', 'pug');
    app.get('/', async (req, res) => {
      res.render('index')
    })
  }

  connectToServer(url){
    const self = this;
    return new Promise(async (res, rej) => {
      if(this.conns[url] && this.conns[url].readyState === WebSocket.OPEN){
        res();
      } else {
        if(!this.conns[url]) {
          this.conns[url] = new WebSocket(url);
        } 
        this.conns[url].onopen = ( async () => {
          try {
            await this.setupWS(this.conns[url]);
            res();
          } catch (e){
            console.log(e);
            rej(e);
          }
        });
        this.conns[url].onerror = (error) => {
          rej(error);
        }
        this.conns[url].onclose = function clear() {
          clearTimeout(self.conns[url].pingTimeout);
        };
      }
    })
  }

  loadCredentials = async () => {
    const self = this;
    return new Promise(async(res, rej) => {
      const credentials = await self.load("credentials.json");
      if(!credentials){
        return rej();
      } else {
        const ecdsaPub = await subtle.importKey(
          'raw',
          Buffer.from(credentials.ecdsaPub, 'base64'),
          {
            name: 'ECDSA',
            namedCurve: 'P-384'
          },
          true,
          ['verify']
        )
        const ecdsaPubHash = await subtle.digest("SHA-256", Buffer.from(credentials.ecdsaPub, 'base64'));
        const id = Buffer.from(ecdsaPubHash).toString('hex').substr(24, 64);
        self.id = id;
        self.ECDSA.publicKey = ecdsaPub;
        const keyMaterial = await subtle.importKey(
          "raw",
          new TextEncoder().encode(credentials.secret),
          {name: "PBKDF2"},
          false,
          ["deriveBits", "deriveKey"]
        );
        const salt = Buffer.from(credentials.ecdsaPrv.salt, 'base64');
        const unwrappingKey = await subtle.deriveKey(
          {
            "name": "PBKDF2",
            salt: salt,
            "iterations": 100000,
            "hash": "SHA-256"
          },
          keyMaterial,
          { "name": "AES-GCM", "length": 256},
          true,
          [ "wrapKey", "unwrapKey" ]
        );
        const iv = Buffer.from(credentials.ecdsaPrv.iv, 'base64');
        const ecdsaPrv = await subtle.unwrapKey(
          "jwk",
          Buffer.from(credentials.ecdsaPrv.wrapped, 'base64'),
          unwrappingKey,
          {
            name: "AES-GCM",
            iv: iv
          },
          {                      
            name: "ECDSA",
            namedCurve: "P-384"
          },  
          true,
          ["sign"]
        )
        self.ECDSA.privateKey = ecdsaPrv;
        return res();
      }
      //Loading
    });
  }

  generateCredentials = async () => {
    const self = this;
    return new Promise(async(res, rej) => {
      try {
        const ecdsaPair = await subtle.generateKey(
          {
            name: 'ECDSA',
            namedCurve: 'P-384'
          },
          true,
          ['sign', 'verify']
        );
        const ecdsaPub = await subtle.exportKey('raw', ecdsaPair.publicKey)
        const ecdsaPubHash = await subtle.digest("SHA-256", Buffer.from(ecdsaPub));
        const id = Buffer.from(ecdsaPubHash).toString('hex').substr(24, 64);
        self.id = id;
        self.ECDSA.publicKey = ecdsaPair.publicKey;
        self.ECDSA.privateKey = ecdsaPair.privateKey;
        let secret = Buffer.from(crypto.randomBytes(32)).toString('hex');
        const keyMaterial = await subtle.importKey(
          "raw",
          new TextEncoder().encode(secret),
          {name: "PBKDF2"},
          false,
          ["deriveBits", "deriveKey"]
        );
        const salt = crypto.randomBytes(16);
        const wrappingKey = await subtle.deriveKey(  
          {
            "name": "PBKDF2",
            salt: salt,
            "iterations": 100000,
            "hash": "SHA-256"
          },
          keyMaterial,
          { "name": "AES-GCM", "length": 256},
          true,
          [ "wrapKey", "unwrapKey" ]
        );
        const iv = crypto.randomBytes(12);
        const wrappedKey = await subtle.wrapKey(
          "jwk",
          ecdsaPair.privateKey,
          wrappingKey,
          {
            name: "AES-GCM",
            iv: iv
          }
        );
        const wrapped = Buffer.from(wrappedKey).toString('base64');
        const prvKeyData = {wrapped : wrapped, salt: Buffer.from(salt).toString('base64'), iv: Buffer.from(iv).toString('base64')};
        const credentials = {
          ecdsaPub: Buffer.from(ecdsaPub).toString('base64'),
          ecdsaPrv: prvKeyData,
          secret
        }
        await fs.writeFileSync(`${self.path}credentials.json`, JSON.stringify(credentials, null, 2));
        await fs.writeFileSync(`${self.path}server.json`, JSON.stringify({
          ecdsaPub: Buffer.from(ecdsaPub).toString('base64'),
        }, null, 2))
        res();
      } catch(e){
        console.log(e);
        rej(e);
      }
    });
  }

  save = async (path, data) => {
    const self = this;
    return new Promise(async(res, rej) => {
      await fs.mkdirSync(`${self.path}${path.substr(0, path.lastIndexOf("/"))}`, {recursive: true});
      await fs.writeFileSync(`${self.path}${path}`, JSON.stringify(data, null, 2));
      res();
    })
  }

  load = (path) => {
    const self = this;
    return new Promise(async(res, rej) => {
      try {
        let data = fs.readFileSync(`${self.path}${path}`, "utf-8");
        data = JSON.parse(data);
        res(data);
      } catch (e){
        res(null);
      }
    });
  }

  async verifyIsSelf(url){
    const self = this;
    return new Promise(async(res, rej) => {
      if(!self.conns[url]) return rej();
      self.promises["Verified self with " + url] = {res, rej};
      self.selfKey = Buffer.from(crypto.randomBytes(32)).toString('hex');
      self.conns[url].send(JSON.stringify({
        event: "Verify self"
      }));
    });
  }

  setupWS = async (ws) => {
    const self = this;
    return new Promise(async(res, rej) => {
      ws.id = ws.id || uuidv4();
      self.conns[ws.id] = ws;
      ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
      })
      ws.on('close', () => {
        if(self.conns[ws.id].dimension && self.dimensions[ws.dimension]){
          delete self.dimensions[ws.dimension].conns[ws.id];
          const peers = Object.keys(self.dimensions[ws.dimension].conns)
          for(let i=0;i<peers.length;i++){
            self.dimensions[ws.dimension].conns[peers[i]].send(JSON.stringify({
              event: "Peer has left dimension",
              data: {
                dimension: ws.dimension,
                peer: ws.id
              }
            }))
          }
        }
        delete self.conns[ws.id];
      })
      ws.on('message', async (d) => {
        d = JSON.parse(d);
        switch (d.event) {
          // case 'Get pubkey':
          //   await self.handleGetPubKey(ws, d.data);
          //   break;
          // case 'Got pubkey':
          //   await self.handleGotPubKey(ws, d.data);
          //   break;
          case 'Verify self':
            self.handleVerifySelf(ws);
            break;
          case 'Verified self':
            self.handleVerifiedSelf(ws, d.data);
            break;
          case 'Get groups':
            await self.handleGetGroups(ws);
            break;
          case 'Got groups':
            await self.handleGotGroups(ws, d.data);
            break;
          // case 'Request new group':
          //   await self.handleRequestNewGroup(ws, d.data);
          //   break;
          // case 'New group response':
          //   await self.handleNewGroupResponse(ws, d.data);
          //   break;
          // case 'Join group':
          //   await self.handleJoinGroupRequest(ws);
          //   break;
          // case 'Joined group':
          //   await self.handleJoinedGroup(ws, d.data);
          //   break;
          // case 'Joined group success':
          //   await self.handleJoinedGroupSuccess(ws);
          //   break;
          // case 'Sign verification token':
          //   await self.handleSignVerificationToken(ws, d.data);
          //   break;
          // case 'Verify token signature':
          //   self.handleVerifyTokenSignature(ws, d.data);
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
          // case "Request group signature":
          //   await self.handleRequestGroupSignature(ws, d.data)
          //   break;
          // case "Got group signature":
          //   self.handleGotGroupSignature(ws, d.data);
          //   break;
          // case "Request group member signature":
          //   await self.handleRequestMemberSignature(ws, d.data)
          //   break;
          // case "Got group member signature":
          //   await self.handleGotMemberSignature(ws, d.data)
          //   break;
          // case "Request group replication":
          //   await self.handleRequestGroupReplication(ws, d.data);
          //   break;
          case "Join dimension":
            await self.handleJoinDimension(ws, d.data);
            break;
          case "Send rtc description":
            self.handleSendRtcDescription(ws, d.data);
            break;
          case "Send rtc candidate":
            self.handleSendRtcCandidate(ws, d.data);
            break;
        }
      })
      res();
    })
  }

  now(){
    return Math.round(Date.now() + this.timeOffset + this.testOffset);
  }

  heartbeat(ws){
    clearTimeout(ws.pingTimeout);
    ws.pingTimeout = setTimeout(() => {
      ws.terminate();
    }, 3500);
  }

  handleVerifySelf(ws){
    if(!this.selfKey) return;
    ws.send(JSON.stringify({
      event: "Verified self",
      data: this.selfKey
    }))
  }

  handleVerifiedSelf(ws, data){
    const self = this;
    if(!self.promises["Verified self with " + ws.url]) return;
    if(self.selfKey == data){
      self.promises["Verified self with " + ws.url].res()
    } else {
      self.promises["Verified self with " + ws.url].rej();
    }
    self.selfKey = "";
  }

  handleGetGroups(ws){
    const self = this;
    return new Promise(async( res, rej) => {
      ws.send(JSON.stringify({
        event: "Got groups",
        data: self.groups
      }))
      return res();
    })
  }

  handleGotGroups(ws, data){
    const self = this;
    return new Promise(async( res, rej) => {
      if(self.promises["Got groups from " + ws.url]){
        self.promises["Got groups from " + ws.url].res(data)
      }
      return res();
    })
  }

  handleJoinDimension(ws, data){
    const self = this;
    return new Promise(async( res, rej) => {
      const id = data.id;
      if(!self.dimensions[id]) self.dimensions[id] = {conns: {}};
      const peers = Object.keys(self.dimensions[id].conns)
      self.dimensions[id].conns[ws.id] = ws;
      self.conns[ws.id].dimension = id;
      ws.send(JSON.stringify({
        event: "Joined dimension",
        data: {
          dimension: id,
          peers
        }
      }))
      for(let i=0;i<peers.length;i++){
        self.dimensions[id].conns[peers[i]].send(JSON.stringify({
          event: "New peer in dimension",
          data: {
            peer: ws.id,
            dimension: id
          }
        }));
      }
      res();
    })
  }

  handleSendRtcDescription(ws, data){
    const self = this;
    if(!self.conns[data.id]) return;
    if(!self.conns[data.id].peers) self.conns[data.id].peers = {};
    if(!self.conns[ws.id].peers) self.conns[ws.id].peers = {};
    if(!self.conns[ws.id].peers[data.id]){
      self.conns[ws.id].peers[data.id] = {polite: false};
      self.conns[data.id].peers[ws.id] = {polite: true};
    }
    self.conns[data.id].send(JSON.stringify({
      event: "Got rtc description",
      data: {
        id: ws.id,
        desc: data.desc,
        polite: self.conns[ws.id].peers[data.id]?.polite,
      }
    }));
  }

  handleSendRtcCandidate(ws, data){
    const self = this;
    if(!self.conns[data.id]) return;
    self.conns[data.id].send(JSON.stringify({
      event: "Got rtc candidate",
      data: {
        id: ws.id,
        candidate: data.candidate
      }
    }))
  }

  

}

let localServerCount = 1;
if(isLocal){
  (async () => {
    for(let i=0;i<localServerCount;i++){
      const server = new Server(i + Port);
      await server.setup();
    }
  })();
} else {
  const server = new Server(Port);
}

