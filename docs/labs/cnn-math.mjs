export function layerGeometry(layers, inputSize) {
  if (!Number.isInteger(inputSize) || inputSize < 1 || layers.length < 1 || layers.length > 4)
    return {error: '请选择正整数输入尺寸和 1–4 层卷积。'};
  const sizes = [inputSize];
  let jump = 1, span = 1, padding = 0;
  for (const [index, {k, s, p, d}] of layers.entries()) {
    if (![k, s, p, d].every(Number.isInteger) || Math.min(k,s,d) < 1 || p < 0)
      return {error: '第 ' + (index + 1) + ' 层的卷积参数无效。'};
    const next = Math.floor((sizes.at(-1) + 2*p - d*(k-1) - 1) / s) + 1;
    if (next <= 0) return {error: '第 ' + (index+1) + ' 层输出尺寸为 ' + next + '。请减小核或空洞率，或增加填充。'};
    sizes.push(next);
    span += (k-1) * d * jump;
    padding += p * jump;
    jump *= s;
  }
  return {sizes, jump, span, padding};
}

export function computeReceptiveField(layers, inputSize, targetY, targetX) {
  const geometry = layerGeometry(layers, inputSize);
  if (geometry.error) return geometry;
  const {sizes, jump, span, padding} = geometry;
  if (![targetY,targetX].every(v => Number.isInteger(v) && v >= 0 && v < sizes.at(-1)))
    return {error: '探针坐标超出最终输出网格。'};
  let pulse = new Float64Array(sizes.at(-1)**2);
  pulse[targetY*sizes.at(-1)+targetX] = 1;
  for (let i=layers.length-1; i>=0; i--) {
    const {k,s,p,d} = layers[i];
    const width = sizes[i], out = sizes[i+1];
    const gradient = new Float64Array(width*width);
    for (let y=0; y<out; y++) for (let x=0; x<out; x++) {
      const count = pulse[y*out+x];
      if (!count) continue;
      for (let ky=0; ky<k; ky++) {
        const iy = y*s + ky*d - p;
        if (iy<0 || iy>=width) continue;
        for (let kx=0; kx<k; kx++) {
          const ix = x*s + kx*d - p;
          if (ix>=0 && ix<width) gradient[iy*width+ix] += count;
        }
      }
    }
    pulse = gradient;
  }
  const x0=targetX*jump-padding, y0=targetY*jump-padding;
  const trfBox={x0,y0,x1:x0+span-1,y1:y0+span-1};
  const insideLength = start => Math.max(0, Math.min(inputSize,start+span)-Math.max(0,start));
  const inBoundsArea = insideLength(x0)*insideLength(y0);
  const pathGrid = Array.from({length:inputSize}, (_,y)=>pulse.subarray(y*inputSize,(y+1)*inputSize));
  // The geometric center can lie in padding or in a dilation hole.
  const centerX=x0+(span-1)/2, centerY=y0+(span-1)/2;
  const centerPath=pathGrid[centerY]?.[centerX] ?? null;
  let edgeMin=Infinity;
  const left=Math.max(0,x0), right=Math.min(inputSize-1,trfBox.x1);
  const top=Math.max(0,y0), bottom=Math.min(inputSize-1,trfBox.y1);
  for(let y=top;y<=bottom;y++) for(let x=left;x<=right;x++){
    if((y===top || y===bottom || x===left || x===right) && pathGrid[y][x]>0)
      edgeMin=Math.min(edgeMin,pathGrid[y][x]);
  }
  const weights = Array.from(pulse).filter(v=>v>0).sort((a,b)=>b-a);
  const total = weights.reduce((sum,v)=>sum+v,0);
  let corePixels=0, mass=0;
  while (10*mass < 9*total) mass += weights[corePixels++];
  return {...geometry, trfBox, pathGrid, inBoundsArea, area:span*span, reachable:weights.length,
    coverage:inBoundsArea ? weights.length/inBoundsArea : 0,
    corePixels, coreFraction:inBoundsArea ? corePixels/inBoundsArea : 0,
    centerPath, edgeMin:Number.isFinite(edgeMin)?edgeMin:null,
    maxPath:weights[0]||0, minPath:weights.at(-1)||0, total};
}
