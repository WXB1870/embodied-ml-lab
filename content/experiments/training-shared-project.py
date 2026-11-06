"""执行 training-loop 课程中的唯一共同项目源码。

完整可独立下载的源码由 content/architecture.json 的
training-loop.extraImplementations[shared-training-project].source 提供。
"""
import json
from pathlib import Path

source_file = Path(__file__).resolve().parents[1] / "architecture.json"
lessons = json.loads(source_file.read_text())
lesson = next(item for item in lessons if item["id"] == "training-loop")
example = next(item for item in lesson["extraImplementations"]
               if item["id"] == "shared-training-project")
exec(compile(example["source"], "shared-training-project", "exec"), {"__name__": "__main__"})
