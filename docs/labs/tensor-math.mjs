// Axis metadata only. No dense tensor is allocated by this experiment.
const symbols = {B:2, T:3, D:4, H:2, Q:3, K:5};
const fail = message => { throw new RangeError(message); };

export function parseShape(text) {
  let body = text.trim();
  if (body === '()' || body === '[]') return [];
  if ((body.startsWith('(') && body.endsWith(')')) ||
      (body.startsWith('[') && body.endsWith(']'))) body = body.slice(1,-1);
  const tokens = body.split(',').map(token => token.trim());
  if (tokens.length > 6) fail('每个输入最多支持六条轴。');
  return tokens.map(token => {
    const n = Object.hasOwn(symbols,token) ? symbols[token] : /^\d+$/.test(token) ? Number(token) : NaN;
    if (!Number.isInteger(n) || n < 1 || n > 4096)
      fail('轴长请输入 1–4096 的整数，或使用 B、T、D、H、Q、K。标量写作 ()。');
    return n;
  });
}

const product = shape => shape.reduce((n, dim) => n * BigInt(dim), 1n);

export function alignTensors(a, b, equation = null) {
  const shapes = [parseShape(a),parseShape(b)];
  let inputs, output;
  if (equation === null) {
    const rank = Math.max(...shapes.map(shape => shape.length));
    output = Array.from({length:rank}, (_,i) => String(i-rank));
    inputs = shapes.map(shape => output.slice(rank-shape.length));
  } else {
    const match = /^([a-zA-Z]*),([a-zA-Z]*)->([a-zA-Z]*)$/.exec(equation.replace(/\s/g,''));
    if (!match) fail('使用两个操作数和显式输出，例如 bhqd,bhkd->bhqk。下标使用单个英文字母。');
    inputs = [Array.from(match[1]),Array.from(match[2])];
    output = Array.from(match[3]);
    if (inputs.some((axes,i) => axes.length !== shapes[i].length))
      fail('每个输入的下标数必须等于它的轴数。');
    if (new Set(output).size !== output.length || output.some(axis => !inputs.flat().includes(axis)))
      fail('输出下标必须出现在输入中，且每个只能保留一次。');
  }
  const axes = [...new Set([...output,...inputs.flat()])];
  const sizes = new Map();
  inputs.forEach((labels, operand) => {
    const local = new Map();
    labels.forEach((axis,i) => {
      const size = shapes[operand][i];
      if (local.has(axis) && local.get(axis) !== size) fail('同一输入中重复的下标 '+axis+' 必须等长才能取对角线。');
      local.set(axis,size);
      const previous = sizes.get(axis) ?? 1;
      if (previous !== 1 && size !== 1 && size !== previous)
        fail('轴 '+axis+' 的长度 '+previous+' 与 '+size+' 无法对齐，只有长度 1 可以扩张。');
      sizes.set(axis,Math.max(previous,size));
    });
  });
  const outputShape = output.map(axis => sizes.get(axis));
  const reduced = axes.filter(axis => !output.includes(axis));
  return {shapes,inputs,axes,output,reduced,sizes,outputShape,
    inputCounts:shapes.map(product),outputCount:product(outputShape),
    terms:product(reduced.map(axis => sizes.get(axis)))};
}

// Coordinate for one selected product term (also handles repeated subscripts).
export function sourceIndices(model, coordinates) {
  return model.inputs.map((labels,n) => labels.map((axis,i) =>
    model.shapes[n][i] === 1 ? 0 : coordinates.get(axis) ?? 0));
}
