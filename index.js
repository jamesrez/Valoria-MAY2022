const amountOfServers = 3;
const isLocal = process.env.PORT ? false : true;
const http = require('http');
const fs = require('fs');
const express = require('express');
const Port = process.env.PORT || 3000;
const crypto = require('crypto');
const subtle = crypto.webcrypto.subtle;
const WebSocket = require('ws');

class Server {
  constructor(port){
    this.app = express();
    this.server = http.Server(this.app);
    this.port = port;
    this.wss = new WebSocket.Server({ server: this.server });
    this.conns = {};
    this.ECDSA = {publicKey: null, privateKey: null};
    this.ECDH = {publicKey: null, privateKey: null};
    const self = this;
    if(isLocal){
      this.url = 'http://localhost:' + port;
    } else {
      this.app.use(async (req, res, next) => {
        if(!self.url){
          const url = req.protocol + "://" + req.get('host') + "/";
          self.url = url;
          await this.setup();
        }
        next();
      });
    }
    this.setupRoutes();
    this.server.listen(port, () => {
      console.log(this.url + " is running");
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
    this.wss.on('connection', async (ws) => {
      await self.setupWS(ws);
    })
    this.heartbeatInterval();
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

  loadCredentials = async () => {
    const self = this;
    return new Promise(async(res, rej) => {
      const creds = await self.load("credentials.json");
      if(!creds){
        return rej();
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

  setupWS = async (ws) => {
    const self = this;
    return new Promise(async(res, rej) => {
      // ws.id = ws.id || uuidv4();
      ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
      });
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

        }
      })
      res();
    })
  }

  now(){
    return Math.round(Date.now() + this.timeOffset + this.testOffset);
  }

  heartbeatInterval(){
    const self = this;
    const interval = setInterval(function ping() {
      self.wss.clients.forEach(function each(ws) {
        if (ws.isAlive === false) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
      });
    }, 2500);
    self.wss.on('close', function close() {
      clearInterval(interval);
    });
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

}

if(isLocal){
  (async () => {
    for(let i=0;i<amountOfServers;i++){
      const server = new Server(i + Port);
      await server.setup();
    }
  })();
} else {
  const server = new Server(Port);
}

