import { FORM_DEFAULTS, STORAGE_KEY } from "../config";
import type { FormPayload, PersistedDefaults } from "../types";

export function readPersistedDefaults(): PersistedDefaults {
  const fallback: PersistedDefaults = {
    repoUrl: FORM_DEFAULTS.repoUrl,
    branch: FORM_DEFAULTS.branch,
    filePath: FORM_DEFAULTS.filePath,
    commitMessage: FORM_DEFAULTS.commitMessage,
    authorName: FORM_DEFAULTS.authorName,
    authorEmail: FORM_DEFAULTS.authorEmail
  };

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return fallback;
  }

  try {
    return {
      ...fallback,
      ...(JSON.parse(stored) as Partial<PersistedDefaults>)
    };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return fallback;
  }
}

export function persistDefaults(payload: FormPayload) {
  const defaults: PersistedDefaults = {
    repoUrl: payload.repoUrl,
    branch: payload.branch,
    filePath: payload.filePath,
    commitMessage: payload.commitMessage,
    authorName: payload.authorName,
    authorEmail: payload.authorEmail
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
}
