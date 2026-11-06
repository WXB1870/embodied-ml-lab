"""Render the checked numerical evidence, without rerunning or inventing training data."""
import json
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

root = Path(__file__).resolve().parent
evidence_path = root / "fm-mixture-evidence.json"
if not evidence_path.exists():
    evidence_path = root.parent / "assets/experiments/fm-mixture-evidence.json"
evidence = json.loads(evidence_path.read_text())
output_dir = evidence_path.parent
plt.rcParams.update({
    "font.family": "DejaVu Sans", "font.size": 10, "axes.titlesize": 11,
    "axes.labelsize": 10, "axes.edgecolor": "#D4DBE6",
    "xtick.color": "#6B7687", "ytick.color": "#6B7687",
    "text.color": "#26364A", "axes.labelcolor": "#5A6A80",
    "svg.fonttype": "none", "savefig.facecolor": "white",
})
blue, teal, gray = "#426EA7", "#3D8C7C", "#A3ADBB"
condition = evidence["conditions"][0]


def spatial(ax, title):
    ax.set_title(title, loc="left", pad=12)
    ax.set(xlim=(-3, 3), ylim=(-3, 3), xlabel=r"$x_1$", ylabel=r"$x_2$")
    ax.set_aspect("equal", adjustable="box")
    ax.set_xticks([-2, 0, 2])
    ax.set_yticks([-2, 0, 2])
    ax.grid(alpha=0.12, color="#5B6B82")
    ax.set_axisbelow(True)
    ax.spines[["top", "right"]].set_visible(False)


fig, axes = plt.subplots(1, 3, figsize=(10.8, 3.65), constrained_layout=True)
for ax, key, label, color in zip(
        axes, ["noise", "data", "generated"],
        ["Initial noise", "Target data", "Generated: Heun, 64 steps"],
        [gray, blue, teal]):
    points = np.asarray(condition[key])
    spatial(ax, label)
    ax.scatter(points[:, 0], points[:, 1], s=12, c=color, alpha=0.7, linewidths=0)
fig.savefig(output_dir / "fm-mixture-distributions.svg")
fig.savefig(output_dir / "fm-mixture-distributions.png", dpi=160)
plt.close(fig)

fig, axes = plt.subplots(2, 2, figsize=(10.2, 8.2), constrained_layout=True)
pair = evidence["training_pairs"]
labels = np.asarray(pair["condition"])
noise = np.asarray(pair["noise"])[labels == 0]
data = np.asarray(pair["data"])[labels == 0]
spatial(axes[0, 0], "Training pairs: straight conditional paths")
for a, b in zip(noise, data):
    axes[0, 0].plot([a[0], b[0]], [a[1], b[1]], color=gray, alpha=0.6, lw=1.1)
axes[0, 0].scatter(noise[:, 0], noise[:, 1], s=25, facecolor="white", edgecolor=gray, zorder=4)
axes[0, 0].scatter(data[:, 0], data[:, 1], s=25, c=blue, linewidths=0, zorder=4)

field = next(f for f in evidence["fields"] if f["condition"] == 0 and f["t"] == 0.5)
points, velocity = np.asarray(field["points"]), np.asarray(field["learned"])
spatial(axes[0, 1], "Learned velocity: snapshot at t = 0.5")
axes[0, 1].quiver(points[:, 0], points[:, 1], velocity[:, 0], velocity[:, 1],
                  color=blue, alpha=0.8, angles="xy", scale_units="xy", scale=6,
                  width=0.0035, headwidth=3.2)

trajectory = evidence["trajectories"]
mask = np.asarray(trajectory["condition"]) == 0
states = np.asarray([s["points"] for s in trajectory["states"]])[:, mask, :]
spatial(axes[1, 0], "Learned ODE: time-varying trajectories")
for i in range(states.shape[1]):
    axes[1, 0].plot(states[:, i, 0], states[:, i, 1], c=blue, alpha=0.55, lw=1.2)
axes[1, 0].scatter(states[0, :, 0], states[0, :, 1], s=20, facecolor="white", edgecolor=gray, zorder=4)
axes[1, 0].scatter(states[-1, :, 0], states[-1, :, 1], s=24, c=teal, linewidths=0, zorder=4)

ax = axes[1, 1]
ax.set_title("Numerical error and learned-field error", loc="left", pad=12)
for method, color, marker in [("euler", blue, "o"), ("heun", teal, "s")]:
    rows = [r for r in evidence["metrics"] if r["method"] == method]
    nfe = [r["nfe"] for r in rows]
    ax.loglog(nfe, [r["solver_rms"] for r in rows], color=color, marker=marker,
              ms=4, lw=1.5, label=f"{method.title()} / solver")
    ax.loglog(nfe, [r["oracle_rms"] for r in rows], color=color, marker=marker,
              ms=4, lw=1.2, linestyle="--", label=f"{method.title()} / oracle")
ax.set(xlabel="Network function evaluations (NFE)", ylabel="Per-coordinate RMS")
ax.set_xticks([4, 8, 16, 32, 64, 128], labels=["4", "8", "16", "32", "64", "128"])
ax.grid(which="major", alpha=0.15)
ax.spines[["top", "right"]].set_visible(False)
ax.legend(frameon=False, fontsize=8, loc="lower left", ncol=2)
fig.savefig(output_dir / "fm-mixture-dynamics.svg")
fig.savefig(output_dir / "fm-mixture-dynamics.png", dpi=160)
plt.close(fig)
print("Rendered 2 SVG figures from fm-mixture-evidence.json")
