import {defaultDevice, init} from '@jax-js/jax';
import {WorldCore, WORLD_INTERVAL} from './engine';
import {renderSensor} from './sensor';
import {initialArm, stepArm, poseError} from './simulator';

let core: WorldCore | null=null;
let stopped=false, queue=Promise.resolve(), options:any={}, backend='';
let state=initialArm(), previous=initialArm(), previousAction:[number,number]=[0,0], controlStep=0;
// Local goals are inherited from Jaxverse's pre-existing validation suite.
// The original failed distant goal is retained explicitly as a stress test.
const goals=[{q1:-.9,q2:1},{q1:-1.8,q2:1.8},{q1:-1.05,q2:2.25},{q1:.3,q2:.25}];
function scene(goal=0){return {state,previous,goal:goals[goal],frame:renderSensor(state,core!.config.resolution),goalFrame:renderSensor(goals[goal],core!.config.resolution),error:poseError(state,goals[goal]),step:controlStep};}
async function handle(req:any){
 if(req.op==='init'){
  const devices=await init();backend=req.backend&&devices.includes(req.backend)?req.backend:devices.includes('webgpu')?'webgpu':devices.includes('wasm')?'wasm':'cpu';defaultDevice(backend);
  core?.dispose();options={seed:17,...req.options};core=new WorldCore(options);
  const info=await core.init();state=initialArm();previous={...state};previousAction=[0,0];controlStep=0;
  return {info,backend,devices,scene:scene()};
 }
 if(!core)throw Error('Prepare the model first.');
 if(req.op==='evaluate')return core.evaluate();
 if(req.op==='train'){
  stopped=false;let last=-1;
  const metrics=await core.train(req.steps??500,m=>{if(m.step===1||m.step-last>=25){last=m.step;postMessage({id:req.id,event:'metrics',metrics:m,phase:'regularized'})}},()=>stopped);
  return {metrics,evaluation:await core.evaluate(),stopped};
 }
 if(req.op==='compare'){
  stopped=false;const regularized=await core.evaluate(),baseline=await core.createUnregularizedBaseline();
  try{let last=0;const metrics=await baseline.train(regularized.step,m=>{if(m.step-last>=50){last=m.step;postMessage({id:req.id,event:'metrics',metrics:m,phase:'prediction-only'})}},()=>stopped);
   return {regularized,unregularized:await baseline.evaluate(),complete:metrics.step===regularized.step};
  }finally{baseline.dispose();}
 }
 if(req.op==='scene'){state=initialArm();previous={...state};previousAction=[0,0];controlStep=0;return scene(req.goal??0);}
 if(req.op==='control'){
  stopped=false;const goal=req.goal??0;const trajectory=[];
  for(let i=0;i<(req.steps??20)&&!stopped;i++){
   const r=core.config.resolution,observations=new Float32Array(2*r*r);observations.set(renderSensor(previous,r));observations.set(renderSensor(state,r),r*r);
   const planned=await core.plan({observations,previousAction,goal:renderSensor(goals[goal],r),horizon:6,hold:true,effort:.01,seed:300+controlStep});
   previous={...state};state=stepArm(state,planned.action,{dt:WORLD_INTERVAL});previousAction=planned.action;controlStep++;
   const data={...scene(goal),action:planned.action,cost:planned.cost,ms:planned.ms,imagined:planned.poses,readoutError:planned.readoutError};trajectory.push({error:data.error,action:data.action,cost:data.cost});
   postMessage({id:req.id,event:'control',scene:data});await new Promise(r=>setTimeout(r,40));
  }
  return {scene:scene(goal),trajectory};
 }
 if(req.op==='forecasts'){
  const start={q1:-1.9,q2:1.45,v1:.45,v2:-.55};
  const priorAction:[number,number]=[.2,.08];
  const current=stepArm(start,priorAction,{dt:WORLD_INTERVAL});
  const r=core.config.resolution,observations=new Float32Array(2*r*r);
  observations.set(renderSensor(start,r));observations.set(renderSensor(current,r),r*r);
  const results=[];
  for(const [name,command] of [['Push',[.55,-.45]],['Reverse',[-.55,.45]],['Release',[0,0]]] as const){
   const actions=Float32Array.from(Array.from({length:12},()=>command).flat());
   const forecast=await core.forecast({observations,previousAction:priorAction,actions});
   let p={...current};const actual=Array.from({length:12},()=>p=stepArm(p,command,{dt:WORLD_INTERVAL}));
   results.push({name,start:current,actual,...forecast});
  }
  return results;
 }
 if(req.op==='dispose'){core.dispose();core=null;return null;}
 throw Error('Unknown operation '+req.op);
}
self.onmessage=({data:req})=>{
 if(req.op==='stop'){stopped=true;postMessage({id:req.id,ok:true,result:null});return;}
 queue=queue.then(async()=>{try{postMessage({id:req.id,ok:true,result:await handle(req)})}catch(e){postMessage({id:req.id,ok:false,error:e instanceof Error?e.message:String(e)})}});
};
