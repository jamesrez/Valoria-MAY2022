class MMOControls {

  constructor(camera, avatar, domElement){
    this.camera = camera;
    this.avatar = avatar;
    this.avatar.move = {forward: 0, left: 0};
    this.avatar.lastMove = {};
    this.domElement = domElement;
    this.cursor = {};
    this.speed = 6;
    this.target = new THREE.Vector3();
    this.spherical = new THREE.Spherical();
		this.sphericalDelta = new THREE.Spherical();
    this.rotateSpeed = 1.0;
    this.rotateStart = null;
		this.rotateEnd = new THREE.Vector2();
		this.rotateDelta = new THREE.Vector2();
    this.enabled = false;
    this.ranOnce = false;
    this.activeAction;
    this.lastAction;
    this.domElement.onclick = () => {
      this.domElement.requestPointerLock();
    }
    document.onpointerlockchange = event => {
      // console.log(this.domElement.pointerLockElement);
      if(document.pointerLockElement){
        this.enabled = true;
      } else {
        this.enabled = false;
        this.ranOnce = false;
      }
    };
    this.setup();
  }

  setAction = (toAction, timeScale) => {
    if (toAction != this.activeAction) {
        this.lastAction = this.activeAction;
        this.activeAction = toAction;
        if(this.lastAction){
          this.lastAction.fadeOut(0.2)
        }
        this.activeAction.reset()
        this.activeAction.fadeIn(0.2)
        this.activeAction.play()
        this.activeAction.timeScale = timeScale || this.activeAction.timeScale;
    }
  }

  setup = () => {
    this.avatar.attach(this.camera);
    this.avatar.dirTarget = new THREE.Object3D();
    this.avatar.dirTarget.position.copy(this.avatar.position);
    this.camera.position.set(this.avatar.position.x, 2.5, this.avatar.position.z - 1.5)
    this.camera.dirTarget = new THREE.Object3D();
    this.camera.attach(this.camera.dirTarget);
    this.camera.dirTarget.position.set(this.camera.position.x, this.camera.position.y, this.camera.position.z + 2.5);
    this.sphericalDelta.phi = 0.3;
    this.domElement.addEventListener("mousemove", (e) => {
      if(!this.enabled || !this.ranOnce) return;
      const movementX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
			const movementY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;
      if(!this.rotateStart){
        this.rotateStart = new THREE.Vector2();
        this.rotateStart.set( 0, 0 );
        return;
      } 
      this.rotateEnd.set( this.rotateStart.x + movementX, this.rotateStart.y + movementY );
      this.rotateDelta.subVectors( this.rotateEnd, this.rotateStart ).multiplyScalar( this.rotateSpeed );
      const element = this.domElement;
      this.sphericalDelta.theta -= 2 * Math.PI * this.rotateDelta.x / element.clientHeight // yes, height
      this.sphericalDelta.phi -= 2 * Math.PI * this.rotateDelta.y / element.clientHeight;
      this.rotateStart.copy( this.rotateEnd );
    })
  }

  update = (delta) => {
    // this.avatar.mixer.update(delta)
    this.camera.dirTarget.position.set(this.camera.position.x + (this.avatar.move.left * 10), this.camera.position.y, this.camera.position.z + (this.avatar.move.forward * 20) - 2);
    var viewPos = this.camera.dirTarget.position;
    var newView = new THREE.Vector3();
    newView.copy(viewPos);
    let pos = this.camera.dirTarget.getWorldPosition(newView)
    if(
      (this.avatar.move.forward !== 0 || this.avatar.move.left !== 0) && (
      (JSON.stringify(this.avatar.lastMove) !== JSON.stringify(this.avatar.move)) ||
      (JSON.stringify(this.camera.lastPosition) !== JSON.stringify(this.camera.position)))
    ){
      this.camera.parent.parent.attach(this.camera);
      this.avatar.lookAt(this.avatar.position.x - (pos.x - this.avatar.position.x), this.avatar.position.y, this.avatar.position.z - (pos.z - this.avatar.position.z));
      this.avatar.attach(this.camera);
    }
    const offset = new THREE.Vector3(); // so camera.up is the orbit axis
    const quat = new THREE.Quaternion().setFromUnitVectors( this.camera.up, new THREE.Vector3( 0, 1, 0 ) );
    const quatInverse = quat.clone().invert();
    const position = this.camera.position;
    offset.copy( position ).sub( this.target ); // rotate offset to "y-axis-is-up" space
    offset.applyQuaternion( quat ); // angle from z-axis around y-axis
    this.spherical.setFromVector3( offset );
    this.spherical.theta += this.sphericalDelta.theta;
    this.spherical.phi += this.sphericalDelta.phi; 
    this.spherical.phi = Math.max(0.2, Math.min(Math.PI / 2 - 0.05, this.spherical.phi ) ); // restrict phi to be between desired limits
    this.spherical.makeSafe();
    this.spherical.radius *= 1; // restrict radius to be between desired limits
    this.spherical.radius = Math.max( 0, Math.min( Infinity, this.spherical.radius ) ); // move target to panned location
    offset.setFromSpherical( this.spherical ); // rotate offset back to "camera-up-vector-is-up" space
    offset.applyQuaternion( quatInverse );
    position.copy( this.target ).add( offset );
    let isMoving = this.avatar.move.forward !== 0 || this.avatar.move.left !== 0;
    if(this.avatar.jump){
      this.setAction(this.avatar.animationActions[2], 1);
    } else if(!this.avatar.jump){
      if(isMoving){
        this.setAction(this.avatar.animationActions[3], 1);
      } else {
        if(this.avatar.dancing){
          this.setAction(this.avatar.animationActions[0], 1);
        } else {
          this.setAction(this.avatar.animationActions[1], 1);
        }
      }
    }
    let velocity = isMoving ? 1 : 0;
    this.avatar.translateZ(velocity * this.speed * delta);
    this.avatar.lastMove = Object.assign({}, this.avatar.move);
    this.sphericalDelta.set( 0, 0, 0 );
    this.camera.lookAt( this.avatar.position.x, this.avatar.position.y + 1, this.avatar.position.z );
    this.camera.lastPos = Object.assign({}, this.camera.position);
    this.ranOnce = true;
    if(!this.enabled && this.ranOnce) return; 
  }

}

window.MMOControls = MMOControls;