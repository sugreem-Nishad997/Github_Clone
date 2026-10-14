import fs from "fs/promises";
import path from "path";
import { S3_BUCKET } from "../config/aws-config.js";
import { ensureAuth, promptQuestion } from "./loginCli.js";

async function findLocalRepository(startDirectory = process.cwd()) {
  let directory = path.resolve(startDirectory);

  while (true) {
    const repoPath = path.join(directory, ".apnaGit");
    const configPath = path.join(repoPath, "config.json");

    try {
      const rawConfig = await fs.readFile(configPath, "utf-8");
      const config = JSON.parse(rawConfig);
      return { repoPath, repoRoot: directory, configPath, config };
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw new Error(`Unable to read ApnaGit config at "${configPath}": ${error.message}`);
      }
    }

    const parentDirectory = path.dirname(directory);
    if (parentDirectory === directory) return null;
    directory = parentDirectory;
  }
}

/**
 * Initializes a local ApnaGit repository
 */
async function initRepo(repoName) {
  // 1. Authenticate user before init
  const auth = await ensureAuth();
  if (!auth) return;

  const repoPath = path.resolve(process.cwd(), ".apnaGit");
  const commitsPath = path.join(repoPath, "commits");
  const currentFolderName = path.basename(process.cwd());

  let finalRepoName = repoName;
  if (!finalRepoName) {
    console.log(`\n📁 Initializing local repository for ApnaGit account: ${auth.email}`);
    const input = await promptQuestion(`Enter remote repository name (press Enter for '${currentFolderName}'): `);
    finalRepoName = input || currentFolderName;
  }

  try {
    await fs.mkdir(repoPath, { recursive: true });
    await fs.mkdir(commitsPath, { recursive: true });
    await fs.mkdir(path.join(repoPath, "staging"), { recursive: true });

    let existingConfig = {};
    try {
      const raw = await fs.readFile(path.join(repoPath, "config.json"), "utf-8");
      existingConfig = JSON.parse(raw);
    } catch (e) {}

    const config = {
      ...existingConfig,
      repoName: finalRepoName,
      owner: auth.email,
      bucket: existingConfig.bucket || S3_BUCKET || "github-clone-commits",
    };

    await fs.writeFile(
      path.join(repoPath, "config.json"),
      JSON.stringify(config, null, 2)
    );

    console.log(`\n✅ Repository initialized successfully!`);
    console.log(`🔗 Remote repository set to: "${finalRepoName}"`);
    console.log(`👤 Owner: ${auth.email}`);
    console.log(`👉 Next steps:\n   1. apnagit add .\n   2. apnagit commit "Initial commit"\n   3. apnagit push\n`);
  } catch (error) {
    console.error("❌ Error initializing repository:", error);
  }
}

/**
 * Links/changes the remote repository name for this local directory
 */
async function setRemoteRepo(repoName) {
  const auth = await ensureAuth();
  if (!auth) return;

  const existingRepo = await findLocalRepository();
  const repoPath = existingRepo?.repoPath || path.resolve(process.cwd(), ".apnaGit");
  const configPath = path.join(repoPath, "config.json");

  let targetName = repoName;
  if (!targetName) {
    const defaultName = path.basename(process.cwd());
    targetName = await promptQuestion(`Enter remote repository name to link (default: ${defaultName}): `);
    if (!targetName) targetName = defaultName;
  }

  try {
    let config = {};
    try {
      const raw = await fs.readFile(configPath, "utf-8");
      config = JSON.parse(raw);
    } catch (e) {}

    config.repoName = targetName;
    config.owner = auth.email;
    config.bucket = config.bucket || S3_BUCKET || "github-clone-commits";

    await fs.mkdir(repoPath, { recursive: true });
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));

    console.log(`\n✅ Remote repository linked to: "${targetName}"`);
    console.log(`👤 Owner: ${auth.email}\n`);
  } catch (err) {
    console.error("❌ Failed to set remote repository:", err);
  }
}

/**
 * Helper to ensure local repo is initialized and remote repo name is configured
 */
async function ensureRepoAndRemote() {
  let localRepo = await findLocalRepository();

  if (!localRepo) {
    console.log("\n⚠️ No initialized repository found in this directory or its parent directories.");
    const shouldInit = await promptQuestion("Would you like to initialize it now? (Y/n): ");
    if (shouldInit.toLowerCase() === "n" || shouldInit.toLowerCase() === "no") {
      console.log("❌ Operation cancelled. Run 'apnagit init' when ready.\n");
      return null;
    }
    const defaultName = path.basename(process.cwd());
    const inputName = await promptQuestion(`Enter remote repository name (default: ${defaultName}): `);
    const finalRepoName = inputName || defaultName;
    await initRepo(finalRepoName);
    localRepo = await findLocalRepository();
    if (!localRepo) {
      console.error("❌ Repository initialization did not create a valid .apnaGit/config.json.");
      return null;
    }
  }

  const { repoPath, repoRoot } = localRepo;
  const config = localRepo.config;

  if (!config.repoName) {
    const defaultName = path.basename(repoRoot);
    console.log("\n⚠️ No remote repository is linked to this directory.");
    const inputName = await promptQuestion(`Enter the remote repository name (as created on web, default: ${defaultName}): `);
    const finalRepoName = inputName || defaultName;
    await setRemoteRepo(finalRepoName);
    config.repoName = finalRepoName;
  }

  return {
    repoPath,
    repoRoot,
    repoName: config.repoName,
    bucket: config.bucket || S3_BUCKET || "github-clone-commits",
  };
}

export { initRepo, setRemoteRepo, ensureRepoAndRemote, findLocalRepository };