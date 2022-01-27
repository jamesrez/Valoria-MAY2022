const isLocal = process.env.PORT ? false : true;
const http = require('http');
const fs = require('fs');
const URL = require('url').URL;
const express = require('express');
const Port = process.env.PORT || 3000;
const crypto = require('crypto');
const subtle = crypto.webcrypto.subtle;
const WebSocket = require('ws');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

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

class Server {
  constructor(port){
    this.app = express();
    this.app.enable('trust proxy');
    this.server = http.Server(this.app);
    this.port = port;
    this.wss = new WebSocket.Server({ server: this.server });
    this.conns = {};
    this.promises = {};
    this.groups = [];
    this.ECDSA = {publicKey: null, privateKey: null};
    this.ECDH = {publicKey: null, privateKey: null};
    this.dimensions = {};
    const self = this;
    if(isLocal){
      this.url = 'http://localhost:' + port;
    } else {
      this.app.use(async (req, res, next) => {
        next();
        if(!self.url && !self.verifyingSelf){
          self.verifyingSelf = true;
          try {
            let url = req.protocol + "://" + req.get('host') + "/";
            self.selfKey = Buffer.from(crypto.randomBytes(32)).toString('hex');
            const data = (await axios.get(url + "valoria/self-verification")).data;
            if(data.key == self.selfKey){
              self.url = url;
              await this.setup();
            }
            self.verifyingSelf = false;
            self.selfKey = "";
          } catch(e){
            console.log(e)
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
    self.wss.on('connection', async (ws) => {
      await self.setupWS(ws);
    })
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
    await self.loadAllGroups();
    await self.joinGroup();
    console.log(self.groups)
    // console.log(self.url + " is setup");
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
    app.get('/valoria/self-verification', async(req, res) => {
      res.send({key: self.selfKey});
    })
  }

  connectToServer(url){
    const self = this;
    return new Promise(async (res, rej) => {
      if(this.conns[url] && this.conns[url].readyState === WebSocket.OPEN){
        res();
      } else {
        if(!this.conns[url]) {
          let wsUrl = "ws://" + new URL(url).host + "/"
          this.conns[url] = new WebSocket(wsUrl);
          this.conns[url].Url = url;
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
          console.log(error)
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

  loadAllGroups = async () => {
    const self = this;
    return new Promise(async(res, rej) => {
      let initialServers = isLocal ? ['http://localhost:3000/'] : require('servers.json');
      if(!initialServers || initialServers.length == 0) rej("No initial servers found.");
      let servers = [...initialServers];
      let askAmount = 10;
      let askCount = 0
      if(servers.length == 1 && servers[0] == self.url){
        //FIRST SERVER IN NETWORK
        res();
        return;
      }
      if(servers.indexOf(self.url) !== -1){
        servers.splice(servers.indexOf(this.url), 1);
        if(servers.length < 1) rej("No initial servers found.")
      }
      let used = [self.url];
      while(askCount < askAmount){
        if(servers.length < 1){
          break;
        }
        const url = servers[servers.length * Math.random() << 0];
        const groups = new Promise(async(res, rej) => {
          await self.connectToServer(url);
          self.promises["Got groups from " + url] = {res, rej};
          self.conns[url].send(JSON.stringify({
            event: "Get groups"
          }));
        })
        if(groups.length > self.groups.length){
          self.groups = [...groups];
        }
        used.push(url);
        servers = self.groups.flat();
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

  joinGroup = async () => {
    const self = this;
    return new Promise(async (res, rej) => {
      const groups = [...self.groups];
      let willCreateGroup = true;
      while(groups.length > 0 && !self.group){
        const group = groups[groups.length * Math.random() << 0];
        const url = group[group.length * Math.random() << 0];
        groups.splice(group, 1);
        try {
          self.group = await new Promise(async(res, rej) => {
            try {
              await self.connectToServer(url);
              self.promises["Joined group from " + url] = {res, rej};
              self.conns[url].send(JSON.stringify({
                event: "Join group",
              }));
            } catch(e){
              console.log(e)
            } 
          });
          willCreateGroup = false;
          console.log(self.url + " has joined group " + self.group.index);
          self.groups[self.group.index] = self.group.servers;
          self.conns[url].send(JSON.stringify({
            event: "Joined group success"
          }));
        } catch (e){
          continue;
        }
      }
      if(willCreateGroup){
        try {
          await self.requestNewGroup();
          await self.createGroup();
        } catch (e){
          await self.loadAllGroups();
          await self.joinGroup();
        }
      }
    });
  }

  requestNewGroup(){
    const self = this;
    return new Promise(async(res, rej) => {
      const groupIndex = self.groups.length;
      if(groupIndex == 0) return res();
      const url = self.groups[groupIndex - 1][self.groups[groupIndex - 1]?.length * Math.random() << 0];
      await self.connectToServer(url);
      self.promises["New group response from " + url] = {res, rej};
      self.conns[url].send(JSON.stringify({
        event: "Request new group",
        data: {
          index: groupIndex
        }
      }));
    })
  }

  createGroup = async () => {
    const self = this;
    return new Promise(async (res, rej) => {
      try {
        self.group = {
          index : self.groups.length,
          members: [self.url],
          version: 0,
          created: self.now()
        }
        self.groups.push([self.url]);
        console.log(self.url + " created group " + self.group.index);
        if(self.group.index > 0){
          const url = self.groups[self.group.index - 1][self.groups[self.group.index - 1]?.length * Math.random() << 0];
          await self.connectToServer(url);
          self.promises["New group found at " + url] = {res, rej};
          self.conns[url].send(JSON.stringify({
            event: "New group",
            data: {
              group: self.group
            }
          }));
          return res()
        } else {
          return res();
        }
      } catch (e){
        console.log(e)
      }
    })
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
          case 'Get groups':
            await self.handleGetGroups(ws);
            break;
          case 'Got groups':
            await self.handleGotGroups(ws, d.data);
            break;
          case 'Request new group':
            await self.handleRequestNewGroup(ws, d.data);
            break;
          case 'New group response':
            await self.handleNewGroupResponse(ws, d.data);
            break;
          case 'Join group':
            await self.handleJoinGroupRequest(ws);
            break;
          case 'Joined group':
            await self.handleJoinedGroup(ws, d.data);
            break;
          case 'Joined group success':
            await self.handleJoinedGroupSuccess(ws);
            break;
          // case 'Sign verification token':
          //   await self.handleSignVerificationToken(ws, d.data);
          //   break;
          // case 'Verify token signature':
          //   self.handleVerifyTokenSignature(ws, d.data);
          //   break;
          case 'New server in group':
            await self.handleNewServerInGroup(ws, d.data);
            break;
          case 'New group':
            await self.handleNewGroup(ws, d.data);
            break;
          case 'New group found':
            await self.handleNewGroupFound(ws, d.data);
            break;
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
      if(self.promises["Got groups from " + ws.Url]){
        self.promises["Got groups from " + ws.Url].res(data)
      }
      return res();
    })
  }

  handleJoinGroupRequest = async (ws) => {
    const self = this;
    return new Promise(async (res, rej) => {
      try {
        const g = self.group;
        if(g.servers.indexOf(ws.Url) !== -1){
          ws.send(JSON.stringify({
            event: "Joined group",
            data: {err: "Already joined group"}
          }));
          res();
          return
        }
        if(g.members.length < g.max){
          g.updated = self.now();
          g.version += 1;
          g.members.push(ws.Url);
          self.groups[g.index] = g.members;
          self.conns[ws.Url].send(JSON.stringify({
            event: "Joined group",
            data: g
          }));
          await (async () => {
            return new Promise((res, rej) => {
              self.promises["Joined group success from " + ws.Url] = {res, rej};
            })
          })
          for(let i=0;i<g.members?.length;i++){
            if(g.members[i] == self.url || g.members[i] == ws.Url) continue;
            await self.connectToServer(g.members[i]);
            self.conns[g.members[i]].send(JSON.stringify({
              event: "New member in group",
              data: g
            }))
          }
          if(self.groups[g.index - 1]?.length > 0){
            const servers = self.groups[g.index - 1];
            const url = servers[servers.length * Math.random() << 0];
            await self.connectToServer(url);
            await self.verifyConnection(self.conns[url]);
            self.conns[url].send(JSON.stringify({
              event: "New member in group",
              data: g
            }))
          }
          if(self.groups[g.index + 1]?.length > 0){
            const servers = self.groups[g.index + 1];
            const url = servers[servers.length * Math.random() << 0];
            await self.connectToServer(url);
            await self.verifyConnection(self.conns[url]);
            self.conns[url].send(JSON.stringify({
              event: "New server in group",
              data: g
            }))
          }
          res()
          return
        } else {
          ws.send(JSON.stringify({
            event: "Joined group",
            data: {err: "Not seeking new members"}
          }));
          res();
          return
        }
      } catch (e){
        console.log(e);
        res();
      }
    })
  }

  handleJoinedGroup(ws, data){
    const self = this;
    return new Promise(async (res, rej) => {
      if(self.promises["Joined group from " + ws.Url]){
        if(data.err) {
          self.promises["Joined group from " + ws.Url].rej();
        } else {
          self.promises["Joined group from " + ws.Url].res(data)
        }
      }
      res();
    })
  }

  handleJoinedGroupSuccess(ws){
    const self = this;
    return new Promise((res, rej) => {
      if(self.promises["Joined group success from " + ws.Url]){
        self.promises["Joined group success from " + ws.Url].res();
      }
      res()
    })
  }

  handleRequestNewGroup = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!data.index) return res();
      if(data.index == self.groups.length){
        ws.send(JSON.stringify({
          event: "New group response",
          data: {
            success: true
          }
        }))
      } else {
        ws.send(JSON.stringify({
          event: "New group response",
          data: {
            success: false
          }
        }))
      }
      return res();
    })
  }

  handleNewGroupResponse = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!self.promises["New group response from " + ws.Url]) return res();
      if(data.success){
        self.promises["New group response from " + ws.Url].res();
      } else {
        self.promises["New group response from " + ws.Url].rej();
      }
    })
  }

  handleNewGroup = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      try {
        if(!ws.Url && data.url){
          await this.connectToServer(data.url);
        }
        if(!data.group || data.group.index < 0 || !ws.Url) return
        if(data.group.index !== self.groups.length) {
          ws.send(JSON.stringify({
            event: "New group found",
            data: {success: false}
          }))
        }
        if(self.group.members.indexOf(ws.Url) !== -1){
          self.groups.push(data.group.members);
          // await fs.writeFileSync(`${self.path}groups.json`, JSON.stringify(self.groups, null, 2));
        }
        else if((data.group.index == self.groups.length && data.group.index == self.index + 1) || self.groups[self.group.index + 1]?.indexOf(ws.Url) !== -1){
          self.groups.push(data.group.members);
          for(let i=0;i<self.group.members.length;i++){
            if(self.group.members[i] == self.url) continue;
            await self.connectToServer(self.group.members[i]);
            self.conns[self.group.members[i]].send(JSON.stringify({
              event: "New group",
              data
            }))
          }
          if(self.group.index > 0 && self.groups[self.group.index - 1]){
            const url = self.groups[self.group.index - 1][self.groups[self.group.index - 1]?.length * Math.random() << 0];
            await self.connectToServer(url);
            // await self.verifyConnection(self.conns[url]);
            self.conns[url].send(JSON.stringify({
              event: "New group",
              data: {
                ...data,
                url: self.url
              }
            }))
          }
          // await fs.writeFileSync(`${self.path}groups.json`, JSON.stringify(self.groups, null, 2));
          ws.send(JSON.stringify({
            event: "New group found",
            data: {success: true}
          }))
        }
      } catch(e){
        console.log(e)
      }
      res();
    })
  }

  handleNewGroupFound = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(self.promises["New group found at " + ws.Url]){
        if(data.success){
          self.promises["New group found at " + ws.Url].res()
        } else {
          self.promises["New group found at " + ws.Url].rej()
        }
      }
      res();
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

let localServerCount = 3;
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

