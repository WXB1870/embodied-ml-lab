function seededUniform(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let x = Math.imul(state ^ state >>> 15, 1 | state);
    x ^= x + Math.imul(x ^ x >>> 7, 61 | x);
    return ((x ^ x >>> 14) >>> 0) / 4294967296;
  };
}

// Fixed-length vectors keep each coordinate identical when the dimension slider moves.
export function gaussianBank(seed) {
  const random = seededUniform(seed);
  return Array.from({length:9}, () => {
    const vector = new Float64Array(512);
    for (let i=0; i<vector.length; i+=2) {
      const radius = Math.sqrt(-2*Math.log(1-random()));
      const angle = 2*Math.PI*random();
      vector[i] = radius*Math.cos(angle);
      vector[i+1] = radius*Math.sin(angle);
    }
    return vector;
  });
}

export function attentionStats(scores) {
  const mean = scores.reduce((a,b)=>a+b,0)/scores.length;
  const variance = scores.reduce((a,b)=>a+(b-mean)**2,0)/(scores.length-1);
  const max = Math.max(...scores);
  const exp = scores.map(v=>Math.exp(v-max));
  const sum = exp.reduce((a,b)=>a+b,0);
  const probabilities = exp.map(v=>v/sum);
  return {scores, probabilities, variance, peak:Math.max(...probabilities),
    entropy:-probabilities.reduce((acc,p)=>acc+(p ? p*Math.log(p) : 0),0),
    gradient:Math.max(...probabilities.map(p=>p*(1-p)))};
}

export function compareAttention(bank, dim) {
  const [query,...keys] = bank;
  const scores = keys.map(key=>{
    let score=0;
    for (let i=0;i<dim;i++) score += query[i]*key[i];
    return score;
  });
  return {raw:attentionStats(scores), scaled:attentionStats(scores.map(v=>v/Math.sqrt(dim)))};
}

export function kvCache(queryHeads, kvHeads, tokens, layers, headDim) {
  if (![queryHeads,kvHeads,tokens,layers,headDim].every(v=>Number.isInteger(v) && v>0) || queryHeads%kvHeads)
    throw new RangeError('头数必须整除，所有维度必须为正整数。');
  const groupSize = queryHeads/kvHeads;
  const bytes = 2 * layers * tokens * kvHeads * headDim * 2;
  return {groupSize, groups:Array.from({length:queryHeads},(_,i)=>Math.floor(i/groupSize)),
    ratio:kvHeads/queryHeads, bytes, mhaBytes:bytes*groupSize};
}
