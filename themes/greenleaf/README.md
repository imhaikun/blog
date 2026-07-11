# GreenLeaf - Hexo 清新博客主题

一个清新简洁的 Hexo 博客主题，薄荷绿主色调，经典双栏布局。

## 安装方法

### 方法一：克隆到 themes 目录

```bash
cd your-hexo-blog
git clone <your-repo-url> themes/greenleaf
```

或直接复制 `hexo-theme-greenleaf` 文件夹到 `themes/` 目录下并重命名为 `greenleaf`。

### 方法二：npm 安装（如已发布）

```bash
cd your-hexo-blog
npm install hexo-theme-greenleaf
```

## 配置

### 1. 修改站点 `_config.yml`

在 Hexo 博客根目录的 `_config.yml` 中设置主题：

```yaml
theme: greenleaf
language: zh-CN
```

### 2. 主题配置

复制主题目录下的 `_config.yml` 到博客根目录，重命名为 `_config.greenleaf.yml`，或直接在主题目录中修改 `_config.yml`。

可配置项：

```yaml
# 站点信息
title: GreenLeaf
subtitle: 用心记录生活
description: 一个热爱技术与写作的博客

# 导航菜单
menu:
  首页: /
  分类: /categories/
  归档: /archives/
  标签: /tags/
  关于: /about/

# 侧边栏作者信息
sidebar:
  author:
    name: GreenLeaf
    avatar: /images/avatar.png
    bio: 一个热爱技术与写作的博主
  tags: true
  archive: true

# 社交链接
social:
  github: https://github.com
  twitter: https://twitter.com
  rss: /atom.xml
```

### 3. 创建关于页面

```bash
hexo new page about
```

编辑 `source/about/index.md`，添加 front matter：

```yaml
---
title: 关于
layout: page
---
```

## 主题结构

```
hexo-theme-greenleaf/
├── _config.yml          # 主题配置
├── index.js             # 主题入口
├── package.json
├── languages/
│   └── zh-CN.yml        # 中文语言包
├── layout/
│   ├── layout.ejs       # 基础布局
│   ├── index.ejs        # 首页
│   ├── post.ejs         # 文章页
│   ├── archive.ejs      # 归档页
│   ├── category.ejs     # 分类页
│   ├── tag.ejs          # 标签页
│   └── page.ejs         # 通用页面
│       └── _partial/
│           ├── head.ejs     # HTML 头部
│           ├── header.ejs   # 导航栏
│           ├── footer.ejs   # 页脚
│           ├── sidebar.ejs  # 侧边栏
│           └── article-card.ejs  # 文章卡片
└── source/
    └── css/
        └── style.css     # 主题样式
```

## 特性

- 清新薄荷绿配色，纯白背景
- 经典双栏布局，右侧栏含作者卡片、标签云、归档
- 文章页沉浸式阅读，衬线标题
- 响应式设计，移动端自动单栏
- 纯 CSS 实现，无需额外依赖

## License

MIT
