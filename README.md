# 每日复盘静态页面

这是一个不依赖服务器的静态网页，用来把每日复盘内容直接提交到 GitHub 仓库。

## 功能

- 输入今天的复盘内容
- 填写 GitHub 仓库地址
- 填写有仓库写权限的 GitHub Personal Access Token
- 点击按钮后，把内容提交到仓库中的 `reviews/YYYY-MM-DD.md`
- 同一天多次提交时，会自动继续追加

## 使用方式

1. 打开 `index.html`
2. 填写或确认仓库地址
3. 输入 GitHub Token
4. 输入今天的内容
5. 点击“提交到 GitHub”

## Token 权限

GitHub 已经不支持账号密码直接提交。请使用 Token，并确保它具备仓库内容写入权限：

- Classic Token：勾选 `repo`
- Fine-grained Token：至少给目标仓库的 `Contents` 写权限

## 开发

如果你修改了 `src/main.ts`，可以在当前目录重新编译：

```bash
tsc -p .
```
