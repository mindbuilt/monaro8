import fs from 'node:fs'; import {PNG} from 'pngjs'; import {contours} from 'd3-contour';
const [tileDir, outDir] = process.argv.slice(2);
const Z=12, X0=3741, Y0=2489, TX=5, TY=4, W=TX*256, H=TY*256;
const mosaic = new Float32Array(W*H);
for (let tx=0;tx<TX;tx++) for (let ty=0;ty<TY;ty++){
  const p = PNG.sync.read(fs.readFileSync(`${tileDir}/${X0+tx}_${Y0+ty}.png`));
  for (let y=0;y<256;y++) for (let x=0;x<256;x++){ const i=(y*256+x)*4;
    mosaic[(ty*256+y)*W + tx*256+x] = p.data[i]*256 + p.data[i+1] + p.data[i+2]/256 - 32768; }
}
const n=2**Z, px2lon = gx => gx/256/n*360-180, px2lat = gy => Math.atan(Math.sinh(Math.PI*(1-2*gy/256/n)))*180/Math.PI;
const CX=252, CY=160, CW=1024, CH=640; // crop in mosaic px
const sample=(fx,fy)=>{ const x=Math.min(W-2,Math.max(0,fx)), y=Math.min(H-2,Math.max(0,fy)); const x0=Math.floor(x), y0=Math.floor(y), dx=x-x0, dy=y-y0;
  const a=mosaic[y0*W+x0], b=mosaic[y0*W+x0+1], c=mosaic[(y0+1)*W+x0], d=mosaic[(y0+1)*W+x0+1]; return a*(1-dx)*(1-dy)+b*dx*(1-dy)+c*(1-dx)*dy+d*dx*dy; };
const grid=(gw,gh)=>{ const g=new Float32Array(gw*gh); for(let j=0;j<gh;j++)for(let i=0;i<gw;i++) g[j*gw+i]=sample(CX+i/(gw-1)*(CW-1), CY+j/(gh-1)*(CH-1)); return g; };
// 1) mesh grid 512x320 as Uint16 decimetres
const MW=512, MH=320, mg=grid(MW,MH); let min=1e9,max=-1e9; for(const v of mg){min=Math.min(min,v);max=Math.max(max,v);}
const u16=new Uint16Array(mg.length); mg.forEach((v,i)=>u16[i]=Math.round(v*10)); fs.writeFileSync(`${outDir}/cooma-dem.bin`, Buffer.from(u16.buffer));
const gx0=X0*256+CX, gy0=Y0*256+CY;
const bounds={west:px2lon(gx0), east:px2lon(gx0+CW), north:px2lat(gy0), south:px2lat(gy0+CH)};
const ll2uv=(lat,lon)=>{ const gx=(lon+180)/360*n*256; const r=lat*Math.PI/180; const gy=(1-Math.log(Math.tan(r)+1/Math.cos(r))/Math.PI)/2*n*256; return [(gx-gx0)/CW,(gy-gy0)/CH]; };
const uv2ll=(u,v)=>[px2lat(gy0+v*CH), px2lon(gx0+u*CW)];
const elevAt=(u,v)=>sample(CX+u*(CW-1), CY+v*(CH-1));
const mpp = 156543.03392*Math.cos(-36.2355*Math.PI/180)/n;
// 2) waypoints: Cooma + highest local summits in 3 western/northern/southern zones
const cooma=ll2uv(-36.2355,149.1257);
const peak=(u0,u1,v0,v1)=>{let best=[0,0,-1];for(let v=v0;v<v1;v+=0.004)for(let u=u0;u<u1;u+=0.004){const e=elevAt(u,v); if(e>best[2]) best=[u,v,e];} return best;};
const wps=[ peak(0.05,0.35,0.08,0.45), peak(0.05,0.35,0.55,0.92), peak(0.40,0.62,0.06,0.40), [cooma[0],cooma[1],elevAt(...cooma)] ]
  .map(([u,v,e])=>{const [lat,lon]=uv2ll(u,v); return {u:+u.toFixed(4),v:+v.toFixed(4),elev:Math.round(e),lat:+lat.toFixed(4),lon:+lon.toFixed(4)};});
const meta={source:'AWS Terrain Tiles (terrarium, z12; SRTM/GA-derived), resampled', width:MW, height:MH, unit:'decimetres uint16 LE', min:Math.round(min), max:Math.round(max), bounds, widthKm:+(CW*mpp/1000).toFixed(1), heightKm:+(CH*mpp/1000).toFixed(1), cooma:{u:+cooma[0].toFixed(4),v:+cooma[1].toFixed(4),elev:Math.round(elevAt(...cooma))}, waypoints:wps};
fs.writeFileSync(`${outDir}/cooma-dem.json`, JSON.stringify(meta,null,1));
// 3) SVG contours from 256x160 grid, lightly blurred, viewBox 1024x640
const SW=256, SH=160; let sg=grid(SW,SH);
for(let pass=0;pass<2;pass++){const o=new Float32Array(sg.length);for(let j=0;j<SH;j++)for(let i=0;i<SW;i++){let s=0,c=0;for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const x=i+di,y=j+dj;if(x>=0&&y>=0&&x<SW&&y<SH){s+=sg[y*SW+x];c++;}}o[j*SW+i]=s/c;}sg=o;}
const lo=Math.ceil(min/20)*20, th=[]; for(let t=lo;t<max;t+=20) th.push(t);
const cs=contours().size([SW,SH]).thresholds(th)(Array.from(sg));
const sx=1024/(SW-1), sy=640/(SH-1);
const ringPath=ring=>{ if(ring.length<6) return ''; const pts=[]; for(const [x,y] of ring){ const X=Math.round(x*sx), Y=Math.round(y*sy); const l=pts[pts.length-1]; if(!l||Math.hypot(X-l[0],Y-l[1])>=3) pts.push([X,Y]); } if(pts.length<4) return ''; return 'M'+pts.map(p=>p.join(' ')).join('L')+'Z'; };
let minor='', index='';
for(const c of cs){ const d=c.coordinates.flat().map(ringPath).join(''); if(!d) continue; if(c.value%100===0) index+=`<path pathLength="1" data-e="${c.value}" d="${d}"/>`; else minor+=`<path pathLength="1" d="${d}"/>`; }
const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="6 6 1012 628" preserveAspectRatio="xMidYMid slice" fill="none"><g class="c-minor">${minor}</g><g class="c-index">${index}</g></svg>`;
fs.writeFileSync(`${outDir}/cooma-contours.svg`, svg);
console.log(JSON.stringify(meta,null,1)); console.log('svg KB', (svg.length/1024).toFixed(0), 'levels', th.length);
