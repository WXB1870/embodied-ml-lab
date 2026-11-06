"""A small, original pi0-style teaching model; no pretrained weights required.

Run: python vla-joint-attention.py  (dependency: PyTorch)
OpenPI convention: t=1 is noise, t=0 is action; target = noise - action.
The fixed requested horizon mask is known at inference, not future episode termination.
"""
import copy
import json
import math

import torch
from torch import nn


def rms(x):
    return x * torch.rsqrt(x.square().mean(dim=-1, keepdim=True) + 1e-6)


def rope(x, positions):
    # x: [B, heads, L, d]; rotate adjacent pairs (a teaching convention).
    d = x.shape[-1]
    assert d % 2 == 0
    frequency = 10000.0 ** (-torch.arange(0, d, 2, device=x.device, dtype=x.dtype) / d)
    angle = positions[:, None, :, None] * frequency
    even, odd = x[..., 0::2], x[..., 1::2]
    return torch.stack((even * angle.cos() - odd * angle.sin(),
                        even * angle.sin() + odd * angle.cos()), dim=-1).flatten(-2)


def visibility(valid, groups):
    # Row=query, column=key. The three groups are prefix=0, state=1, action=2.
    return (groups[None, :] <= groups[:, None])[None] & valid[:, :, None] & valid[:, None, :]


def attend(q, k, v, allowed):
    scores = q @ k.transpose(-1, -2) / math.sqrt(q.shape[-1])
    allowed = allowed[:, None]
    has_key = allowed.any(dim=-1, keepdim=True)
    scores = scores.masked_fill(~allowed, -torch.inf)
    scores = torch.where(has_key, scores, torch.zeros_like(scores))
    weights = torch.softmax(scores, dim=-1)
    weights = torch.where(allowed, weights, torch.zeros_like(weights))
    return weights @ v  # An invalid query has a zero attention result.


class StreamLayer(nn.Module):
    def __init__(self, width, heads=2, head_dim=4):
        super().__init__()
        self.heads, self.head_dim = heads, head_dim
        inner = heads * head_dim
        self.qkv = nn.Linear(width, 3 * inner, bias=False)
        self.out = nn.Linear(inner, width, bias=False)
        self.ff = nn.Sequential(nn.Linear(width, 2 * width), nn.SiLU(),
                                nn.Linear(2 * width, width))
        self.scale1 = nn.Parameter(torch.ones(width))
        self.scale2 = nn.Parameter(torch.ones(width))

    def project(self, x, positions):
        b, length, _ = x.shape
        q, k, v = self.qkv(rms(x) * self.scale1).chunk(3, dim=-1)
        q, k, v = [y.reshape(b, length, self.heads, self.head_dim).transpose(1, 2)
                   for y in (q, k, v)]
        return rope(q, positions), rope(k, positions), v

    def finish(self, x, attention):
        merged = attention.transpose(1, 2).flatten(-2)
        x = x + self.out(merged)
        return x + self.ff(rms(x) * self.scale2)


class PrefixEncoder(nn.Module):
    def __init__(self, depth=2, width=16):
        super().__init__()
        self.patch = nn.Conv2d(3, width, kernel_size=4, stride=4)
        self.camera = nn.Embedding(2, width)
        self.word = nn.Embedding(32, width)
        self.layers = nn.ModuleList(StreamLayer(width) for _ in range(depth))

    def embed(self, images, words, image_valid, word_valid):
        b, views, channels, height, width = images.shape
        assert (views, channels, height, width) == (2, 3, 8, 8)
        pixels = torch.where(image_valid[:, :, None, None, None], images, 0.0)
        patches = self.patch(pixels.reshape(b * views, channels, height, width))
        patches = patches.flatten(2).transpose(1, 2).reshape(b, views, 4, -1)
        cameras = self.camera(torch.arange(views, device=images.device))
        patches = (patches + cameras[None, :, None]).flatten(1, 2)
        text = self.word(words)
        valid = torch.cat((image_valid.repeat_interleave(4, dim=1), word_valid), dim=1)
        prefix = torch.cat((patches, text), dim=1)
        return torch.where(valid[..., None], prefix, 0.0), valid


