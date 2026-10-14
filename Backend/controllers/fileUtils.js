import fs from "fs/promises";
import path from "path";

async function listFilesRecursively(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      const nestedFiles = await listFilesRecursively(fullPath);
      files.push(...nestedFiles.map((file) => path.join(entry.name, file)));
    } else if (entry.isFile()) {
      files.push(entry.name);
    }
  }

  return files;
}

function toPosixPath(filePath) {
  return filePath.split(path.sep).join("/");
}

function fromPosixPath(filePath) {
  return filePath.split("/").join(path.sep);
}

async function restoreWorkingTreeFromCommits(commitsPath, workingDirectory) {
  let commitEntries;
  try {
    commitEntries = await fs.readdir(commitsPath, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return 0;
    throw error;
  }

  const commits = [];
  for (const entry of commitEntries) {
    if (!entry.isDirectory()) continue;

    const commitPath = path.join(commitsPath, entry.name);
    let metadata = {};
    try {
      metadata = JSON.parse(
        await fs.readFile(path.join(commitPath, "commit.json"), "utf-8"),
      );
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }

    const stats = await fs.stat(commitPath);
    const date = new Date(metadata.date || stats.mtime);
    commits.push({
      id: entry.name,
      path: commitPath,
      timestamp: Number.isNaN(date.getTime()) ? stats.mtimeMs : date.getTime(),
    });
  }

  commits.sort((first, second) =>
    first.timestamp - second.timestamp || first.id.localeCompare(second.id),
  );

  const restoredFiles = new Set();
  for (const commit of commits) {
    const files = await listFilesRecursively(commit.path);
    for (const file of files) {
      if (file === "commit.json") continue;

      const relativePath = fromPosixPath(file);
      const segments = relativePath.split(path.sep);
      if (
        segments.some((segment) =>
          !segment || segment === "." || segment === ".." ||
          segment.toLowerCase() === ".apnagit" ||
          segment.toLowerCase() === ".git",
        )
      ) {
        throw new Error(`Unsafe path found in commit ${commit.id}: ${file}`);
      }

      const destination = path.resolve(workingDirectory, relativePath);
      const relativeDestination = path.relative(workingDirectory, destination);
      if (relativeDestination.startsWith("..") || path.isAbsolute(relativeDestination)) {
        throw new Error(`Commit path escapes the working directory: ${file}`);
      }

      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.copyFile(path.join(commit.path, relativePath), destination);
      restoredFiles.add(relativePath);
    }
  }

  return restoredFiles.size;
}

export {
  listFilesRecursively,
  toPosixPath,
  fromPosixPath,
  restoreWorkingTreeFromCommits,
};
