# 旧课程内容归档

本次课程重构采用“新主干 + 旧内容保留”的策略。原始课程 JSON 不删除、不覆盖，继续保存在原有源文件中，作为历史版本、参考材料和后续补充来源。

## 原始课程源文件

- `content/foundations.json`
- `content/architecture.json`
- `content/vla.json`
- `content/foundations_p0.json`
- `content/architecture_p0.json`
- `content/vla_p0.json`
- `content/generative.json`
- `content/policy-models.json`
- `content/vla-architecture.json`
- `content/topics/`

## 迁移原则

1. 新的四大模块只收录 20 节核心课程。
2. 经典基础和训练工程内容迁入 `content/appendix.json`。
3. 旧课程源文件保留原样，避免丢失推导、代码、练习和参考答案。
4. 旧课程 URL 通过前端兼容映射跳转到新课程或对应附录主题。
5. 旧专题练习数据继续保留，待逐步整合到对应新课程。

## 课程边界

本网站不纳入 3D 空间几何、相机/手眼标定、点云、SE(3) 运动学、物理仿真、Sim2Real、域随机化与 WBC。
