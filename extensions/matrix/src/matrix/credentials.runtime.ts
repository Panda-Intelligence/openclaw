import { writeJsonFileAtomically } from "../runtime-api.js";
import {
  loadMatrixCredentials,
  resolveMatrixCredentialsPath,
  type MatrixStoredCredentials,
} from "./credentials.shared.js";

export async function saveMatrixCredentials(
  credentials: Omit<MatrixStoredCredentials, "createdAt" | "lastUsedAt">,
  env: NodeJS.ProcessEnv = process.env,
  accountId?: string | null,
): Promise<void> {
  const credPath = resolveMatrixCredentialsPath(env, accountId);
  const existing = loadMatrixCredentials(env, accountId);
  const now = new Date().toISOString();

  const toSave: MatrixStoredCredentials = {
    ...credentials,
    createdAt: existing?.createdAt ?? now,
    lastUsedAt: now,
  };

  await writeJsonFileAtomically(credPath, toSave);
}

export async function touchMatrixCredentials(
  env: NodeJS.ProcessEnv = process.env,
  accountId?: string | null,
): Promise<void> {
  const existing = loadMatrixCredentials(env, accountId);
  if (!existing) {
    return;
  }

  existing.lastUsedAt = new Date().toISOString();
  const credPath = resolveMatrixCredentialsPath(env, accountId);
  await writeJsonFileAtomically(credPath, existing);
}

export const matrixCredentialsRuntime = {
  saveMatrixCredentials,
  touchMatrixCredentials,
};
