import fs from 'node:fs';
import {deflateSync} from 'node:zlib';
import {createDragonModel,mergeDragonParts} from './dragon-model.js';
const model=mergeDragonParts(createDragonModel());
const json={asset:{version:'2.0',generator:'Drakon model study V'+model.userData.version},scene:0,scenes:[{name:model.name,nodes:[0]}],nodes:[{name:model.name,children:[],extras:model.userData}],meshes:[],materials:[],bufferViews:[],accessors:[],buffers:[]};
const chunks=[];let offset=0;
function append(bytes,target){const view={buffer:0,byteOffset:offset,byteLength:bytes.length};if(target)view.target=target;const index=json.bufferViews.push(view)-1;const padding=(4-bytes.length%4)%4;chunks.push(bytes,Buffer.alloc(padding));offset+=bytes.length+padding;return index;}
function png(texture){
 const {data,width,height}=texture.image;
 const crcTable=Array.from({length:256},(_,n)=>{for(let j=0;j<8;j++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
 function chunk(type,bytes){const name=Buffer.from(type),body=Buffer.concat([name,bytes]),out=Buffer.alloc(12+bytes.length);out.writeUInt32BE(bytes.length,0);body.copy(out,4);let crc=0xffffffff;for(const b of body)crc=crcTable[(crc^b)&255]^(crc>>>8);out.writeUInt32BE((crc^0xffffffff)>>>0,8+bytes.length);return out;}
 const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(width,0);ihdr.writeUInt32BE(height,4);ihdr[8]=8;ihdr[9]=6;
 const rows=Buffer.alloc((width*4+1)*height);for(let y=0;y<height;y++)Buffer.from(data.buffer,data.byteOffset+y*width*4,width*4).copy(rows,y*(width*4+1)+1);
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);
}
const textures=new Map();
function textureInfo(t){
 if(!textures.has(t.uuid)){
  json.images??=[];json.textures??=[];json.samplers??=[{magFilter:9729,minFilter:9987,wrapS:10497,wrapT:10497}];
  const image=json.images.push({name:t.name,mimeType:'image/png',bufferView:append(png(t))})-1;
  textures.set(t.uuid,json.textures.push({name:t.name,source:image,sampler:0})-1);
 }
 return {index:textures.get(t.uuid)};
}
function attribute(a,type,bounds=false){
 const bytes=Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength);
 const view=append(bytes,34962);
 const acc={bufferView:view,componentType:5126,count:a.count,type};
 if(bounds){acc.min=Array(a.itemSize).fill(Infinity);acc.max=Array(a.itemSize).fill(-Infinity);for(let i=0;i<a.count;i++)for(let j=0;j<a.itemSize;j++){const v=a.array[i*a.itemSize+j];if(!Number.isFinite(v))throw Error('Non-finite geometry');acc.min[j]=Math.min(acc.min[j],v);acc.max[j]=Math.max(acc.max[j],v);}}
 return json.accessors.push(acc)-1;
}
let triangles=0;
for(const part of model.children){
 const m=part.material,attrs={POSITION:attribute(part.geometry.attributes.position,'VEC3',true),NORMAL:attribute(part.geometry.attributes.normal,'VEC3')};if(part.geometry.attributes.color)attrs.COLOR_0=attribute(part.geometry.attributes.color,'VEC3');
 if((m.map||m.roughnessMap||m.normalMap)&&part.geometry.attributes.uv)attrs.TEXCOORD_0=attribute(part.geometry.attributes.uv,'VEC2');
 if(m.normalMap&&part.geometry.attributes.tangent)attrs.TANGENT=attribute(part.geometry.attributes.tangent,'VEC4');
 const material={name:m.name,pbrMetallicRoughness:{baseColorFactor:[m.color.r,m.color.g,m.color.b,1],metallicFactor:m.metalness,roughnessFactor:m.roughness},doubleSided:m.side===2};
 if(m.map)material.pbrMetallicRoughness.baseColorTexture=textureInfo(m.map);
 if(m.roughnessMap)material.pbrMetallicRoughness.metallicRoughnessTexture=textureInfo(m.roughnessMap);
 if(m.normalMap)material.normalTexture={...textureInfo(m.normalMap),scale:m.normalScale.x};
 if(m.emissive.r||m.emissive.g||m.emissive.b)material.emissiveFactor=[m.emissive.r*m.emissiveIntensity,m.emissive.g*m.emissiveIntensity,m.emissive.b*m.emissiveIntensity];
 const mi=json.materials.push(material)-1,mesh=json.meshes.push({name:part.name,primitives:[{attributes:attrs,material:mi,mode:4}]} )-1;
 const node=json.nodes.push({name:part.name,mesh})-1;json.nodes[0].children.push(node);triangles+=part.geometry.attributes.position.count/3;
}
json.buffers=[{byteLength:offset}];
const raw=Buffer.from(JSON.stringify(json)),jsonBuf=Buffer.concat([raw,Buffer.alloc((4-raw.length%4)%4,0x20)]),bin=Buffer.concat(chunks),header=Buffer.alloc(12),jh=Buffer.alloc(8),bh=Buffer.alloc(8);
header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(28+jsonBuf.length+bin.length,8);jh.writeUInt32LE(jsonBuf.length,0);jh.writeUInt32LE(0x4e4f534a,4);bh.writeUInt32LE(bin.length,0);bh.writeUInt32LE(0x004e4942,4);
const output=new URL('./drakon-model-v'+model.userData.version+'.glb',import.meta.url);fs.writeFileSync(output,Buffer.concat([header,jh,jsonBuf,bh,bin]));
console.log(JSON.stringify({file:output.pathname,triangles,materials:json.materials.length,bytes:fs.statSync(output).size}));