class TeachingVLA(nn.Module):
    def __init__(self):
        super().__init__()
        self.prefix = PrefixEncoder()
        self.state = nn.Linear(4, 12)
        self.action = nn.Linear(3, 12)
        self.time_action = nn.Sequential(nn.Linear(24, 12), nn.SiLU(), nn.Linear(12, 12))
        self.expert = nn.ModuleList(StreamLayer(12) for _ in range(2))
        self.readout = nn.Linear(12, 3)

    def suffix(self, state, x, t, action_valid):
        # State has no t dependence; only the H action slots receive generation time.
        frequency = torch.arange(1, 7, device=x.device, dtype=x.dtype) * math.pi
        phase = t[:, None] * frequency
        time = torch.cat((phase.sin(), phase.cos()), dim=-1)
        action = self.action(torch.where(action_valid[..., None], x, 0.0))
        time = time[:, None].expand(-1, x.shape[1], -1)
        action = self.time_action(torch.cat((action, time), dim=-1))
        suffix = torch.cat((self.state(state)[:, None], action), dim=1)
        valid = torch.cat((torch.ones_like(action_valid[:, :1]), action_valid), dim=1)
        return torch.where(valid[..., None], suffix, 0.0), valid

    def forward(self, images, words, state, x, t, image_valid, word_valid,
                action_valid, cache=None):
        suffix, sv = self.suffix(state, x, t, action_valid)
        if cache is None:
            prefix, pv = self.prefix.embed(images, words, image_valid, word_valid)
        else:
            prefix, pv = None, cache['valid']
        p = pv.shape[1]
        valid = torch.cat((pv, sv), dim=1)
        positions = valid.long().cumsum(dim=1) - 1
        groups = torch.cat((torch.zeros(p, device=x.device, dtype=torch.long),
                            torch.ones(1, device=x.device, dtype=torch.long),
                            torch.full((x.shape[1],), 2, device=x.device)))
        allowed = visibility(valid, groups)
        for index, (prefix_layer, expert_layer) in enumerate(zip(self.prefix.layers, self.expert)):
            qs, ks, vs = expert_layer.project(suffix, positions[:, p:])
            if cache is None:
                qp, kp, vp = prefix_layer.project(prefix, positions[:, :p])
                q, k, v = [torch.cat(pair, dim=2)
                           for pair in ((qp, qs), (kp, ks), (vp, vs))]
                result = attend(q, k, v, allowed)
                prefix = prefix_layer.finish(prefix, result[:, :, :p])
                suffix = expert_layer.finish(suffix, result[:, :, p:])
            else:
                kp, vp = cache['layers'][index]
                result = attend(qs, torch.cat((kp, ks), dim=2),
                                torch.cat((vp, vs), dim=2), allowed[:, p:])
                suffix = expert_layer.finish(suffix, result)
        velocity = self.readout(rms(suffix[:, 1:]))
        return torch.where(action_valid[..., None], velocity, 0.0)

    def make_cache(self, images, words, image_valid, word_valid):
        # This function itself preserves autograd. The caller chooses no_grad/detach.
        prefix, valid = self.prefix.embed(images, words, image_valid, word_valid)
        positions = valid.long().cumsum(dim=1) - 1
        allowed = valid[:, :, None] & valid[:, None, :]
        layers = []
        for layer in self.prefix.layers:
            q, k, v = layer.project(prefix, positions)
            layers.append((k, v))  # Save each layer's rotated K and unrotated V.
            prefix = layer.finish(prefix, attend(q, k, v, allowed))
        return {'layers': layers, 'valid': valid}

    def fm_loss(self, batch, noise, t):
        images, words, state, actions, iv, wv, av = batch
        if not av.any():
            raise ValueError('The batch has no supervised action slots')
        if not torch.isfinite(actions[av]).all():
            raise ValueError('A valid action contains a non-finite value')
        # Invalid labels may be NaN: replace before interpolation, not after squaring.
        clean = torch.where(av[..., None], actions, 0.0)
        noise = torch.where(av[..., None], noise, 0.0)
        time = t[:, None, None]
        x = time * noise + (1 - time) * clean
        target = noise - clean
        prediction = self(images, words, state, x, t, iv, wv, av)
        return (prediction[av] - target[av]).square().mean()

    @torch.no_grad()
    def sample(self, batch, noise, steps=8, use_cache=True):
        if steps < 1:
            raise ValueError('steps must be positive')
        if self.training:
            raise ValueError('Call eval() before the inference comparison')
        images, words, state, _, iv, wv, av = batch
        cache = self.make_cache(images, words, iv, wv) if use_cache else None
        x = torch.where(av[..., None], noise.clone(), 0.0)
        dt = -1.0 / steps
        for step in range(steps):
            time = x.new_full((x.shape[0],), 1.0 + step * dt)
            x = x + dt * self(images, words, state, x, time, iv, wv, av, cache)
        return x


