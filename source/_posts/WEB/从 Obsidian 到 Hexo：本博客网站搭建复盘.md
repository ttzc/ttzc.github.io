---
title: 从 Obsidian 到 Hexo：本博客网站搭建复盘
category: 建站笔记
tags:
  - Hexo
  - Obsidian
  - GitHub_Pages
  - stellar
  - KaTeX
author: zaochen
abbrlink: d566f658
date: 2026-07-24
updated: 2026-07-27
description: 记录从零搭建 Hexo + Stellar 博客的完整过程，涵盖三次架构迭代、Obsidian 双链渲染、KaTeX 公式、favicon 配置、busuanzi 访问统计等踩坑经验与最终落地方案。
---
本文记录了我把 Obsidian 笔记发布为 Hexo 静态博客的完整过程——从 7 月 23 日晚到 24 日上午，大约 12 小时，经历了三次架构迭代，踩了一堆坑，最终落地为一个简洁的方案。

如果你也想"在 Obsidian 内闭环写博客"，这篇文章应该能帮你少走一些弯路。

## 起点与目标

我的需求很明确：

- **Obsidian 里写**，笔记带 `[[双链]]` 和 $\LaTeX$ 公式
- **Hexo 渲染**，双链变成站内链接，公式正常显示
- **GitHub Pages 部署**，一个 `git push` 上线
- **短 URL**，不要一长串日期路径

已有的 Hexo 项目在 `D:/web_study/hexo_blog/zaochen_blog`，Obsidian 笔记在 `D:\programming_contest\cp_blog`，22 篇算法竞赛笔记，希望发布到 `_posts/算法竞赛/` 子文件夹。

## 阶段一：Hexo Integration + pathMapping 注入

### 思路

