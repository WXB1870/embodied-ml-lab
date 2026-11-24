'use strict';
const assert=require('node:assert/strict');

async function main(){
  const {computeReceptiveField:rf}=await import('../dist/labs/cnn-math.mjs');
  const {gaussianBank,compareAttention,kvCache}=await import('../dist/labs/attention-math.mjs');
  const layer=d=>({k:3,s:1,p:d,d});
  const dense=rf([1,1,1].map(layer),21,10,10);
  assert.deepEqual(dense.trfBox,{x0:7,y0:7,x1:13,y1:13});
  const one=[1,3,6,7,6,3,1];
  for(let y=0;y<21;y++) for(let x=0;x<21;x++)
    assert.equal(dense.pathGrid[y][x],(one[y-7]||0)*(one[x-7]||0));
  assert.equal(dense.centerPath,49);assert.equal(dense.edgeMin,1);
  assert.equal(dense.total,729);assert.equal(dense.maxPath,49);assert.equal(dense.minPath,1);
  const weights=dense.pathGrid.flatMap(row=>Array.from(row)).sort((a,b)=>b-a);
  const mass=n=>weights.slice(0,n).reduce((a,b)=>a+b,0);
  assert.ok(mass(dense.corePixels-1)<0.9*dense.total && mass(dense.corePixels)>=0.9*dense.total);
  const holes=rf([2,2,2].map(layer),21,10,10);
  assert.equal(holes.span,13);assert.equal(holes.reachable,49);assert.equal(holes.coverage,49/169);
  assert.equal(holes.pathGrid[9][10],0);
  const mixed=rf([1,2,3].map(layer),21,10,10);
  assert.equal(mixed.reachable,169);assert.equal(mixed.coverage,1);
  const edge=rf(Array.from({length:2},()=>({...layer(1),s:2})),21,0,0);
  assert.deepEqual(edge.sizes,[21,11,6]);assert.equal(edge.jump,4);assert.equal(edge.total,25);
  assert.equal(edge.inBoundsArea,16);assert.equal(edge.area,49);assert.equal(edge.coverage,1);
  assert.deepEqual(edge.trfBox,{x0:-3,y0:-3,x1:3,y1:3});
  assert.match(rf([{k:7,s:1,p:0,d:3}],15,0,0).error,/第 1 层/);
  assert.ok(rf([layer(1)],15,15,0).error);
  const empty=rf([{k:1,s:1,p:3,d:1}],15,0,0);
  assert.equal(empty.total,0);assert.equal(empty.inBoundsArea,0);

  let rawEntropy=0,scaledEntropy=0;
  for(let seed=1;seed<=128;seed++){
    const bank=gaussianBank(seed), {raw,scaled}=compareAttention(bank,512);
    for(const [a,theory] of [[raw,512],[scaled,1]]){
      assert.ok(Math.abs(a.probabilities.reduce((sum,p)=>sum+p,0)-1)<1e-9);
      assert.ok(a.gradient>=0 && a.gradient<=0.25 && a.entropy>=0);
      if(theory===1)assert.ok(Math.abs(a.variance-raw.variance/512)<1e-10);
    }
    rawEntropy+=raw.entropy;scaledEntropy+=scaled.entropy;
  }
  assert.ok(rawEntropy<0.3*scaledEntropy);
  assert.deepEqual(gaussianBank(7),gaussianBank(7));
  const cache=kvCache(32,8,4096,32,128);
  assert.equal(cache.bytes,536870912);assert.equal(cache.bytes/2**20,512);
  assert.equal(cache.mhaBytes,4*cache.bytes);assert.equal(cache.ratio,.25);
  assert.deepEqual(kvCache(8,2,512,1,64).groups,[0,0,0,0,1,1,1,1]);
  assert.throws(()=>kvCache(8,3,4096,32,128),RangeError);
  console.log('CNN path counts, support, boundary and invalid shapes: passed.');
  console.log('Attention, 128 seeds: mean entropy raw '+(rawEntropy/128).toFixed(4)+' / scaled '+(scaledEntropy/128).toFixed(4)+' nat. KV cache: 512 MiB.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
