const isLocal = process.env.PORT ? false : true;
const http = require('http');
const fs = require('fs');
const fsPromises = require("fs/promises");
const URL = require('url').URL;
const express = require('express');
const Port = process.env.PORT || 3000;
const crypto = require('crypto');
const subtle = crypto.webcrypto.subtle;
const WebSocket = require('ws');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const iceServers = [
  "stun:stun.l.google.com:19302",
  "stun:stun2.l.google.com:19302",
  "stun:stun3.l.google.com:19302",
  "stun:stu4.l.google.com:19302",
  "stun:stunserver.org",
  "stun:stun.voiparound.com",
  "stun:stun.voipbuster.com",
  "stun:stun.voipstunt.com"
];

function getDirContents(dir, results=[]){
  try {
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
        file = file.substr(file.indexOf("/") + 1);
        file = file.substr(file.indexOf("/") + 1);
        file = file.substr(file.indexOf("/") + 1);
        results.push(file);
      }
    }
  } catch(e){

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

function mode (arr){
  const mode = {};
  let max = 0, count = 0;

  for(let i = 0; i < arr.length; i++) {
    const item = arr[i];
    
    if(mode[item]) {
      mode[item]++;
    } else {
      mode[item] = 1;
    }
    
    if(count < mode[item]) {
      max = item;
      count = mode[item];
    }
  }
   
  return max;
};

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
    this.syncGroups = [];
    this.verifying = {};
    this.verificationKeys = {};
    this.pastPaths = {};
    this.saving = {};
    this.ECDSA = {publicKey: null, privateKey: null};
    this.ECDH = {publicKey: null, privateKey: null};
    this.dimensions = {};
    this.timeOffset = 0;
    this.testOffset = 0;
    this.syncIntervalMs = 1000;
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
            // console.log(e)
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
    return new Promise(async (res, rej) => {
      let pathUrl = self.url.replace(/\//g, "");
      self.pathUrl = pathUrl.replace(/\:/g, "");
      self.path = `${__dirname}/data/servers/${self.pathUrl}/`;
      fs.mkdirSync(self.path, {recursive: true});
      await this.reset();
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
        try {
          await self.setupWS(ws);
        } catch(e){}
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
      try {
        let setup = false;
        setTimeout(async () => {
          if(!setup){
            await self.setup();
            return;
          }
        }, 3000)
        await self.loadAllGroups();
        await self.joinGroup();
        await self.sharePublic();
        await self.syncGroupData();
        const stall = (self.sync + self.syncIntervalMs) - self.now();
        setTimeout(async () => {
          await self.syncInterval();
        }, self.sync == self.start ? 0 : stall > 0 ? stall : 0)
        setup = true;
        res();
      } catch(e){
        // console.log(e)
        rej()
      }
    })
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
      if(!url || url == self.url) return rej();
      let connected = false;
      setTimeout(() => {
        if(!connected) {
          return rej();
        }
      }, 3000)
      try {
        if(self.conns[url] && self.conns[url].readyState === WebSocket.OPEN){
          connected = true;
          return res();
        } else {
          if(!self.conns[url]) {
            if(url.includes("valoria/peers/")){
              let originUrl = url.substring(0, url.indexOf("valoria/peers/"));
              let id = url.substring(url.indexOf("valoria/peers/") + 14, url.length - 1);
              await self.connectToServer(originUrl);
              self.conns[url] = await new Promise(async (res, rej) => {
                self.promises["Connected to peer ws for " + url] = {res, rej};
                self.conns[originUrl].send(JSON.stringify({
                  event: "Connect to peer ws",
                  data: {
                    id
                  }
                }))
              })
            } else {
              let wsUrl = "ws://" + new URL(url).host + "/"
              if(url.startsWith('https')){
                wsUrl = "wss://" + new URL(url).host + "/"
              }
              self.conns[url] = new WebSocket(wsUrl);
            }
            try {
              self.conns[url].Url = url;
              self.conns[url].onopen = ( async () => {
                try {
                  await self.setupWS(self.conns[url]);
                  await new Promise(async(res, rej) => {
                    self.promises["Url verified with " + url] = {res, rej};
                    self.conns[url].send(JSON.stringify({
                      event: "Verify url request",
                      data: {
                        url: self.url
                      }
                    }))
                  })
                  connected = true;
                  return res();
                } catch (e){
                  // console.log(e)
                  rej(e);
                }
              });
              self.conns[url].onerror = (error) => {
                console.log(error)
                rej(error);
              }
            } catch(e){
              console.log(e)
              rej(e);
            }
          } 
        }
      } catch(e){
        console.log(e)
      }
    })
  }

  loadCredentials = async () => {
    const self = this;
    return new Promise(async(res, rej) => {
      try {
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
      } catch(e){
        return rej();
      }      
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
      try {
        await fsPromises.mkdir(`${self.path}${path.substr(0, path.lastIndexOf("/"))}`, {recursive: true});
        if(typeof data == "object"){
          data =  JSON.stringify(data, null, 2);
        }
        await fsPromises.writeFile(`${self.path}${path}`, data);
      } catch(e){

      }
      res();
    })
  }

  getLocal = (path) => {
    const self = this;
    return new Promise(async(res, rej) => {
      try {
        if(!fs.existsSync(`${self.path}${path}`)) throw null;
        let data = await fsPromises.readFile(`${self.path}${path}`, "utf-8");
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

  get = async (path, opts={public: ""}) => {
    const self = this;
    return new Promise(async(res, rej) => {
      try {
        const groupIndex = jumpConsistentHash(path, self.groups.length);
        // if(groupIndex == self.group.index){
          const data = self.saving[self.sync]["all/" + path] || await self.getLocal("all/" + path);
          if(data){
            return res(data);
          }
        // }
        const members = [...self.groups[groupIndex]]
        if(members.indexOf(self.url) !== -1) members.splice(members.indexOf(self.url), 1);
        if(members.length == 0) return res();
        const url = members[members.length * Math.random() << 0];
        await self.connectToServer(url);
        const now = self.now();
        self.promises["Got data from " + url + " for " + path + " at " + now + opts.public] = {res, rej};
        self.conns[url].send(JSON.stringify({
          event: "Get",
          data: {
            path,
            group: self.group.index,
            now,
            public: opts.public
          }
        }))
      } catch(e){
        return res();
      }
    })
  }

  set = async (path, data, opts={}) => {
    const self = this;
    return new Promise(async(res, rej) => {
      if(!self.group) return res();
      try {
        await self.createSetRequest(path, data);
        const groupIndex = jumpConsistentHash("data/" + path, self.groups.length);
        if(groupIndex == self.group.index){
          await self.setLocal("all/data/" + path, data);
          for(let i=0;i<self.group.members.length;i++){
            try {
              if(self.group.members[i] == self.url) continue;
              // await new Promise(async (res, rej) => {
                await self.connectToServer(self.group.members[i]);
                // self.promises["Group sot for data/" + path + " from " + self.group.members[i]] = {res, rej};
                self.conns[self.group.members[i]].send(JSON.stringify({
                  event: "Group set",
                  data: {
                    path: "data/" + path,
                    data: data
                  }
                }));
              // })              
            } catch(e){
              console.log(e)
            }
          }
          try {
            await self.claimValorForData(path);
            return res();
          } catch(e){
            return res();
          }
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
      } catch(e){
        return rej(e);
      }
    })
  }

  createSetRequest = async (path, data) => {
    const self = this;
    return new Promise(async(res, rej) => {
      if(!self.group) return rej();
      try {
        const groupIndex = jumpConsistentHash("requests/" + path, self.groups.length);
        const dataHashSig = await self.sign(JSON.stringify(data));
        const request = {
          from: self.id,
          url: self.url,
          path,
          data: Buffer.from(dataHashSig).toString('base64'),
          group: self.group.index,
          sync: self.sync
        }
        if(groupIndex == self.group.index){
          const d = await self.getLocal("all/requests/" + path);
          if(d && d.from == request.from) {
            try {
              await self.verify(JSON.stringify(data), Buffer.from(d.data, "base64"), self.ECDSA.publicKey);
              return rej()
            } catch(e){
            }
          };
          await self.setLocal("all/requests/" + path, request);
          for(let i=0;i<self.group.members.length;i++){
            try {
              if(self.group.members[i] == self.url) continue;
              // await new Promise(async (res, rej) => {
                await self.connectToServer(self.group.members[i]);
                // self.promises["Group sot for requests/" + path + " from " + self.group.members[i]] = {res, rej};
                self.conns[self.group.members[i]].send(JSON.stringify({
                  event: "Group set",
                  data: {
                    path: "requests/" + path,
                    data: request
                  }
                }));
              // })              
            } catch(e){
              console.log(e)
            }
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
      } catch(e){
        return rej();
      }
    })
  }

  getSetRequest = async (path) => {
    const self = this;
    return new Promise(async(res, rej) => {
      try {
        const groupIndex = jumpConsistentHash("requests/" + path, self.groups.length);
        const data = await self.getLocal("all/requests/" + path);
        if(data) return res(data);
        const group = [...self.groups[groupIndex]];
        if(group.indexOf(self.url) !== -1) group.splice(group.indexOf(self.url), 1);
        if(group.length == 0) {
          return res();
        }
        const url = group[group.length * Math.random() << 0];
        await self.connectToServer(url);
        self.promises["Got set request from " + url + " for " + path] = {res, rej};
        self.conns[url].send(JSON.stringify({
          event: "Get set request",
          data: {
            path,
            group: self.group.index
          }
        }))
      } catch(e){
        return res();
      }
    })
  }

  getValorPath = async (path, id) => {
    const self = this;
    return new Promise(async(res, rej) => {
      try {
        const groupIndex = jumpConsistentHash(`valor/${id}/${path}`, self.groups.length);
        // if(groupIndex == self.group.index){
          const data = await self.getLocal(`all/valor/${id}/${path}`);
          if(data) return res(data);
        // }
        const group = [...self.groups[groupIndex]];
        if(group.indexOf(self.url) !== -1) group.splice(group.indexOf(self.url), 1);
        const url = group[group.length * Math.random() << 0];
        await self.connectToServer(url);
        self.promises["Got valor path " + path + " from " + url + " for " + id] = {res, rej};
        self.conns[url].send(JSON.stringify({
          event: "Get valor path",
          data: {
            path,
            id: id,
            group: self.group.index
          }
        }))
      } catch(e){
        return res();
      }
     
    })
  }

  getLedger = async (id) => {
    const self = this;
    return new Promise(async(res, rej) => {
      try {
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
      } catch(e){
        return res();
      }
    })
  }

  loadAllGroups = async () => {
    const self = this;
    return new Promise(async (res, rej) => {
      try {
        let initialServers = isLocal ? ['http://localhost:3000/'] : require('./servers.json');
        if(!initialServers || initialServers.length == 0) rej("No initial servers found.");
        let servers = [...initialServers];
        let askAmount = 10;
        let askCount = 0
        if(servers.length == 1 && servers[0] == self.url){
          //FIRST SERVER IN NETWORK
          self.start = self.now();
          self.sync = self.start;
          self.nextSync = self.sync + self.syncIntervalMs;
          self.saving[self.sync] = {};
          return res();
        }
        if(servers.indexOf(self.url) !== -1){
          servers.splice(servers.indexOf(this.url), 1);
          if(servers.length < 1) rej("No initial servers found.")
        }
        let used = [self.url];
        let startClaims = [];
        let syncClaims = [];
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
          startClaims.push(data.start);
          syncClaims.push(data.sync);
          if(groups.length > self.groups.length){
            self.groups = [...groups];
            self.syncGroups = [...groups];
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
        self.start = mode(startClaims)
        self.sync = mode(syncClaims)
        self.nextSync = self.sync + self.syncIntervalMs;
        self.saving[self.sync] = {};
        res();
      } catch(e){
        return rej();
      }
    })
  }

  joinGroup = async () => {
    const self = this;
    return new Promise(async (res, rej) => {
      const groups = [...self.groups];
      let willCreateGroup = true;
      while(groups.length > 0 && !self.group){
        const gIndex = groups.length * Math.random() << 0
        const group = groups[gIndex];
        const url = group[group.length * Math.random() << 0];
        groups.splice(gIndex, 1);
        try {
          self.group = await new Promise(async(res, rej) => {
            try {
              await self.connectToServer(url);
              self.promises["Joined group from " + url] = {res, rej};
              self.conns[url].send(JSON.stringify({
                event: "Join group",
              }));
            } catch(e){
              // console.log(e)
            } 
          });
          willCreateGroup = false;
          console.log(self.url + " has joined group " + self.group.index);
          self.groups[self.group.index] = self.group.members;
          self.conns[url].send(JSON.stringify({
            event: "Joined group success"
          }));
          await self.syncTimeWithNearby();
          // await self.setLocal("group.json", self.group);
          // await self.setLocal("groups.json", self.groups);
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
      try {
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
      } catch(e){
        rej();
      }
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
          await new Promise(async(res, rej) => {
            await self.connectToServer(url);
            self.promises["New group found at " + url] = {res, rej};
            self.conns[url].send(JSON.stringify({
              event: "New group",
              data: {
                group: self.group
              }
            }));
          })
        } else if(self.group.index == 0){
          // self.start = now;
          // self.sync = self.start;
          // self.nextSync = self.sync + self.syncIntervalMs;
        }
        await self.syncTimeWithNearby();
        // await self.setLocal("group.json", self.group);
        // await self.setLocal("groups.json", self.groups);
        console.log(self.url + " has created group " + self.group.index);
        return res(true);
      } catch (e){
        rej();
        // console.log(e)
      }
    })
  }

  claimValorForData = async (path) => {
    const self = this;
    return new Promise(async (res, rej) => {
      try {
        if(!self.group || self.groups.length <= 0) return res();
        const valorGroupIndex = jumpConsistentHash(`valor/${self.ownerId}/${path}`, self.groups.length);
        const sync = self.sync;
        if(valorGroupIndex == self.group.index){     
          for(let i=0;i<self.group.members.length;i++){
            if(self.group.members[i] == self.url) continue;
            await self.connectToServer(self.group.members[i]);
            // await new Promise(async (res, rej) => {
              // self.promises["Claimed valor for path " + path + " from " + self.group.members[i]] = {res, rej};
              self.conns[self.group.members[i]].send(JSON.stringify({
                event: "Claim valor for path",
                data: {
                  path,
                  id: self.ownerId,
                  url: self.url,
                  sync
                }
              }));
            // })
          }
          const request = await self.get("requests/" + path);
          let publicD = await self.getPublicFromUrl(request.url);
          const dataGroupIndex = jumpConsistentHash("data/" + path, self.groups.length);
          if(dataGroupIndex !== self.group.index) return res()
          const data = await self.getLocal("all/data/" + path);
          const size = Buffer.byteLength(JSON.stringify(data), 'utf8');
          try {
            await self.verify(JSON.stringify(data), Buffer.from(request.data, "base64"), publicD.ecdsaPub);
          } catch(e){
            throw e;
          }
          let valor = self.saving[self.sync][`all/valor/${self.ownerId}/${path}`] || await self.get(`valor/${self.ownerId}/${path}`);
          if(valor && valor.data && valor.sigs && valor.data.for == self.ownerId && valor.data.path == path && valor.data.time?.length > 0){
            if(valor.data.size !== size){
              valor.data.size = size;
              delete valor.sigs;
              valor.sigs = {};
            }
            if(valor.data.time[valor.data.time.length - 1].length == 2){
              valor.data.time.push([sync]);
              delete valor.sigs;
              valor.sigs = {};
            }
          } else {
            valor = {
              data: {
                for: self.ownerId,
                url: self.url,
                path: path,
                size,
                sync,
                time: [[sync]]
              },
              sigs : {}
            }
          }
          valor.sigs[self.url] = Buffer.from(await self.sign(JSON.stringify(valor))).toString("base64");
          self.saving[self.sync][`all/valor/${self.ownerId}/${path}`] = valor;
          await self.setLocal(`all/valor/${self.ownerId}/${path}`, valor);
          await self.shareGroupSig(`valor/${self.ownerId}/${path}`);
          await self.addPathToLedger(path);
        } else {  
          for(let i=0;i<self.groups[valorGroupIndex].length;i++){
            const url = self.groups[valorGroupIndex][i];
            if(self.promises["Claimed valor for path " + path + " from " + url]) continue;
            await self.connectToServer(url);
            await new Promise(async (res, rej) => {
              self.promises["Claimed valor for path " + path + " from " + url] = {res, rej};
              self.conns[url].send(JSON.stringify({
                event: "Claim valor for path",
                data: {
                  path,
                  id: self.ownerId,
                  url: self.url,
                  sync
                }
              }));
            })
          }
          await self.addPathToLedger(path); 
        }
      } catch(e){
        console.log(e);
      }
      return res();
    })
  }

  updateValorClaims = async () => {
    const self = this;
    return new Promise(async (res, rej) => {
      let paths = getDirContents(__dirname + "/data/servers/" + self.pathUrl + "/all/valor");
      for(let i=0;i<paths.length;i++){
        const valor = self.saving[self.sync][`all/${paths[i]}`] || await self.get(`${paths[i]}`);
        if(!valor || !valor.data) continue;
        if(valor.data.time[valor.data.time.length - 1].length == 1){
          const dataGroupIndex = jumpConsistentHash("data/" + valor.data.path, self.groups.length);
          if(self.groups[dataGroupIndex].indexOf(valor.data.url) == -1){
            valor.data.time[valor.data.time.length - 1].push(self.nextSync);
            self.saving[self.sync][`all/${paths[i]}`] = valor;
            await self.setLocal(`all/${paths[i]}`, valor);
            console.log("Valor duration ended for " + valor.data.url + " on path " + valor.data.path)
            // console.log(valor.data);
          }
        }
      }
      return res();
    });
  }

  addPathToLedger = async (path) => {
    const self = this;
    return new Promise(async (res, rej) => {
      try {
        const ledgerGroupIndex = jumpConsistentHash("ledgers/" + self.ownerId + ".json", self.groups.length);
        const ledgerGroup = [...self.groups[ledgerGroupIndex]];
        for(let i=0;i<ledgerGroup.length;i++){
          const url = ledgerGroup[i];
          if(url !== self.url){
            try {
              if(self.promises[`Path ${path} added to ledger ${self.ownerId} from ${url}`]) continue;
              await self.connectToServer(url);
              // await new Promise(async(res, rej) => {
              //   self.promises[`Path ${path} added to ledger ${self.ownerId} from ${url}`] = {res, rej};
                self.conns[url].send(JSON.stringify({
                  event: "Add path to ledger",
                  data: {
                    id: self.ownerId,
                    path
                  }
                }))
              // })
            }catch(e){

            }
          } else {
            try {
              const valorGroupIndex = jumpConsistentHash(`valor/${self.ownerId}/${path}`, self.groups.length);
              const valorGroup = self.groups[valorGroupIndex];
              let valor = await self.get(`valor/${self.ownerId}/${path}`);
              let isValid = true;
              // TODO VERIFY VALOR WITH THE SIGS
              // for(let j=0;j<valorGroup.length;j++){
              //   const url = valorGroup[j];
              //   let v;
              //   if(url == self.url) {
              //     v = await self.getLocal(`all/valor/${self.ownerId}/${path}`);
              //   } else {
              //     try {
              //       v = await new Promise(async(res, rej) => {
              //         await self.connectToServer(url);
              //         self.promises["Got valor path " + path + " from " + url + " for " + self.ownerId] = {res, rej};
              //         self.conns[url].send(JSON.stringify({
              //           event: "Get valor path",
              //           data: {
              //             path,
              //             id: self.ownerId,
              //             group: self.group.index
              //           }
              //         }))
              //       })
              //     } catch(e){
              //     }
              //   }
              //   if(!valor && v) {
              //     valor = JSON.stringify(v.data);
              //   } else if(v && valor !== JSON.stringify(v.data)){
              //     isValid = false;
              //     break;
              //   }
              // }
              if(isValid){
                let d = self.saving[self.sync]["all/ledgers/" + self.ownerId + ".json"] || await self.getLocal("all/ledgers/" + self.ownerId + ".json");
                if(!d || !d.data) {
                  d = {
                    data: {
                      paths: {},
                      for: self.ownerId,
                    },
                    sigs: {}
                  }
                }
                if(!d.data.paths[path]){
                  d.data.paths[path] = 1;
                  delete d.sigs;
                  d.sigs = {};
                  d.sigs[self.url] = Buffer.from(await self.sign(JSON.stringify(d.data))).toString("base64");
                  self.saving[self.sync]["all/ledgers/" + self.ownerId + ".json"] = d;
                  await self.setLocal("all/ledgers/" + self.ownerId + ".json", d);
                  await self.shareGroupSig("ledgers/" + self.ownerId + ".json");
                }
              }
            } catch(e){
              console.log(e)
            }
          }
        }   
        return res()   
      } catch(e){
        return res();
      }
    })
  }

  calculateValor = async (id) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!id) return res(0);
      if(id.startsWith('http')){
        const publicD = await self.getPublicFromUrl(id);
        id = publicD.id;
      }
      try {
        const ledger = await self.get(`ledgers/${id}.json`);
        if(!ledger || !ledger.sigs) {
          return res(0)
        };
        const sigUrls = Object.keys(ledger.sigs);
        for(let i=0;i<sigUrls.length;i++){
          try {
            const ledgerPublic = await self.getPublicFromUrl(sigUrls[i]);
            await self.verify(JSON.stringify(ledger.data), Buffer.from(ledger.sigs[sigUrls[i]], "base64"), ledgerPublic.ecdsaPub);
          } catch(e){
            throw e;
          }
        }
        let valor = 0;
        const paths = Object.keys(ledger.data.paths);
        for(let i=0;i<paths.length;i++){
          try {
            const v = self.saving[self.sync][`all/valor/${id}/${paths[i]}`] || await self.get(`valor/${id}/${paths[i]}`);
            if(!v || !v.data) continue;
            const duration = self.getDuration(v.data.time);
            const amount = ((v.data.size / 10000000) * (duration / 1000000000 )) + (duration * 0.0000000005);
            valor += amount;
          } catch(e){
            continue;
          }
        }
        res(+valor.toFixed(12));
      } catch(e){
        rej(e);
      }
    })
  }

  getDuration(timeArr){
    const self = this;
    let dur = 0;
    for(let i=0;i<timeArr.length;i++){
      if(timeArr[i].length == 2){
        dur += Math.abs(timeArr[i][1] - timeArr[i][0]);
      }else if(timeArr[i].length == 1){
        dur += Math.abs(self.nextSync - timeArr[i][0]);
      }
    }
    return dur;
  }

  async syncPing(ws){
    const self = this;
    return new Promise(async (res, rej) => {
      try {
        const resp = await new Promise(async (res, rej) => {
          const start = self.now();
          ws.send(JSON.stringify({
            event: "Sync ping",
            data: {
              start
            }
          }))
          self.promises["Pong from " + ws.Url + " at " + start] = {res, rej};
        })
        resp.roundTrip = resp.end - resp.start;
        resp.latency = resp.roundTrip / 2;
        resp.offset = resp.pingReceived - resp.end + resp.latency;
        return res(resp)
      } catch(e){
        return rej();
      }
    })
  }

  syncTimeWithNearby = async () => {
    const self = this;
    return new Promise(async(res, rej) => {
      try {
        let offsets = [];
        if(!self.group) return res();
        for(let i=0;i<self.group.members.length;i++){
          try {
            const url = self.group.members[i];
            if(url == self.url) continue;
            await self.connectToServer(url);
            const ping = await self.syncPing(self.conns[url]);
            offsets.push(ping.offset);
          } catch(e){

          }
        }
        if(self.group.index > 0 && self.groups[self.group.index - 1]?.length > 0){
          try {
            const url = self.groups[self.group.index - 1][self.groups[self.group.index - 1]?.length * Math.random() << 0];
            await self.connectToServer(url);
            const ping = await self.syncPing(self.conns[url]);
            offsets.push(ping.offset);
          } catch(e){

          }
        }
        if(self.groups[self.group.index + 1]?.length > 0){
          try {
            const url = self.groups[self.group.index + 1][self.groups[self.group.index + 1]?.length * Math.random() << 0];
            await self.connectToServer(url);
            const ping = await self.syncPing(self.conns[url]);
            offsets.push(ping.offset);
          } catch (e){
          }
        }
        if(offsets.length > 0){
          self.timeOffset += offsets.reduce((a, b) => a + b) / offsets.length;
        }
        res();
      } catch(e){
        res();
      }
      
    })
  };

  syncInterval = async () => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(self.now() >= self.nextSync || self.sync == self.start){
        self.saving[self.sync] = {};
        self.syncGroup = Object.assign({}, self.group);
        self.syncGroups = [...self.groups];
        // await self.saveGroups();
      }
      res();
      const main = setInterval(async () => {
        if(!self.saving[self.sync]) self.saving[self.sync] = {};
        self.syncGroup = Object.assign({}, self.group);
        self.syncGroups = [...self.groups];
        try {
          await self.syncTimeWithNearby();
          // await self.saveGroups();
          // await self.sharePublic();
          // await self.syncGroupData();
          // await self.updateValorClaims();
          // await self.reassignGroupData();
        } catch(e){
          
        }
        delete self.saving[self.sync - (self.syncIntervalMs * 2)];
        self.sync = self.nextSync;
        self.nextSync += self.syncIntervalMs;
        self.saving[self.sync] = {};

        //VALOR TESTS
        if(self.url == 'http://localhost:3000/' || self.url == 'https://www.valoria.live/'){
          for(let i=0;i<self.groups.length;i++){
            for(let j=0;j<self.groups[i]?.length;j++){
              try {
                const valor = await self.calculateValor(self.groups[i][j]);
                console.log(`${self.groups[i][j]} Valor: ${valor}`);
              } catch(e){
                console.log(e)
              } 
            }
          }
          console.log("\n\n")
        }

      }, self.syncIntervalMs);
    })
  }

  saveGroups = async () => {
    const self = this;
    return new Promise(async(res, rej) => {
      const path = `groups/${self.sync}.json`;
      const group = jumpConsistentHash("data/" + path, self.syncGroups.length);
      if(self.syncGroup && group == self.syncGroup.index){
        const d = {
          data: {
            groups: self.syncGroups,
            sync: self.sync
          },
          sigs: {}
        };
        d.sigs[self.url] = Buffer.from(await self.sign(JSON.stringify(d.data))).toString("base64");
        self.saving[self.sync]["all/" + path] = d;
        await self.setLocal("all/" + path, d);
        await self.shareGroupSig(path);
      }
      res();
    });
  }

  shareGroupSig = async (path) => {
    const self = this;
    return new Promise(async (res, rej) => {
      const d = self.saving[self.sync]["all/" + path] || self.getLocal("all/" + path);
      if(!d || !d.sigs || !d.sigs[self.url]) return res();
      for(let i=0;i<self.group.members.length;i++){
        const url = self.group.members[i];
        if(url == self.url) continue;
        console.log("asking sig from " + url);
        new Promise(async (res, rej) => {
          await self.connectToServer(url);
          self.promises["Got group sig for " + path + " from " + url] = {res, rej};
          self.conns[url].send(JSON.stringify({
            event: "Share group sig",
            data: {
              path,
              sig: d.sigs[self.url]
            }
          }));
        }).then(async (sig) => {
          console.log("Got sig back");
          const publicD = await self.getPublicFromUrl(url);
          if(!publicD || !publicD.ecdsaPub) return
          console.log("Got public")
          try {
            await self.verify(JSON.stringify(d.data), Buffer.from(sig, "base64"), publicD.ecdsaPub);
            d.sigs[ws.Url] = data.sig;
            d.sigs[url] = sig;
            self.saving[self.sync]["all/" + path] = d;
            await self.setLocal("all/" + path, d);
          } catch(e){
            
          }
        }).catch((e) => {
          
        })       
      }
      console.log("share group sig done");
      return res();
    })
  }

  sharePublic = async () => {
    const self = this;
    return new Promise(async (res, rej) => {
      try {
        await self.set(`${self.pathUrl}/public.json`, self.public);
        // await self.set(`${self.id}/public.json`, self.public);
      } catch(e){
        // console.log(e)
      }
      return res();
    })
  }

  syncGroupData = async () => {
    const self = this;
    return new Promise(async(res, rej) => {
      const group = [...self.group.members];
      group.splice(group.indexOf(self.url), 1);
      if(group.length == 0) return res();
      const url = group[group.length * Math.random << 0];
      const paths = await new Promise(async (res, rej) => {
        await self.connectToServer(url);
        self.promises[`Got group paths from ${url}`] = {res, rej};
        self.conns[url].send(JSON.stringify({
          event: "Get group paths",
        }))
      });
      let dataPaths = [];
      for(let i=0;i<paths.length;i++){
        try {
          if(paths[i].startsWith("data/")){
            dataPaths.push(paths[i].substr(paths[i].indexOf("/") + 1));
          }
          const d = await self.get(paths[i]);
          await self.setLocal("all/" + paths[i], d);
        } catch(e){
          continue;
        }
      }
      for(let j=0;j<dataPaths.length;j++){
        try {
          await self.claimValorForData(dataPaths[j]);
        } catch(e){
          continue;
        }
      }
      return res();
    })
  }

  reassignGroupData = async () => {
    const self = this;
    return new Promise(async (res, rej) => {
      try {
        let paths = getDirContents(__dirname + "/data/servers/" + self.pathUrl + "/all");
        let groups = {};
        for(let i=0;i<paths.length;i++){
          const groupIndex = jumpConsistentHash(paths[i], self.groups.length);
          if(groupIndex !== self.group.index){
            if(!groups[groupIndex]) groups[groupIndex] = [];
            groups[groupIndex].push(paths[i]);
          }
        }
        const gIndices = Object.keys(groups);
        for(let j=0;j<gIndices.length;j++){
          try { 
            const paths = groups[gIndices[j]];
            const url = self.groups[gIndices[j]][self.groups[gIndices[j]].length * Math.random() << 0];
            await new Promise(async (res, rej) => {
              await self.connectToServer(url);
              self.promises["Group " + self.group.index + " data taken over from " + url] = {res, rej}
              self.conns[url].send(JSON.stringify({
                event: "Take over group data",
                data: {
                  paths,
                  group: self.group.index
                }
              }))
            });

            const groupIndices = Object.keys(self.pastPaths);
            for(let k=0;k<groupIndices.length;k++){
              if(Math.abs(groupIndices[k] - self.groups.length) >= 2){
                for( let l=0;l<self.pastPaths[groupIndices[k]].length; i++){
                  try {
                    await fs.unlinkSync(`${self.path}all/${self.pastPaths[k]}`);
                    let dir = `${self.path}all/${self.pastPaths[k]}`;
                    dir = dir.substring(0, dir.lastIndexOf("/"));
                    await fs.rmdirSync(dir)
                  } catch(e){
                    // console.log(e);
                  }
                }
              }
            }
            self.pastPaths[self.group.length] = paths;
          } catch(e){

          }
        }
      } catch(e){
        // console.log(e)
      }
      res();
    });
  }

  getPublicFromUrl = async (url) => {
    const self = this;
    return new Promise(async (res, rej) => {
      let publicD;
      if(url == self.url) {
        publicD = Object.assign({}, self.public);
      } else {
        try {
          let pathUrl = url.replace(/\//g, "");
          pathUrl = pathUrl.replace(/\:/g, "");
          publicD = await self.get(`data/${pathUrl}/public.json`, {public: true});
          if(!publicD){
            console.log("Public not found from GET: " + `data/${pathUrl}/public.json`);
            console.log("Asking the url for its own public info: " + url);
            publicD = await new Promise(async (res, rej) => {
              await self.connectToServer(url);
              self.promises["Got public from " + url] = {res, rej};
              self.conns[url].send(JSON.stringify({
                event: "Get public",
              }))
            })
            console.log("GOT PUBLIC from url");
          }
          const ecdsaPubHash = await subtle.digest("SHA-256", Buffer.from(publicD.ecdsaPub, 'base64'));
          const id = Buffer.from(ecdsaPubHash).toString('hex').substr(24, 64);
          if(publicD.id !== id) return rej({err: "Invalid public data"});
        } catch(e){
          rej(e)
        }
      }
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

  getPublicFromId = async (id) => {
    const self = this;
    return new Promise(async (res, rej) => {
      try {
        let publicD = await self.get(`data/${id}/public.json`);
        if(!publicD) {
          return rej({err: "Could not find public"});
        }
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
      } catch(e){
        rej(e)
      }
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
        res(signature)
      } catch(e) {
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
      } catch(e){
        rej(e)
      }
    })
  }

  setupWS = async (ws) => {
    const self = this;
    return new Promise(async(res, rej) => {
      // ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
      })
      ws.on('close', async () => {
        if(self.conns[ws.Url]?.dimension && self.dimensions[ws.dimension]){
          delete self.dimensions[ws.dimension].conns[ws.Url];
          const peers = Object.keys(self.dimensions[ws.dimension].conns)
          for(let i=0;i<self.group.members.length;i++){
            if(self.url == self.group.members[i] || ws.Url == self.group.members[i]) continue;
            self.conns[self.group.members[i]]?.send(JSON.stringify({
              event: "Peer has left group dimension",
              data: {
                dimension: ws.dimension,
                url: ws.Url
              }
            }))
          }
          for(let i=0;i<peers.length;i++){
            self.conns[peers[i]]?.send(JSON.stringify({
              event: "Peer has left dimension",
              data: {
                dimension: ws.dimension,
                url: ws.Url
              }
            }))
          }
        }
        if(ws.Url && ws.Url !== self.url && self.group.members.indexOf(ws.Url) !== -1){
          await self.handleMemberHasLeftGroup(ws, {index: self.group.index, url: ws.Url})
        } else if(
          self.groups[self.group.index + 1]?.indexOf(ws.Url) !== -1 &&
          self.groups[self.group.index + 1]?.length == 1
        ){
          await self.handleGroupRemoved(ws, {index: self.group.index + 1, url: ws.Url})
        } else if(
          self.groups[self.group.index - 1]?.indexOf(ws.Url) !== -1 && 
          self.groups[self.group.index - 1]?.length == 1
        ){
          await self.handleGroupRemoved(ws, {index: self.group.index - 1, url: ws.Url})
        }
        if(self.conns[ws.Url]?.peers){
          let peerUrls = Object.keys(self.conns[ws.Url].peers);
          for(let i=0;i<peerUrls.length;i++){
            if(!self.conns[peerUrls[i]]) continue;
            self.conns[peerUrls[i]]?.send(JSON.stringify({
              event: "Peer disconnect",
              data: {
                url: ws.Url
              }
            }));
            if(self.conns[peerUrls[i]]?.peers[ws.Url]){
              delete self.conns[peerUrls[i]].peers[ws.Url]
            }
          }
        }
        delete self.conns[ws.Url];
        ws.Url = "";
        ws.terminate();
      })
      ws.on('message', async (d) => {
        d = JSON.parse(d);
        try {
          switch (d.event) {
            case 'Get public':
              await self.handleGetPublic(ws, d.data);
              break;
            case 'Got public':
              await self.handleGotPublic(ws, d.data);
              break;
            case 'Connect to peer ws':
              await self.handleConnectToPeerWs(ws, d.data);
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
            case 'Verify peer url with key':
              await self.handleVerifyPeerUrl(ws, d.data);
              break;
            case 'Set origin url':
              await self.handleSetOriginUrl(ws, d.data);
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
            case 'New member in group response':
              await self.handleNewMemberInGroupResponse(ws, d.data);
              break;
            case 'Member has left group':
              await self.handleMemberHasLeftGroup(ws, d.data);
              break;
            case 'New group':
              await self.handleNewGroup(ws, d.data);
              break;
            case 'New group found':
              await self.handleNewGroupFound(ws, d.data);
              break;
            case 'Group removed':
              await self.handleGroupRemoved(ws, d.data);
              break;
            case "Sync ping":
              await self.handleSyncPing(ws, d.data)
              break;
            case "Sync pong":
              await self.handleSyncPong(ws, d.data)
              break;
            case "Share group sig":
              await self.handleShareGroupSig(ws, d.data)
              break;
            case "Got group sig":
              await self.handleGotGroupSig(ws, d.data)
              break;
            case "Get group paths":
              await self.handleGetGroupPaths(ws, d.data);
              break;
            case "Got group paths":
              await self.handleGotGroupPaths(ws, d.data);
              break;
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
            case "Group sot":
              await self.handleGroupSot(ws, d.data);
              break;
            case "Take over group data":
              await self.handleTakeOverGroupData(ws, d.data);
              break;
            case "Group data taken over":
              await self.handleGroupDataTakenOver(ws, d.data);
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
            case "Path added to ledger":
              await self.handlePathAddedToLedger(ws, d.data);
              break;
            case "Join dimension":
              await self.handleJoinDimension(ws, d.data);
              break;
            case "New peer in group dimension":
              await self.handleNewPeerInGroupDimension(ws, d.data);
              break;
            case "Peer has left group dimension":
              await self.handlePeerHasLeftGroupDimension(ws, d.data);
              break;
            case "Get peers in group dimension":
              await self.handleGetPeersInGroupDimension(ws, d.data);
              break;
            case "Got peers in group dimension":
              await self.handleGotPeersInGroupDimension(ws, d.data);
              break;
            case "Send rtc description":
              self.handleSendRtcDescription(ws, d.data);
              break;
            case "Send rtc candidate":
              self.handleSendRtcCandidate(ws, d.data);
              break;
          }
        } catch(e){

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
        delete self.promises["Pong from " + ws.Url + " at " + data.start]
      }
      return res();
    })
  }

  handleConnectToPeerWs = async (ws, data) => {
    const self = this;
    return new Promise (async (res, rej) => {
      if(!ws.Url || !data.id) return res();
      let url = self.url + "valoria/peers/" + data.id + "/";
      if(!self.conns[url]) return res();
      self.conns[url].send(JSON.stringify({
        event: "Connect to server request",
        data: {
          url: ws.Url
        }
      }));
      return res();
    })
  }

  handleVerifyUrlRequest = async (ws, data) => {
    const self = this;
    return new Promise(async( res, rej) => {
      try {
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
        res();
      } catch(e){
        rej();
      }
    })
  }

  handleVerifyUrlKey = async (ws, data) => {
    const self = this;
    return new Promise(async( res, rej) => {
      if(!self.promises["Url verified with " + ws.Url] || !data.key) return res();
      let pathUrl = ws.Url.replace(/\//g, "");
      pathUrl = pathUrl.replace(/\:/g, "");
      self.verificationKeys["/valoria/verifying/" + pathUrl] = data.key;
      self.app.get("/valoria/verifying/" + pathUrl, (req, res) => {
        res.send(self.verificationKeys[req.path]);
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
      try {
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
          if(self.promises["Connected to peer ws for " + ws.Url]){
            self.promises["Connected to peer ws for " + ws.Url].res(ws);
          }
          return res();
        } else {
          ws.send(JSON.stringify({
            event: "Url verified",
            data: {
              err: true
            }
          }))
        }
      } catch(e){
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
      delete self.promises["Url verified with " + ws.Url]
      res()
    })
  }

  handleVerifyPeerUrl= async (ws, data) => {
    const self = this;
    return new Promise(async(res, rej) => {
      if(self.conns[ws.Url] && self.conns[ws.Url].originUrl == self.url){
        let pathUrl = data.url.replace(/\//g, "");
        pathUrl = pathUrl.replace(/\:/g, "");
        self.verificationKeys["/valoria/peers/" + self.conns[ws.Url].peerId + "/valoria/verifying/" + pathUrl] = data.key;
        self.app.get("/valoria/peers/" + self.conns[ws.Url].peerId + "/valoria/verifying/" + pathUrl, (req, res) => {
          res.send(self.verificationKeys[req.path]);
          delete self.verificationKeys[req.path];
        })
        ws.send(JSON.stringify({
          event: "Verified peer url",
          data: {
            url: data.url
          }
        }))
      }
      res()
    })
  }

  handleSetOriginUrl= async (ws, data) => {
    const self = this;
    return new Promise(async(res, rej) => {
      if(!data.id) return res();
      let url = self.url + "valoria/peers/" + data.id + "/";
      ws.Url = url;
      ws.peerId = data.id;
      ws.originUrl = self.url;
      self.conns[url] = ws;
      ws.send(JSON.stringify({
        event: "Origin url set",
        data: {
          url: data.url,
          success: true
        }
      }))
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
          sync: self.sync
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
        delete self.promises["Got groups from " + ws.Url]
      }
      return res();
    })
  }

  handleGetGroupPaths(ws){
    const self = this;
    return new Promise(async( res, rej) => {
      const paths = getDirContents(__dirname + "/data/servers/" + self.pathUrl + "/all");
      ws.send(JSON.stringify({
        event: "Got group paths",
        data: {
          paths
        }
      }))
      return res();
    })
  }

  handleGotGroupPaths(ws, data){
    const self = this;
    return new Promise(async( res, rej) => {
      if(self.promises["Got group paths from " + ws.Url]){
        self.promises["Got group paths from " + ws.Url].res(data.paths)
        delete self.promises["Got group paths from " + ws.Url]
      }
      return res();
    })
  }

  handleJoinGroupRequest = async (ws) => {
    const self = this;
    return new Promise(async (res, rej) => {
      console.log("handle join group request from " + ws.Url);
      try {
        const g = self.group;
        if(g.members.indexOf(ws.Url) !== -1){
          ws.send(JSON.stringify({
            event: "Joined group",
            data: {err: "Already joined group"}
          }));
          console.log("already in group");
          res();
          return
        }
        if(g.members.length < g.max){
          try {
            console.log("Asking if group is full");
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
            console.log("Group not full");
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
          console.log("NEW MEMBER IN GROUP. GOTTA TELL OTHER MEMBERS!");
          for(let i=0;i<g.members?.length;i++){
            if(g.members[i] == self.url || g.members[i] == ws.Url) continue;
            await new Promise(async (res, rej) => {
              await self.connectToServer(g.members[i]);
              self.promises["New member in group response from " + g.members[i] + " for version " + g.version] = {res, rej};
              self.conns[g.members[i]].send(JSON.stringify({
                event: "New member in group",
                data: g
              }))
            })
          }
          console.log("TOLD!!!!")
          self.conns[ws.Url].send(JSON.stringify({
            event: "Joined group",
            data: g
          }));
          await new Promise((res, rej) => {
            self.promises["Joined group success from " + ws.Url] = {res, rej};
          })

          //SEND GROUP DATA TO NEW MEMBER. TODO - MUST SEND ALL DATA BEFORE THE SERVER CLAIMS THE DATA. 
          // let paths = getDirContents(__dirname + "/data/servers/" + self.pathUrl + "/all");
          // for(let i=0;i<paths.length;i++){
          //   let path = paths[i].substr(paths[i].indexOf("/") + 1);
          //   path = path.substr(path.indexOf("/") + 1);
          //   path = path.substr(path.indexOf("/") + 1);
          //   // if(path.startsWith("ledgers/")) continue;
          //   const groupIndex = jumpConsistentHash(path, self.groups.length);
          //   if(groupIndex == self.group.index){
          //     try {
          //       await new Promise(async (res, rej) => {
          //         const data = await self.getLocal("all/" + path);
          //         self.promises["Group sot for " + path + " from " + ws.Url] = {res, rej};
          //         ws.send(JSON.stringify({
          //           event: "Group set",
          //           data: {
          //             path,
          //             data
          //           }
          //         }));
          //       })
          //     } catch(e){}
          //   }
          // }

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
          // await self.setLocal("group.json", self.group);
          // await self.setLocal("groups.json", self.groups);
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
      if(!ws.Url || !self.group || self.group.members.indexOf(ws.Url) == -1) return err();
      ws.send(JSON.stringify({
        event: "Group not full response",
        data: {
          success: self.group.members.length < self.group.max
        }
      }))
      function err(){
        ws.send(JSON.stringify({
          event: "Group not full response",
          data: {
            err: true
          }
        }))
      }
      return res()
    })
  }

  
  handleGroupNotFullResponse = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!self.promises["Group not full from " + ws.Url]) return res();
      if(data.success){
        self.promises["Group not full from " + ws.Url].res();
      } else {
        self.promises["Group not full from " + ws.Url].rej();
      }
      delete self.promises["Group not full from " + ws.Url].rej();
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
        delete self.promises["Joined group from " + ws.Url]
      }
      res();
    })
  }

  handleJoinedGroupSuccess(ws){
    const self = this;
    return new Promise((res, rej) => {
      if(self.promises["Joined group success from " + ws.Url]){
        self.promises["Joined group success from " + ws.Url].res();
        delete self.promises["Joined group success from " + ws.Url];
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
      delete self.promises["New group response from " + ws.Url]
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
      delete self.promises[`Group ${data.index} can be created from ${ws.Url}`]
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
        if(!data.group || data.group.index < 0 || !ws.Url) return res();
        if(data.group.index !== self.groups.length) {
          ws.send(JSON.stringify({
            event: "New group found",
            data: {success: false}
          }))
          return res();
        }
        if(self.group.members.indexOf(ws.Url) !== -1){
          self.groups.push(data.group.members);
          if(self.canCreate && self.canCreate == data.index) self.canCreate = null;
          await self.updateValorClaims();
          await self.reassignGroupData();
        }
        else if((data.group.index == self.groups.length && data.group.index == self.group.index + 1) || self.groups[self.group.index + 1]?.indexOf(ws.Url) !== -1){
          self.groups.push(data.group.members);
          if(self.canCreate && self.canCreate == data.index) self.canCreate = null;
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
          await self.updateValorClaims();
          await self.reassignGroupData();
          ws.send(JSON.stringify({
            event: "New group found",
            data: {success: true}
          }))
        }
      } catch(e){
        console.log(e)
      }
      // await self.setLocal("group.json", self.group);
      // await self.setLocal("groups.json", self.groups);
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
        delete self.promises["New group found at " + ws.Url];
      }
      res();
    })
  }

  handleGroupRemoved = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(self.groups[data.index]?.indexOf(data.url) !== -1 && self.groups[data.index]?.length == 1){
        self.groups.splice(data.index, 1);
        if(self.canCreate && self.canCreate == data.index) self.canCreate = null;
        if(data.index < self.group.index){
          self.group.index -= 1;
          self.group.version += 1;
          self.group.updated = self.sync;
        }
        await self.updateValorClaims();
        await self.reassignGroupData();
        if(self.group.members.indexOf(ws.Url) == -1){
          for(let i=0;i<self.group.members.length;i++){
            const url = self.group.members[i];
            if(url == self.url) continue;
            self.conns[url].send(JSON.stringify({
              event: "Group removed",
              data
            }))
          }
          if(data.index > self.group.index && self.groups[self.group.index - 1]){
            const g = self.groups[self.group.index - 1];
            const url = g[g.length * Math.random() << 0];
            await self.connectToServer(url);
            self.conns[url].send(JSON.stringify({
              event: "Group removed",
              data
            }))
          } else if(data.index < self.group.index && self.groups[self.group.index + 1]){
            const g = self.groups[self.group.index + 1];
            const url = g[g.length * Math.random() << 0];
            await self.connectToServer(url);
            self.conns[url].send(JSON.stringify({
              event: "Group removed",
              data
            }))
          }
        }

      }
      return res();
    })
  }

  handleNewMemberInGroup = async (ws, data) => {
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
          ws.send(JSON.stringify({
            event: "New member in group response",
            data: {
              version: data.version
            }
          }))
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
      res();
    })
  }

  handleNewMemberInGroupResponse = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!self.promises["New member in group response from " + ws.Url + " for version " + data.version]) return res();
      self.promises["New member in group response from " + ws.Url + " for version " + data.version].res();
      delete self.promises["New member in group response from " + ws.Url + " for version " + data.version];
      return res()
    })
  }

  handleMemberHasLeftGroup = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(self.group.index == data.index && self.group.members.indexOf(data.url) !== -1){
        // if(self.conns[data.url]) delete self.conns[data.url]
        self.group.members.splice(self.group.members.indexOf(data.url), 1);
        if(self.groups[self.group.index].indexOf(data.url) !== -1){
          self.groups[self.group.index].splice(self.groups[self.group.index].indexOf(data.url), 1); 
        }
        self.group.updated = self.sync;
        self.group.version += 1;
      } else if (self.groups[data.index]?.indexOf(data.url) !== -1){
        // if(self.conns[data.url]) delete self.conns[data.url]
        self.groups[data.index]?.splice(self.groups[data.index]?.indexOf(data.url), 1); 
        if(self.group.members.indexOf(ws.Url) == -1){
          for(let i=0;i<self.group.members.length;i++){
            let url = self.group.members[i];
            if(url == self.url) continue;
            self.conns[url].send(JSON.stringify({
              event: "Member has left group",
              data
            }))
          }
        }
      }
      if(self.groups[self.group.index + 1] && data.index <= self.group.index){
        const g = self.groups[self.group.index + 1];
        const url = g[g.length * Math.random() << 0];
        await self.connectToServer(url);
        self.conns[url].send(JSON.stringify({
          event: "Member has left group",
          data
        }))
      }
      if(self.groups[self.group.index - 1] && data.index >= self.group.index){
        const g = self.groups[self.group.index - 1];
        const url = g[g.length * Math.random() << 0];
        await self.connectToServer(url);
        self.conns[url].send(JSON.stringify({
          event: "Member has left group",
          data
        }))
      }
      await self.updateValorClaims();
      return res();
    });
  }

  handleGet = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      try {
        if(!data.path || !data.now) return res();
        if(ws.Url && self.groups[data.group]?.indexOf(ws.Url) !== -1){
          const d = self.saving[self.sync]["all/" + data.path] || await self.getLocal("all/" + data.path);
          ws.send(JSON.stringify({
            event: "Got",
            data: {
              path: data.path,
              data: d,
              now: data.now,
              public: data.public
            }
          }))
        }
      } catch(e){

      }
      return res()
    })
  }

  handleSet = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(ws.Url.length > 22){
        console.log("handle set for " + data.path);
      }
      try {
        if(!data.path || !data.data) return res();
        if(ws.Url && self.groups[data.group]?.indexOf(ws.Url) !== -1){
          let request = await self.get("requests/" + data.path);
          if(!request) return err();
          if(request.url){
            if(request.url !== ws.Url) return err();
            try {
              let publicD = await self.getPublicFromUrl(request.url);
              if(!publicD) return err();
              await self.verify(JSON.stringify(data.data), Buffer.from(request.data, "base64"), publicD.ecdsaPub);
            } catch(e){
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
            try {
              await new Promise(async (res, rej) => {
                self.promises["Group sot for data/" + data.path + " from " + self.group.members[i]] = {res, rej};
                await self.connectToServer(self.group.members[i]);
                self.conns[self.group.members[i]].send(JSON.stringify({
                  event: "Group set",
                  data: {
                    data: data.data,
                    path: "data/" + data.path
                  }
                }));
              })
            } catch(e){

            }
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
      } catch(e){

      }
      return res()
    })
  }

  handleSetRequest = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      try {
        if(!data.request) return res();
        if(ws.Url && self.groups[data.request.group]?.indexOf(ws.Url) !== -1){
          const d = await self.getLocal("all/requests/" + data.request.path);
          if(d && d.from == data.request.from) {
            try {
              await self.verify(JSON.stringify(data), Buffer.from(d.data, "base64"), self.ECDSA.publicKey);
              ws.send(JSON.stringify({
                event: "Set request saved",
                data: {
                  path: data.request.path,
                  err: true
                }
              }))
              return res()
            } catch(e){
            }
          }
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
            try {
              await new Promise(async (res, rej) => {
                self.promises["Group sot for requests/" + data.request.path + " from " + self.group.members[i]] = {res, rej};
                await self.connectToServer(self.group.members[i]);
                self.conns[self.group.members[i]].send(JSON.stringify({
                  event: "Group set",
                  data: {
                    data: data.request,
                    path: "requests/" + data.request.path
                  }
                }));
              })
            } catch(e){

            }
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
      } catch(e){
        ws.send(JSON.stringify({
          event: "Set request saved",
          data: {
            path: data.request.path,
            err: true
          }
        }))
        return res();
      }
    })
  }

  handleSetRequestSaved = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!self.promises["Sent request to " + ws.Url + " for " + data.path]) return res();
      if(data.success){
        self.promises["Sent request to " + ws.Url + " for " + data.path].res();
      } else {
        self.promises["Sent request to " + ws.Url + " for " + data.path].rej();
      }
      delete self.promises["Sent request to " + ws.Url + " for " + data.path]
      return res()
    })
  }

  handleGetSetRequest = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      try {
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
      } catch(e){
      }
      return res()
    })
  }

  handleGotSetRequest = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!self.promises["Got set request from " + ws.Url + " for " + data.path]) return res();
      self.promises["Got set request from " + ws.Url + " for " + data.path].res(data.request);
      delete self.promises["Got set request from " + ws.Url + " for " + data.path];
      return res()
    })
  }

  handleGroupSet = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      try {
        if(!data.path || !data.data) return err();
        console.log("Group set from " + ws.Url);
        if(ws.Url && self.group?.members?.indexOf(ws.Url) !== -1){
          console.log("Setting");
          // if(data.path.startsWith("ledgers/")) return err();
          await self.setLocal("all/" + data.path, data.data);
          ws.send(JSON.stringify({
            event: "Group sot",
            data: {
              path: data.path,
              success: true
            }
          }));
          if(data.path.startsWith("data/")){
            await self.claimValorForData(data.path.substr(5));
          }
        } else return err();
      } catch(e){
        console.log(e);
        return err();
      }
      function err(){
        ws.send(JSON.stringify({
          event: "Group sot",
          data: {
            path: data.path,
            err: true
          }
        }));
        return res();
      }
      return res()
    })
  }

  handleTakeOverGroupData = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      try {
        if(!data.paths) return err();
        const paths = data.paths;
        if(ws.Url && self.groups[data.group].indexOf(ws.Url) !== -1){
          const pastLength = data.group > self.group.index ? self.group.index + 1 : self.group.index;
          let dataPaths = [];
          for(let i=0;i<paths.length;i++){
            if(jumpConsistentHash(paths[i], pastLength) !== data.group) continue;
            try {
              if(paths[i].startsWith("data/")){
                dataPaths.push(paths[i].substr(paths[i].indexOf("/") + 1));
              }
              const d = await new Promise(async(res, rej) => {
                const now = self.now()
                self.promises["Got data from " + ws.Url + " for " + paths[i] + " at " + now] = {res, rej};
                self.conns[ws.Url].send(JSON.stringify({
                  event: "Get",
                  data: {
                    path : paths[i],
                    group: self.group.index,
                    now
                  }
                }))
              });
              if(paths[i].startsWith("ledgers")){
                // delete d.sigs;
                // d.sigs = {};
              }
              await self.setLocal("all/" + paths[i], d);
            } catch(e){
              continue;
            }
          }
          ws.send(JSON.stringify({
            event: "Group data taken over",
            data: {
              group: data.group,
              success: true
            }
          }))
          res();
          for(let j=0;j<dataPaths.length;j++){
            try {
              await self.claimValorForData(dataPaths[j]);
            } catch(e){
              continue;
            }
          }
        } else {
          return err()
        }
      } catch(e){
        return err();
      }
      function err(){
        ws.send(JSON.stringify({
          event: "Group data taken over",
          data: {
            group: data.group,
            err: true
          }
        }))
        return res();
      }
      return res()
    })
  }

  handleGroupDataTakenOver = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!self.promises["Group " + data.group + " data taken over from " + ws.Url]) return res();
      if(data.success){
        self.promises["Group " + data.group + " data taken over from " + ws.Url].res()
      } else {
        self.promises["Group " + data.group + " data taken over from " + ws.Url].rej()
      }
      delete self.promises["Group " + data.group + " data taken over from " + ws.Url]
      return res()
    })
  }


  handleGot = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!data.public) data.public = "";
      if(!self.promises["Got data from " + ws.Url + " for " + data.path + " at " + data.now + data.public]) return res();
      self.promises["Got data from " + ws.Url + " for " + data.path + " at " + data.now + data.public].res(data.data);
      delete self.promises["Got data from " + ws.Url + " for " + data.path + " at " + data.now + data.public]
      return res()
    })
  }

  handleSot = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!self.promises["Set data from " + ws.Url + " for " + data.path]) return res();
      self.promises["Set data from " + ws.Url + " for " + data.path].res(data.success);
      delete self.promises["Set data from " + ws.Url + " for " + data.path]
      return res()
    })
  }

  handleGroupSot = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!self.promises["Group sot for " + data.path + " from " + ws.Url]) return res();
      self.promises["Group sot for " + data.path + " from " + ws.Url].res();
      delete self.promises["Group sot for " + data.path + " from " + ws.Url];
      return res()
    })
  }

  handleGetPublic = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      // if(!ws.Url) return res();
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
      delete self.promises["Got public from " + ws.Url]
      return res()
    })
  }

  handleShareGroupSig = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      console.log("Handle share group sig from " + ws.Url);
      if(!ws.Url || !self.group || self.group.members.indexOf(ws.Url) == -1 || !data.path || !data.sig) return err();
      const d = self.saving[self.sync]["all/" + data.path] || await self.getLocal("all/" + data.path);
      if(!d || !d.data || !d.sigs || !d.sigs[self.url]) {
        return err()
      }
      console.log("Got data")
      const publicD = await self.getPublicFromUrl(ws.Url);
      if(!publicD || !publicD.ecdsaPub) return err();
      console.log("got public")
      try {
        await self.verify(JSON.stringify(d.data), Buffer.from(data.sig, "base64"), publicD.ecdsaPub);
        console.log("verified");
        d.sigs[ws.Url] = data.sig;
        self.saving[self.sync]["all/" + data.path] = d;
        await self.setLocal("all/" + data.path, d);
        ws.send(JSON.stringify({
          event: "Got group sig",
          data: {
            path: data.path,
            sig: d.sigs[self.url]
          }
        }));
        console.log("Sent success")
        return res();
      } catch(e){
        return err();
      }
      function err(){
        ws.send(JSON.stringify({
          event: "Got group sig",
          data: {
            path: data.path,
            err: true
          }
        }));
        console.log("Sent error")
        return res()
      }
    })
  }

  handleGotGroupSig = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!self.promises["Got group sig for " + data.path + " from " + ws.Url]) return res();
      self.promises["Got group sig for " + data.path + " from " + ws.Url].res(data.sig)
      delete self.promises["Got group sig for " + data.path + " from " + ws.Url];
      return res()
    })
  }


  handleClaimValorForPath = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      try {
        if(!ws.Url || !data.path || !data.url) return err();
        console.log("Handle claim valor for " + ws.Url);
        const valorGroupIndex = jumpConsistentHash("valor/" + data.id + "/" + data.path, self.groups.length);
        if(valorGroupIndex !== self.group.index) return err();
        const request = await self.getSetRequest(data.path);
        if(!request) return err();
        let reqPublicD = await self.getPublicFromUrl(request.url);
        if(!reqPublicD) return err();
        const dataGroupIndex = jumpConsistentHash("data/" + data.path, self.groups.length);
        if(self.groups[dataGroupIndex].indexOf(data.url) == -1) return err();
        const now = self.now();
        await self.connectToServer(data.url);
        console.log("Handling claim: Getting the data for valor");
        const d = await new Promise(async(res, rej) => {
          self.promises["Got data from " + data.url + " for data/" + data.path + " at " + now] = {res, rej};
          self.conns[data.url].send(JSON.stringify({
            event: "Get",
            data: {
              path: "data/" + data.path,
              group: self.group.index,
              now
            }
          }))
        })
        if(!d) return err();
        console.log("handling claim: got data")
        const size = Buffer.byteLength(JSON.stringify(d), 'utf8')
        try {
          await self.verify(JSON.stringify(d), Buffer.from(request.data, "base64"), reqPublicD.ecdsaPub);
        } catch(e){
          console.log(e);
          throw e;
        }
        console.log("handling claim: data verified")
        let valor = self.saving[self.sync][`all/valor/${data.id}/${data.path}`] || await self.get(`valor/${data.id}/${data.path}`);
        if(valor && valor.data && valor.sigs && valor.data.for == data.id && valor.data.path == data.path && valor.data.time?.length > 0){
          if(valor.data.size !== size){
            valor.data.size = size;
            delete valor.sigs;
            valor.sigs = {};
          }
          if(valor.data.time[valor.data.time.length - 1].length == 2){
            valor.data.time.push([data.sync]);
            delete valor.sigs;
            valor.sigs = {};
          }
        } else {
          valor = {
            data: {
              for: data.id,
              url: data.url,
              path: data.path,
              size,
              sync: data.sync,
              time: [[data.sync]]
            },
            sigs: {}
          }
        }
        valor.sigs[self.url] = Buffer.from(await self.sign(JSON.stringify(valor))).toString("base64");
        self.saving[self.sync][`all/valor/${data.id}/${data.path}`] = valor;
        await self.setLocal(`all/valor/${data.id}/${data.path}`, valor);
        console.log("handling claim: sharing group sig");
        await self.shareGroupSig(`valor/${data.id}/${data.path}`);
        console.log("handling claim: valor saved");
        ws.send(JSON.stringify({
          event: "Claimed valor for path",
          data: {
            success: true,
            path: data.path
          }
        }))
        return res()
      } catch(e){
        err();
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
        delete self.promises["Claimed valor for path " + data.path + " from " + ws.Url]
      }
      return res();
    })
  }

  handleGetValorPath(ws, data){
    const self = this;
    return new Promise(async (res, rej) => {
      try {
        if(!data.path || !data.id) return res();
        if(ws.Url && self.groups[data.group]?.indexOf(ws.Url) !== -1){
          const d = await self.saving[self.sync][`all/valor/${data.id}/${data.path}`] || await self.getLocal(`all/valor/${data.id}/${data.path}`);
          ws.send(JSON.stringify({
            event: "Got valor path",
            data: {
              path: data.path,
              id: data.id,
              valor: d
            }
          }))
        }
      } catch (e){

      }
      return res();
    })
  }

  handleGotValorPath(ws, data){
    const self = this;
    return new Promise(async (res, rej) => {
      if(self.promises["Got valor path " + data.path + " from " + ws.Url + " for " + data.id]){
        self.promises["Got valor path " + data.path + " from " + ws.Url + " for " + data.id].res(data.valor);
        delete self.promises["Got valor path " + data.path + " from " + ws.Url + " for " + data.id]
      }
      return res();
    })
  }

  handleGetLedger(ws, data){
    const self = this;
    return new Promise(async (res, rej) => {
      try {
        if(!data.id) return res();
        if(ws.Url && self.groups[data.group]?.indexOf(ws.Url) !== -1){
          const d = await self.saving[self.sync]["all/ledgers/" + data.id + ".json"] || await self.getLocal("all/ledgers/" + data.id + ".json");
          ws.send(JSON.stringify({
            event: "Got ledger",
            data: {
              id: data.id,
              ledger: d
            }
          }))
        }
      } catch(e){

      }
      return res();
    })
  }

  handleGotLedger(ws, data){
    const self = this;
    return new Promise(async (res, rej) => {
      if(self.promises["Got ledger " + data.id + " from " + ws.Url]){
        self.promises["Got ledger " + data.id + " from " + ws.Url].res(data.ledger);
        delete self.promises["Got ledger " + data.id + " from " + ws.Url]
      }
      return res();
    })
  }

  handleAddPathToLedger(ws, data){
    const self = this;
    return new Promise(async (res, rej) => {
      try {
        if(!ws.Url || !data.path || !data.id) return res();
        console.log("handle add path to ledger for " + ws.Url);
        const valorGroupIndex = jumpConsistentHash(`valor/${data.id}/${data.path}`, self.groups.length);
        const valorGroup = self.groups[valorGroupIndex];
        let valor = await self.get(`valor/${data.id}/${data.path}`);
        let isValid = true;
        //TODO VERIFY VALOR WITH SIGS
        if(isValid){
          console.log("handle ledger: Valor is valid");
          let d = self.saving[self.sync]["all/ledgers/" + data.id + ".json"] || await self.getLocal("all/ledgers/" + data.id + ".json");
          if(!d || !d.data) d = {
            data: {
              paths: {},
              for: data.id,
            },
            sigs: {}
          }
          if(d.data.paths[data.path]) {
            ws.send(JSON.stringify({
              event: "Path added to ledger",
              data: {
                path: data.path,
                id: data.id,
                success: true
              }
            }));
            console.log("handle ledger success")
            return res();
          }
          d.data.paths[data.path] = 1
          delete d.sigs;
          d.sigs = {};
          d.sigs[self.url] = Buffer.from(await self.sign(JSON.stringify(d.data))).toString("base64");
          self.saving[self.sync]["all/ledgers/" + data.id + ".json"] = d;
          await self.setLocal("all/ledgers/" + data.id + ".json", d);
          await self.shareGroupSig("ledgers/" + data.id + ".json");
          ws.send(JSON.stringify({
            event: "Path added to ledger",
            data: {
              path: data.path,
              id: data.id,
              success: true
            }
          }));
          console.log("handle ledger success")
        }
      } catch(e){
        // console.log(e);
        ws.send(JSON.stringify({
          event: "Path added to ledger",
          data: {
            path: data.path,
            id: data.id,
            err: true
          }
        }));
        console.log("handle ledger err");
      }
      return res();
    })
  }

  reset = async () => {
    const self = this;
    return new Promise(async(res, rej) => {
      try {
        await fs.rmdirSync(__dirname + "/data/servers/" + self.pathUrl + "/all", {recursive: true, force: true});
      } catch(e){

      }
      res();
    })
  }

  handlePathAddedToLedger(ws, data){
    const self = this;
    return new Promise(async (res, rej) => {
      if(self.promises[`Path ${data.path} added to ledger ${data.id} from ${ws.Url}`]){
        self.promises[`Path ${data.path} added to ledger ${data.id} from ${ws.Url}`].res();
        delete self.promises[`Path ${data.path} added to ledger ${data.id} from ${ws.Url}`];
      }
      return res();
    })
  }

  handleJoinDimension(ws, data){
    const self = this;
    return new Promise(async( res, rej) => {
      const id = data.id;
      if(!self.dimensions[id]) {
        self.dimensions[id] = {conns: {}};
        const g = [...self.group.members];
        g.splice(g.indexOf(self.url), 1);
        if(g.length > 0){
          const url = g[g.length * Math.random() << 0];
          await this.connectToServer(url);
          self.dimensions[id].conns = await new Promise(async (res, rej) => {
            self.promises["Got peers in group dimension " + id + " from " + url] = {res, rej};
            self.conns[url].send(JSON.stringify({
              event: "Get peers in group dimension",
              data: {
                id
              }
            }))
          });
        }
      }
      const peers = Object.keys(self.dimensions[id].conns)
      self.dimensions[id].conns[ws.Url] = 1;
      if(self.conns[ws.Url]) self.conns[ws.Url].dimension = id;
      if(ws.send){
        console.log("NEW PEER IN DIMENSION");
        console.log(peers);
        ws.send(JSON.stringify({
          event: "Joined dimension",
          data: {
            dimension: id,
            peers
          }
        }))
      }
      for(let i=0;i<self.group.members.length;i++){
        if(self.url == self.group.members[i]) continue;
        await self.connectToServer(self.group.members[i]);
        self.conns[self.group.members[i]]?.send(JSON.stringify({
          event: "New peer in group dimension",
          data: {
            url: ws.Url,
            dimension: id
          }
        }))
      }
      for(let i=0;i<peers.length;i++){
        await self.connectToServer(peers[i]);
        self.conns[peers[i]]?.send(JSON.stringify({
          event: "New peer in dimension",
          data: {
            url: ws.Url,
            dimension: id
          }
        }));
      }
      res();
    })
  }

  handleNewPeerInGroupDimension(ws, data){
    const self = this;
    return new Promise(async (res, rej) => {
      try {
        if(!data.dimension || jumpConsistentHash(data.dimension, self.groups.length) !== self.group.index) return res();
        const id = data.dimension;
        if(!self.dimensions[id]) self.dimensions[id] = {conns: {}};
        const peers = Object.keys(self.dimensions[id].conns);
        self.dimensions[id].conns[data.url] = 1;
        if(self.conns[data.url]) self.conns[data.url].dimension = id;
        for(let i=0;i<peers.length;i++){
          await self.connectToServer(peers[i]);
          self.conns[peers[i]]?.send(JSON.stringify({
            event: "New peer in dimension",
            data: {
              url: data.url,
              dimension: id
            }
          }));
        }
      } catch(e){
        console.log(e)
      }
      res();
    });
  }

  handlePeerHasLeftGroupDimension(ws, data){
    const self = this;
    return new Promise(async (res, rej) => {
      try {
        if(jumpConsistentHash(data.dimension, self.groups.length) !== self.group.index || !data.dimension) return res();
        delete self.dimensions[data.dimension]?.conns[data.url];
        const peers = Object.keys(self.dimensions[data.dimension].conns);
        for(let i=0;i<peers.length;i++){
          self.conns[peers[i]]?.send(JSON.stringify({
            event: "Peer has left dimension",
            data: {
              dimension: data.dimension,
              url: data.url
            }
          }))
        }
      } catch(e){
        console.log(e)
      }
      res();
    });
  }

  handleGetPeersInGroupDimension = async (ws, data) => {
    const self = this;
    return new Promise(async(res, rej) => {
      if(!ws.Url || self.group?.members?.indexOf(ws.Url) == -1 || !data.id) return res();
      ws.send(JSON.stringify({
        event: "Got peers in group dimension",
        data: {
          conns: self.dimensions[data.id]?.conns || {},
          id: data.id
        } 
      }))
      return res()
    })
  } 

  handleGotPeersInGroupDimension = async (ws, data) => {
    const self = this;
    return new Promise(async(res, rej) => {
      if(!self.promises["Got peers in group dimension " + data.id + " from " + ws.Url]) return res();
      self.promises["Got peers in group dimension " + data.id + " from " + ws.Url].res(data.conns)
      delete self.promises["Got peers in group dimension " + data.id + " from " + ws.Url];
      return res()
    })
  } 

  handleSendRtcDescription(ws, data){
    const self = this;
    if(!self.conns[data.url]) {
      console.log(data.url + " is not connected");
      return;
    }
    if(!self.conns[data.url].peers) self.conns[data.url].peers = {};
    if(!self.conns[ws.Url].peers) self.conns[ws.Url].peers = {};
    if(!self.conns[ws.Url].peers[data.url] || !self.conns[data.url].peers[ws.Url]){
      self.conns[ws.Url].peers[data.url] = {polite: false};
      self.conns[data.url].peers[ws.Url] = {polite: true};
    }
    self.conns[data.url].send(JSON.stringify({
      event: "Got rtc description",
      data: {
        url: ws.Url,
        desc: data.desc,
        polite: self.conns[ws.Url].peers[data.url]?.polite,
      }
    }));
  }

  handleSendRtcCandidate(ws, data){
    const self = this;
    if(!self.conns[data.url]) return;
    self.conns[data.url].send(JSON.stringify({
      event: "Got rtc candidate",
      data: {
        url: ws.Url,
        candidate: data.candidate
      }
    }))
  }

}

let localServerCount = 1;
let localServers = [];
if(isLocal){
  (async () => {
    for(let i=0;i<localServerCount;i++){
      // await new Promise(async (res, rej) => {
      //   setTimeout(async () => {
          try {
            const server = new Server(i + Port);
            await server.setup();
            localServers.push(server);
          } catch(e){
          }
      //     return res();
      //   }, 300)
      // })
    }
    // calculateValorInterval();
  })();
} else {
  const server = new Server(Port);
}


function calculateValorInterval(){
  let main = async () => {
    for(let i=0;i<localServers.length;i++){
      try {
        const valor = await localServers[i].calculateValor(localServers[i].id);
        console.log(`Server ${i} Valor: ${valor}`);
      } catch(e){
        console.log(e)
      }  
    }
    console.log("\n\n\n");
    return;
  }
  let mainInterval = setInterval(async () => {
    main();
  }, localServers[0].syncIntervalMs)
  main();
}