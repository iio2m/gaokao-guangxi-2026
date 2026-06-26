# 🎯 广西2026高考志愿填报助手

> 基于 AI 多角色对话的广西物理类高考志愿填报辅助工具 | 纯前端 · 零后端 · GitHub Pages 部署

## ✨ 功能

- 🎓 **4角色AI对话**：张雪峰风格咨询师、政策解读官、工科规划师、数据测算师
- 📊 **冲稳保智能推荐**：基于位次量化算法，科学分档推荐
- 🗺️ **广西专属优化**：区内院校权重加成、地方专项识别、本地就业分析
- 📈 **数据可视化**：位次波动图表、录取风险评估
- 📥 **一键导出**：Markdown / Excel 文本格式志愿报告
- 📱 **移动端适配**：375px ~ 1280px 全响应式
- 🌐 **实时联网**：支持 DeepSeek API 实时 AI 对话
- 📦 **离线可用**：基础数据查询无需网络

## 🚀 快速开始

### 在线使用
访问：`https://iio2m.github.io/gaokao-guangxi-2026/`

### 本地使用
1. 克隆仓库
2. 用浏览器打开 `index.html`
3. 填写考生信息
4. 配置 DeepSeek API Key（设置 → API Key）
5. 开始 AI 对话咨询

## 🎯 适用人群

- 广西2026年物理类高考考生
- 意向公办本科工科专业
- 优先电气/自动化/电子信息/机械等方向
- 普通工薪家庭，追求性价比

## ⚙️ 技术栈

| 组件 | 选型 |
|------|------|
| 前端 | 原生 JavaScript ES6+ |
| 样式 | 纯 CSS（无框架） |
| 图表 | Chart.js 4.x CDN |
| AI API | DeepSeek chat/completions |
| 图标 | Font Awesome 6 CDN |
| 存储 | localStorage |
| 部署 | GitHub Pages |

## 📁 项目结构

```
├── index.html              # 首页（考生信息录入）
├── pages/
│   ├── chat.html           # 多角色AI对话
│   ├── volunteer.html      # 冲稳保志愿推荐
│   └── data-manage.html    # 数据管理
├── src/
│   ├── data-engine/        # 位次换算、筛选引擎、缓存
│   ├── agent/              # DeepSeek API、角色管理、对话存储
│   ├── guangxi/            # 冲稳保算法、权重修正、风险评估
│   ├── api/                # 联网数据抓取
│   └── view/               # 图表、表格、导出
├── data/                   # 院校数据、历年投档数据
├── skill/                  # 4角色系统Prompt定义
├── css/style.css           # 全局样式
└── .github/workflows/      # 自动同步数据
```

## 📊 数据来源

- [广西招生考试院](https://zyfz.gxeea.cn/)
- [阳光高考](https://gaokao.chsi.com.cn/)
- [夸克高考](https://vt.quark.cn/)

> ⚠️ 数据标注"仅供参考"，实际填报请以官方公布为准

## 🏗️ 开源声明

本工具基于以下开源项目二次开发：
- 多角色对话引擎 + 可视化：[TsangHaotian/GaokaoHelper](https://github.com/TsangHaotian/GaokaoHelper)
- 张雪峰认知操作系统：[alchaincyf/zhangxuefeng-skill](https://github.com/alchaincyf/zhangxuefeng-skill)

## ⚠️ 免责声明

本工具为 AI 辅助参考工具，所有分析和建议仅供参考。填报志愿请以广西招生考试院官方公布信息为准。因参考本工具内容而产生的任何后果，作者概不负责。

## 📄 License

MIT
