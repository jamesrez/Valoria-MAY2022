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
const { off } = require('process');

function getDirContents(dir, results=[]){
  if(!fs.existsSync(dir + "/")) return [];
  let list = fs.readdirSync(dir + "/");
  for(let i=0;i<list.length;i++){
    let file = list[i];
    if(dir !== __dirname){
      file = dir + '/' + file;
    }
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      getDirContents(file, results);
    } else { 
      file = file.substr((__dirname + "/data/").length);
      results.push(file);
    }
  }
  return results;
};

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
    this.wss = new WebSocket.Server({ 
      server: this.server,
      maxPayload: 512 * 1024 * 1024
    });
    this.conns = {};
    this.promises = {};
    this.groups = [];
    this.verifying = {};
    this.ECDSA = {publicKey: null, privateKey: null};
    this.ECDH = {publicKey: null, privateKey: null};
    this.dimensions = {};
    this.timeOffset = 0;
    this.testOffset = 0;
    this.syncIntervalMs = 10000;
    this.ownerId = process.env.VALORIA_USER_ID;
    const self = this;
    if(isLocal){
      this.url = 'http://localhost:' + port + "/";
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
    self.ownerId = self.ownerId ? self.ownerId : self.id; 
    self.public.ownerId = self.ownerId;
    self.app.get('/valoria/public', async (req, res) => {
      res.send(self.public)
    });
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
    self.syncInterval();
    await self.joinGroup();
    // self.valor = await self.calculateValor(self.url);
    // console.log(self.url + " has " + self.valor + " valor");
    // console.log(self.groups)
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
          try {
            let wsUrl = "ws://" + new URL(url).host + "/"
            // if(url.startsWith('https')){
            //   wsUrl = "wss://" + new URL(url).host + "/"
            // }
            this.conns[url] = new WebSocket(wsUrl);
            this.conns[url].Url = url;
          } catch(e){
            console.log(e)
          }
        } 
        this.conns[url].onopen = ( async () => {
          try {
            await this.setupWS(this.conns[url]);
            await new Promise(async(res, rej) => {
              self.promises["Url verified with " + url] = {res, rej};
              self.conns[url].send(JSON.stringify({
                event: "Verify url request",
                data: {
                  url: self.url
                }
              }))
            })
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
      const credentials = await self.getLocal("credentials.json");
      const secret = await self.getLocal("secret");
      if(!credentials || !secret){
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
        const ecdhPub = await subtle.importKey(
          'raw',
          Buffer.from(credentials.ecdhPub, 'base64'),
          {
            name: 'ECDH',
            namedCurve: 'P-384'
          },
          true,
          ["deriveKey"]
        )
        self.ECDH.publicKey = ecdhPub;
        const keyMaterial = await subtle.importKey(
          "raw",
          new TextEncoder().encode(secret),
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
        const ecdhPrv = await subtle.unwrapKey(
          "jwk",
          Buffer.from(credentials.ecdhPrv.wrapped, 'base64'),
          unwrappingKey,
          {
            name: "AES-GCM",
            iv: iv
          },
          {                      
            name: "ECDH",
            namedCurve: "P-384"
          },  
          true,
          ["deriveKey"]
        )
        self.ECDSA.privateKey = ecdsaPrv;
        self.ECDH.privateKey = ecdhPrv;
        self.public = {
          ecdsaPub: credentials.ecdsaPub,
          ecdhPub: credentials.ecdhPub,
          id,
          url: self.url
        }
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
        const ecdhPair = await subtle.generateKey(
          {
            name: 'ECDH',
            namedCurve: 'P-384'
          },
          true,
          ['deriveKey']
        );
        const ecdhPub = await subtle.exportKey('raw', ecdhPair.publicKey)
        self.ECDH.publicKey = ecdhPair.publicKey;
        self.ECDH.privateKey = ecdhPair.privateKey;
        const secret = Buffer.from(crypto.randomBytes(32)).toString('hex');
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
        const wrappedECDSAKey = await subtle.wrapKey(
          "jwk",
          ecdsaPair.privateKey,
          wrappingKey,
          {
            name: "AES-GCM",
            iv: iv
          }
        );
        const wrappedECDSA = Buffer.from(wrappedECDSAKey).toString('base64');
        const prvKeyDataECDSA = {wrapped : wrappedECDSA, salt: Buffer.from(salt).toString('base64'), iv: Buffer.from(iv).toString('base64')};
        const wrappedECDHKey = await subtle.wrapKey(
          "jwk",
          ecdhPair.privateKey,
          wrappingKey,
          {
            name: "AES-GCM",
            iv: iv
          }
        );
        const wrappedECDH = Buffer.from(wrappedECDHKey).toString('base64');
        const prvKeyDataECDH = {wrapped : wrappedECDH, salt: Buffer.from(salt).toString('base64'), iv: Buffer.from(iv).toString('base64')};
        const credentials = {
          ecdsaPub: Buffer.from(ecdsaPub).toString('base64'),
          ecdsaPrv: prvKeyDataECDSA,
          ecdhPub: Buffer.from(ecdhPub).toString('base64'),
          ecdhPrv: prvKeyDataECDH,
        }
        await self.setLocal("credentials.json", credentials);
        await self.setLocal("secret", secret);
        self.public = {
          ecdsaPub: Buffer.from(ecdsaPub).toString('base64'),
          ecdhPub: Buffer.from(ecdhPub).toString('base64'),
          id,
          url: self.url
        }
        await self.setLocal("public.json", self.public);
        res();
      } catch(e){
        console.log(e);
        rej(e);
      }
    });
  }

  setLocal = async (path, data) => {
    const self = this;
    return new Promise(async(res, rej) => {
      await fs.mkdirSync(`${self.path}${path.substr(0, path.lastIndexOf("/"))}`, {recursive: true});
      if(typeof data == "object"){
        data =  JSON.stringify(data, null, 2);
      }
      await fs.writeFileSync(`${self.path}${path}`, data);
      res();
    })
  }

  getLocal = (path) => {
    const self = this;
    return new Promise(async(res, rej) => {
      try {
        let data = fs.readFileSync(`${self.path}${path}`, "utf-8");
        try {
          data = JSON.parse(data);
        } catch(e){

        }
        res(data);
      } catch (e){
        res(null);
      }
    });
  }

  get = async (path, opts={}) => {
    const self = this;
    return new Promise(async(res, rej) => {
      const groupIndex = jumpConsistentHash("data/" + path, self.groups.length);
      if(groupIndex == self.group.index){
        const data = await self.getLocal("all/data/" + path);
        return res(data);
      } else {
        const members = self.groups[groupIndex]
        const url = members[members.length * Math.random() << 0];
        await self.connectToServer(url);
        self.promises["Got data from " + url + " for " + path] = {res, rej};
        self.conns[url].send(JSON.stringify({
          event: "Get",
          data: {
            path,
            group: self.group.index
          }
        }))
      }
    })
  }

  set = async (path, data, opts={}) => {
    const self = this;
    return new Promise(async(res, rej) => {
      if(!self.group) return res();
      await self.createSetRequest(path, data);
      const groupIndex = jumpConsistentHash("data/" + path, self.groups.length);
      if(groupIndex == self.group.index){
        await self.setLocal("all/data/" + path, data);
        for(let i=0;i<self.group.members.length;i++){
          if(self.group.members[i] == self.url) continue;
          await self.connectToServer(self.group.members[i]);
          self.conns[self.group.members[i]].send(JSON.stringify({
            event: "Group set",
            data: {
              path: "data/" + path,
              data: data
            }
          }));
        }
        return res();
      } else {
        const members = self.groups[groupIndex];
        const url = members[members.length * Math.random() << 0];
        await self.connectToServer(url);
        self.promises["Set data from " + url + " for " + path] = {res, rej};
        self.conns[url].send(JSON.stringify({
          event: "Set",
          data: {
            path,
            data,
            group: self.group.index
          }
        }))
      }
    })
  }

  createSetRequest = async (path, data) => {
    const self = this;
    return new Promise(async(res, rej) => {
      if(!self.group) return res();
      const groupIndex = jumpConsistentHash("requests/" + path, self.groups.length);
      const dataHashSig = await self.sign(JSON.stringify(data));
      const request = {
        from: self.id,
        url: self.url,
        path,
        data: Buffer.from(dataHashSig).toString('base64'),
        group: self.group.index,
        sync: self.lastSync
      }
      if(groupIndex == self.group.index){
        await self.setLocal("all/requests/" + path, request);
        for(let i=0;i<self.group.members.length;i++){
          if(self.group.members[i] == self.url) continue;
          await self.connectToServer(self.group.members[i]);
          self.conns[self.group.members[i]].send(JSON.stringify({
            event: "Group set",
            data: {
              path: "requests/" + path,
              data: request
            }
          }));
        }
        return res();
      } else {
        const members = self.groups[groupIndex];
        const url = members[members.length * Math.random() << 0];
        await self.connectToServer(url);
        self.promises["Sent request to " + url + " for " + path] = {res, rej};
        self.conns[url].send(JSON.stringify({
          event: "Set request",
          data: {
            request
          }
        }))
      }
    })
  }

  getSetRequest = async (path) => {
    const self = this;
    return new Promise(async(res, rej) => {
      const groupIndex = jumpConsistentHash("requests/" + path, self.groups.length);
      if(groupIndex == self.group.index){
        const data = await self.getLocal("all/requests/" + path);
        return res(data);
      } else {
        const members = self.groups[groupIndex]
        const url = members[members.length * Math.random() << 0];
        await self.connectToServer(url);
        self.promises["Got set request from " + url + " for " + path] = {res, rej};
        self.conns[url].send(JSON.stringify({
          event: "Get set request",
          data: {
            path,
            group: self.group.index
          }
        }))
      }
    })
  }

  getValorPath = async (path) => {
    const self = this;
    return new Promise(async(res, rej) => {
      const groupIndex = jumpConsistentHash("valor/" + path, self.groups.length);
      if(groupIndex == self.group.index){
        const data = await self.getLocal("all/valor/" + path);
        return res(data);
      } else {
        const members = self.groups[groupIndex]
        const url = members[members.length * Math.random() << 0];
        await self.connectToServer(url);
        self.promises["Got valor path " + path + " from " + url] = {res, rej};
        self.conns[url].send(JSON.stringify({
          event: "Get valor path",
          data: {
            path,
            group: self.group.index
          }
        }))
      }
    })
  }

  getLedger = async (id) => {
    const self = this;
    return new Promise(async(res, rej) => {
      const groupIndex = jumpConsistentHash("ledgers/" + id + ".json", self.groups.length);
      if(groupIndex == self.group.index){
        const data = await self.getLocal("all/ledgers/" + id + ".json");
        return res(data);
      } else {
        const members = self.groups[groupIndex]
        const url = members[members.length * Math.random() << 0];
        await self.connectToServer(url);
        self.promises["Got ledger " + id + " from " + url] = {res, rej};
        self.conns[url].send(JSON.stringify({
          event: "Get ledger",
          data: {
            id,
            group: self.group.index
          }
        }))
      }
    })
  }

  loadAllGroups = async () => {
    const self = this;
    return new Promise(async (res, rej) => {
      let initialServers = isLocal ? ['http://localhost:3000/'] : require('./servers.json');
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
        const data = await new Promise(async (res, rej) => {
          await self.connectToServer(url);
          self.promises["Got groups from " + url] = {res, rej};
          self.conns[url].send(JSON.stringify({
            event: "Get groups"
          }));
        })
        const groups = data.groups;
        if(!self.start || data.start < self.start){
          self.start = data.start;
        }
        if(!self.lastSync || data.lastSync > self.lastSync){
          self.lastSync = data.lastSync;
        }
        if(groups.length > self.groups.length){
          self.groups = [...groups];
        }
        used.push(url);
        servers = self.groups.flat();
        for(let i=0;i<used.length;i++){
          if(servers.indexOf(used[i]) !== -1){
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
          self.groups[self.group.index] = self.group.members;
          self.conns[url].send(JSON.stringify({
            event: "Joined group success"
          }));
          await self.syncTimeWithNearby();
          await self.sharePublic();
          await self.setLocal("group.json", self.group);
          await self.setLocal("groups.json", self.groups);
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
      return res();
    });
  }

  requestNewGroup(){
    const self = this;
    return new Promise(async(res, rej) => {
      await self.loadAllGroups();
      const groupIndex = self.groups.length;
      if(groupIndex == 0) return res();
      if(self.groups[groupIndex]) return rej()
      const group = self.groups[self.groups.length * Math.random() << 0];
      const url = group[group.length * Math.random() << 0];
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
      const now = self.now();
      try {
        self.group = {
          index : self.groups.length,
          members: [self.url],
          version: 0,
          updated: now,
          max: 3
        }
        self.groups.push([self.url]);
        if(self.group.index > 0){
          const url = self.groups[self.group.index - 1][self.groups[self.group.index - 1]?.length * Math.random() << 0];
          await self.connectToServer(url);
          // self.promises["New group found at " + url] = {res, rej};
          self.conns[url].send(JSON.stringify({
            event: "New group",
            data: {
              group: self.group
            }
          }));
        } else if(self.group.index == 0){
          self.start = now;
        }
        await self.syncTimeWithNearby();
        await self.sharePublic();
        await self.setLocal("group.json", self.group);
        await self.setLocal("groups.json", self.groups);
        console.log(self.url + " has created group " + self.group.index);
        return res(true);
      } catch (e){
        console.log(e)
      }
    })
  }

  claimValorForData = async (path) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!self.group) return res();
      const valorGroupIndex = jumpConsistentHash("valor/" + path, self.groups.length);
      if(valorGroupIndex == self.group.index){
        for(let i=0;i<self.group.members.length;i++){
          if(self.group.members[i] == self.url) continue;
          await self.connectToServer(self.group.members[i]);
          await new Promise(async (res, rej) => {
            self.promises["Claimed valor for path " + path + " from " + self.group.members[i]] = {res, rej};
            self.conns[self.group.members[i]].send(JSON.stringify({
              event: "Claim valor for path",
              data: {
                path,
                url: self.url
              }
            }));
          })
        }
        const request = await self.getSetRequest(path);
        if(!request) return res();
        let publicD = await self.getPublicFromId(request.from);
        if(!publicD) return res();
        const dataGroupIndex = jumpConsistentHash("data/" + path, self.groups.length);
        if(dataGroupIndex !== self.group.index) return res()
        const data = await self.getLocal("all/data/" + path);
        try {
          await self.verify(JSON.stringify(data), Buffer.from(request.data, "base64"), publicD.ecdsaPub);
          const valor = {
            data: {
              for: self.ownerId,
              path: path,
              size: Buffer.byteLength(JSON.stringify(data), 'utf8'),
              sync: self.lastSync || self.start
            }
          }
          valor.sig = Buffer.from(await self.sign(JSON.stringify(valor))).toString("base64");
          valor.from = self.id;
          await self.setLocal(`all/valor/${path}`, valor);
          await self.sendPathToLedger(path);
        } catch(e) {
          return res();
        }
      } else {
        for(let i=0;i<self.groups[valorGroupIndex].length;i++){
          const url = self.groups[valorGroupIndex][i];
          await self.connectToServer(url);
          await new Promise(async (res, rej) => {
            self.promises["Claimed valor for path " + path + " from " + url] = {res, rej};
            self.conns[url].send(JSON.stringify({
              event: "Claim valor for path",
              data: {
                path,
                url: self.url
              }
            }));
          })
        }
        await self.sendPathToLedger(path);
      }
      return res();
    })
  }

  sendPathToLedger = async (path) => {
    const self = this;
    return new Promise(async (res, rej) => {
      const ledgerGroupIndex = jumpConsistentHash("ledgers/" + self.ownerId + ".json", self.groups.length);
      const ledgerGroup = [...self.groups[ledgerGroupIndex]];
      for(let i=0;i<ledgerGroup.length;i++){
        const url = ledgerGroup[i];
        if(url !== self.url){
          await this.connectToServer(url);
          self.conns[url].send(JSON.stringify({
            event: "Add path to ledger",
            data: {
              id: self.ownerId,
              path
            }
          }))
        } else {
          let d = await self.getLocal("all/ledgers/" + self.ownerId + ".json");
          if(!d) d = {
            paths: []
          }
          if(d.paths.indexOf(path) !== -1) return res();
          const valorGroupIndex = jumpConsistentHash("valor/" + path, self.groups.length);
          const valorGroup = self.groups[valorGroupIndex];
          let valor;
          let isValid = true;
          for(let j=0;j<valorGroup.length;j++){
            const url = valorGroup[j];
            let v;
            if(url == self.url) {
              v = await self.getLocal("all/valor/" + path);
            } else {
              v = await new Promise(async(res, rej) => {
                await self.connectToServer(url);
                self.promises["Got valor path " + path + " from " + url] = {res, rej};
                self.conns[url].send(JSON.stringify({
                  event: "Get valor path",
                  data: {
                    path,
                    group: self.group.index
                  }
                }))
              })
            }
            if(!valor) {
              valor = JSON.stringify(v.data);
            } else if(valor !== JSON.stringify(v.data)){
              isValid = false;
              break;
            }
          }
          if(isValid){
            d.paths.push(path);
            d.sig = Buffer.from(await self.sign(JSON.stringify(d.paths))).toString("base64");
            d.from = self.id;
            await self.setLocal("all/ledgers/" + self.ownerId + ".json", d);
          }
        }
      }   
      return res()   
    })
  }

  calculateValor = async (id) => {
    const self = this;
    return new Promise(async (res, rej) => {
      try {
        const ledger = await self.getLedger(id);
        if(!ledger) return res();
        const ledgerPublic = await self.getPublicFromId(ledger.from);
        await self.verify(JSON.stringify(ledger.paths), Buffer.from(ledger.sig, "base64"), ledgerPublic.ecdsaPub);
        let valor = 0;
        for(let i=0;i<ledger.paths.length;i++){
          const v = await self.getValorPath(ledger.paths[i]);
          if(!v || !v.data) continue;
          valor += (v.data.size / 10000000) + ((self.now() - v.data.sync) * 0.0000000005);
          if(valor == undefined){
            console.log(self.lastSync);
            console.log(self.start);
            console.log(v.data.size);
          }
        }
        res(valor);
      } catch(e){
        rej(e);
      }
    })
  }

  async syncPing(ws){
    const self = this;
    return new Promise(async (res, rej) => {
      const resp = await (async () => {
        return new Promise(async (res2, rej2) => {
          const start = self.now();
          ws.send(JSON.stringify({
            event: "Sync ping",
            data: {
              start
            }
          }))
          self.promises["Pong from " + ws.Url + " at " + start] = {res: res2, rej: rej2};
        })
      })();
      resp.roundTrip = resp.end - resp.start;
      resp.latency = resp.roundTrip / 2;
      resp.offset = resp.pingReceived - resp.end + resp.latency;
      return res(resp)
    })
  }

  syncTimeWithNearby = async () => {
    const self = this;
    return new Promise(async(res, rej) => {
      let offsets = [];
      if(!self.group) return res();
      for(let i=0;i<self.group.members.length;i++){
        const url = self.group.members[i];
        if(url == self.url) continue;
        try {
          if(!self.conns[url] || self.conns[url].readyState !== 1){
            await self.connectToServer(url);
          }
          const ping = await self.syncPing(self.conns[url]);
          offsets.push(ping.offset);
        } catch (e){

        }
      }
      if(self.group.index > 0 && self.groups[self.group.index - 1]?.length > 0){
        const url = self.groups[self.group.index - 1][self.groups[self.group.index - 1]?.length * Math.random() << 0];
        try {
          if(!self.conns[url] || self.conns[url].readyState !== 1){
            await self.connectToServer(url);
          }
          const ping = await self.syncPing(self.conns[url]);
          offsets.push(ping.offset);
        } catch (e){

        }
      }
      if(self.groups[self.group.index + 1]?.length > 0){
        const url = self.groups[self.group.index + 1][self.groups[self.group.index + 1]?.length * Math.random() << 0];
        try {
          if(!self.conns[url] || self.conns[url].readyState !== 1){
            await self.connectToServer(url);
          }
          const ping = await self.syncPing(self.conns[url]);
          offsets.push(ping.offset);
        } catch (e){
          console.log(e);
        }
      }
      if(offsets.length > 0){
        self.timeOffset += offsets.reduce((a, b) => a + b) / offsets.length;
      }
      res();
    })
  };

  syncInterval = async () => {
    const self = this;
    function saveGroups(){
      const time = self.now();
      const path = `groups/${self.lastSync + self.syncIntervalMs}.json`;
      if(!self.lastSync) self.lastSync = self.start;
      if(time - self.lastSync > self.syncIntervalMs){
        const group = jumpConsistentHash("data/" + path, self.groups.length);
        if(self.group && group == self.group.index){
          // console.log(`${self.url} will save groups at time: ${self.lastSync + self.syncIntervalMs}`);
        }
        self.lastSync += self.syncIntervalMs
      }
    }
    saveGroups();
    const main = setInterval(async () => {
      await self.syncTimeWithNearby();
      saveGroups();
      await self.sharePublic();
    }, self.syncIntervalMs);
  }

  sharePublic = async () => {
    const self = this;
    return new Promise(async (res, rej) => {
      await self.set(`${self.id}/public.json`, self.public);
      await self.set(`${self.pathUrl}/public.json`, self.public);
      return res();
    })
  }

  reassignGroupData = async () => {
    const self = this;
    return new Promise(async (res, rej) => {
      let paths = getDirContents(__dirname + "/data/servers/" + self.pathUrl + "/all");
      for(let i=0;i<paths.length;i++){
        let path = paths[i].substr(paths[i].indexOf("/") + 1);
        path = path.substr(path.indexOf("/") + 1);
        path = path.substr(path.indexOf("/") + 1);
        // if(path.startsWith("valor/")) continue;
        const groupIndex = jumpConsistentHash(path, self.groups.length);
        if(groupIndex !== self.group.index){
          const data = await self.getLocal("all/" + path);
          const url = await self.groups[groupIndex][self.groups[groupIndex].length * Math.random() << 0]
          await self.connectToServer(url);
          self.conns[url].send(JSON.stringify({
            event: "Take over group data",
            data: {
              path,
              data,
              group: self.group.index
            }
          }))
          await fs.unlinkSync(__dirname + "/data/" + paths[i]);
          try {
            let dir = __dirname + "/data/" + paths[i];
            dir = dir.substring(0, dir.lastIndexOf("/"));
            await fs.rmdirSync(dir)
          } catch(e){}
        }
      }
      res();
    });
  }

  getPublicFromUrl = async (url) => {
    const self = this;
    return new Promise(async (res, rej) => {
      let pathUrl = url.replace(/\//g, "");
      pathUrl = pathUrl.replace(/\:/g, "");
      let publicD = await self.get(`${pathUrl}/public.json`);
      if(!publicD){
        publicD = await new Promise(async (res, rej) => {
          await self.connectToServer(url);
          self.promises["Got public from " + url] = {res, rej};
          self.conns[url].send(JSON.stringify({
            event: "Get public",
          }))
        })
      }
      const ecdsaPubHash = await subtle.digest("SHA-256", Buffer.from(publicD.ecdsaPub, 'base64'));
      const id = Buffer.from(ecdsaPubHash).toString('hex').substr(24, 64);
      if(publicD.id !== id) return rej({err: "Invalid public data"});
      try {
        publicD.ecdsaPub = await subtle.importKey(
          'raw',
          Buffer.from(publicD.ecdsaPub, 'base64'),
          {
            name: 'ECDSA',
            namedCurve: 'P-384'
          },
          true,
          ['verify']
        )
        publicD.ecdhPub = await subtle.importKey(
          'raw',
          Buffer.from(publicD.ecdhPub, 'base64'),
          {
            name: 'ECDH',
            namedCurve: 'P-384'
          },
          true,
          ['deriveKey']
        )
      } catch(e){
        return rej({err: "Invalid public data"});
      }
      return res(publicD);
    });
  };

  getPublicFromId = async (id) => {
    const self = this;
    return new Promise(async (res, rej) => {
      let publicD = await self.get(`${id}/public.json`);
      if(!publicD) return rej({err: "Could not find public"});
      const ecdsaPubHash = await subtle.digest("SHA-256", Buffer.from(publicD.ecdsaPub, 'base64'));
      const pubId = Buffer.from(ecdsaPubHash).toString('hex').substr(24, 64);
      if(publicD.id !== pubId) return rej({err: "Invalid public data"});
      publicD.ecdsaPub = await subtle.importKey(
        'raw',
        Buffer.from(publicD.ecdsaPub, 'base64'),
        {
          name: 'ECDSA',
          namedCurve: 'P-384'
        },
        true,
        ['verify']
      )
      publicD.ecdhPub = await subtle.importKey(
        'raw',
        Buffer.from(publicD.ecdhPub, 'base64'),
        {
          name: 'ECDH',
          namedCurve: 'P-384'
        },
        true,
        ['deriveKey']
      )
      return res(publicD);
    });
  };

  sign = async (msg) => {
    const self = this;
    return new Promise(async (res, rej) => {
      try {
        const signature = await subtle.sign(
          {
            name: "ECDSA",
            hash: {name: "SHA-384"},
          },
          self.ECDSA.privateKey,
          new TextEncoder().encode(msg)
        );
        return res(signature)
      } catch(e){
        rej(e)
      }
    })
  }

  verify = async (msg, sig, pubKey) => {
    const self = this;
    return new Promise(async (res, rej) => {
      try {
        const isValid = await subtle.verify(
          {
            name: "ECDSA",
            hash: {name: "SHA-384"},
          },
          pubKey,
          sig,
          new TextEncoder().encode(msg)
        );
        if(isValid){
          res(isValid);
        } else {
          rej({err: "Invalid"});
        }
        return 
      } catch(e){
        rej(e)
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
          case 'Get public':
            await self.handleGetPublic(ws, d.data);
            break;
          case 'Got public':
            await self.handleGotPublic(ws, d.data);
            break;
          case 'Verify url request':
            await self.handleVerifyUrlRequest(ws, d.data);
            break;
          case 'Verify url with key':
            await self.handleVerifyUrlKey(ws, d.data);
            break;
          case 'Verify url':
            await self.handleVerifyUrl(ws)
            break;
          case 'Url verified':
            await self.handleUrlVerified(ws, d.data);
            break;
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
          case 'Group can be created':
            await self.handleGroupCanBeCreated(ws, d.data);
            break;
          case 'Group can be created response':
            await self.handleGroupCanBeCreatedResponse(ws, d.data);
            break;
          case 'Join group':
            await self.handleJoinGroupRequest(ws);
            break;
          case 'Group not full':
            await self.handleGroupNotFull(ws);
            break;
          case 'Group not full response':
            await self.handleGroupNotFullResponse(ws, d.data);
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
          case 'New member in group':
            await self.handleNewMemberInGroup(ws, d.data);
            break;
          case 'New group':
            await self.handleNewGroup(ws, d.data);
            break;
          case 'New group found':
            await self.handleNewGroupFound(ws, d.data);
            break;
          case "Sync ping":
            await self.handleSyncPing(ws, d.data)
            break;
          case "Sync pong":
            await self.handleSyncPong(ws, d.data)
            break;
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
          case "Get":
            await self.handleGet(ws, d.data);
            break;
          case "Set":
            await self.handleSet(ws, d.data);
            break; 
          case "Set request":
            await self.handleSetRequest(ws, d.data);
            break;
          case "Set request saved":
            await self.handleSetRequestSaved(ws, d.data);
            break;
          case "Get set request":
            await self.handleGetSetRequest(ws, d.data);
            break;
          case "Got set request":
            await self.handleGotSetRequest(ws, d.data);
            break;
          case "Group set":
            await self.handleGroupSet(ws, d.data);
            break;
          case "Take over group data":
            await self.handleTakeOverGroupData(ws, d.data);
            break;
          case "Got":
            await self.handleGot(ws, d.data);
            break;
          case "Sot":
            await self.handleSot(ws, d.data);
            break; 
          case "Claim valor for path":
            await self.handleClaimValorForPath(ws, d.data);
            break;
          case "Claimed valor for path":
            await self.handleClaimedValorPath(ws, d.data);
            break;
          case "Get valor path":
            await self.handleGetValorPath(ws, d.data);
            break;
          case "Got valor path":
            await self.handleGotValorPath(ws, d.data);
            break;
          case "Get ledger":
            await self.handleGetLedger(ws, d.data);
            break;
          case "Got ledger":
            await self.handleGotLedger(ws, d.data);
            break;
          case "Add path to ledger":
            await self.handleAddPathToLedger(ws, d.data);
            break;
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

  handleSyncPing = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      // setTimeout(() => {
        data.pingReceived = self.now();
        ws.send(JSON.stringify({
          event: "Sync pong",
          data
        }))
        return res()
      // }, self.testLatency)
    })
  }

  handleSyncPong = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      data.end = self.now();
      if(self.promises["Pong from " + ws.Url + " at " + data.start]){
        self.promises["Pong from " + ws.Url + " at " + data.start].res(data);
      }
      return res();
    })
  }

  handleVerifyUrlRequest = async (ws, data) => {
    const self = this;
    return new Promise(async( res, rej) => {
      if(ws.Url || !data.url) return res();
      ws.verifyingUrl = data.url;
      self.verifying[data.url] = Buffer.from(crypto.randomBytes(32)).toString('hex');
      await new Promise(async(res, rej) => {
        self.promises["Verified url " + data.url + " with key"] = {res, rej}
        ws.send(JSON.stringify({
          event: "Verify url with key",
          data: {
            key: self.verifying[data.url]
          }
        }))
      })
      return res();
    })
  }

  handleVerifyUrlKey = async (ws, data) => {
    const self = this;
    return new Promise(async( res, rej) => {
      if(!self.promises["Url verified with " + ws.Url] || !data.key) return res();
      let pathUrl = ws.Url.replace(/\//g, "");
      pathUrl = pathUrl.replace(/\:/g, "");
      self.app.get("/valoria/verifying/" + pathUrl, (req, res) => {
        res.send(data.key);
      })
      ws.send(JSON.stringify({
        event: "Verify url"
      }))
      return res();
    })
  }

  handleVerifyUrl = async (ws) => {
    const self = this;
    return new Promise(async( res, rej) => {
      if(!ws.verifyingUrl || !self.verifying[ws.verifyingUrl]) return res();
      const key = (await axios.get(ws.verifyingUrl + "valoria/verifying/" + self.pathUrl)).data;
      if(key == self.verifying[ws.verifyingUrl]){
        ws.Url = ws.verifyingUrl;
        self.conns[ws.Url] = ws;
        ws.send(JSON.stringify({
          event: "Url verified",
          data: {
            success: true
          }
        }))
      } else {
        ws.send(JSON.stringify({
          event: "Url verified",
          data: {
            err: true
          }
        }))
      }
      return res();
    })
  }

  handleUrlVerified = async (ws, data) => {
    const self = this;
    return new Promise(async(res, rej) => {
      if(!self.promises["Url verified with " + ws.Url]) return res();
      if(data.success){
        self.promises["Url verified with " + ws.Url].res()
      } else {
        self.promises["Url verified with " + ws.Url].rej();
      }
      res()
    })
  }

  handleGetGroups(ws){
    const self = this;
    return new Promise(async( res, rej) => {
      ws.send(JSON.stringify({
        event: "Got groups",
        data: {
          groups: self.groups,
          start: self.start,
          lastSync: self.lastSync
        }
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
        if(g.members.indexOf(ws.Url) !== -1){
          ws.send(JSON.stringify({
            event: "Joined group",
            data: {err: "Already joined group"}
          }));
          res();
          return
        }
        if(g.members.length < g.max){
          try {
            for(let i=0;i<g.members.length;i++){
              if(g.members[i] == self.url) continue;
              await self.connectToServer(g.members[i]);
              await new Promise(async (res, rej) => {
                self.promises["Group not full from " + g.members[i]] = {res, rej};
                self.conns[g.members[i]].send(JSON.stringify({
                  event: "Group not full",
                }))
              })
            }
          } catch (e){
            ws.send(JSON.stringify({
              event: "Joined group",
              data: {err: "Not seeking new members"}
            }));
            return res();
          }
          g.members.push(ws.Url);
          g.updated = self.now();
          g.version += 1;
          self.groups[g.index] = g.members;
          for(let i=0;i<g.members?.length;i++){
            if(g.members[i] == self.url || g.members[i] == ws.Url) continue;
            await self.connectToServer(g.members[i]);
            self.conns[g.members[i]].send(JSON.stringify({
              event: "New member in group",
              data: g
            }))
          }
          self.conns[ws.Url].send(JSON.stringify({
            event: "Joined group",
            data: g
          }));
          await new Promise((res, rej) => {
            self.promises["Joined group success from " + ws.Url] = {res, rej};
          })

          //SEND GROUP DATA TO NEW MEMBER
          let paths = getDirContents(__dirname + "/data/servers/" + self.pathUrl + "/all");
          for(let i=0;i<paths.length;i++){
            let path = paths[i].substr(paths[i].indexOf("/") + 1);
            path = path.substr(path.indexOf("/") + 1);
            path = path.substr(path.indexOf("/") + 1);
            // if(path.startsWith("valor/")) continue;
            const groupIndex = jumpConsistentHash(path, self.groups.length);
            if(groupIndex == self.group.index){
              const data = await self.getLocal("all/" + path);
              self.conns[ws.Url].send(JSON.stringify({
                event: "Group set",
                data: {
                  path,
                  data
                }
              }));
            }
          }

          if(self.groups[g.index - 1]?.length > 0){
            const servers = self.groups[g.index - 1];
            const url = servers[servers.length * Math.random() << 0];
            await self.connectToServer(url);
            self.conns[url].send(JSON.stringify({
              event: "New member in group",
              data: g
            }))
          }
          if(self.groups[g.index + 1]?.length > 0){
            const servers = self.groups[g.index + 1];
            const url = servers[servers.length * Math.random() << 0];
            await self.connectToServer(url);
            self.conns[url].send(JSON.stringify({
              event: "New member in group",
              data: g
            }))
          }
          await self.setLocal("group.json", self.group);
          await self.setLocal("groups.json", self.groups);
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

  handleGroupNotFull = async (ws) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!ws.Url || !self.group || self.group.members.indexOf(ws.Url) == -1) return res();
      ws.send(JSON.stringify({
        event: "Group not full response",
        data: self.group.members.length < self.group.max
      }))
      return res()
    })
  }

  
  handleGroupNotFullResponse = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!self.promises["Group not full from " + ws.Url]) return res();
      if(data){
        self.promises["Group not full from " + ws.Url].res();
      } else {
        self.promises["Group not full from " + ws.Url].rej();
      }
      res();
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
        self.canCreate = data.index;
        try {
          for(let i=0;i<self.group.members.length;i++){
            if(self.group.members[i] == self.url) continue;
            await self.connectToServer(self.group.members[i]);
            await new Promise(async (res, rej) => {
              self.promises[`Group ${data.index} can be created from ${self.group.members[i]}`] = {res, rej};
              self.conns[self.group.members[i]].send(JSON.stringify({
                event: "Group can be created",
                data: {
                  index: data.index
                }
              }))
            })
          }
        } catch(e){
          ws.send(JSON.stringify({
            event: "New group response",
            data: {
              success: false
            }
          }))
          return res();
        }
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
      res();
    })
  }

  handleGroupCanBeCreated = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!ws.Url || !self.group || self.group.members.indexOf(ws.Url) == -1 || !data.index) return res();
      ws.send(JSON.stringify({
        event: "Group can be created response",
        data: {
          success: (data.index == self.groups.length && self.canCreate !== data.index),
          index: data.index
        }
      }))
      res();
    })
  }

  handleGroupCanBeCreatedResponse = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!self.promises[`Group ${data.index} can be created from ${ws.Url}`]) return res();
      if(data.success){
        self.promises[`Group ${data.index} can be created from ${ws.Url}`].res();
      } else {
        self.promises[`Group ${data.index} can be created from ${ws.Url}`].rej();
      }
      res()
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
          return res();
        }
        if(self.group.members.indexOf(ws.Url) !== -1){
          self.groups.push(data.group.members);
        }
        else if((data.group.index == self.groups.length && data.group.index == self.group.index + 1) || self.groups[self.group.index + 1]?.indexOf(ws.Url) !== -1){
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
        self.reassignGroupData();
      } catch(e){
        console.log(e)
      }
      await self.setLocal("group.json", self.group);
      await self.setLocal("groups.json", self.groups);
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

  handleNewMemberInGroup(ws, data){
    const self = this;  
    return new Promise(async (res, rej) => {
      if(!ws.Url || data.index < 0 || !self.group) return res();
      try {
        if(data.index < 0) return;
        if(!self.groups[data.index]) self.groups[data.index] = [];
        if(self.group.index == data.index  && self.group.members.indexOf(ws.Url) !== -1){
          if(self.group.version !== data.version - 1) return;
          self.group.members = Array.from(new Set([...self.group.members, ...data.members]));
          self.groups[data.index] = self.group.members;
          self.group.version += 1;
          self.group.updated = data.updated;
        } else if(self.group.index > 0 && self.groups[self.group.index - 1] && self.groups[self.group.index - 1]?.indexOf(ws.Url) !== -1){
          self.groups[data.index] = Array.from(new Set([...self.groups[data.index], ...data.members]));
          if(self.groups[self.group.index + 1]?.length > 0){
            const servers = self.groups[self.group.index + 1];
            const url = servers[servers.length * Math.random() << 0];
            await self.connectToServer(url);
            self.conns[url].send(JSON.stringify({
              event: "New member in group",
              data
            }))
          }
          for(let i=0;i<self.group.members.length;i++){
            if(self.group.members[i] == self.url) continue;
            await self.connectToServer(self.group.members[i]);
            self.conns[self.group.members[i]].send(JSON.stringify({
              event: "New member in group",
              data
            }))
          }
        } else if(self.groups[self.group.index + 1] && self.groups[self.group.index + 1]?.indexOf(ws.Url) !== -1){
          self.groups[data.index] = Array.from(new Set([...self.groups[data.index], ...data.members]));
          if(self.group.index > 0 && self.groups[self.group.index - 1]?.length > 0){
            const servers = self.groups[self.group.index - 1];
            const url = servers[servers.length * Math.random() << 0];
            await self.connectToServer(url);
            self.conns[url].send(JSON.stringify({
              event: "New member in group",
              data
            }))
          }
          for(let i=0;i<self.group.members.length;i++){
            if(self.group.members[i] == self.url) continue;
            await self.connectToServer(self.group.members[i]);
            self.conns[self.group.members[i]].send(JSON.stringify({
              event: "New member in group",
              data
            }))
          }
        } else if (self.group.members.indexOf(ws.Url) !== -1 && data.index !== self.group.index){
          self.groups[data.index] = Array.from(new Set([...self.groups[data.index], ...data.members]));
        }
      } catch (e){
        console.log(e)
      }
      await self.setLocal("group.json", self.group);
      await self.setLocal("groups.json", self.groups);
      res();
    })
  }

  handleGet = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!data.path) return res();
      if(ws.Url && self.groups[data.group]?.indexOf(ws.Url) !== -1){
        const d = await self.getLocal("all/data/" + data.path);
        ws.send(JSON.stringify({
          event: "Got",
          data: {
            path: data.path,
            data: d
          }
        }))
      }
      return res()
    })
  }

  handleSet = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!data.path || !data.data) return res();
      if(ws.Url && self.groups[data.group]?.indexOf(ws.Url) !== -1){
        let request = await self.getSetRequest(data.path);
        if(!request) return err();
        if(request.url){
          if(request.url !== ws.Url) return err();
          try {
            let publicD = await self.getPublicFromUrl(request.url);
            if(!publicD) return err();
            await self.verify(JSON.stringify(data.data), Buffer.from(request.data, "base64"), publicD.ecdsaPub);
          } catch(e){
            console.log(e);
            return err()
          }
        }
        await self.setLocal("all/data/" + data.path, data.data);
        ws.send(JSON.stringify({
          event: "Sot",
          data: {
            path: data.path,
            success: true
          }
        }));
        for(let i=0;i<self.group.members.length;i++){
          if(self.group.members[i] == self.url) continue;
          await self.connectToServer(self.group.members[i]);
          self.conns[self.group.members[i]].send(JSON.stringify({
            event: "Group set",
            data: {
              data: data.data,
              path: "data/" + data.path
            }
          }));
        }
        await self.claimValorForData(data.path);
      } else {
        return err();
      }
      function err(){
        ws.send(JSON.stringify({
          event: "Sot",
          data: {
            path: data.path,
            err: true
          }
        }))
        return res()
      }
      return res()
    })
  }

  handleSetRequest = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!data.request) return res();
      if(ws.Url && self.groups[data.request.group]?.indexOf(ws.Url) !== -1){
        await self.setLocal("all/requests/" + data.request.path, data.request);
        ws.send(JSON.stringify({
          event: "Set request saved",
          data: {
            path: data.request.path,
            success: true
          }
        }))
        for(let i=0;i<self.group.members.length;i++){
          if(self.group.members[i] == self.url) continue;
          await self.connectToServer(self.group.members[i]);
          self.conns[self.group.members[i]].send(JSON.stringify({
            event: "Group set",
            data: {
              data: data.request,
              path: "requests/" + data.request.path
            }
          }));
        }
      } else {
        ws.send(JSON.stringify({
          event: "Set request saved",
          data: {
            path: data.request.path,
            err: true
          }
        }))
      }
      return res()
    })
  }

  handleSetRequestSaved = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!self.promises["Sent request to " + ws.Url + " for " + data.path]) return res();
      self.promises["Sent request to " + ws.Url + " for " + data.path].res();
      return res()
    })
  }

  handleGetSetRequest = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!data.path) return res();
      if(ws.Url && self.groups[data.group]?.indexOf(ws.Url) !== -1){
        const d = await self.getLocal("all/requests/" + data.path);
        ws.send(JSON.stringify({
          event: "Got set request",
          data: {
            path: data.path,
            request: d
          }
        }))
      }
      return res()
    })
  }

  handleGotSetRequest = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!self.promises["Got set request from " + ws.Url + " for " + data.path]) return res();
      self.promises["Got set request from " + ws.Url + " for " + data.path].res(data.request);
      return res()
    })
  }

  handleGroupSet = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!data.path || !data.data) return res();
      if(ws.Url && self.group.members.indexOf[ws.Url] !== -1){
        await self.setLocal("all/" + data.path, data.data);
        if(data.path.startsWith("data/")){

        }
      }
      return res()
    })
  }

  handleTakeOverGroupData = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!data.path || !data.data || !data.group) return res();
      if(ws.Url && self.groups[data.group].indexOf[ws.Url] !== -1){

        const pastLength = data.group > self.group.index ? self.group.index + 1 : self.group.length - 1;
        if(jumpConsistentHash(data.path, pastLength) !== data.group)  return res();

        await self.setLocal("all/" + data.path, data.data);
        if(data.path.startsWith("data/")){

        }
        for(let i=0;i<self.group.members.length;i++){
          if(self.group.members[i] == self.url) continue;
          await self.connectToServer(self.group.members[i]);
          self.conns[self.group.members[i]].send(JSON.stringify({
            event: "Group set",
            data: {
              path: data.path,
              data: data.data
            }
          }));
        }
      }
      return res()
    })
  }

  handleGot = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!self.promises["Got data from " + ws.Url + " for " + data.path]) return res();
      self.promises["Got data from " + ws.Url + " for " + data.path].res(data.data);
      return res()
    })
  }

  handleSot = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!self.promises["Set data from " + ws.Url + " for " + data.path]) return res();
      self.promises["Set data from " + ws.Url + " for " + data.path].res(data.success);
      return res()
    })
  }

  handleGetPublic = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!ws.Url) return res();
      ws.send(JSON.stringify({
        event: "Got public",
        data: self.public
      }));
      return res()
    })
  }

  handleGotPublic = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!self.promises["Got public from " + ws.Url]) return res();
      self.promises["Got public from " + ws.Url].res(data);
      return res()
    })
  }

  handleClaimValorForPath = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!ws.Url || !data.path || !data.url) return err();
      const valorGroupIndex = jumpConsistentHash("valor/" + data.path, self.groups.length);
      if(valorGroupIndex !== self.group.index) return err();
      const request = await self.getSetRequest(data.path);
      if(!request) return err();
      let reqPublicD = await self.getPublicFromId(request.from);
      if(!reqPublicD) return err();
      const dataGroupIndex = jumpConsistentHash("data/" + data.path, self.groups.length);
      if(self.groups[dataGroupIndex].indexOf(data.url) == -1) return err();
      await self.connectToServer(data.url);
      const d = await new Promise(async(res, rej) => {
        self.promises["Got data from " + data.url + " for " + data.path] = {res, rej};
        self.conns[data.url].send(JSON.stringify({
          event: "Get",
          data: {
            path: data.path,
            group: self.group.index
          }
        }))
      })
      try {
        await self.verify(JSON.stringify(d), Buffer.from(request.data, "base64"), reqPublicD.ecdsaPub);
        let dataPublicD = await self.getPublicFromUrl(data.url);
        if(!dataPublicD) return err();
        const valor = {
          data: {
            for: dataPublicD.ownerId,
            path: data.path,
            size: Buffer.byteLength(JSON.stringify(d), 'utf8'),
            sync: self.lastSync || self.start
          }
        }
        valor.sig = Buffer.from(await self.sign(JSON.stringify(valor))).toString("base64");
        valor.from = self.id;
        await self.setLocal(`all/valor/${data.path}`, valor);
        ws.send(JSON.stringify({
          event: "Claimed valor for path",
          data: {
            success: true,
            path: data.path
          }
        }))
        return res()
      } catch(e) {
        return res();
      }
      function err(){
        ws.send(JSON.stringify({
          event: "Claimed valor for path",
          data: {
            err: true,
            path: data.path
          }
        }))
        return res()
      }
    })
  }

  handleClaimedValorPath(ws, data){
    const self = this;
    return new Promise(async (res, rej) => {
      if(self.promises["Claimed valor for path " + data.path + " from " + ws.Url]){
        self.promises["Claimed valor for path " + data.path + " from " + ws.Url].res();
      }
      return res();
    })
  }

  handleGetValorPath(ws, data){
    const self = this;
    return new Promise(async (res, rej) => {
      if(!data.path) return res();
      if(ws.Url && self.groups[data.group]?.indexOf(ws.Url) !== -1){
        const d = await self.getLocal("all/valor/" + data.path);
        ws.send(JSON.stringify({
          event: "Got valor path",
          data: {
            path: data.path,
            valor: d
          }
        }))
      }
      return res();
    })
  }

  handleGotValorPath(ws, data){
    const self = this;
    return new Promise(async (res, rej) => {
      if(self.promises["Got valor path " + data.path + " from " + ws.Url]){
        self.promises["Got valor path " + data.path + " from " + ws.Url].res(data.valor);
      }
      return res();
    })
  }

  handleGetLedger(ws, data){
    const self = this;
    return new Promise(async (res, rej) => {
      if(!data.id) return res();
      if(ws.Url && self.groups[data.group]?.indexOf(ws.Url) !== -1){
        const d = await self.getLocal("all/ledgers/" + data.id + ".json");
        ws.send(JSON.stringify({
          event: "Got ledger",
          data: {
            id: data.id,
            ledger: d
          }
        }))
      }
      return res();
    })
  }

  handleGotLedger(ws, data){
    const self = this;
    return new Promise(async (res, rej) => {
      if(self.promises["Got ledger " + data.id + " from " + ws.Url]){
        self.promises["Got ledger " + data.id + " from " + ws.Url].res(data.ledger);
      }
      return res();
    })
  }

  handleAddPathToLedger(ws, data){
    const self = this;
    return new Promise(async (res, rej) => {
      if(!ws.Url || !data.path || !data.id) return res();
      let d = await self.getLocal("all/ledgers/" + data.id + ".json");
      if(!d) d = {
        paths: []
      }
      if(d.paths.indexOf(data.path) !== -1) return res();
      const valorGroupIndex = jumpConsistentHash("valor/" + data.path, self.groups.length);
      const valorGroup = self.groups[valorGroupIndex];
      let valor;
      let isValid = true;
      for(let j=0;j<valorGroup.length;j++){
        const url = valorGroup[j];
        let v;
        if(url == self.url) {
          v = await self.getLocal("all/valor/" + data.path);
        } else {
          v = await new Promise(async(res, rej) => {
            await self.connectToServer(url);
            self.promises["Got valor path " + data.path + " from " + url] = {res, rej};
            self.conns[url].send(JSON.stringify({
              event: "Get valor path",
              data: {
                path: data.path,
                group: self.group.index
              }
            }))
          })
        }
        if(!v || v.data.for !== data.id){
          break;
        } else if(!valor) {
          valor = JSON.stringify(v.data);
        } else if(valor !== JSON.stringify(v.data)){
          isValid = false;
          break;
        }
      }
      if(isValid){
        d.paths.push(data.path);
        d.sig = Buffer.from(await self.sign(JSON.stringify(d.paths))).toString("base64");
        d.from = self.id;
        await self.setLocal("all/ledgers/" + data.id + ".json", d);
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

let localServerCount = 24;
if(isLocal){
  (async () => {
    let servers = [];
    for(let i=0;i<localServerCount;i++){
      const server = new Server(i + Port);
      await server.setup();
      servers.push(server);
    }
    setInterval(async () => {
      for(let i=0;i<servers.length;i++){
        try {
          const valor = await servers[i].calculateValor(servers[i].id);
          console.log(`Server ${i} Valor: ${valor}`);
        } catch(e){
          console.log(e)
        }  
      }
      console.log("\n\n\n")
    }, 10000)
  })();
} else {
  const server = new Server(Port);
}

