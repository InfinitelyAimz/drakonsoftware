// Deterministic reptile micro-surface. Shared by the viewer and GLB export.
// The three maps describe the same staggered, irregular scale boundaries.
export function createScaleTextures(THREE,size=1024) {
  const height=new Float32Array(size*size),variation=new Float32Array(size*size);
  const wrap=(n,m)=>((n%m)+m)%m;
  const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453123;return n-Math.floor(n);};
  const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
  const cols=16,rows=20;
  // Periodic staggered Voronoi cells give each scale a slightly different
  // outline and size; the two nearest cells define a recessed seam.
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const px=x/size*cols,py=y/size*rows,cy=Math.floor(py);let first=Infinity,second=Infinity,seed=0,localY=0;
    for(let dy=-1;dy<=1;dy++){
      const row=cy+dy,shift=(wrap(row,2))*.5,cx=Math.floor(px-shift);
      for(let dx=-1;dx<=1;dx++){
        const col=cx+dx,rx=wrap(col,cols),ry=wrap(row,rows),h=hash(rx,ry);
        const vx=col+.5+shift+(h-.5)*.24,vy=row+.5+(hash(rx+81,ry+37)-.5)*.2;
        const d=(px-vx)**2+((py-vy)*.87)**2;
        if(d<first){second=first;first=d;seed=h;localY=py-vy;}else if(d<second)second=d;
      }
    }
    const seam=smooth(.006,.11,second-first),dome=Math.max(0,1-Math.sqrt(first)*1.5);
    const grain=(hash(x,y)-.5)*.026+(hash(x*.21,y*.21)-.5)*.012;
    const pores=hash(x+913,y+271)>.982?-.07:0;
    const i=y*size+x;
    height[i]=seam*(.5+.22*dome+.09*localY+.07*seed)+grain+pores*seam;
    variation[i]=(.73+.21*seam+.045*seed+.015*dome)+grain*.6;
  }
  const albedo=new Uint8Array(size*size*4),normal=new Uint8Array(size*size*4),roughness=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const i=y*size+x,j=i*4;
    const dx=(height[y*size+wrap(x+1,size)]-height[y*size+wrap(x-1,size)])*6;
    const dy=(height[wrap(y+1,size)*size+x]-height[wrap(y-1,size)*size+x])*6;
    const len=Math.hypot(dx,dy,1),v=Math.round(Math.max(0,Math.min(1,variation[i]))*255);
    albedo.set([v,v,v,255],j);
    normal.set([Math.round((-.5*dx/len+.5)*255),Math.round((-.5*dy/len+.5)*255),Math.round((.5/len+.5)*255),255],j);
    // glTF packs roughness in G and metallic in B. B=1 preserves each
    // material's own metallic factor, including the gold areas.
    const r=Math.round(255*(.72+.22*(1-height[i])+.04*hash(x+27,y+19)));
    roughness.set([255,Math.min(255,r),255,255],j);
  }
  function texture(bytes,name,srgb=false){
    const t=new THREE.DataTexture(bytes,size,size,THREE.RGBAFormat);t.name=name;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.flipY=false;if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.needsUpdate=true;return t;
  }
  return {albedo:texture(albedo,'Reptile scale colour detail',true),normal:texture(normal,'Raised reptile scale normal'),roughness:texture(roughness,'Reptile scale roughness')};
}
