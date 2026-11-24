import * as THREE from './three.module.min.js';

// Drakon V2: a volumetric interpretation of the supplied side artwork.
// X points toward the nose, Y is up, Z is the dragon's left side.
export function createDragonModel() {
  const root = new THREE.Group(); root.name = 'Drakon — model study V2';
  const mat = (name,color,metalness,roughness) => {
    const m = new THREE.MeshStandardMaterial({color,metalness,roughness}); m.name=name;return m;
  };
  const gold=mat('Warm gold armour',0xd7a327,.64,.35);
  const lightGold=mat('Gold edges and claws',0xf3ce67,.62,.3);
  const green=mat('Emerald body',0x008448,.18,.43);
  const teal=mat('Turquoise fins',0x00a8b6,.22,.4);
  const blue=mat('Cobalt mane',0x0349bb,.24,.39);
  const dark=mat('Deep green scale seams',0x002c2c,.12,.46);
  const black=mat('Mouth and eye sockets',0x031111,.1,.45);
  const eye=mat('Cyan eyes',0x42f5ed,.2,.2);eye.emissive.set(0x07c8c0);eye.emissiveIntensity=.55;
  let serial=0;
  function mesh(parent,geo,m,name) {
    const obj=new THREE.Mesh(geo,m);obj.name=name+' '+(++serial);parent.add(obj);return obj;
  }
  const sphere=new THREE.SphereGeometry(1,20,12);
  function ellipsoid(parent,m,p,s,name) {const o=mesh(parent,sphere,m,name);o.position.set(...p);o.scale.set(...s);return o;}
  function tapered(parent,points,radius,m,name,tip=.002) {
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    const n=24,sides=10,g=new THREE.TubeGeometry(curve,n,radius,sides,false),a=g.attributes.position;
    for(let i=0;i<=n;i++) {
      const p=curve.getPointAt(i/n),f=Math.pow(1-i/n,.7)*(1-tip)+tip;
      for(let j=0;j<=sides;j++){const k=i*(sides+1)+j;
        a.setXYZ(k,p.x+(a.getX(k)-p.x)*f,p.y+(a.getY(k)-p.y)*f,p.z+(a.getZ(k)-p.z)*f);
      }
    }
    g.computeVertexNormals();return mesh(parent,g,m,name);
  }
  function curvedPlate(parent,shape,m,name,depth=.035) {
    return mesh(parent,new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.012,bevelThickness:.01,bevelSegments:2,curveSegments:18,steps:1}),m,name);
  }
  // Centre line follows the artwork's raised neck, low chest and curling tail.
  const curve=new THREE.CatmullRomCurve3([
    [2.65,1.02,0],[2.38,.65,0],[2.23,-.05,0],[1.77,-.6,0],[.85,-.74,0],
    [-.22,-.37,0],[-1.34,-.06,0],[-2.42,-.43,0],[-3.34,-.45,0],[-4.03,-.09,0],[-4.22,.48,0]
  ].map(p=>new THREE.Vector3(...p)));
  function radius(u){return (.29+.055*Math.exp(-Math.pow((u-.31)/.17,2)))*Math.pow(1-u,.67)+.014;}
  function frame(u) {
    const p=curve.getPointAt(u),t=curve.getTangentAt(u).negate().normalize();
    const up=new THREE.Vector3(-t.y,t.x,0).normalize(),side=new THREE.Vector3(0,0,1);
    return {p,t,up,side,r:radius(u)};
  }
  function surface(u,a,extra=0){const f=frame(u);return f.p.addScaledVector(f.up,(f.r+extra)*Math.cos(a)).addScaledVector(f.side,(f.r*.83+extra)*Math.sin(a));}
  // Closed sweep; vertex colours shift the dorsal surface from teal to cobalt.
  const positions=[],colours=[],indices=[],rings=150,sides=24;
  for(let i=0;i<=rings;i++)for(let j=0;j<=sides;j++){
    const u=i/rings,a=j/sides*Math.PI*2,p=surface(u,a);positions.push(...p.toArray());
    const c=new THREE.Color().lerpColors(new THREE.Color(0x00854e),new THREE.Color(0x0067a1),Math.max(0,Math.cos(a))*(.25+u*.75));colours.push(c.r,c.g,c.b);
  }
  for(let i=0;i<rings;i++)for(let j=0;j<sides;j++){const a=i*(sides+1)+j,b=a+sides+1;indices.push(a,b,a+1,b,b+1,a+1);}
  const bodyGeo=new THREE.BufferGeometry();bodyGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));bodyGeo.setAttribute('color',new THREE.Float32BufferAttribute(colours,3));bodyGeo.setIndex(indices);bodyGeo.computeVertexNormals();
  const skin=mat('Green and blue body gradient',0xffffff,.18,.43);skin.vertexColors=true;
  mesh(root,bodyGeo,skin,'Continuous serpentine body');
  // Wide belly scutes wrap under the body, rather than separate gold beads.
  function scute(u,halfLength,m,name) {
    const p=[],idx=[],n=12;
    for(let i=0;i<=2;i++)for(let j=0;j<=n;j++){
      const a=Math.PI*.51+j/n*Math.PI*.98;
      const pt=surface(Math.min(.997,Math.max(.002,u+(i-1)*halfLength)),a,.014+Math.sin(i/2*Math.PI)*.014);p.push(...pt.toArray());
    }
    for(let i=0;i<2;i++)for(let j=0;j<n;j++){const a=i*(n+1)+j,b=a+n+1;idx.push(a,b,a+1,b,b+1,a+1);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();return mesh(root,g,m,name);
  }
  for(let i=0;i<44;i++)scute(.016+i*.0222,.0096,gold,'Broad segmented belly plate');
  // Small raised scales on both flanks; low relief keeps the long clean silhouette.
  const scaleShape=[[0,.09],[.065,.035],[.055,-.04],[0,-.09],[-.055,-.04],[-.065,.035]];
  const scaleGeo=new THREE.ExtrudeGeometry(new THREE.Shape(scaleShape.map(p=>new THREE.Vector2(...p))),{depth:.004,bevelEnabled:true,bevelSize:.004,bevelThickness:.003,bevelSegments:1,steps:1});
  for(let row=0;row<49;row++)for(const side of [-1,1])for(let col=0;col<2;col++){
    const u=.035+row*.018+(col%2)*.007;if(u>.91)continue;
    const a=side*(.65+col*.43),f=frame(u),normal=f.up.clone().multiplyScalar(Math.cos(a)).addScaledVector(f.side,Math.sin(a));
    const across=new THREE.Vector3().crossVectors(f.t,normal).normalize(),basis=new THREE.Matrix4().makeBasis(across,f.t,normal);
    const s=Math.pow(1-u,.64)*1.25,o=mesh(root,scaleGeo,col===0?(row>27?blue:teal):green,'Low relief flank scale');
    o.position.copy(surface(u,a,.005));o.quaternion.setFromRotationMatrix(basis);o.scale.set(s,s,.7);
  }
  // Broad layered ribbons follow the neck and tail, with a blue crest and teal
  // lower band. Both sides have thickness, rather than a single flat sail.
  const maneP=[],maneC=[],maneI=[],edgeA=[],flowLines=[[],[]];
  const maneRows=130,maneAcross=8;
  for(let side=0;side<2;side++)for(let i=0;i<=maneRows;i++){
    const u=.025+i/maneRows*.95,f=frame(u),s=side===0?1:-1;
    const height=(.31+.15*Math.exp(-Math.pow((u-.19)/.13,2))+.11*Math.sin(u*15)) * Math.pow(1-u,.36);
    for(let j=0;j<=maneAcross;j++){
      const v=j/maneAcross,base=surface(u,.38*s,.005);
      const pt=base.addScaledVector(f.up,height*v).addScaledVector(f.t,-.32*v*(1-u));
      pt.z=s*(.035+.055*Math.sin(v*Math.PI)+f.r*.38*(1-v));
      maneP.push(...pt.toArray());
      const c=new THREE.Color().lerpColors(new THREE.Color(0x00a7ac),new THREE.Color(0x033fb2),THREE.MathUtils.clamp(v*.85+u*.5,0,1));maneC.push(c.r,c.g,c.b);
      if(side===0&&j===maneAcross)edgeA.push(pt.toArray());
      if((j===3||j===6))flowLines[j===3?0:1].push({p:pt.toArray(),side});
      if(i<maneRows&&j<maneAcross){const a=side*(maneRows+1)*(maneAcross+1)+i*(maneAcross+1)+j,b=a+maneAcross+1;if(side===0)maneI.push(a,a+1,b,b,a+1,b+1);else maneI.push(a,b,a+1,b,b+1,a+1);}
    }
  }
  // Close the crest and root so the mane reads as a sculpted ridge from the front.
  const stripSize=(maneRows+1)*(maneAcross+1);
  for(let i=0;i<maneRows;i++)for(const j of [0,maneAcross]){const a=i*(maneAcross+1)+j,b=a+maneAcross+1,c=a+stripSize,d=b+stripSize;maneI.push(a,c,b,b,c,d);}
  const maneGeo=new THREE.BufferGeometry();maneGeo.setAttribute('position',new THREE.Float32BufferAttribute(maneP,3));maneGeo.setAttribute('color',new THREE.Float32BufferAttribute(maneC,3));maneGeo.setIndex(maneI);maneGeo.computeVertexNormals();
  const maneMat=mat('Blue to teal flowing mane',0xffffff,.2,.43);maneMat.vertexColors=true;maneMat.side=THREE.DoubleSide;
  mesh(root,maneGeo,maneMat,'Layered flowing mane');
  tapered(root,edgeA,.024,lightGold,'Gold dorsal edge',.2);
  for(const line of flowLines)for(const side of [0,1]){const points=line.filter(p=>p.side===side).map(({p})=>[p[0],p[1],p[2]+(side===0?.008:-.008)]);tapered(root,points,.014,dark,'Sweeping mane seam',.2);}
  // Curved sickle fins are drawn with the same concave sweep as the artwork.
  for(const [u,size] of [[.07,.68],[.37,.98],[.66,.53]]){
    const f=frame(u),fin=new THREE.Group();root.add(fin);fin.position.copy(surface(u,0,-.02));fin.rotation.z=Math.atan2(f.t.y,f.t.x);
    const shape=new THREE.Shape();shape.moveTo(.18,-.1);shape.bezierCurveTo(-.06,.24*size,-.42,.66*size,-1.1,.72*size);shape.bezierCurveTo(-.64,.55*size,-.5,.27*size,-.65,.08);shape.bezierCurveTo(-.8,.02,-1.07,-.01,-1.23,-.14);shape.bezierCurveTo(-.59,-.06,-.12,-.32,.18,-.1);shape.closePath();
    const rim=curvedPlate(fin,shape,gold,'Curved fin gold border',.04);rim.position.z=-.02;
    for(const side of [-1,1]){const inset=curvedPlate(fin,shape,teal,'Curved fin turquoise inlay',.009);inset.scale.set(.86,.8,side);inset.position.set(-.035,.015,side*.041);}
  }
  // The broad green shoulder streamers are a defining feature of the image.
  // Their three swept points continue the silhouette below the body.
  for(const side of [-1,1]){
    const fin=new THREE.Group();fin.name='Flowing shoulder fin';root.add(fin);
    const f=frame(.225);fin.position.copy(f.p);fin.position.z=side*f.r*.73;fin.scale.z=side;
    const shape=new THREE.Shape();shape.moveTo(.12,.19);
    shape.bezierCurveTo(-.31,.28,-.66,.26,-1.13,.54);
    shape.bezierCurveTo(-.75,.16,-.95,-.3,-1.62,-.73);
    shape.bezierCurveTo(-.98,-.59,-.72,-.35,-.56,-.17);
    shape.bezierCurveTo(-.57,-.45,-.85,-.78,-1.14,-.96);
    shape.bezierCurveTo(-.56,-.76,-.3,-.48,-.18,-.22);
    shape.bezierCurveTo(-.07,-.47,-.22,-.7,-.41,-.83);
    shape.bezierCurveTo(.23,-.58,.35,-.13,.12,.19);shape.closePath();
    curvedPlate(fin,shape,gold,'Gold shoulder fin outline',.045);
    const face=curvedPlate(fin,shape,green,'Emerald shoulder fin',.022);face.scale.set(.89,.84,1);face.position.set(-.025,-.015,.054);
    tapered(fin,[[-.06,.11,.094],[-.39,-.03,.094],[-.68,-.33,.094],[-1.27,-.64,.094]],.026,dark,'Long shoulder fin crease');
    tapered(fin,[[.03,.02,.094],[-.18,-.24,.094],[-.44,-.48,.094],[-.85,-.75,.094]],.021,teal,'Teal shoulder fin sweep');
  }
  // Head sculpt: elongated angular cheek, tapered muzzle and separated lower jaw.
  const head=new THREE.Group();head.name='Sculpted gold head';head.position.set(2.66,1.03,0);root.add(head);
  function loft(stations,m,name) {
    const p=[],idx=[],n=16;
    for(const [x,y,ry,rz] of stations)for(let j=0;j<=n;j++){const a=j/n*Math.PI*2;p.push(x,y+Math.cos(a)*ry,Math.sin(a)*rz);}
    for(let i=0;i<stations.length-1;i++)for(let j=0;j<n;j++){const a=i*(n+1)+j,b=a+n+1;idx.push(a,a+1,b,b,a+1,b+1);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();return mesh(head,g,m,name);
  }
  loft([[-.48,.02,.045,.04],[-.3,.075,.2,.22],[-.06,.09,.235,.255],[.22,.065,.16,.205],[.44,-.015,.105,.155],[.64,-.045,.09,.13],[.77,-.08,.065,.08],[.82,-.17,.004,.004]],gold,'Tapered gold face and hooked muzzle');
  loft([[-.08,-.2,.045,.12],[.23,-.195,.04,.158],[.5,-.17,.032,.12],[.72,-.12,.018,.055],[.77,-.13,.003,.003]],lightGold,'Swept lower jaw');
  loft([[.12,-.14,.025,.176],[.47,-.128,.035,.142],[.72,-.115,.018,.06]],black,'Dark mouth opening');
  // Cheek blades, brows and luminous almond eyes on each side.
  for(const side of [-1,1]){
    // Flush cheek blades with dark separations, replacing the blocky flat cheek.
    for(let blade=0;blade<3;blade++){
      const y=.12-blade*.095,z=side*(.225-blade*.012);
      tapered(head,[[.13,y,z],[-.18,y+.045,side*.255],[-.47,y+.13,side*.25],[-.75-blade*.06,y+.22,side*.21]],.073-blade*.008,gold,'Swept gold cheek blade',.008);
      tapered(head,[[-.03,y-.04,side*.259],[-.31,y+.015,side*.269],[-.58,y+.13,side*.24]],.012,black,'Cheek blade separation');
    }
    const socketShape=new THREE.Shape();socketShape.moveTo(-.015,.18);socketShape.quadraticCurveTo(.22,.16,.4,.075);socketShape.quadraticCurveTo(.22,.025,.08,.075);socketShape.closePath();
    const socket=curvedPlate(head,socketShape,black,'Angular eye mask',.008);socket.position.z=side*.224;socket.scale.z=side;
    const eyeShape=new THREE.Shape();eyeShape.moveTo(.105,.125);eyeShape.quadraticCurveTo(.24,.127,.32,.089);eyeShape.quadraticCurveTo(.2,.059,.14,.092);eyeShape.closePath();
    const iris=curvedPlate(head,eyeShape,eye,'Narrow cyan eye',.008);iris.position.z=side*.246;iris.scale.z=side;
    ellipsoid(head,black,[.24,.102,side*.265],[.008,.025,.003],'Vertical pupil');
    tapered(head,[[-.03,.205,side*.22],[.16,.183,side*.251],[.4,.117,side*.177]],.032,lightGold,'Sharp sloping brow',.12);
    ellipsoid(head,black,[.64,.007,side*.122],[.039,.016,.008],'Slit nostril').rotation.z=-.45;
    tapered(head,[[-.16,.23,side*.125],[-.44,.38,side*.18],[-.9,.48,side*.22],[-1.34,.52,side*.21]],.09,lightGold,'Long swept crown horn');
    tapered(head,[[-.25,.09,side*.22],[-.62,.17,side*.34],[-1.1,.32,side*.38]],.07,gold,'Swept side horn');
    tapered(head,[[-.24,-.05,side*.23],[-.58,-.01,side*.3],[-.95,.13,side*.32]],.046,lightGold,'Swept cheek barb');
    tapered(head,[[.67,-.11,side*.085],[.69,-.18,side*.09],[.65,-.22,side*.087]],.024,lightGold,'Hooked upper fang');
  }
  tapered(head,[[.39,.125,0],[.06,.3,0],[-.43,.36,0],[-1.02,.36,0]],.068,lightGold,'Swept central crown');
  for(const side of [-1,1]){
    const sideMane=new THREE.Shape();sideMane.moveTo(-.24,.19);sideMane.bezierCurveTo(-.7,.4,-1.05,.34,-1.42,.1);sideMane.bezierCurveTo(-1.03,.18,-.82,-.05,-.77,-.43);sideMane.bezierCurveTo(-.63,-.2,-.44,-.02,-.24,.19);sideMane.closePath();
    const rim=curvedPlate(head,sideMane,gold,'Head mane gold border',.018);rim.position.z=side*.115;rim.scale.z=side;
    const inlay=curvedPlate(head,sideMane,teal,'Teal head mane',.01);inlay.position.set(-.03,.015,side*.15);inlay.scale.set(.85,.8,side);
  }
  // Four articulated-looking limbs, green muscles and three curved gold talons.
  for(const [u,front] of [[.2,true],[.57,false]])for(const side of [-1,1]) {
    const f=frame(u),leg=new THREE.Group();leg.name=(front?'Fore':'Hind')+' limb '+side;leg.position.copy(f.p);root.add(leg);
    const z=side*.28,reach=front?.38:-.12;
    ellipsoid(leg,green,[.01,-.06,z],[.235,.15,.155],'Shoulder muscle');
    tapered(leg,[[.02,-.05,z],[reach+.16,-.18,side*.42],[reach+.32,-.34,side*.47],[reach+.52,-.39,side*.51]],.12,green,'Tapered green limb',.38);
    tapered(leg,[[-.04,.035,z],[.13,-.06,side*.39],[reach+.2,-.32,side*.51]],.03,lightGold,'Gold limb accent',.2);
    ellipsoid(leg,green,[reach+.52,-.39,side*.51],[.17,.07,.14],'Paw');
    for(let j=-1;j<=1;j++){
      const zz=side*.51+j*.115,xx=reach+.54-Math.abs(j)*.055;
      tapered(leg,[[xx,-.39,zz],[xx+.13,-.42,zz],[xx+.17,-.6,zz],[xx+.06,-.77,zz]],.06,lightGold,'Long curved gold talon');
    }
  }
  // Forked, gold-rimmed tail tip.
  const tail=frame(.98).p;
  for(const s of [-1,1])tapered(root,[tail.toArray(),[tail.x-.1,tail.y+.25,s*.09],[tail.x+.13,tail.y+.63,s*.14],[tail.x+.36,tail.y+.77,s*.14]],.05,lightGold,'Forked tail tip');
  root.userData={version:2,stage:'Unrigged model for likeness review',reference:'drakon-swimmer.png',author:'Drakon Software & IT Solutions'};
  return root;
}

// Merge by material for a small number of draw calls. Source parts remain editable.
export function mergeDragonParts(root) {
  root.updateMatrixWorld(true);const batches=new Map();
  root.traverse(o=>{if(!o.isMesh)return;const key=o.material.uuid;if(!batches.has(key))batches.set(key,{material:o.material,parts:[]});batches.get(key).parts.push(o);});
  const merged=new THREE.Group();merged.name=root.name;merged.userData={...root.userData};
  for(const {material,parts} of batches.values()) {
    const p=[],n=[],c=[];
    for(const part of parts){const g=(part.geometry.index?part.geometry.toNonIndexed():part.geometry.clone()).applyMatrix4(part.matrixWorld);p.push(...g.attributes.position.array);n.push(...g.attributes.normal.array);if(material.vertexColors)c.push(...g.attributes.color.array);g.dispose();}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(n,3));if(c.length)g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));
    const m=new THREE.Mesh(g,material);m.name=material.name;merged.add(m);
  }
  return merged;
}
