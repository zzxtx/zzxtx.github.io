# zzxtx 的博客 · 使用说明

> 这份文档解释博客的结构，以及「写文章 → 发布 → 备份」的完整流程。
> 忘了怎么操作时，直接打开这个文件看。

## 一、先搞清两个分支的分工

| 位置 | 是什么 | 你能改吗 |
| --- | --- | --- |
| `main` 分支 | 网站成品（HTML） | 不能，由 `hexo deploy` 自动生成 |
| `source` 分支 | 源码备份（你的原稿） | 由 `git push` 自动更新 |
| `source/_posts/` | 你写的文章（Markdown） | 天天改的就是这里 |
| `source/_drafts/` | 草稿，不会被发布 | 随便放 |
| `_config.yml` | 博客总配置 | 偶尔改 |
| `public/` | 编译产物 | 别手改，会被覆盖 |

一句话：**你只写 `source/_posts/` 里的 Markdown，其他都是机器和你 git 的事。**

## 二、写一篇新文章

```powershell
cd D:\Blog\my-blog
npx hexo new "文章标题"
```

会在 `source\_posts\` 生成 `文章标题.md`。

**标题禁忌**：不要用英文半角冒号 `:`，以及 `? * " < > |`。因为文件名就是标题，Windows 不允许这些字符。想表达冒号请用中文冒号 `：`。

文章开头必须有这段（front-matter），Hexo 靠它识别标题、时间、分类：

```markdown
---
title: 文章标题
date: 2026-09-15 21:00:00
tags: [JavaScript, 学习笔记]
categories: 前端
---

正文从这里开始……
```

注意 `---` 必须**各占一行**，`date` 不能写成未来时间（否则首页不显示）。

## 三、本地预览（推荐，边写边看）

```powershell
npx hexo server
```

浏览器打开 http://localhost:4000 ，保存文章后刷新即可看到效果。按 `Ctrl + C` 停止。

这一步不联网、不碰 GitHub，随便折腾。

## 四、发布上线

```powershell
npx hexo clean
npx hexo generate
npx hexo deploy
```

三步的分工：

- `clean`：清掉缓存和旧的 `public/`，防止改了不生效
- `generate`：把 Markdown 编译成 HTML，塞进 `public/`
- `deploy`：把 `public/` 里的成品强推到 GitHub 的 `main` 分支

等 1 分钟左右，打开 https://zzxtx.github.io 就能看到（页面没变就按 `Ctrl + F5` 强刷）。

## 五、备份源码到 GitHub

```powershell
git add -A
git commit -m "新增：文章标题"
git push
```

第一次已经设置好跟踪 `origin/source`，以后直接 `git push` 即可。

**注意一定要先 `cd D:\Blog\my-blog`**，否则 git 会在别的目录里乱找仓库。

## 六、日常推荐动作（复制这四行就够）

```powershell
cd D:\Blog\my-blog
npx hexo new "文章标题"
# 用 VS Code 打开 source\_posts\文章标题.md 开始写
npx hexo clean; npx hexo generate; npx hexo deploy; git add -A; git commit -m "新增：文章标题"; git push
```

## 七、命令速查

| 目的 | 命令 |
| --- | --- |
| 新建文章 | `npx hexo new "标题"` |
| 本地预览 | `npx hexo server` |
| 编译网页 | `npx hexo generate` |
| 清缓存 | `npx hexo clean` |
| 发布上线 | `npx hexo deploy` |
| 备份源码 | `git add -A; git commit -m "说明"; git push` |
| 看当前状态 | `git status` |
| 看提交历史 | `git log --oneline -5` |
| 确认自己在哪个仓库 | `git rev-parse --show-toplevel` |

## 八、换电脑了怎么恢复

```powershell
git clone -b source https://github.com/zzxtx/zzxtx.github.io.git my-blog
cd my-blog
npm install
npx hexo server
```

## 九、三条铁律（血泪教训）

1. **不要删** `D:\Blog\my-blog\.deploy_git\.git`。它一消失，`hexo deploy` 会把整个项目源码强推到 `main` 分支，网站直接 404。
2. **不要在** `my-blog` **根目录执行** `git init`。
3. **敲 git 命令前先 `cd D:\Blog\my-blog`**，确保在正确的仓库里操作。

## 十、出问题怎么办

- **网页没更新**：`npx hexo clean` → `npx hexo generate` → 浏览器 `Ctrl + F5`
- **`hexo deploy` 报错**：先运行 `Test-Path D:\Blog\my-blog\.deploy_git\.git`，返回 `False` 就删掉整个 `.deploy_git` 文件夹再 deploy
- **`git push` 连不上**：国内访问 GitHub 时常抽风，等几分钟重试；有代理软件时用 `git config --global http.proxy http://127.0.0.1:7890`（端口按实际改），推完 `git config --global --unset http.proxy`
- **文章不显示**：检查 front-matter 的两个 `---` 是否各占一行、`date` 是否写成未来时间
- **网站打不开（404）**：仓库 Settings → Pages，确认 Source 是 `Deploy from a branch` + 分支 `main` + 目录 `/ (root)`
- **想换主题**：把主题 `git clone` 到 `themes/` 文件夹，改 `_config.yml` 里的 `theme:`，再走一遍 clean/generate/deploy

---

最后更新：2026-09-15
