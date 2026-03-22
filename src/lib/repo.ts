import type { RepoInfo } from "../types";

const SSH_PATTERN = /^git@github\.com:([^/\s]+)\/([^/\s]+?)(?:\.git)?$/i;
const SSH_URL_PATTERN =
  /^ssh:\/\/git@github\.com\/([^/\s]+)\/([^/\s]+?)(?:\.git)?$/i;
const SLUG_PATTERN = /^([^/\s]+)\/([^/\s]+?)(?:\.git)?$/;

export function parseRepoInput(input: string): RepoInfo | null {
  const value = input.trim();

  if (!value) {
    return null;
  }

  const sshMatch = value.match(SSH_PATTERN) ?? value.match(SSH_URL_PATTERN);
  if (sshMatch) {
    return createRepoInfo(sshMatch[1], sshMatch[2]);
  }

  const slugMatch = value.match(SLUG_PATTERN);
  if (slugMatch && !value.startsWith("http")) {
    return createRepoInfo(slugMatch[1], slugMatch[2]);
  }

  try {
    const url = new URL(value);
    const parts = url.pathname.replace(/^\/+|\/+$/g, "").split("/");

    if (url.hostname !== "github.com" || parts.length < 2) {
      return null;
    }

    return createRepoInfo(parts[0], parts[1]);
  } catch {
    return null;
  }
}

function createRepoInfo(owner: string, repo: string): RepoInfo {
  const cleanedRepo = repo.replace(/\.git$/, "");

  return {
    owner,
    repo: cleanedRepo,
    canonicalUrl: `https://github.com/${owner}/${cleanedRepo}`
  };
}
