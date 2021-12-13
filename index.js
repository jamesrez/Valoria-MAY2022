const amountOfServers = 3;
const isLocal = process.env.PORT ? false : true;
const http = require('http');
const fs = require('fs');
const express = require('express');
const Port = process.env.PORT || 3000;
const Crypto = require('crypto');
const subtle = Crypto.webcrypto.subtle;

class Server {
  constructor(port){
    this.app = express();
    this.server = http.Server(this.app);
    this.port = port;
    if(isLocal){
      this.url = 'http://localhost:' + port;
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
      res();
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

