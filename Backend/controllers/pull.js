import fs from "fs/promises";
import path from "path";
import { s3, S3_BUCKET } from "../config/aws-config.js";
import { getRepositoryCommitsPrefix } from "../config/storageKeys.js";
import { ensureAuth } from "./loginCli.js";
import { ensureRepoAndRemote } from "./init.js";
import { restoreWorkingTreeFromCommits } from "./fileUtils.js";

async function listObjects(bucketName, prefix) {
  const objects = [];
  let continuationToken;

  do {
    const page = await s3.listObjectsV2({
      Bucket: bucketName,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    }).promise();
    objects.push(...(page.Contents || []));

    continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
    if (page.IsTruncated && !continuationToken) {
      throw new Error("Storage returned a truncated page without a continuation token.");
    }
  } while (continuationToken);

  return objects;
}

async function getLegacyCommitIds(auth, repoName) {
  const serverUrl = auth.serverUrl || process.env.API_URL || "http://localhost:3000";
  const response = await fetch(
    `${serverUrl}/repo/sync-pull/${encodeURIComponent(repoName)}`,
    { headers: { Authorization: `Bearer ${auth.token}` } },
  );

  let result;
  try {
    result = await response.json();
  } catch (error) {
    throw new Error(`Backend returned invalid JSON while looking up legacy commits (HTTP ${response.status}).`);
  }

  if (!response.ok) {
    throw new Error(result.message || `Could not look up legacy commits (HTTP ${response.status}).`);
  }

  return (result.repository?.commits || [])
    .map((commit) => commit.commitID)
    .filter((commitId) => typeof commitId === "string" && commitId.length > 0);
}

async function pullRepo() {
  const auth = await ensureAuth();
  if (!auth) return;

  const repoInfo = await ensureRepoAndRemote();
  if (!repoInfo) return;

  const repoPath = repoInfo.repoPath;
  const commitsPath = path.join(repoPath, "commits");
  const repoName = repoInfo.repoName;
  const bucketName = repoInfo.bucket || S3_BUCKET;

  if (!bucketName) {
    console.error("❌ Error pulling: Bucket name is not configured.");
    return;
  }

  try {
    console.log(`\n📥 Pulling commits for "${repoName}" from cloud storage...`);
    if (!auth.userId) {
      throw new Error("The saved ApnaGit login has no user ID. Please log in again.");
    }
    const prefix = getRepositoryCommitsPrefix(auth.userId, repoName);
    let objects = await listObjects(bucketName, prefix);

    if (objects.length === 0) {
      const legacyCommitIds = await getLegacyCommitIds(auth, repoName);
      const legacyObjects = await Promise.all(
        legacyCommitIds.map((commitId) =>
          listObjects(bucketName, `commits/${encodeURIComponent(commitId)}/`),
        ),
      );
      objects = legacyObjects.flat();
    }

    let downloaded = 0;

    for (const object of objects) {
      if (!object.Key) continue;
      const relativeKey = object.Key.startsWith(prefix)
        ? object.Key.slice(prefix.length)
        : object.Key.startsWith("commits/")
          ? object.Key.slice("commits/".length)
          : null;
      if (relativeKey === null || relativeKey.endsWith("/")) continue;
      const segments = relativeKey.split("/");
      if (
        segments.length < 2 ||
        segments.some((segment) =>
          !segment || segment === "." || segment === ".." || segment.includes("\\"),
        )
      ) {
        throw new Error(`Invalid object key returned by storage: ${object.Key}`);
      }

      const destination = path.resolve(commitsPath, ...segments);
      const relativeDestination = path.relative(commitsPath, destination);
      if (relativeDestination.startsWith("..") || path.isAbsolute(relativeDestination)) {
        throw new Error(`Object key escapes the local repository: ${object.Key}`);
      }

      const response = await s3.getObject({
        Bucket: bucketName,
        Key: object.Key,
      }).promise();

      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.writeFile(destination, response.Body);
      downloaded += 1;
    }

    if (downloaded === 0) {
      console.log("ℹ️ No commits found for this repository in cloud storage.");
      return;
    }

    const restoredFiles = await restoreWorkingTreeFromCommits(commitsPath, repoInfo.repoRoot);
    console.log(`✅ Pulled ${downloaded} commit file(s) for repository "${repoName}".`);
    console.log(`✅ Restored ${restoredFiles} file(s) to "${repoInfo.repoRoot}".\n`);
  } catch (error) {
    console.error("❌ Unable to pull commits:", error.message || error);
  }
}

export { pullRepo };
