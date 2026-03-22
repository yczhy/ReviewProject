type RepoParts = {
  owner: string;
  repo: string;
};

type RepoDetailsResponse = {
  default_branch: string;
};

type FileResponse = {
  sha: string;
  content: string;
};

type PutFileResponse = {
  commit: {
    html_url?: string;
    sha: string;
  };
  content?: {
    html_url?: string;
    path: string;
  };
};

const DEFAULT_REPO = "git@github.com:yczhy/ReviewSelf.git";
const STORAGE_KEY = "daily-review.repo-url";

const repoInput = getRequiredElement<HTMLInputElement>("#repoUrl");
const tokenInput = getRequiredElement<HTMLInputElement>("#token");
const reviewContentInput = getRequiredElement<HTMLTextAreaElement>("#reviewContent");
const form = getRequiredElement<HTMLFormElement>("#review-form");
const submitButton = getRequiredElement<HTMLButtonElement>("#submitButton");
const statusElement = getRequiredElement<HTMLDivElement>("#status");
const filePathHint = getRequiredElement<HTMLParagraphElement>("#filePathHint");

initialize();

function initialize(): void {
  const savedRepo = window.localStorage.getItem(STORAGE_KEY);
  repoInput.value = savedRepo || DEFAULT_REPO;
  updateFilePathHint();

  repoInput.addEventListener("input", () => {
    window.localStorage.setItem(STORAGE_KEY, repoInput.value.trim() || DEFAULT_REPO);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void submitReview();
  });

  reviewContentInput.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      void submitReview();
    }
  });
}

async function submitReview(): Promise<void> {
  const repoUrl = repoInput.value.trim() || DEFAULT_REPO;
  const token = tokenInput.value.trim();
  const reviewContent = reviewContentInput.value.trim();

  if (!reviewContent) {
    setStatus("请先填写“今天我做了什么”。", "error");
    reviewContentInput.focus();
    return;
  }

  if (!token) {
    setStatus("请填写 GitHub Token。", "error");
    tokenInput.focus();
    return;
  }

  const repoParts = parseRepoUrl(repoUrl);
  if (!repoParts) {
    setStatus("GitHub 仓库链接格式不正确。", "error");
    repoInput.focus();
    return;
  }

  setBusy(true);
  setStatus("正在提交到 GitHub，请稍候...", "success");

  try {
    const branch = await fetchDefaultBranch(repoParts, token);
    const today = formatDate(new Date());
    const currentTime = formatTime(new Date());
    const filePath = `reviews/${today}.md`;

    filePathHint.textContent = `提交路径：${filePath}`;

    const existingFile = await fetchExistingFile(repoParts, token, branch, filePath);
    const nextContent = buildNextFileContent(existingFile?.content ?? null, reviewContent, today, currentTime);
    const commitMessage = `review: ${today} ${currentTime}`;
    const result = await putFile(repoParts, token, branch, filePath, nextContent, commitMessage, existingFile?.sha);
    const targetUrl = result.content?.html_url || result.commit.html_url;

    if (targetUrl) {
      setStatus(
        `提交成功。已写入 ${filePath}，你可以在这里查看：<a href="${escapeHtml(targetUrl)}" target="_blank" rel="noreferrer">${escapeHtml(targetUrl)}</a>`,
        "success",
      );
    } else {
      setStatus(`提交成功。已写入 ${filePath}。`, "success");
    }

    reviewContentInput.value = "";
    reviewContentInput.focus();
  } catch (error) {
    const message = error instanceof Error ? error.message : "提交失败，请稍后重试。";
    setStatus(message, "error");
  } finally {
    setBusy(false);
  }
}

function parseRepoUrl(value: string): RepoParts | null {
  const trimmed = normalizeRepoInput(value);
  const patterns = [
    /^git@github\.com:([^/]+)\/(.+?)(?:\.git)?$/i,
    /^ssh:\/\/git@github\.com\/([^/]+)\/(.+?)(?:\.git)?$/i,
    /^https:\/\/github\.com\/([^/]+)\/(.+?)(?:\.git)?\/?$/i,
    /^([^/\s]+)\/([^/\s]+)$/i,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) {
      return normalizeRepoParts(match[1], match[2]);
    }
  }

  return null;
}

