import fs from "fs/promises";
import path from "path";
import { ensureAuth } from "./loginCli.js";
import { ensureRepoAndRemote } from "./init.js";

const IGNORED_ENTRIES = new Set([
  ".apnaGit",
  ".git",
  "node_modules",
  ".env",
  "dist",
  "build",
  ".DS_Store",
]);

async function getFilesToStage(directory, baseDirectory = directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (IGNORED_ENTRIES.has(entry.name)) continue;

    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await getFilesToStage(fullPath, baseDirectory));
    } else if (entry.isFile()) {
      files.push(path.relative(baseDirectory, fullPath));
    }
  }

  return files;
}

async function findFilesByName(directory, fileName) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const matches = [];

  for (const entry of entries) {
    if (IGNORED_ENTRIES.has(entry.name)) continue;

    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      matches.push(...await findFilesByName(fullPath, fileName));
    } else if (
      entry.isFile() &&
      entry.name.toLowerCase() === fileName.toLowerCase()
    ) {
      matches.push(fullPath);
    }
  }

  return matches;
}

async function addRepo(filePath) {
  // 1. Ensure user is logged in
  const auth = await ensureAuth();
  if (!auth) return;

  // 2. Ensure repository is initialized and remote repo is linked
  const repoInfo = await ensureRepoAndRemote();
  if (!repoInfo) return;

  const repoPath = repoInfo.repoPath;
  const stagingPath = path.join(repoPath, "staging");

  try {
    await fs.mkdir(stagingPath, { recursive: true });

    const target = filePath ? filePath.trim() : ".";
    const currentDir = process.cwd();
    const repoRoot = repoInfo.repoRoot;

    if (target === "." || target === "*" || target === "all") {
      // Stage all files in working directory (excluding ignored items)
      const filesToStage = await getFilesToStage(currentDir, repoRoot);

      if (filesToStage.length === 0) {
        console.log(`ℹ️ No files found to stage in repository "${repoInfo.repoName}".`);
        return;
      }

      for (const relativePath of filesToStage) {
        const stagedFile = path.join(stagingPath, relativePath);
        await fs.mkdir(path.dirname(stagedFile), { recursive: true });
        await fs.copyFile(path.join(repoRoot, relativePath), stagedFile);
      }

      console.log(`\n✅ Staged ${filesToStage.length} file(s) for repository "${repoInfo.repoName}" (${auth.email})`);
      console.log(`👉 Next step: apnagit commit "Your commit message"\n`);
    } else {
      // Stage single file
      let resolvedPath = path.resolve(currentDir, target);
      let targetStat;
      try {
        targetStat = await fs.stat(resolvedPath);
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
        if (path.basename(target) !== target) {
          console.error(`❌ File not found: ${resolvedPath}`);
          console.error(`   Current directory: ${currentDir}`);
          console.error("   Check the file name/path, or run 'apnagit add .' to stage files in this directory.");
          return;
        }

        const matches = await findFilesByName(currentDir, target);
        if (matches.length > 1) {
          console.error(`❌ Multiple files named "${target}" were found. Specify the relative path:`);
          for (const match of matches) {
            console.error(`   ${path.relative(currentDir, match)}`);
          }
          return;
        }
        if (matches.length === 0) {
          console.error(`❌ File not found in "${currentDir}" or its subfolders: ${target}`);
          return;
        }

        resolvedPath = matches[0];
        targetStat = await fs.stat(resolvedPath);
      }

      const relativePath = path.relative(repoRoot, resolvedPath);
      if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
        console.error(`❌ Path must be inside the current repository: ${target}`);
        return;
      }
      if (relativePath.split(path.sep).some((segment) => IGNORED_ENTRIES.has(segment))) {
        console.error(`❌ Path is ignored and cannot be staged: ${target}`);
        return;
      }

      const pathsToStage = targetStat.isDirectory()
        ? await getFilesToStage(resolvedPath, repoRoot)
        : [relativePath];

      for (const stagedPath of pathsToStage) {
        const stagedFile = path.join(stagingPath, stagedPath);
        await fs.mkdir(path.dirname(stagedFile), { recursive: true });
        await fs.copyFile(path.join(repoRoot, stagedPath), stagedFile);
      }

      if (pathsToStage.length === 0) {
        console.log(`ℹ️ No files found to stage in "${target}".`);
        return;
      }

      console.log(`\n✅ Staged ${pathsToStage.length} file(s) from "${target}" in repository "${repoInfo.repoName}".`);
      console.log(`👉 Next step: apnagit commit "Your commit message"\n`);
    }
  } catch (error) {
    console.error("❌ Error staging files:", error.message || error);
  }
}

export { addRepo };