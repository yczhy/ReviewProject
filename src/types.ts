export type StatusTone = "info" | "success" | "error";

export type RepoInfo = {
  owner: string;
  repo: string;
  canonicalUrl: string;
};

export type ExistingFileResponse = {
  sha?: string;
  html_url?: string;
  download_url?: string;
  message?: string;
};

export type FormPayload = {
  repoUrl: string;
  token: string;
  branch: string;
  filePath: string;
  commitMessage: string;
  authorName: string;
  authorEmail: string;
  content: string;
};

export type PersistedDefaults = Omit<FormPayload, "token" | "content">;

export type FormElements = {
  repoUrl: HTMLInputElement;
  token: HTMLInputElement;
  branch: HTMLInputElement;
  filePath: HTMLInputElement;
  commitMessage: HTMLInputElement;
  authorName: HTMLInputElement;
  authorEmail: HTMLInputElement;
  content: HTMLTextAreaElement;
  submitButton: HTMLButtonElement;
  status: HTMLParagraphElement;
  response: HTMLPreElement;
};