async function fetchDefaultBranch(repo: RepoParts, token: string): Promise<string> {
  const response = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.repo}`, {
    headers: buildHeaders(token),
  });

  if (response.status === 404) {
    throw new Error(
      `找不到仓库 ${repo.owner}/${repo.repo}。请确认这个仓库已经在 GitHub 上创建完成；如果它是私有仓库，请确认当前 Token 已授权到这个仓库。`,
    );
  }

  if (!response.ok) {
    throw new Error(await buildGitHubError(response, "无法读取仓库信息，请检查仓库地址和 Token 权限。"));
  }

  const data = (await response.json()) as RepoDetailsResponse;
  return data.default_branch;
}

async function fetchExistingFile(
  repo: RepoParts,
  token: string,
  branch: string,
  filePath: string,
): Promise<{ sha: string; content: string } | null> {
  const response = await fetch(
    `https://api.github.com/repos/${repo.owner}/${repo.repo}/contents/${encodePath(filePath)}?ref=${encodeURIComponent(branch)}`,
    {
      headers: buildHeaders(token),
    },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(await buildGitHubError(response, "读取原有复盘内容失败。"));
  }

  const data = (await response.json()) as FileResponse;
  return {
    sha: data.sha,
    content: decodeBase64Utf8(data.content),
  };
}

async function putFile(
  repo: RepoParts,
  token: string,
  branch: string,
  filePath: string,
  content: string,
  message: string,
  sha?: string,
): Promise<PutFileResponse> {
  const response = await fetch(
    `https://api.github.com/repos/${repo.owner}/${repo.repo}/contents/${encodePath(filePath)}`,
    {
      method: "PUT",
      headers: buildHeaders(token),
      body: JSON.stringify({
        message,
        content: encodeBase64Utf8(content),
        branch,
        sha,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(await buildGitHubError(response, "写入 GitHub 失败。"));
  }

  return (await response.json()) as PutFileResponse;
}

function buildNextFileContent(existingContent: string | null, reviewContent: string, day: string, time: string): string {
  const title = `# ${day}`;
  const entry = [`## ${time}`, "", reviewContent.trim()].join("\n");

  if (!existingContent) {
    return `${title}\n\n${entry}\n`;
  }

  const normalized = existingContent.trimEnd();
  const hasTitle = normalized.startsWith(title);
  const baseContent = hasTitle ? normalized : `${title}\n\n${normalized}`;
  return `${baseContent}\n\n${entry}\n`;
}

function encodePath(value: string): string {
  return value
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function buildHeaders(token: string): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function buildGitHubError(response: Response, fallback: string): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string };
    if (payload.message) {
      return `${fallback} GitHub 返回：${payload.message}`;
    }
  } catch {
    return fallback;
  }

  return fallback;
}

function encodeBase64Utf8(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return window.btoa(binary);
}

function decodeBase64Utf8(value: string): string {
  const normalized = value.replace(/\n/g, "");
  const binary = window.atob(normalized);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTime(date: Date): string {
  const hour = `${date.getHours()}`.padStart(2, "0");
  const minute = `${date.getMinutes()}`.padStart(2, "0");
  return `${hour}:${minute}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function setBusy(isBusy: boolean): void {
  submitButton.disabled = isBusy;
  submitButton.textContent = isBusy ? "提交中..." : "提交到 GitHub";
}

function setStatus(message: string, type: "success" | "error"): void {
  statusElement.innerHTML = message;
  statusElement.className = `status is-visible ${type === "success" ? "is-success" : "is-error"}`;
}

function updateFilePathHint(): void {
  const today = formatDate(new Date());
  filePathHint.textContent = `提交路径：reviews/${today}.md`;
}

function normalizeRepoInput(value: string): string {
  const trimmed = value.trim();
  const prefixes = ["github:", "repo:"];

  for (const prefix of prefixes) {
    if (trimmed.toLowerCase().startsWith(prefix)) {
      const candidate = trimmed.slice(prefix.length).trim();
      if (
        candidate.startsWith("git@github.com:") ||
        candidate.startsWith("ssh://git@github.com/") ||
        candidate.startsWith("https://github.com/")
      ) {
        return candidate;
      }
    }
  }

  return trimmed;
}

function normalizeRepoParts(owner: string, repo: string): RepoParts {
  return {
    owner: owner.trim(),
    repo: repo.trim().replace(/\.git$/i, ""),
  };
}

function getRequiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`页面初始化失败，找不到元素：${selector}`);
  }

  return element;
}
