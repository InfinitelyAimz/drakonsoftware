import * as THREE from './three.module.min.js';

// Drakon V1: an original volumetric interpretation of the supplied side artwork.
// X points toward the nose, Y is up, Z is the dragon's left side.
export function createDragonModel() {
  const root = new THREE.Group(); root.name = 'Drakon — model study V1';
  const mat = (name,color,metalness,roughness) => {
    const m = new THREE.MeshStandardMaterial({color,metalness,roughness}); m.name=name;return m;
  };
  const gold=mat('Warm gold armour',0xe6b947,.72,.31);
  const lightGold=mat('Gold edges and claws',0xffd77b,.7,.26);
  const green=mat('Emerald body',0x068c59,.36,.35);
  const teal=mat('Turquoise fins',0x08b5b3,.4,.3);
  const blue=mat('Cobalt mane',0x0869ce,.48,.3);
  const dark=mat('Deep green scale seams',0x03483e,.25,.42);
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
  function outline(parent,points,m,name,depth=.045) {
    const shape=new THREE.Shape();shape.moveTo(...points[0]);
    for(const p of points.slice(1))shape.lineTo(...p);shape.closePath();
    return mesh(parent,new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.018,bevelThickness:.015,bevelSegments:2,curveSegments:6,steps:1}),m,name);
  }
  // Centre line follows the artwork's raised neck, low chest and curling tail.
  const curve=new THREE.CatmullRomCurve3([
    [2.65,1.02,0],[2.42,.58,0],[2.3,-.13,0],[1.85,-.67,0],[.9,-.78,0],
    [-.2,-.45,0],[-1.3,-.16,0],[-2.4,-.46,0],[-3.35,-.48,0],[-4.05,-.1,0],[-4.23,.55,0]
  ].map(p=>new THREE.Vector3(...p)));
  function radius(u){return .31*Math.pow(1-u,.72)+.018;}
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
    const c=new THREE.Color().lerpColors(new THREE.Color(0x04a666),new THREE.Color(0x0878b9),Math.max(0,Math.cos(a))*(.35+u*.65));colours.push(c.r,c.g,c.b);
  }
  for(let i=0;i<rings;i++)for(let j=0;j<sides;j++){const a=i*(sides+1)+j,b=a+sides+1;indices.push(a,b,a+1,b,b+1,a+1);}
  const bodyGeo=new THREE.BufferGeometry();bodyGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));bodyGeo.setAttribute('color',new THREE.Float32BufferAttribute(colours,3));bodyGeo.setIndex(indices);bodyGeo.computeVertexNormals();
  const skin=mat('Green and blue body gradient',0xffffff,.38,.36);skin.vertexColors=true;
  mesh(root,bodyGeo,skin,'Continuous serpentine body');
  // Wide belly scutes wrap under the body, rather than separate gold beads.
  function scute(u,halfLength,m,name) {
    const p=[],idx=[],n=12;
    for(let i=0;i<=2;i++)for(let j=0;j<=n;j++){
      const a=Math.PI*.56+j/n*Math.PI*.88;
      const pt=surface(Math.min(.997,Math.max(.002,u+(i-1)*halfLength)),a,.014+Math.sin(i/2*Math.PI)*.014);p.push(...pt.toArray());
    }
    for(let i=0;i<2;i++)for(let j=0;j<n;j++){const a=i*(n+1)+j,b=a+n+1;idx.push(a,b,a+1,b,b+1,a+1);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();return mesh(root,g,m,name);
  }
  for(let i=0;i<53;i++)scute(.015+i*.0182,.0081,gold,'Overlapping belly plate');
  // Small raised scales on both flanks; low relief keeps the long clean silhouette.
  const scaleShape=[[0,.09],[.065,.035],[.055,-.04],[0,-.09],[-.055,-.04],[-.065,.035]];
  const scaleGeo=new THREE.ExtrudeGeometry(new THREE.Shape(scaleShape.map(p=>new THREE.Vector2(...p))),{depth:.009,bevelEnabled:true,bevelSize:.007,bevelThickness:.006,bevelSegments:1,steps:1});
  for(let row=0;row<43;row++)for(const side of [-1,1])for(let col=0;col<3;col++){
    const u=.035+row*.02+(col%2)*.007;if(u>.91)continue;
    const a=side*(.65+col*.43),f=frame(u),normal=f.up.clone().multiplyScalar(Math.cos(a)).addScaledVector(f.side,Math.sin(a));
    const across=new THREE.Vector3().crossVectors(f.t,normal).normalize(),basis=new THREE.Matrix4().makeBasis(across,f.t,normal);
    const s=Math.pow(1-u,.64)*1.6,o=mesh(root,scaleGeo,col===0?(row>22?blue:teal):green,'Flank scale');
    o.position.copy(surface(u,a,.012));o.quaternion.setFromRotationMatrix(basis);o.scale.set(s,s,1);
  }
  // A continuous flowing dorsal blade, with paired gold edges.
  const maneP=[],maneI=[],edgeA=[],edgeB=[];
  for(let i=0;i<=110;i++){
    const u=.035+i/110*.93,f=frame(u);
    const height=(.2+.09*Math.sin(u*19))*Math.pow(1-u,.35);
    const base=surface(u,0,.018),crest=base.clone().addScaledVector(f.up,height).addScaledVector(f.t,-.16*(1-u));
    maneP.push(...base.toArray(),...crest.toArray());edgeA.push(crest.toArray());edgeB.push(base.toArray());
    if(i<110){const a=i*2;maneI.push(a,a+1,a+2,a+2,a+1,a+3);}
  }
  const maneGeo=new THREE.BufferGeometry();maneGeo.setAttribute('position',new THREE.Float32BufferAttribute(maneP,3));maneGeo.setIndex(maneI);maneGeo.computeVertexNormals();
  const maneMat=blue.clone();maneMat.name='Blue dorsal sail';maneMat.side=THREE.DoubleSide;
  mesh(root,maneGeo,maneMat,'Flowing dorsal sail');
  tapered(root,edgeA,.022,lightGold,'Gold dorsal edge',.2);
  // Three signature swept fins, shaped as curved hooks like the reference.
  for(const [u,size] of [[.1,.65],[.39,.8],[.64,.48]]){
    const f=frame(u),fin=new THREE.Group();root.add(fin);fin.position.copy(surface(u,0,-.02));fin.rotation.z=Math.atan2(f.t.y,f.t.x);
    const points=[[.13,0],[-.15,.22*size],[-.36,.64*size],[-.88,.84*size],[-.62,.57*size],[-.61,.2*size],[-1.02,-.02],[-.35,-.15]];
    const rim=outline(fin,points,gold,'Swept fin gold border',.035);rim.position.z=-.018;
    const inset=outline(fin,points.map(([x,y])=>[x*.84-.04,y*.78+.016]),teal,'Swept fin turquoise inlay',.012);inset.position.z=.038;
    const back=inset.clone();back.position.z=-.064;fin.add(back);
  }
  // Head sculpt: elongated angular cheek, tapered muzzle and separated lower jaw.
  const head=new THREE.Group();head.name='Sculpted gold head';head.position.set(2.66,1.03,0);root.add(head);
  function loft(stations,m,name) {
    const p=[],idx=[],n=16;
    for(const [x,y,ry,rz] of stations)for(let j=0;j<=n;j++){const a=j/n*Math.PI*2;p.push(x,y+Math.cos(a)*ry,Math.sin(a)*rz);}
    for(let i=0;i<stations.length-1;i++)for(let j=0;j<n;j++){const a=i*(n+1)+j,b=a+n+1;idx.push(a,a+1,b,b,a+1,b+1);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();return mesh(head,g,m,name);
  }
  loft([[-.46,.03,.06,.045],[-.29,.07,.23,.25],[0,.09,.26,.29],[.24,.055,.19,.235],[.47,-.005,.12,.18],[.68,-.01,.12,.14],[.77,-.04,.025,.025]],gold,'Gold face and muzzle');
  loft([[-.06,-.19,.055,.14],[.23,-.185,.058,.18],[.51,-.13,.05,.14],[.72,-.1,.013,.045]],lightGold,'Lower jaw');
  loft([[.15,-.12,.023,.19],[.5,-.095,.025,.155],[.72,-.075,.01,.05]],black,'Mouth opening');
  // Cheek blades, brows and luminous almond eyes on each side.
  for(const side of [-1,1]){
    const cheek=outline(head,[[-.53,.18],[-.12,.22],[.13,.02],[-.1,-.12],[-.46,-.22],[-.31,-.02],[-.68,-.08]],gold,'Swept cheek armour',.055);cheek.position.z=side*.19; if(side<0){cheek.rotation.y=Math.PI;cheek.scale.x=-1;}
    ellipsoid(head,black,[.19,.105,side*.221],[.17,.073,.031],'Dark almond socket').rotation.z=-.23;
    ellipsoid(head,eye,[.22,.11,side*.246],[.115,.035,.014],'Cyan almond eye').rotation.z=-.23;
    ellipsoid(head,black,[.245,.11,side*.261],[.012,.034,.004],'Vertical pupil');
    tapered(head,[[.02,.2,side*.235],[.18,.185,side*.26],[.4,.135,side*.17]],.048,gold,'Angular gold brow',.2);
    ellipsoid(head,black,[.61,.047,side*.115],[.04,.024,.014],'Nostril').rotation.z=-.45;
    tapered(head,[[-.15,.24,side*.15],[-.4,.48,side*.22],[-.75,.64,side*.25],[-1.13,.69,side*.24]],.11,lightGold,'Swept crown horn');
    tapered(head,[[-.25,.1,side*.26],[-.56,.21,side*.4],[-.95,.24,side*.43]],.083,gold,'Side horn');
    tapered(head,[[-.24,-.05,side*.25],[-.53,-.04,side*.34],[-.79,.02,side*.36]],.054,lightGold,'Cheek barb');
    tapered(head,[[.64,-.07,side*.1],[.67,-.17,side*.105],[.61,-.24,side*.1]],.031,lightGold,'Hooked upper fang');
    tapered(head,[[.09,-.2,side*.12],[-.16,-.3,side*.19],[-.51,-.22,side*.27]],.027,gold,'Jaw tendril');
  }
  tapered(head,[[.35,.19,0],[.07,.35,0],[-.35,.41,0],[-.75,.37,0]],.08,lightGold,'Central crown ridge');
  // Four articulated-looking limbs, green muscles and three curved gold talons.
  for(const [u,front] of [[.2,true],[.57,false]])for(const side of [-1,1]) {
    const f=frame(u),leg=new THREE.Group();leg.name=(front?'Fore':'Hind')+' limb '+side;leg.position.copy(f.p);root.add(leg);
    const z=side*.28,reach=front?.38:-.12;
    ellipsoid(leg,green,[.01,-.06,z],[.24,.19,.18],'Shoulder muscle');
    tapered(leg,[[.02,-.05,z],[reach+.15,-.23,side*.42],[reach+.28,-.4,side*.48],[reach+.47,-.46,side*.51]],.14,green,'Curved green limb',.45);
    tapered(leg,[[-.04,.035,z],[.13,-.06,side*.39],[reach+.2,-.32,side*.51]],.03,lightGold,'Gold limb accent',.2);
    ellipsoid(leg,green,[reach+.47,-.46,side*.51],[.19,.085,.14],'Paw');
    for(let j=-1;j<=1;j++){
      const zz=side*.51+j*.1,xx=reach+.49-Math.abs(j)*.035;
      tapered(leg,[[xx,-.46,zz],[xx+.15,-.52,zz],[xx+.18,-.7,zz],[xx+.1,-.8,zz]],.052,lightGold,'Curved gold claw');
    }
  }
  // Forked, gold-rimmed tail tip.
  const tail=frame(.98).p;
  for(const s of [-1,1])tapered(root,[tail.toArray(),[tail.x-.1,tail.y+.25,s*.09],[tail.x+.13,tail.y+.63,s*.14],[tail.x+.36,tail.y+.77,s*.14]],.05,lightGold,'Forked tail tip');
  root.userData={version:1,stage:'Unrigged model for likeness review',reference:'drakon-swimmer.png',author:'Drakon Software & IT Solutions'};
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
