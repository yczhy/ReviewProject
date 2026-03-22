export const STORAGE_KEY = "review-self-uploader-defaults";

export const FORM_DEFAULTS = {
  repoUrl: "git@github.com:yczhy/ReviewSelf.git",
  branch: "main",
  filePath: "reviews/self-review.md",
  commitMessage: "feat: upload review content from web app",
  authorName: "",
  authorEmail: ""
} as const;
