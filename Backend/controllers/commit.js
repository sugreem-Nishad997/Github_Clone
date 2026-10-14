import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { ensureAuth, promptQuestion } from "./loginCli.js";
import { ensureRepoAndRemote } from "./init.js";
import { fromPosixPath, listFilesRecursively, toPosixPath } from "./fileUtils.js";

async function commitRepo(message) {
  // 1. Ensure user is logged in
  const auth = await ensureAuth();
  if (!auth) return;

  // 2. Ensure repository is initialized and remote is linked
  const repoInfo = await ensureRepoAndRemote();
  if (!repoInfo) return;

  const repoPath = repoInfo.repoPath;
  const stagedPath = path.join(repoPath, "staging");
  const commitPath = path.join(repoPath, "commits");

  let commitMessage = message;
  if (!commitMessage) {
    commitMessage = await promptQuestion("Enter commit message: ");
    if (!commitMessage) {
      console.error("❌ Commit message is required. Operation cancelled.");
      return;
    }
  }

  try {
    await fs.mkdir(stagedPath, { recursive: true });
    await fs.mkdir(commitPath, { recursive: true });

    const files = await listFilesRecursively(stagedPath);
    if (!files || files.length === 0) {
      console.log(`\n⚠️ No files staged for commit in repository "${repoInfo.repoName}".`);
      console.log(`👉 Use 'apnagit add .' or 'apnagit add <filename>' to stage files first.\n`);
      return;
    }

    const commitID = uuidv4();
    const commitDir = path.join(commitPath, commitID);
    await fs.mkdir(commitDir, { recursive: true });

    for (const file of files) {
      const relativePath = fromPosixPath(file);
      const destination = path.join(commitDir, relativePath);
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.copyFile(
        path.join(stagedPath, relativePath),
        destination
      );
    }

    const meta = {
      commitID,
      message: commitMessage,
      author: auth.email ? auth.email.split("@")[0] : "User",
      date: new Date().toISOString(),
      files: files.map(toPosixPath),
    };

    await fs.writeFile(
      path.join(commitDir, "commit.json"),
      JSON.stringify(meta, null, 2)
    );

    await fs.rm(stagedPath, { recursive: true, force: true });
    await fs.mkdir(stagedPath, { recursive: true });

    console.log(`\n✅ Commit created successfully!`);
    console.log(`🔖 Commit ID: ${commitID}`);
    console.log(`💬 Message: "${commitMessage}"`);
    console.log(`📁 Files: ${files.join(", ")}`);
    console.log(`🔗 Remote Repo: "${repoInfo.repoName}"`);
    console.log(`👉 Next step: Run 'apnagit push' to upload commits to ApnaGit remote & cloud.\n`);
  } catch (error) {
    console.error("❌ Error committing files: ", error.message || error);
  }
}

export { commitRepo };