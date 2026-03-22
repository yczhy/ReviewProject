import { FORM_DEFAULTS } from "../config";

export function createAppMarkup() {
  return `
    <main class="shell">
      <section class="hero">
        <div>
          <p class="eyebrow">ReviewSelf + TypeScript</p>
          <h1>把自定义内容提交到默认 GitHub 仓库</h1>
          <p class="intro">
            这个页面已经预设为你的仓库 <strong>${FORM_DEFAULTS.repoUrl}</strong>，
            也支持改成别的 GitHub 仓库地址。点击按钮后会调用 GitHub API，
            在指定分支里创建或更新文件，并生成一次 commit。
          </p>
        </div>
        <div class="notice">
          <h2>地址支持</h2>
          <p>支持 <code>https://github.com/owner/repo</code>、<code>git@github.com:owner/repo.git</code> 和 <code>owner/repo</code>。</p>
          <p>GitHub 账户密码不可用，请使用 Personal Access Token。</p>
          <p>Token 只在本次页面会话中使用，不会写入本地存储。</p>
        </div>
      </section>

      <section class="panel">
        <form id="upload-form" class="form">
          <div class="grid">
            <label class="field field-wide">
              <span>GitHub 仓库地址或简称</span>
              <input
                id="repoUrl"
                name="repoUrl"
                type="text"
                value="${FORM_DEFAULTS.repoUrl}"
                placeholder="git@github.com:yczhy/ReviewSelf.git"
                spellcheck="false"
                required
              />
              <small class="field-help">默认已经指向你的仓库 <code>yczhy/ReviewSelf</code>。</small>
            </label>

            <label class="field">
              <span>GitHub Token</span>
              <input
                id="token"
                name="token"
                type="password"
                placeholder="ghp_xxx / github_pat_xxx"
                autocomplete="off"
                spellcheck="false"
                required
              />
            </label>

            <label class="field">
              <span>分支名</span>
              <input
                id="branch"
                name="branch"
                type="text"
                value="${FORM_DEFAULTS.branch}"
                placeholder="main"
                spellcheck="false"
                required
              />
            </label>

            <label class="field">
              <span>目标文件路径</span>
              <input
                id="filePath"
                name="filePath"
                type="text"
                value="${FORM_DEFAULTS.filePath}"
                placeholder="reviews/self-review.md"
                spellcheck="false"
                required
              />
            </label>

            <label class="field">
              <span>提交说明</span>
              <input
                id="commitMessage"
                name="commitMessage"
                type="text"
                value="${FORM_DEFAULTS.commitMessage}"
                placeholder="feat: upload review content from web app"
                required
              />
            </label>

            <label class="field">
              <span>提交人姓名（可选）</span>
              <input
                id="authorName"
                name="authorName"
                type="text"
                placeholder="yczhy"
              />
            </label>

            <label class="field">
              <span>提交人邮箱（可选）</span>
              <input
                id="authorEmail"
                name="authorEmail"
                type="email"
                placeholder="you@example.com"
              />
            </label>

            <label class="field field-wide">
              <span>自定义内容</span>
              <textarea
                id="content"
                name="content"
                rows="12"
                placeholder="# 今日复盘&#10;&#10;- 完成了什么&#10;- 遇到了什么问题&#10;- 下一步要做什么"
                required
              ></textarea>
            </label>
          </div>

          <div class="actions">
            <button id="submitButton" type="submit">上传到 GitHub</button>
            <p id="status" class="status" role="status" aria-live="polite"></p>
          </div>
        </form>
      </section>

      <section class="panel">
        <div class="result-header">
          <h2>接口返回</h2>
          <p>成功后会显示 commit 地址和文件链接。</p>
        </div>
        <pre id="response" class="response">等待提交…</pre>
      </section>
    </main>
  `;
}
