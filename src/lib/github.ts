import type { ExistingFileResponse, FormPayload, RepoInfo } from "../types";

type UploadResponse = Record<string, unknown>;

export async function uploadFileToGitHub(
  repoInfo: RepoInfo,
  payload: FormPayload
) {
  const existingFile = await fetchExistingFile(repoInfo, payload);
  const apiUrl = buildContentsApiUrl(repoInfo, payload.filePath);

  const body: Record<string, unknown> = {
    message: payload.commitMessage,
    content: encodeContent(payload.content),
    branch: payload.branch
  };

  if (existingFile.sha) {
    body.sha = existingFile.sha;
  }

  if (payload.authorName && payload.authorEmail) {
    body.committer = {
      name: payload.authorName,
      email: payload.authorEmail
    };
  }

  const response = await fetch(apiUrl, {
    method: "PUT",
    headers: buildHeaders(payload.token),
    body: JSON.stringify(body)
  });

  const data = (await response.json()) as UploadResponse;

  if (!response.ok) {
    throw new Error(resolveErrorMessage(data, response.status));
  }

  return {
    status: response.status,
    repository: `${repoInfo.owner}/${repoInfo.repo}`,
    repositoryUrl: repoInfo.canonicalUrl,
    branch: payload.branch,
    path: payload.filePath,
    fileUrl: (data.content as ExistingFileResponse | undefined)?.html_url ?? null,
    downloadUrl:
      (data.content as ExistingFileResponse | undefined)?.download_url ?? null,
    commitUrl:
      (data.commit as { html_url?: string } | undefined)?.html_url ?? null,
    apiResponse: data
  };
}

async function fetchExistingFile(repoInfo: RepoInfo, payload: FormPayload) {
  const query = new URLSearchParams({ ref: payload.branch }).toString();
  const response = await fetch(
    `${buildContentsApiUrl(repoInfo, payload.filePath)}?${query}`,
    {
      method: "GET",
      headers: buildHeaders(payload.token)
    }
  );

  if (response.status === 404) {
    return {} as ExistingFileResponse;
  }

  const data = (await response.json()) as ExistingFileResponse;

  if (!response.ok) {
    throw new Error(resolveErrorMessage(data, response.status));
  }

  return data;
}

function buildContentsApiUrl(repoInfo: RepoInfo, filePath: string): string {
  const encodedPath = filePath
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  return `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/contents/${encodedPath}`;
}

function buildHeaders(token: string): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28"
  };
}

function encodeContent(content: string): string {
  const bytes = new TextEncoder().encode(content);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary);
}

function resolveErrorMessage(
  data: ExistingFileResponse | UploadResponse,
  status: number
): string {
  const message = "message" in data ? String(data.message) : "";

  switch (status) {
    case 401:
      return "身份验证失败，请检查 GitHub Token 是否正确。";
    case 403:
      return "访问被拒绝。请确认 Token 权限足够，并且仓库允许当前账号写入。";
    case 404:
      return "仓库、分支或目标路径不存在，或者当前账号没有访问权限。";
    case 409:
      return "提交冲突。请确认分支名正确，或者稍后重试。";
    case 422:
      return `请求无效：${message || "请检查文件路径、提交信息和 Token 权限。"}`;
    default:
      return message || `GitHub API 返回错误，状态码：${status}。`;
  }
}
