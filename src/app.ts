import { createAppMarkup } from "./ui/template";
import { uploadFileToGitHub } from "./lib/github";
import { parseRepoInput } from "./lib/repo";
import { persistDefaults, readPersistedDefaults } from "./lib/storage";
import type { FormElements, FormPayload, StatusTone } from "./types";

export function mountApp() {
  const app = document.querySelector<HTMLDivElement>("#app");

  if (!app) {
    throw new Error("App root was not found.");
  }

  app.innerHTML = createAppMarkup();

  const form = document.querySelector<HTMLFormElement>("#upload-form");
  if (!form) {
    throw new Error("Upload form was not found.");
  }

  const elements = queryElements();
  hydrateDefaults(elements);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = collectFormData(elements);
    const repoInfo = parseRepoInput(payload.repoUrl);

    if (!repoInfo) {
      setStatus(
        elements,
        "请输入有效的 GitHub 仓库地址，支持 https、SSH 或 owner/repo。",
        "error"
      );
      return;
    }

    if (!payload.content.trim()) {
      setStatus(elements, "自定义内容不能为空。", "error");
      return;
    }

    if (payload.authorName && !payload.authorEmail) {
      setStatus(elements, "填写了提交人姓名时，也请补充提交人邮箱。", "error");
      return;
    }

    if (!payload.authorName && payload.authorEmail) {
      setStatus(elements, "填写了提交人邮箱时，也请补充提交人姓名。", "error");
      return;
    }

    toggleSubmitting(elements, true);
    setStatus(elements, "正在连接 GitHub 并创建提交，请稍候…", "info");
    renderResponse(elements.response, {
      step: "uploading",
      repo: `${repoInfo.owner}/${repoInfo.repo}`,
      branch: payload.branch,
      filePath: payload.filePath
    });

    try {
      const result = await uploadFileToGitHub(repoInfo, payload);

      setStatus(elements, "上传成功，内容已经提交到 GitHub。", "success");
      renderResponse(elements.response, result);
      persistDefaults(payload);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "提交失败，请检查输入内容后重试。";
      setStatus(elements, message, "error");
      renderResponse(elements.response, { error: message });
    } finally {
      toggleSubmitting(elements, false);
    }
  });
}

function queryElements(): FormElements {
  return {
    repoUrl: document.querySelector<HTMLInputElement>("#repoUrl")!,
    token: document.querySelector<HTMLInputElement>("#token")!,
    branch: document.querySelector<HTMLInputElement>("#branch")!,
    filePath: document.querySelector<HTMLInputElement>("#filePath")!,
    commitMessage: document.querySelector<HTMLInputElement>("#commitMessage")!,
    authorName: document.querySelector<HTMLInputElement>("#authorName")!,
    authorEmail: document.querySelector<HTMLInputElement>("#authorEmail")!,
    content: document.querySelector<HTMLTextAreaElement>("#content")!,
    submitButton: document.querySelector<HTMLButtonElement>("#submitButton")!,
    status: document.querySelector<HTMLParagraphElement>("#status")!,
    response: document.querySelector<HTMLPreElement>("#response")!
  };
}

function collectFormData(fields: FormElements): FormPayload {
  return {
    repoUrl: fields.repoUrl.value.trim(),
    token: fields.token.value.trim(),
    branch: fields.branch.value.trim(),
    filePath: normalizeFilePath(fields.filePath.value),
    commitMessage: fields.commitMessage.value.trim(),
    authorName: fields.authorName.value.trim(),
    authorEmail: fields.authorEmail.value.trim(),
    content: fields.content.value
  };
}

function normalizeFilePath(input: string): string {
  return input.trim().replace(/^\/+/, "");
}

function setStatus(
  fields: FormElements,
  message: string,
  tone: StatusTone
) {
  fields.status.textContent = message;
  fields.status.dataset.tone = tone;
}

function toggleSubmitting(fields: FormElements, submitting: boolean) {
  fields.submitButton.disabled = submitting;
  fields.submitButton.textContent = submitting ? "上传中…" : "上传到 GitHub";
}

function renderResponse(target: HTMLPreElement, data: unknown) {
  target.textContent = JSON.stringify(data, null, 2);
}

function hydrateDefaults(fields: FormElements) {
  const defaults = readPersistedDefaults();
  fields.repoUrl.value = defaults.repoUrl;
  fields.branch.value = defaults.branch;
  fields.filePath.value = defaults.filePath;
  fields.commitMessage.value = defaults.commitMessage;
  fields.authorName.value = defaults.authorName;
  fields.authorEmail.value = defaults.authorEmail;
}
