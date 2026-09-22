// Known-null KS calibration. Independent fixed streams keep the lesson reproducible.
export function rng(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (((t ^ (t >>> 14)) >>> 0) + 0.5) / 4294967296;
  };
}
export function gaussian(random) {
  return Math.sqrt(-2 * Math.log(random())) * Math.cos(2 * Math.PI * random());
}
// Integrate the density on [0, x] with composite Simpson quadrature.
// Symmetry supplies the negative half; beyond 9 the omitted tail is negligible.
export function normalCDF(x) {
  if (x === 0) return 0.5;
  const a = Math.min(9, Math.abs(x)), n = 128, h = a / n;
  let sum = 1 + Math.exp(-a * a / 2);
  for (let i = 1; i < n; i++) sum += (i % 2 ? 4 : 2) * Math.exp(-((i * h) ** 2) / 2);
  const area = sum * h / (3 * Math.sqrt(2 * Math.PI));
  return Math.max(0, Math.min(1, 0.5 + Math.sign(x) * area));
}
// Lookup table makes repeated CDF evaluation cheap; interpolation error is tested.
const lo = -9, step = 0.002;
const cdfTable = Float64Array.from({length:9001},(_,i)=>normalCDF(lo+i*step));
export function cdf(x) {
  if(x<=-9)return 0;if(x>=9)return 1;
  const pos=(x-lo)/step,i=Math.floor(pos),a=pos-i;
  return cdfTable[i]*(1-a)+cdfTable[i+1]*a;
}
export function ks(values) {
  const ordered = [...values].sort((a,b)=>a-b), n=ordered.length;
  if(!n)throw new Error('A test needs observations');
  let d=0;
  ordered.forEach((x,i)=>{const f=cdf(x);d=Math.max(d,(i+1)/n-f,f-i/n);});
  return d;
}
function sample(n,mode,random){return Array.from({length:n},()=>mode==='two-point'?(random()<.5?-1:1):gaussian(random)+(mode==='shifted'?.4:0));}
const cache=new Map();
export function experiment(n,mode='normal') {
  if(!cache.has(n)){
    const random=rng(493+n),nulls=Array.from({length:511},()=>ks(sample(n,'normal',random))).sort((a,b)=>a-b);
    const threshold=nulls[Math.ceil(.95*nulls.length)-1],alternative=rng(8491+n);
    let detected=0;
    for(let i=0;i<128;i++){const d=ks(sample(n,'shifted',alternative));const p=(1+nulls.filter(v=>v>=d).length)/512;if(p<=.05)detected++;}
    cache.set(n,{nulls,threshold,detected,power:detected/128});
  }
  const base=cache.get(n),observed=sample(n,mode,rng(1763+n)),d=ks(observed);
  return {...base,n,observed,d,p:(1+base.nulls.filter(v=>v>=d).length)/512};
}
