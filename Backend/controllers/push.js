import fs from "fs/promises";
import path from "path";
import { s3, S3_BUCKET } from "../config/aws-config.js";
import { getRepositoryCommitsPrefix } from "../config/storageKeys.js";
import { ensureAuth } from "./loginCli.js";
import { ensureRepoAndRemote } from "./init.js";
import { fromPosixPath, listFilesRecursively, toPosixPath } from "./fileUtils.js";

async function pushRepo() {
  const auth = await ensureAuth();
  if (!auth) return;

  const repoInfo = await ensureRepoAndRemote();
  if (!repoInfo) return;

  const repoPath = repoInfo.repoPath;
  const commitsPath = path.join(repoPath, "commits");
  const repoName = repoInfo.repoName;
  const bucketName = repoInfo.bucket || S3_BUCKET;

  if (!bucketName) {
    console.error("❌ Error pushing: Bucket name is not configured. Please define S3_BUCKET or R2_BUCKET in your .env file.");
    return;
  }

  try {
    let commitDirs;
    try {
      commitDirs = await fs.readdir(commitsPath, { withFileTypes: true });
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      commitDirs = [];
    }
    commitDirs = commitDirs.filter((entry) => entry.isDirectory());

    if (commitDirs.length === 0) {
      console.log(`\n⚠️ No commits found to push in repository "${repoName}".`);
      console.log(`👉 Stage files with 'apnagit add .' and commit with 'apnagit commit "msg"' first.\n`);
      return;
    }

    console.log(`\n🚀 Pushing repository "${repoName}" as ${auth.email}...`);

    if (!auth.userId) {
      throw new Error("The saved ApnaGit login has no user ID. Please log in again.");
    }

    const commits = [];
    const contentFiles = new Set();
    const commitsPrefix = getRepositoryCommitsPrefix(auth.userId, repoName);

    for (const entry of commitDirs) {
      const commitId = entry.name;
      const commitPath = path.join(commitsPath, commitId);
      const filePaths = (await listFilesRecursively(commitPath))
        .filter((file) => file !== "commit.json");

      let metadata = {};
      try {
        const rawMetadata = await fs.readFile(path.join(commitPath, "commit.json"), "utf-8");
        metadata = JSON.parse(rawMetadata);
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }

      const files = Array.isArray(metadata.files)
        ? metadata.files.map(toPosixPath)
        : filePaths.map(toPosixPath);
      const stats = await fs.stat(commitPath);
      const commitDate = new Date(metadata.date || stats.mtime);
      const commit = {
        commitID: commitId,
        message: metadata.message || "Commit snapshot",
        author: metadata.author || (auth.email ? auth.email.split("@")[0] : "User"),
        date: Number.isNaN(commitDate.getTime()) ? stats.mtime.toISOString() : commitDate.toISOString(),
        files,
      };
      commits.push(commit);
      files.forEach((file) => contentFiles.add(file));

      for (const file of filePaths) {
        const relativePath = toPosixPath(file);
        const fileContent = await fs.readFile(path.join(commitPath, fromPosixPath(relativePath)));
        await s3.upload({
          Bucket: bucketName,
          Key: `${commitsPrefix}${commitId}/${relativePath}`,
          Body: fileContent,
        }).promise();
      }

      const metadataContent = await fs.readFile(path.join(commitPath, "commit.json")).catch((error) => {
        if (error.code === "ENOENT") return null;
        throw error;
      });
      if (metadataContent) {
        await s3.upload({
          Bucket: bucketName,
          Key: `${commitsPrefix}${commitId}/commit.json`,
          Body: metadataContent,
        }).promise();
      }
    }

    commits.sort((first, second) =>
      Date.parse(first.date) - Date.parse(second.date) || first.commitID.localeCompare(second.commitID),
    );
    console.log("✅ All commit snapshots uploaded to cloud storage (S3/R2).");

    const serverUrl = auth.serverUrl || process.env.API_URL || "http://localhost:3000";
    const syncResponse = await fetch(`${serverUrl}/repo/sync-push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify({
        repoName,
        commits,
        content: [...contentFiles].sort(),
      }),
    });

    let syncResult;
    try {
      syncResult = await syncResponse.json();
    } catch (error) {
      throw new Error(`Backend sync returned invalid JSON (HTTP ${syncResponse.status}).`);
    }

    if (!syncResponse.ok) {
      throw new Error(syncResult.error || syncResult.message || `Backend sync failed (HTTP ${syncResponse.status}).`);
    }

    console.log(`✅ Synced with ApnaGit Web! Repository "${repoName}" is live on the frontend.\n`);
  } catch (error) {
    console.error("❌ Error pushing commits:", error.message || error);
  }
}

export { pushRepo };
