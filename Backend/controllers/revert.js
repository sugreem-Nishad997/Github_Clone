import fs from "fs/promises";
import path from "path";
import { ensureAuth } from "./loginCli.js";
import { ensureRepoAndRemote } from "./init.js";
import { fromPosixPath, listFilesRecursively } from "./fileUtils.js";

async function revertRepo(commitID) {
  // 1. Authenticate user
  const auth = await ensureAuth();
  if (!auth) return;

  // 2. Ensure repo & remote
  const repoInfo = await ensureRepoAndRemote();
  if (!repoInfo) return;

  if (!commitID) {
    console.error("❌ Please provide a commit ID to revert (e.g. apnagit revert <commitID>)");
    return;
  }

  const repoPath = repoInfo.repoPath;
  const commitsPath = path.join(repoPath, "commits");
  const commitDir = path.join(commitsPath, commitID);

  try {
    try {
      await fs.access(commitDir);
    } catch {
      console.error(`❌ Commit ID "${commitID}" not found in local repository.`);
      return;
    }

    const files = await listFilesRecursively(commitDir);
    const parentDir = repoInfo.repoRoot;

    for (const file of files) {
      if (file === "commit.json") continue;
      const relativePath = fromPosixPath(file);
      const destination = path.join(parentDir, relativePath);
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.copyFile(path.join(commitDir, relativePath), destination);
    }

    console.log(`\n✅ Repository "${repoInfo.repoName}" reverted to commit ${commitID} successfully!\n`);
  } catch (error) {
    console.error("❌ Unable to revert commit: ", error.message || error);
  }
}

export { revertRepo };
