// Geometry and tapered-link construction adapted from Jaxverse's Instrument.svelte.
// Link lengths and relative second-joint convention come from the shared simulator.
import { armPoints } from '../book/world/simulator.ts';
const f=n=>Number(n.toFixed(3));
export function armGeometry(pose,cx=250,cy=210,scale=205){
 const p=armPoints(pose),map=v=>({x:cx+v.x*scale,y:cy-v.y*scale});
 return {base:map(p.base),elbow:map(p.elbow),tip:map(p.tip)};
}
function link(a,b,start,end){const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),nx=-dy/len,ny=dx/len;return [[a.x+nx*start,a.y+ny*start],[b.x+nx*end,b.y+ny*end],[b.x-nx*end,b.y-ny*end],[a.x-nx*start,a.y-ny*start]].map(p=>p.map(f).join(',')).join(' ');}
export function armDrawing(pose,cx,cy,scale){
 const p=armGeometry(pose,cx,cy,scale);
 return `<g class="arm-mechanism"><circle cx="${cx}" cy="${cy}" r="30" class="mount-ring"/>${Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return `<path d="M${f(cx+Math.cos(a)*34)} ${f(cy+Math.sin(a)*34)}L${f(cx+Math.cos(a)*38)} ${f(cy+Math.sin(a)*38)}" class="mount-ring"/>`;}).join('')}<circle cx="${cx}" cy="${cy}" r="22" class="arm-mount"/><polygon data-link="first" points="${link(p.base,p.elbow,10,7)}" class="arm-link"/><polygon data-link="second" points="${link(p.elbow,p.tip,7,2.5)}" class="arm-link"/>${[[p.base,11,5],[p.elbow,8.5,3.7]].map(([v,r,ri])=>`<circle cx="${f(v.x)}" cy="${f(v.y)}" r="${r}" class="arm-bearing"/><circle cx="${f(v.x)}" cy="${f(v.y)}" r="${ri}" class="bearing-inner"/><circle cx="${f(v.x)}" cy="${f(v.y)}" r="1.4" class="arm-pin"/>`).join('')}<circle cx="${f(p.tip.x)}" cy="${f(p.tip.y)}" r="3" class="arm-pin"/></g>`;
}
export function armPlate(kind){
 if(kind==='arm-hero')return `<div class="arm-cover"><svg viewBox="0 0 540 330" role="img" aria-labelledby="arm-cover-title arm-cover-desc"><title id="arm-cover-title">The two-link world</title><desc id="arm-cover-desc">A fixed shoulder bearing connects to one elbow bearing by a rigid link. A second link ends in a simple tip. There is no wrist or gripper.</desc><circle cx="235" cy="235" r="177" class="reach-guide"/><path d="M43 235H437M235 43V292" class="reach-guide"/>${armDrawing({q1:1.7,q2:-1.3},235,235,260)}<text x="64" y="308" class="arm-folio">TWO LINKS · TWO ROTATING JOINTS</text></svg><div class="arm-cover-copy"><span class="eyebrow">Our running experiment</span><h3>A small world,<br/>seen by a camera.</h3><p>A picture shows the pose.<br/>It does not show the velocity.</p><p>What would you need to see<br/>to predict the next move?</p></div></div><figcaption>Exact two-link geometry, adapted from Jaxverse. The same link lengths are used in the training laboratory. This drawing shows a physical pose, not an embedding or a learned forecast.</figcaption>`;
 if(kind==='arm-abstraction')return `<div class="arm-comparison">${['striped','plain'].map((bg,i)=>`<div><span class="eyebrow">${i?'Different surface':'Same mechanism'}</span><svg viewBox="0 0 360 270" role="img" aria-label="The same arm pose on a ${bg} surface"><rect x="10" y="10" width="340" height="250" rx="14" class="arm-table ${bg}"/>${i?'':Array.from({length:10},(_,j)=>`<path d="M${20+j*34} 12V258" class="table-stripe"/>`).join('')}${armDrawing({q1:1.7,q2:-1.3},155,197,195)}</svg></div>`).join('')}</div><figcaption>The pose is identical; only the surface changes. For predicting this mechanism's motion, an encoder should preserve pose while ignoring this change in appearance. That invariance is a learning goal, not a property guaranteed by these drawings.</figcaption>`;
 throw Error('Unknown arm plate '+kind);
}
