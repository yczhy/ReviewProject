# ReviewSelf

这是一个基于 `Vite + TypeScript` 的静态网页项目，用来把自定义内容直接提交到 GitHub 仓库文件中。

当前页面已经默认预设到你的仓库：

- `git@github.com:yczhy/ReviewSelf.git`
- 对应网页地址：`https://github.com/yczhy/ReviewSelf`

## 运行方式

```bash
npm install
npm run dev
```

构建生产版本：

```bash
npm run build
```

## 主要功能

- 默认指向 `yczhy/ReviewSelf`
- 支持输入 GitHub 仓库链接、SSH 地址或 `owner/repo`
- 输入 GitHub Personal Access Token
- 指定分支名
- 指定目标文件路径
- 填写提交说明
- 输入自定义内容并上传
- 支持可选的提交人姓名与邮箱
- 将非敏感默认项保存在浏览器本地，方便下次继续使用

## 当前默认值

- 默认分支：`main`
- 默认文件路径：`reviews/self-review.md`
- 默认提交说明：`feat: upload review content from web app`

## Token 权限建议

如果你使用的是 Fine-grained Personal Access Token，请至少确保：

- 对目标仓库有写权限
- 具备 `Contents: Read and write` 权限

如果仓库属于组织，还需要确认组织策略允许该 Token 访问。

## 注意事项

- GitHub 账户密码不能直接用于这里的提交流程，请使用 Personal Access Token。
- 这个项目不会自动保存 Token；为了方便，下次只会记住仓库地址、分支、文件路径等非敏感字段。
- 这是纯前端方案，调用的是 GitHub 官方 API，不依赖后端服务。

## 本地 Git 仓库

如果你想把当前项目目录本身也连接到这个 GitHub 仓库，可以执行：

```bash
git init
git add .
git commit -m "feat: initialize ReviewSelf uploader"
git branch -M main
git remote add origin git@github.com:yczhy/ReviewSelf.git
git push -u origin main
```