用 Obsidian 的 [Hexo Integration](https://github.com/nanjo712/obsidian-hexo-integration) 插件做发布工具。但它的发布路径是**硬编码** `source/_posts`，没有子目录设置。这一阶段的主要思路来源于[这篇文章](https://lankeren035.github.io/2026/04/04/experience/obsidian/obsidian_hexo/)。

好在 `data.json` 里有个 `pathMapping` 字段，可以把"仓库内相对路径 → _posts 下的目标路径"做映射。于是我写了个 `sync_pathmapping.py` 脚本，幂等地为 22 篇笔记注入 pathMapping，路由到 `算法竞赛/<文件名>.md`。

### 踩坑

**坑 1：hexo 命令不在 PATH**

Hexo Integration 插件用 `child_process.spawn("hexo", ...)` 调用 hexo，但 `yarn global add hexo-cli` 后全局 bin 目录 `C:\Users\ftc20\AppData\Local\Yarn\bin` 不在 PATH 里。追加到用户级 PATH 后解决，但需要**重启 Obsidian** 让 Electron 应用重新继承环境变量。

**坑 2：`[[双链]]` 空格截断**

`hexo g` 直接报错：

```
Error: Post not found: post_link 数据结构-ST.
```

这是个双重 bug：

1. Hexo Integration 把 `[[数据结构-ST 表]]` 转成 `{% post_link 数据结构-ST 表 "数据结构-ST 表" %}`——slug 含空格，Nunjucks 按空格拆参数，slug 被截断成 `数据结构-ST`
2. 即使加引号，slug 仍不匹配——Hexo 实际 slug 是 `算法竞赛/数据结构-ST 表`（含子目录前缀），而插件只用了文件名

我改了 `node_modules/hexo-backlink/index.js`，给 slug 加引号 + 按文件名重写路径，勉强跑通了。

### 为什么放弃

Hexo Integration 的 Convert/Publish 流程 + pathMapping 脚本 + hexo-backlink patch，三层 hack 叠在一起，每次新增笔记都要重跑脚本，维护成本太高。

## 阶段二：尝试 hexo-link-obsidian

### 思路

推倒重来。vault 直接设在 `source/_posts/`，写完即发布，不再需要 Convert/Publish 步骤。换用 [hexo-link-obsidian](https://github.com/moelody/hexo-link-obsidian) 插件替代 hexo-backlink——它原生支持文件名空格、`![[图片]]` 嵌入、块引用 `[[笔记#标题]]`，听起来很完美。

### 踩坑

**致命约束**：这个插件依赖 Obsidian 运行时。它通过 `link-info-server` 插件（端口 3333）向 Obsidian 请求链接解析结果。也就是说：

- `hexo g` 时 **Obsidian 必须开着**
- `link-info-server` 插件必须正常运行
- `link-to-server` 插件加载失败（反复尝试未解决）

这让构建链路绑定了 Obsidian 进程，无法独立运行。一个静态站点生成器不应该依赖某个 GUI 应用，所以放弃了。

## 阶段三：最终架构

### 关键突破

找到了 [hexo-filter-titlebased-link](https://github.com/airemu/hexo-filter-titlebased-link)——纯静态按**文件名**匹配 `[[双链]]`，**不需要 Obsidian 运行时**。这就是我一直想要的。

### 技术栈

| 层级 | 组件 | 作用 |
| ------ | ------ | ------ |
| 写作 | Obsidian（vault = `source/_posts/`） | 写完即发布 |
| 渲染 | `hexo-renderer-markdown-it-plus` | 替代默认 marked，支持 callout / 图片尺寸 / 任务列表 |
| 双链 | `hexo-filter-titlebased-link` | `[[文件名]]` → 文章链接 |
| URL | `hexo-abbrlink` | CRC32 短哈希 permalink（如 `/d566f658/`） |
| 公式 | KaTeX | CSS 经 stellar 主题 `plugins.katex.inject` 注入 |
| 主题 | stellar v1.33.1 | |
| 部署 | `hexo-deployer-git` | → GitHub Pages |
| 统计 | 不蒜子 v3.6.9 | 注入 footer |

### 核心配置

`_config.yml` 关键部分：

```yaml
permalink: :abbrlink/
abbrlink:
  alg: crc32
  rep: hex

post_asset_folder: true
exclude:
  - "**/.obsidian/**"

theme: stellar

# 双链插件必须显式开启
titlebased_link:
  enable: true

# markdown-it-plus + 4 个 Obsidian 语法插件
markdown_it_plus:
  plugins:
    - plugin:
        name: markdown-it-task-lists
        enable: true
    - plugin:
        name: markdown-it-obsidian-callouts
        enable: true
    - plugin:
        name: markdown-it-obsidian-imgsize
        enable: true
    - plugin:
        name: markdown-it-obsidian-images
        enable: true

deploy:
  type: git
  repo: git@github.com:ttzc/ttzc.github.io.git
  branch: gh-pages
  message: "Site updated at {{ now('yyyy-MM-dd HH:mm:ss') }}"
```

`_config.stellar.yml` 的 KaTeX 配置：

```yaml
plugins:
  katex:
    enable: true
    inject: |
      <link rel="stylesheet" href="https://gcore.jsdelivr.net/npm/katex@0.16/dist/katex.min.css">
```

### 收尾阶段踩的坑

**坑 3：双链不渲染**

`hexo-filter-titlebased-link` 默认 `enable: false`，必须在 `_config.yml` 里显式写 `titlebased_link: enable: true`。看了源码才发现这个默认值。

**坑 4：KaTeX 公式显示两遍**

每一篇算法笔记，公式既显示了渲染结果又显示了原始 $\LaTeX$ 源码。两个原因叠加：

1. stellar 主题的 `katex` 配置要放在 `plugins:` 父级下，不能放顶层
2. `inject` 里的 `integrity` 哈希与 CDN 文件不匹配，浏览器**静默拒绝**加载 CSS，导致 `.katex-mathml` 没被隐藏

去掉 `integrity` 和 `crossorigin` 属性后解决。SRI 失效是 CSS 静默不加载的常见原因，调试时优先怀疑。

**坑 5：deploy 提交信息乱码**

`hexo d` 的提交信息里日期变成了字面量 `YYYY-MM-DD`。原因是 Hexo 用 luxon 格式化日期，luxon 不识别大写 `YYYY-MM-DD`，改为小写 `yyyy-MM-dd HH:mm:ss` 后正常。

**坑 6：不蒜子标签过时**

旧教程里的不蒜子标签是 `busuanzi_value_site_pv`，但新版（v3.6.9）已经改成了 `busuanzi_site_pv`，CDN 也从 `busuanzi.ibruce.info` 换成了 `cdn.busuanzi.cc`。照着旧教程抄就不会显示数字。

**坑 7：LeanCloud 停服**

stellar 主题默认的访问量统计用 LeanCloud，但 LeanCloud 国际版 2027-01-12 要停服了，所以改用不蒜子——纯前端 JS，不需要后端。

## 日常发布流程

```bat
cd /d D:\web_study\hexo_blog\zaochen_blog
hexo clean && hexo g && hexo d    :: 部署站点
git add -A && git commit && git push  :: 提交源码
```

站点地址：<https://ttzc.github.io>

## 复盘：哪些弯路值得走

回头看，阶段一和阶段二都走了弯路，但我不觉得是浪费时间：

- **阶段一**让我理解了 Hexo 的 `post_link` 机制和 Nunjucks 模板引擎的参数解析逻辑
- **阶段二**让我明确了"构建链路不应该依赖 GUI 应用"这个原则
- **阶段三**的最终方案简洁到只有一层配置，正是因为前两个阶段排除了错误选项

> [!tip] 经验
> 遇到插件不工作时，先看源码再看文档。`hexo-filter-titlebased-link` 的 `enable: false` 默认值、hexo-backlink 的空格截断 bug，都是看源码才发现的。

## 待办

- [x] Callout CSS（`> [!note]` 样式）
- [ ] 考虑加 Giscus 评论系统
