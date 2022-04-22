let auth = document.querySelector('.valUIAuth');
let mainModal = document.querySelector('.valUIMainModal');
let join = document.querySelector('.valUIJoin');
let about = document.querySelector('.valUIAbout');
let donate = document.querySelector('.valUIDonate');
let contact = document.querySelector('.valUIContact');
let desc = document.querySelector('.valUIMainDescription')
let newPasswordForm = document.querySelector('.valUINewPassword');
let newQRForm = document.querySelector('.valUINewQR');
let extensionRec = document.querySelector('.valUIExtension');
let signInEl = document.querySelector('.valUISignIn')

async function showHome(){
  mainModal.style.display = "flex";
  auth.style.display = "none";
  join.style.display = "none";
  about.style.display = "none";
  donate.style.display = "none";
  contact.style.display = "none";
}

async function showJoin(){
  if(valoria.id && valoria.ecdsa.privateKey){
    page.style.display = "none";
    try {
      if(!isMobile){
        controls.lock();
        await valoria.startMediaStream({audio: true, video: false});
      }
    } catch(e){
      
    }
    // await valoria.startMediaStream({audio: {
    //   echoCancellation: true,
    //   noiseSuppression: true,
    //   sampleRate: 44100
    // }, video: false});
    // valoria.onJoin();
  } else {
    auth.style.display = "flex";
    join.style.display = "flex";
    mainModal.style.display = "none";
  }
  
  

 

  // if(window.ReactNativeWebView){
  //   valoria.user.signInFromLocal().then((userId) => {
  //     alert("FOUND USER ID FROM LOCAL: " + userId)
  //   }).catch((e) => {
  //     alert("COULD NOT GET USER ID FROM LOCAL")
  //   })
  // }

  // await valoria.user.create("123");
}

async function showAbout(){
  about.style.display = "flex";
  mainModal.style.display = "none";
}

async function exitAbout(){
  about.style.display = "none";
  mainModal.style.display = "flex";
}

async function showDonate(){
  donate.style.display = "flex";
  mainModal.style.display = "none";
}

async function exitDonate(){
  donate.style.display = "none";
  mainModal.style.display = "flex";
}

async function showContact(){
  contact.style.display = "flex";
  mainModal.style.display = "none";
}

async function exitContact(){
  contact.style.display = "none";
  mainModal.style.display = "flex";
}

function copyStringToClipboard (str) {
  var el = document.createElement('textarea');
  el.value = str;
  el.setAttribute('readonly', '');
  el.style = {position: 'absolute', left: '-9999px'};
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
}

async function copyBtc(){
  document.querySelector('.valUIDonateBtc').textContent = "Copied Bitcoin Address";
  copyStringToClipboard("3GyJoYYKGivB8SEAXZRWwynuQTuz49PdLT")
  setTimeout(() => {
    document.querySelector('.valUIDonateBtc').textContent = "Send Bitcoin";
  }, 1000)
}

async function copyEth(){
  document.querySelector('.valUIDonateEth').textContent = "Copied Ethereum Address";
  copyStringToClipboard("0x236fcaDe3be0A8E9bb08b32250a666eeE61a5352")
  setTimeout(() => {
    document.querySelector('.valUIDonateEth').textContent = "Send Ethereum";
  }, 1000)
}

async function copyDoge(){
  document.querySelector('.valUIDonateDoge').textContent = "Copied Dogecoin Address";
  copyStringToClipboard("DMJurMAWcrzuLrTFdmmnb44Mxphdx2ksk3")
  setTimeout(() => {
    document.querySelector('.valUIDonateDoge').textContent = "Send Dogecoin";
  }, 1000)
}

async function copyShiba(){
  document.querySelector('.valUIDonateShiba').textContent = "Copied Shiba Inu Address";
  copyStringToClipboard("0xFA98A62B3F561c3B52E93cB4d864ad156d8E5C50")
  setTimeout(() => {
    document.querySelector('.valUIDonateShiba').textContent = "Send Shiba Inu";
  }, 1000)
}


async function showNewPassword(){
  auth.style.display = "flex";
  join.style.display = "none";
  newPasswordForm.style.display = "flex";
}

let newPassInput = document.querySelector('.valUINewPasswordInput');
let confirmPassInput = document.querySelector('.valUIConfirmPasswordInput');
let newPassError = document.querySelector('.valUINewPasswordError');
let newQRCodePhoto = document.querySelector('.valUINewQRPhoto');
let QRtemplatePhoto = document.querySelector('.valUIQRTemplate');
let QRrecoveryPhoto = document.querySelector('.valUIQRRecoveryPhoto');
let QRrecoverySave = document.querySelector('.valUINewQRSave');
let QRrecoveryNext = document.querySelector('.valUINewQRNext');

