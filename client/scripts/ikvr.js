class IKVR {
  
  constructor(avatar, leftTarget, rightTarget){
    this.back = [];
    this.leftArm = [];
    this.rightArm = [];
    this.back.push(avatar.getObjectByName("mixamorigHips"));
    this.back.push(avatar.getObjectByName("mixamorigSpine"));
    this.back.push(avatar.getObjectByName("mixamorigSpine1"));
    this.back.push(avatar.getObjectByName("mixamorigSpine2"));
    this.back.push(avatar.getObjectByName("mixamorigLeftShoulder"));
    this.back.push(avatar.getObjectByName("mixamorigRightShoulder"));
    this.leftArm.push(avatar.getObjectByName("mixamorigLeftArm"));
    this.leftArm.push(avatar.getObjectByName("mixamorigLeftForeArm"));
    this.leftArm[0].rotation.x += 1.35;
    this.leftArm[1].rotation.x += 0.1;
    this.leftArm[1].rotation.z += 1.35;
    leftTarget.position.x = -0.24;
    leftTarget.position.y = 1.06;
    leftTarget.position.z = -0.64;
    this.leftTarget = leftTarget; 

    this.rightArm.push(avatar.getObjectByName("mixamorigRightArm"));
    this.rightArm.push(avatar.getObjectByName("mixamorigRightForeArm"));
    this.rightArm[0].rotation.x += 1.35;
    this.rightArm[1].rotation.x += 0.1;
    this.rightArm[1].rotation.z -= 1.35;
    rightTarget.position.x = 0.24;
    rightTarget.position.y = 1.06;
    rightTarget.position.z = -0.64;
    this.rightTarget = rightTarget; 

    this.head = avatar.getObjectByName("mixamorigHead");
    this.head.scale.x = 0.001;
    this.head.scale.y = 0.001;
    this.head.scale.z = 0.001;

    this.setup();
  }

  setup(){
    const self = this;
    for(let i=self.back.length-1;i>=0;i--){
      self.back[i].oRotation = {
        x: self.back[i].rotation.x,
        y:  self.back[i].rotation.y,
        z: self.back[i].rotation.z
      }
    }
    for(let i=self.leftArm.length-1;i>=0;i--){
      self.leftArm[i].oRotation = {
        x: self.leftArm[i].rotation.x,
        y:  self.leftArm[i].rotation.y,
        z: self.leftArm[i].rotation.z
      }
    }
    self.leftTarget.oPosition = {
      x: self.leftTarget.position.x,
      y: self.leftTarget.position.y,
      z: self.leftTarget.position.z
    }
    for(let i=self.rightArm.length-1;i>=0;i--){
      self.rightArm[i].oRotation = {
        x: self.rightArm[i].rotation.x,
        y:  self.rightArm[i].rotation.y,
        z: self.rightArm[i].rotation.z
      }
    }
    self.rightTarget.oPosition = {
      x: self.rightTarget.position.x,
      y: self.rightTarget.position.y,
      z: self.rightTarget.position.z
    }
  }

  update(){
    const self = this;
    self.head.scale.x = 0.001;
    self.head.scale.y = 0.001;
    self.head.scale.z = 0.001;
    for(let i=self.back.length-1;i>=0;i--){
      self.back[i].rotation.x = self.back[i].oRotation.x;
      self.back[i].rotation.y = self.back[i].oRotation.y
      self.back[i].rotation.z = self.back[i].oRotation.z
    }
    for(let i=self.leftArm.length-1;i>=0;i--){
      self.leftArm[i].rotation.x = self.leftArm[i].oRotation.x;
      self.leftArm[i].rotation.y = self.leftArm[i].oRotation.y
      self.leftArm[i].rotation.z = self.leftArm[i].oRotation.z
    }
    self.leftArm[0].rotation.z = (self.leftTarget.position.z - self.leftTarget.oPosition.z) * -2.5;
    self.leftArm[1].rotation.z = ((self.leftTarget.position.z - self.leftTarget.oPosition.z) * 3) + 1.4 + ((self.leftTarget.position.y - self.leftTarget.oPosition.y) * 1.5);
    self.leftArm[1].rotation.y = ((self.leftTarget.position.x - self.leftTarget.oPosition.x) * 1.5);

    for(let i=self.rightArm.length-1;i>=0;i--){
      self.rightArm[i].rotation.x = self.rightArm[i].oRotation.x;
      self.rightArm[i].rotation.y = self.rightArm[i].oRotation.y
      self.rightArm[i].rotation.z = self.rightArm[i].oRotation.z
    }
    self.rightArm[0].rotation.z = (self.rightTarget.position.z - self.rightTarget.oPosition.z) * 2.5;
    self.rightArm[1].rotation.z = ((self.rightTarget.position.z - self.rightTarget.oPosition.z) * -3) - 1.4 + ((self.rightTarget.position.y - self.rightTarget.oPosition.y) * -1.5);
    self.rightArm[1].rotation.y = ((self.rightTarget.position.x - self.rightTarget.oPosition.x) * 1.5);

  }

}

var t1 = new THREE.Vector3();
var t2 = new THREE.Vector3();
var t3 = new THREE.Vector3();
var m1 = new THREE.Matrix4();
function setQuaternionFromDirection(direction, up, target) {
  var x = t1;
  var y = t2;
  var z = t3;
  var m = m1;
  var el = m1.elements;
  z.copy(direction);
  x.crossVectors(up, z);
  if (x.lengthSq() === 0) {
    if (Math.abs(up.z) === 1) {
      z.x += 0.0001;
    } else {
      z.z += 0.0001;
    }
    z.normalize();
    x.crossVectors(up, z);
  }
  x.normalize();
  y.crossVectors(z, x);
  el[0] = x.x;el[4] = y.x;el[8] = z.x;
  el[1] = x.y;el[5] = y.y;el[9] = z.y;
  el[2] = x.z;el[6] = y.z;el[10] = z.z;
  target.setFromRotationMatrix(m);
}

