const fs=require('fs'),vm=require('vm'),assert=require('assert');
const sandbox={P0_VISUALS:[],emlExplorer:()=>'',initExplorers:()=>{},p0Heading:()=>''};
vm.createContext(sandbox);
const f=vm.runInContext(fs.readFileSync(__dirname+'/../dist/deep-explorers.js','utf8')+';DeepFlow;',sandbox);
let count=0;
const near=(a,b,e=1e-7)=>{assert(Math.abs(a-b)<e);count++;};
for(const sigma of [.3,.7,1.5]){
 near(f.variance(0,sigma),1);near(f.variance(1,sigma),sigma*sigma);
 for(const z of [-1.5,0,1.5]){
  near(f.exact(0,z,2,sigma),z);near(f.exact(1,z,2,sigma),2+sigma*z);
  const t=.43,h=1e-5,x=f.exact(t,z,2,sigma);
  near((f.exact(t+h,z,2,sigma)-f.exact(t-h,z,2,sigma))/(2*h),f.velocity(t,x,2,sigma),1e-6);
 }
 for(const method of ['euler','heun']){
  const error=n=>Math.abs(f.integrate(1.5,2,sigma,n,method).at(-1).x-(2+1.5*sigma));
  assert(error(64)<error(8));count++;
 }
}
console.log(count+' analytic flow and integration checks passed.');