def grad_norm(parameters):
    terms = [p.grad.square().sum() for p in parameters if p.grad is not None]
    return float(torch.stack(terms).sum().sqrt()) if terms else 0.0


def experiment():
    torch.manual_seed(20261106)
    torch.set_num_threads(1)
    model = TeachingVLA().double()
    # A planar teaching task: move to the named colour and then close the gripper.
    # Vocabulary: 0=padding, 1=move, 2=red, 3=blue, 4=close.
    words = torch.tensor([[1, 2, 4], [1, 3, 0], [1, 3, 4], [1, 2, 0]])
    # Top-left (row, column) of each 2x2 square: [sample, red/blue, row/column].
    locations = torch.tensor([[[1, 1], [5, 5]], [[1, 5], [5, 1]],
                              [[5, 1], [1, 5]], [[5, 5], [1, 1]]])
    images = torch.zeros(4, 2, 3, 8, 8, dtype=torch.float64)
    for b in range(4):
        for colour, channel in enumerate((0, 2)):  # RGB red or blue
            row, column = locations[b, colour].tolist()
            images[b, :, channel, row:row+2, column:column+2] = 1.0
    # Both views render the same grid; these are not calibrated physical cameras.
    iv = torch.tensor([[1, 1], [1, 0], [1, 1], [1, 1]], dtype=torch.bool)
    wv = words != 0
    av = torch.tensor([[1, 1, 1], [1, 1, 1], [1, 1, 1], [1, 1, 0]], dtype=torch.bool)
    state = torch.tensor([[0.0, 0.0, 0.0, 0.0], [0.25, -0.25, 0.0, 0.0],
                          [-0.25, 0.25, 0.0, 0.0], [0.1, 0.2, 0.0, 0.0]],
                         dtype=torch.float64)  # [x, y, vx, vy], grid units
    selected = (words[:, 1] == 3).long()
    # Map square centres from pixel indices to the declared [-1,1] grid frame.
    centres = (locations.flip(-1).double() + 0.5) / 7.0 * 2.0 - 1.0
    target_xy = centres[torch.arange(4), selected]
    requested_steps = av.sum(-1)
    delta = (target_xy - state[:, :2]) / requested_steps[:, None]
    actions = torch.cat((delta[:, None].expand(-1, 3, -1),
                         -torch.ones(4, 3, 1, dtype=torch.float64)), dim=-1).clone()
    actions[torch.arange(4), requested_steps - 1, 2] = 1.0  # close on last step
    # Independent label checks: integrate displacements; switch the requested colour.
    reached = state[:, :2] + torch.where(av[..., None], actions[..., :2], 0.0).sum(1)
    torch.testing.assert_close(reached, target_xy)
    assert (target_xy - centres[torch.arange(4), 1 - selected]).abs().sum(-1).min() > 0
    actions[~av] = torch.nan
    batch = (images, words, state, actions, iv, wv, av)
    noise = torch.randn(4, 3, 3, dtype=torch.float64)
    time = torch.tensor([0.2, 0.4, 0.6, 0.8], dtype=torch.float64)
    prefix_params = list(model.prefix.parameters())
    expert_params = [p for name, p in model.named_parameters() if not name.startswith('prefix.')]
    optimizer = torch.optim.AdamW([{'params': prefix_params, 'lr': 2e-3},
                                  {'params': expert_params, 'lr': 4e-3}], weight_decay=0.0)
    prefix_before = model.prefix.patch.weight.detach().clone()
    readout_before = model.readout.weight.detach().clone()
    initial = float(model.fm_loss(batch, noise, time).detach())
    for step in range(40):
        optimizer.zero_grad(set_to_none=True)
        loss = model.fm_loss(batch, noise, time)
        loss.backward()
        if step == 0:
            gradients = {'vision': grad_norm(model.prefix.patch.parameters()),
                         'language': grad_norm(model.prefix.word.parameters()),
                         'prefix': grad_norm(prefix_params),
                         'expert': grad_norm(expert_params)}
            assert all(value > 0 and math.isfinite(value) for value in gradients.values())
        optimizer.step()
    final = float(model.fm_loss(batch, noise, time).detach())
    assert final < initial  # Only verifies this fixed four-sample optimization experiment.
    assert not torch.equal(prefix_before, model.prefix.patch.weight)
    assert not torch.equal(readout_before, model.readout.weight)
    model.eval()
    with torch.no_grad():
        cache = model.make_cache(images, words, iv, wv)
        full = model(images, words, state, noise, time, iv, wv, av)
        cached = model(images, words, state, noise, time, iv, wv, av, cache)
        torch.testing.assert_close(full, cached, rtol=1e-10, atol=1e-10)
        altered = images.clone()
        altered[0, 0] += 2.0
        stale = model(altered, words, state, noise, time, iv, wv, av, cache)
        fresh = model(altered, words, state, noise, time, iv, wv, av)
        assert (stale[0] - fresh[0]).abs().max() > 1e-6
        padded = images.clone()
        padded[~iv] = 999.0
        ignored = model(padded, words, state, noise, time, iv, wv, av)
        torch.testing.assert_close(ignored, full, rtol=1e-10, atol=1e-10)
    generated = model.sample(batch, noise, use_cache=True)
    generated_full = model.sample(batch, noise, use_cache=False)
    torch.testing.assert_close(generated, generated_full, rtol=1e-10, atol=1e-10)
    assert torch.isfinite(generated).all() and (generated[~av] == 0).all()
    # A graph-preserving cache is also gradient-equivalent in this deterministic model.
    model.zero_grad(set_to_none=True)
    model(images, words, state, noise, time, iv, wv, av).square().sum().backward()
    reference = model.prefix.patch.weight.grad.clone()
    model.zero_grad(set_to_none=True)
    cache = model.make_cache(images, words, iv, wv)
    model(images, words, state, noise, time, iv, wv, av, cache).square().sum().backward()
    torch.testing.assert_close(reference, model.prefix.patch.weight.grad, rtol=1e-9, atol=1e-9)
    frozen = copy.deepcopy(model).eval()
    frozen.zero_grad(set_to_none=True)
    frozen.prefix.requires_grad_(False)
    pixels = images.clone().requires_grad_()
    frozen(pixels, words, state, noise, time, iv, wv, av).square().sum().backward()
    assert all(p.grad is None for p in frozen.prefix.parameters())
    assert pixels.grad.abs().sum() > 0  # Frozen parameters do not sever input gradients.
    pixels2 = images.clone().requires_grad_()
    with torch.no_grad():
        detached_cache = frozen.make_cache(pixels2, words, iv, wv)
    frozen(pixels2, words, state, noise, time, iv, wv, av, detached_cache).sum().backward()
    assert pixels2.grad is None  # no_grad really removes this upstream route.
    empty = (*batch[:-1], torch.zeros_like(av))
    try:
        model.fm_loss(empty, noise, time)
    except ValueError:
        pass
    else:
        raise AssertionError('empty supervision must be rejected')
    report = {'seed': 20261106, 'torch': torch.__version__, 'dtype': 'float64',
              'shapes': {'images': list(images.shape), 'prefix': [4, 11, 16],
                         'suffix': [4, 4, 12], 'velocity': list(full.shape)},
              'loss_before': initial, 'loss_after_40_updates': final,
              'first_step_gradient_norms': gradients,
              'cache_velocity_max_error': float((full - cached).abs().max()),
              'cache_sample_max_error': float((generated - generated_full).abs().max()),
              'stale_cache_max_error': float((stale - fresh).abs().max()),
              'task': 'planar named-colour approach; dx, dy, gripper in grid units',
              'target_xy': target_xy.tolist(),
              'checks': ['label displacements reach the named colour',
                         'switching colour changes the target label',
                         'finite valid-mask FM loss', 'two parameter groups receive gradients',
                         'full/cache velocity and Euler equality', 'changed-image cache invalidation',
                         'missing-view isolation', 'graph-preserving cache gradient equality',
                         'frozen parameter versus input gradient', 'no_grad cuts input route',
                         'empty supervision rejected']}
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    experiment()
