import * as THREE from './three.module.min.js';

const stage = document.querySelector('.dragon-stage');
const canvas = stage?.querySelector('canvas');
if (canvas) {
  try { buildDragon(); } catch (error) { console.warn('Using the original dragon artwork.', error); }
}

function buildDragon() {
  const renderer = new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));
  renderer.setClearColor(0x080b0b,0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.1;
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(37,1,.1,40);
  camera.position.set(0,.12,7.9);camera.lookAt(0,0,0);
  scene.add(new THREE.HemisphereLight(0xeef9ef,0x182d30,1.6));
  for(const [colour,intensity,x,y,z] of [[0xffe2a0,4,-3,4,5],[0x77eee1,1.5,4,-1,2],[0x386efb,2,1,3,-4]]){
    const light=new THREE.DirectionalLight(colour,intensity);light.position.set(x,y,z);scene.add(light);
  }
  const model=new THREE.Group();scene.add(model);
  // Soft studio reflections give the gold actual metallic highlights.
  const studio=new THREE.Scene();studio.background=new THREE.Color(0x34433e);
  for(const [x,y,z,sx,sy,sz,colour] of [[-5,4,3,2,6,4,0xffeed0],[5,1,1,2,5,3,0xc6fff2],[0,6,-2,7,1,5,0xffffff]]){
    const panel=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),new THREE.MeshBasicMaterial({color:colour}));panel.position.set(x,y,z);studio.add(panel);
  }
  const environment=new THREE.PMREMGenerator(renderer).fromScene(studio,.06);
  scene.environment=environment.texture;scene.environmentIntensity=.7;
  const material=(colour,metalness=.65,roughness=.28)=>new THREE.MeshStandardMaterial({color:colour,metalness,roughness});
  const gold=material(0xe4b841),paleGold=material(0xffde77),teal=material(0x09aa91,.5),dark=material(0x053e36,.5,.38),black=material(0x020706,0,.4);
  const eyeMaterial=new THREE.MeshStandardMaterial({color:0x80fff4,emissive:0x12bda6,emissiveIntensity:1.2,roughness:.2});
  const sphere=new THREE.SphereGeometry(1,18,12);
  function piece(parent,geometry,paint,position,scale){
    const mesh=new THREE.Mesh(geometry,paint);mesh.position.set(...position);if(scale)mesh.scale.set(...scale);parent.add(mesh);return mesh;
  }
  function horn(parent,points,radius,paint=gold){
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    const geometry=new THREE.TubeGeometry(curve,18,radius,7,false),positions=geometry.attributes.position;
    for(let ring=0;ring<=18;ring++){
      const centre=curve.getPointAt(ring/18),taper=Math.pow(1-ring/18,.8);
      for(let side=0;side<=7;side++){
        const i=ring*8+side;
        positions.setXYZ(i,centre.x+(positions.getX(i)-centre.x)*taper,centre.y+(positions.getY(i)-centre.y)*taper,centre.z+(positions.getZ(i)-centre.z)*taper);
      }
    }
    geometry.computeVertexNormals();return piece(parent,geometry,paint,[0,0,0]);
  }
  const head=new THREE.Group();model.add(head);
  piece(head,sphere,gold,[0,.04,-.03],[.29,.26,.44]);
  piece(head,new THREE.CylinderGeometry(.15,.26,.55,5),paleGold,[0,-.015,.36]).rotation.x=Math.PI/2;
  piece(head,sphere,gold,[0,-.13,.43],[.19,.09,.34]);
  piece(head,sphere,black,[0,-.08,.59],[.165,.035,.14]);
  piece(head,sphere,paleGold,[0,-.18,.43],[.17,.05,.29]);
  piece(head,sphere,teal,[0,.23,-.13],[.12,.04,.26]);
  for(const side of [-1,1]){
    piece(head,sphere,teal,[side*.24,.04,-.12],[.055,.18,.26]);
    piece(head,sphere,eyeMaterial,[side*.237,.115,.19],[.056,.06,.11]).rotation.y=side*.4;
    piece(head,sphere,black,[side*.279,.12,.2],[.012,.043,.025]);
    const brow=piece(head,new THREE.BoxGeometry(.1,.07,.28),gold,[side*.226,.18,.13]);brow.rotation.z=-side*.2;brow.rotation.y=side*.25;
    piece(head,sphere,black,[side*.085,.07,.59],[.027,.016,.04]);
    horn(head,[[side*.16,.21,-.19],[side*.25,.46,-.3],[side*.32,.72,-.52],[side*.29,.91,-.72]],.085,paleGold);
    horn(head,[[side*.25,.03,-.29],[side*.44,.19,-.45],[side*.54,.36,-.69]],.095);
    horn(head,[[side*.25,-.07,-.14],[side*.39,-.025,-.35],[side*.43,.04,-.54]],.055,paleGold);
    horn(head,[[side*.17,-.05,.52],[side*.18,-.18,.59],[side*.15,-.29,.57]],.035,paleGold);
    horn(head,[[side*.16,-.14,.3],[side*.3,-.2,.13],[side*.39,-.12,-.02]],.025);
    piece(head,new THREE.ConeGeometry(.045,.17,6),gold,[side*.11,.1,.62]).rotation.x=.55;
  }
  horn(head,[[0,.27,-.02],[0,.4,.04],[0,.48,.18]],.065,paleGold);

  // A continuously bending mesh, with individually oriented armour and spines.
  const segments=84,sides=12,bodyGeometry=new THREE.BufferGeometry();
  const bodyPositions=new Float32Array((segments+1)*(sides+1)*3),indices=[];
  for(let i=0;i<segments;i++)for(let j=0;j<sides;j++){const a=i*(sides+1)+j,b=a+sides+1;indices.push(a,b,a+1,b,b+1,a+1);}
  bodyGeometry.setAttribute('position',new THREE.BufferAttribute(bodyPositions,3).setUsage(THREE.DynamicDrawUsage));bodyGeometry.setIndex(indices);
  const body=new THREE.Mesh(bodyGeometry,dark);body.frustumCulled=false;model.add(body);
  const shield=new THREE.Shape();shield.moveTo(-.075,.075);shield.lineTo(.075,.075);shield.lineTo(.09,-.015);shield.quadraticCurveTo(.055,-.1,0,-.145);shield.quadraticCurveTo(-.055,-.1,-.09,-.015);shield.closePath();
  const scaleGeometry=new THREE.ExtrudeGeometry(shield,{depth:.018,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.008,bevelThickness:.008});
  const rows=51,around=7;
  const rims=new THREE.InstancedMesh(scaleGeometry,gold,rows*around);
  const faces=new THREE.InstancedMesh(scaleGeometry,material(0xffffff,.28,.36),rows*around);
  rims.frustumCulled=false;faces.frustumCulled=false;model.add(rims,faces);
  const spineGeometry=new THREE.ConeGeometry(.09,.42,4);spineGeometry.translate(0,.2,0);
  const spineCount=33,spines=new THREE.InstancedMesh(spineGeometry,paleGold,spineCount);spines.frustumCulled=false;model.add(spines);
  const dummy=new THREE.Object3D(),basis=new THREE.Matrix4(),tangent=new THREE.Vector3(),outward=new THREE.Vector3(),normal=new THREE.Vector3(),across=new THREE.Vector3(),colour=new THREE.Color();
  for(let row=0;row<rows;row++)for(let side=0;side<around;side++){
    colour.setHSL(.36+row/rows*.28,.88,.24+Math.sin(side/around*Math.PI)*.1);faces.setColorAt(row*around+side,colour);
  }
  faces.instanceColor.needsUpdate=true;
  const legs=[];
  for(const u of [.16,.49])for(const side of [-1,1]){
    const leg=new THREE.Group();model.add(leg);legs.push({leg,u,side});
    horn(leg,[[0,0,0],[side*.23,-.11,.04],[side*.36,-.24,.13],[side*.4,-.25,.3]],.072);
    piece(leg,sphere,teal,[side*.26,-.15,.1],[.09,.075,.12]);
    for(let finger=0;finger<3;finger++){
      const x=side*.4+(finger-1)*.065;horn(leg,[[x,-.25,.27],[x,-.28,.42],[x-side*.025,-.2,.49]],.024,paleGold);
    }
  }
  function point(u,t,target=new THREE.Vector3()){
    const angle=2.35+t*.24-u*5.6,radius=1.42+.075*Math.sin(t*2.25-u*10);
    return target.set(Math.cos(angle)*radius,Math.sin(angle)*radius*.86,.42*Math.sin(angle*1.7+t*.4)+.09*Math.sin(t*2-u*12));
  }
  function radius(u){return .19*Math.pow(1-u,.55)+.016;}
  function frameAt(u,t){
    const p=point(u,t);tangent.copy(point(Math.max(0,u-.005),t)).sub(point(u+.005,t)).normalize();
    outward.set(p.x,p.y,0).normalize();outward.addScaledVector(tangent,-outward.dot(tangent)).normalize();return p;
  }
  function draw(t){
    for(let ring=0;ring<=segments;ring++){
      const u=ring/segments,p=frameAt(u,t),r=radius(u);across.crossVectors(tangent,outward).normalize();
      for(let side=0;side<=sides;side++){
        const a=side/sides*Math.PI*2,index=(ring*(sides+1)+side)*3;
        bodyPositions[index]=p.x+r*(outward.x*Math.cos(a)+across.x*Math.sin(a));
        bodyPositions[index+1]=p.y+r*(outward.y*Math.cos(a)+across.y*Math.sin(a));
        bodyPositions[index+2]=p.z+r*(outward.z*Math.cos(a)+across.z*Math.sin(a));
      }
    }
    bodyGeometry.attributes.position.needsUpdate=true;bodyGeometry.computeVertexNormals();
    for(let row=0;row<rows;row++){
      const u=.035+row/(rows-1)*.94,p=frameAt(u,t),r=radius(u),radialSide=new THREE.Vector3().crossVectors(tangent,outward).normalize();
      for(let side=0;side<around;side++){
        const a=side/around*Math.PI*2+(row%2)*.18;normal.copy(outward).multiplyScalar(Math.cos(a)).addScaledVector(radialSide,Math.sin(a));
        across.crossVectors(tangent,normal).normalize();basis.makeBasis(across,tangent,normal);dummy.quaternion.setFromRotationMatrix(basis);
        dummy.position.copy(p).addScaledVector(normal,r);const taper=Math.max(.14,Math.pow(1-u,.55));
        dummy.scale.set(taper,taper,1);dummy.updateMatrix();rims.setMatrixAt(row*around+side,dummy.matrix);
        dummy.position.addScaledVector(normal,.017);dummy.scale.set(taper*.78,taper*.8,.55);dummy.updateMatrix();faces.setMatrixAt(row*around+side,dummy.matrix);
      }
    }
    rims.instanceMatrix.needsUpdate=true;faces.instanceMatrix.needsUpdate=true;
    for(let i=0;i<spineCount;i++){
      const u=.06+i/(spineCount-1)*.89,p=frameAt(u,t);dummy.position.copy(p).addScaledVector(outward,radius(u)*.8);
      normal.copy(outward).addScaledVector(tangent,-.6).normalize();dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),normal);
      const s=Math.pow(1-u,.5);dummy.scale.set(s,s*(1+.25*Math.sin(i*.9)),s);dummy.updateMatrix();spines.setMatrixAt(i,dummy.matrix);
    }
    spines.instanceMatrix.needsUpdate=true;
    head.position.copy(frameAt(0,t));across.crossVectors(outward,tangent).normalize();basis.makeBasis(across,outward,tangent);head.quaternion.setFromRotationMatrix(basis);
    for(const item of legs){
      item.leg.position.copy(frameAt(item.u,t));across.crossVectors(outward,tangent).normalize();basis.makeBasis(across,outward,tangent);item.leg.quaternion.setFromRotationMatrix(basis);item.leg.rotateZ(Math.sin(t*2.2-item.u*4)*.12*item.side);
    }
    model.rotation.x=.16+Math.sin(t*.25)*.12;model.rotation.y=Math.sin(t*.2)*.24;
    renderer.render(scene,camera);
  }
  let paused=false,visible=true,time=0,last=null,request=null,lastPaint=0;
  canvas.setAttribute('role','button');canvas.tabIndex=0;canvas.style.touchAction='manipulation';
  function label(){canvas.setAttribute('aria-label',paused?'Resume dragon animation':'Pause dragon animation');canvas.setAttribute('aria-pressed',String(paused));}
  function tick(now){
    if(last!==null)time+=Math.min(now-last,80)/1000;last=now;
    if(now-lastPaint>=1000/30){draw(time);lastPaint=now;}request=requestAnimationFrame(tick);
  }
  function sync(){
    if(request!==null)cancelAnimationFrame(request);request=null;last=null;label();draw(time);
    if(!paused&&visible&&!document.hidden)request=requestAnimationFrame(tick);
  }
  function toggle(){paused=!paused;sync();}
  canvas.addEventListener('click',toggle);
  canvas.addEventListener('keydown',event=>{if(event.key===' '||event.key==='Enter'){event.preventDefault();toggle();}});
  document.addEventListener('visibilitychange',sync);
  function resize(){const box=stage.getBoundingClientRect();renderer.setSize(box.width,box.height,false);camera.aspect=box.width/box.height;camera.updateProjectionMatrix();draw(time);}
  new ResizeObserver(resize).observe(stage);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.05}).observe(stage);
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();paused=true;if(request!==null)cancelAnimationFrame(request);stage.classList.remove('dragon-ready');});
  stage.classList.add('dragon-ready');resize();sync();
}
