import fs from 'node:fs';
import {createDragonModel,mergeDragonParts} from './dragon-model.js';
const model=mergeDragonParts(createDragonModel());
const json={asset:{version:'2.0',generator:'Drakon model study V'+model.userData.version},scene:0,scenes:[{name:model.name,nodes:[0]}],nodes:[{name:model.name,children:[],extras:model.userData}],meshes:[],materials:[],bufferViews:[],accessors:[],buffers:[]};
const chunks=[];let offset=0;
function attribute(a,type,bounds=false){
 const bytes=Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength),padding=(4-bytes.length%4)%4;
 const view=json.bufferViews.push({buffer:0,byteOffset:offset,byteLength:bytes.length,target:34962})-1;chunks.push(bytes,Buffer.alloc(padding));offset+=bytes.length+padding;
 const acc={bufferView:view,componentType:5126,count:a.count,type};
 if(bounds){acc.min=Array(a.itemSize).fill(Infinity);acc.max=Array(a.itemSize).fill(-Infinity);for(let i=0;i<a.count;i++)for(let j=0;j<a.itemSize;j++){const v=a.array[i*a.itemSize+j];if(!Number.isFinite(v))throw Error('Non-finite geometry');acc.min[j]=Math.min(acc.min[j],v);acc.max[j]=Math.max(acc.max[j],v);}}
 return json.accessors.push(acc)-1;
}
let triangles=0;
for(const part of model.children){
 const m=part.material,attrs={POSITION:attribute(part.geometry.attributes.position,'VEC3',true),NORMAL:attribute(part.geometry.attributes.normal,'VEC3')};if(part.geometry.attributes.color)attrs.COLOR_0=attribute(part.geometry.attributes.color,'VEC3');
 const material={name:m.name,pbrMetallicRoughness:{baseColorFactor:[m.color.r,m.color.g,m.color.b,1],metallicFactor:m.metalness,roughnessFactor:m.roughness},doubleSided:m.side===2};
 if(m.emissive.r||m.emissive.g||m.emissive.b)material.emissiveFactor=[m.emissive.r*m.emissiveIntensity,m.emissive.g*m.emissiveIntensity,m.emissive.b*m.emissiveIntensity];
 const mi=json.materials.push(material)-1,mesh=json.meshes.push({name:part.name,primitives:[{attributes:attrs,material:mi,mode:4}]} )-1;
 const node=json.nodes.push({name:part.name,mesh})-1;json.nodes[0].children.push(node);triangles+=part.geometry.attributes.position.count/3;
}
json.buffers=[{byteLength:offset}];
const raw=Buffer.from(JSON.stringify(json)),jsonBuf=Buffer.concat([raw,Buffer.alloc((4-raw.length%4)%4,0x20)]),bin=Buffer.concat(chunks),header=Buffer.alloc(12),jh=Buffer.alloc(8),bh=Buffer.alloc(8);
header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(28+jsonBuf.length+bin.length,8);jh.writeUInt32LE(jsonBuf.length,0);jh.writeUInt32LE(0x4e4f534a,4);bh.writeUInt32LE(bin.length,0);bh.writeUInt32LE(0x004e4942,4);
const output=new URL('./drakon-model-v'+model.userData.version+'.glb',import.meta.url);fs.writeFileSync(output,Buffer.concat([header,jh,jsonBuf,bh,bin]));
console.log(JSON.stringify({file:output.pathname,triangles,materials:json.materials.length,bytes:fs.statSync(output).size}));