async function createAccount(){
  const newPass = newPassInput.value;
  const confirmPass = confirmPassInput.value;
  if(newPass !== confirmPass) {
    newPassError.style.display = "block";
    newPassError.textContent = "Error: Passwords do not match";
  } else {
   
    // newQRForm.style.display = "flex";
    const account = await valoria.generateCredentials(newPass);
    valoria.saveCredentialsQR();
    newPassError.style.display = "none";
    newPasswordForm.style.display = "none";
    // mainModal.style.display = "none";
    page.style.display = "none";
    if(!isMobile){
      controls.lock();
    }
    try {
      await valoria.startMediaStream({audio: true, video: false});
    } catch(e){
      
    }

    // await valoria.setup();
    // newPassError.style.display = "none";
    // newPasswordForm.style.display = "none";

    // let qr = new QRious({
    //   value: JSON.stringify({
    //     id: account.id,
    //     secret: account.secret
    //   }),
    //   size: 1000,
    // });
    // let canvas = document.querySelector('.valUINewQRCanvas');
    // canvas.width = 500;
    // canvas.height = 500;
    // let ctx = canvas.getContext('2d');
    // newQRCodePhoto.setAttribute('src', qr.toDataURL('image/png'));
    // newQRCodePhoto.onload = () => {
    //   // ctx.drawImage(QRtemplatePhoto, 0, 0, 720, 1280)
    //   ctx.drawImage(newQRCodePhoto, 0, 0, 500, 500)
    //   const qrSrc = canvas.toDataURL();
    //   QRrecoveryPhoto.setAttribute('src', qrSrc);
    //   QRrecoverySave.style.display = "block";
    // }
  }
}

async function saveQRPhoto(){
  let download = document.createElement('a');
  download.style.position = "absolute";
  download.style.top = "-1250000px";
  download.download = "Valoria-Recovery-Photo-" + valoria.id + ".png";
  download.href = QRrecoveryPhoto.src
  newQRForm.append(download)
  download.click();
  QRrecoveryNext.style.display = "flex";
}

async function QRNext(){
  auth.style.display = "none";
  await valoria.startMediaStream({audio: {
    echoCancellation: true,
    noiseSuppression: true,
    sampleRate: 44100
  }, video: false});
  // valoria.onJoin();
}

let signInQRInput = document.querySelector('.valUISignInQRInput');
let signInQrSelect = document.querySelector('.valUISignInQRSelect');
let signInQrMsg = document.querySelector('.valUISignInQRMsg');
let signInPassword = document.querySelector('.valUISignInPassword');
let signInPasswordInput = document.querySelector('.valUISignInPassInput');

async function showSignIn(){
  mainModal.style.display = "none";
  join.style.display = "none";
  auth.style.display = "flex";
  signInEl.style.display = "flex";
  signInQrSelect.style.display = "none";
  signInPassword.style.display = "flex";
}

async function selectRecoveryPhoto(){
  signInQRInput.click();
}

let qrcode;
async function loadRecoveryPhoto(){
  try {
    console.log(signInQRInput.files);
    
    qrcode = await QrScanner.scanImage(signInQRInput.files[0]);
    signInQrSelect.style.display = "none";
    signInQrMsg.style.display = "block";
    signInPassword.style.display = "flex";
  } catch(e){
    console.log(e)
  }
}

async function signIn(){
  const pass = signInPasswordInput.value;
  if(pass.length < 1) return;
  try {
    await valoria.loadCredentialsFromQR(pass)
    page.style.display = "none";
    if(!isMobile){
      controls.lock();
    }
    try {
      await valoria.startMediaStream({audio: true, video: false});
    } catch(e){
      
    }
  } catch(e){

  }
}




// let isCoding = false;
// ace.config.set('basePath', '/scripts/ace')
// let editor = ace.edit("valUICodeEditor");
// editor.session.setMode("ace/mode/javascript");
// editor.session.setTabSize(2);
// editor.on('focus', () => {
//   isCoding = true;
// })
// editor.on('blur', () => {
//   isCoding = false;
// })

// document.addEventListener('keydown', (e) => {
//   if(isCoding && e.key == "s" && e.metaKey){
//     e.preventDefault();
//     // saveFile()
//   }
// })

const setInnerHTML = function(elm, html) {
  elm.innerHTML = html;
  Array.from(elm.querySelectorAll("script")).forEach( oldScript => {
    const newScript = document.createElement("script");
    Array.from(oldScript.attributes)
      .forEach( attr => newScript.setAttribute(attr.name, attr.value) );
    newScript.appendChild(document.createTextNode(oldScript.innerHTML));
    oldScript.parentNode.replaceChild(newScript, oldScript);
  });
}

// const fileNav = document.querySelector('.valUIFileNav');
// const codeContainer = document.querySelector('.valUICodeContainer');
// const appContainer = document.querySelector('.valUIAppContainer');
// const split = Split([fileNav, codeContainer, appContainer], {
//   sizes: [20, 50, 30]
// });

let activeFile = null;

let profileBtn = document.querySelector('.valUIProfileBtn')


// if( window.DeviceOrientationEvent && navigator.userAgent.match(/iPhone/i)
//   || navigator.userAgent.match(/webOS/i)
//   || navigator.userAgent.match(/Android/i)
//   || navigator.userAgent.match(/iPad/i)
//   || navigator.userAgent.match(/iPod/i)
//   || navigator.userAgent.match(/BlackBerry/i)
//   || navigator.userAgent.match(/Windows Phone/i)
// ){
//   document.querySelector('.mobileControls').style.display = "flex";    
// } else {
//   document.querySelector('.mobileControls').style.display = "none";    
// }

// function deviceOrientate(){
//   if(window.DeviceOrientationEvent.requestPermission){
//     window.DeviceOrientationEvent.requestPermission();
//   }
//   document.querySelector('.mobileControls').style.display = "none";    
// }
