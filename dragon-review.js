import * as THREE from './three.module.min.js';
import {createDragonModel,mergeDragonParts} from './dragon-model.js?v=3';
const canvas=document.querySelector('canvas'),loading=document.querySelector('#loading');
try {
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,1,.05,80);
 scene.add(new THREE.HemisphereLight(0xe5f3ff,0x102521,1.1));
 for(const [c,i,x,y,z] of [[0xffedce,2.6,2,6,5],[0x73c9ff,1.4,-5,3,-4],[0xf8fff5,.8,-1,0,6]]){const l=new THREE.DirectionalLight(c,i);l.position.set(x,y,z);scene.add(l);}
 const studio=new THREE.Scene();studio.background=new THREE.Color(0x283b3f);
 for(const [x,y,z,sx,sy,sz,c] of [[0,6,1,8,1,5,0xffffff],[5,1,3,1,5,4,0xffe5b4],[-5,1,-2,1,5,4,0x88dbf5]]){const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),new THREE.MeshBasicMaterial({color:c}));m.position.set(x,y,z);studio.add(m);}
 const pmrem=new THREE.PMREMGenerator(renderer),env=pmrem.fromScene(studio,.1);scene.environment=env.texture;scene.environmentIntensity=.4;pmrem.dispose();
 const dragon=mergeDragonParts(createDragonModel());scene.add(dragon);
 let yaw=.35,pitch=.14,distance=14,target=new THREE.Vector3(-.2,0,0),drag=null;
 const presets={three:[.35,.14,14,[-.2,0,0],'Three-quarter view'],side:[0,0,14,[-.2,0,0],'Side view'],front:[Math.PI/2,.05,9.5,[0,.15,0],'Front view'],back:[-Math.PI/2,.1,9.5,[0,.15,0],'Back view'],head:[.55,.14,5.2,[2.65,1.1,0],'Head detail'],face:[Math.PI/2,.08,3.15,[2.85,1.13,0],'Front face detail'],fins:[.3,-.48,5.6,[.95,-.38,0],'Fin underside detail']};
 function draw(){const box=canvas.getBoundingClientRect();camera.aspect=box.width/box.height;camera.updateProjectionMatrix();const responsive=box.width<650?1+.45*Math.cos(yaw)**2*THREE.MathUtils.smoothstep(distance,4,14):1;camera.position.set(target.x+Math.sin(yaw)*Math.cos(pitch)*distance*responsive,target.y+Math.sin(pitch)*distance*responsive,target.z+Math.cos(yaw)*Math.cos(pitch)*distance*responsive);camera.lookAt(target);renderer.render(scene,camera);}
 function custom(){document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed','false'));document.querySelector('#view-label').textContent='Free view';}
 document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{const p=presets[b.dataset.view];[yaw,pitch,distance]=p;target.set(...p[3]);document.querySelector('#view-label').textContent=p[4];document.querySelectorAll('[data-view]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));draw();}));
 const pointers=new Map();let pinchDistance=null;
 canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);drag=[e.clientX,e.clientY];if(pointers.size===2){const [a,b]=[...pointers.values()];pinchDistance=Math.hypot(a[0]-b[0],a[1]-b[1]);}});
 canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,[e.clientX,e.clientY]);if(pointers.size===2){const [a,b]=[...pointers.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(pinchDistance&&d)distance=THREE.MathUtils.clamp(distance*pinchDistance/d,2,24);pinchDistance=d;}else if(drag){yaw-=(e.clientX-drag[0])*.008;pitch=THREE.MathUtils.clamp(pitch+(e.clientY-drag[1])*.007,-1.3,1.3);}drag=[e.clientX,e.clientY];custom();draw();});
 function release(e){pointers.delete(e.pointerId);drag=null;pinchDistance=null;}canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
 canvas.addEventListener('wheel',e=>{e.preventDefault();distance=THREE.MathUtils.clamp(distance*Math.exp(e.deltaY*.001),2,24);custom();draw();},{passive:false});
 canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','='].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')yaw-=.1;if(e.key==='ArrowRight')yaw+=.1;if(e.key==='ArrowUp')pitch=Math.min(1.3,pitch+.1);if(e.key==='ArrowDown')pitch=Math.max(-1.3,pitch-.1);if(e.key==='+'||e.key==='=')distance=Math.max(2,distance*.9);if(e.key==='-')distance=Math.min(24,distance*1.1);custom();draw();});
 new ResizeObserver(()=>{const r=canvas.getBoundingClientRect();renderer.setSize(r.width,r.height,false);draw();}).observe(canvas.parentElement);
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();loading.hidden=false;loading.textContent='3D preview interrupted. Reload this page to restore it.';});
 loading.hidden=true;draw();
}catch(e){loading.textContent='The 3D preview could not start. You can still view the reference and download the model.';console.error(e);}
