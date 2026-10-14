import Repository from "../models/repoModel.js";
import Issue from "../models/issueModel.js";
import Users from "../models/userModel.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { s3, S3_BUCKET } from "../config/aws-config.js";
import { getRepositoryCommitsPrefix } from "../config/storageKeys.js";
import fs from "fs/promises";
import path from "path";

const createRepository = async (req, res) => {
  const { owner, name, issues, content, description, visibility } = req.body;

  try {
    if (!name) {
      return res.status(400).json({ error: "Repository name is required!" });
    }

    if (!owner || !mongoose.Types.ObjectId.isValid(owner)) {
      return res.status(400).json({ error: "Invalid User Id!" });
    }

    const existingRepo = await Repository.findOne({ name, owner });
    if (existingRepo) {
      return res.status(400).json({ error: "Repository name already exists for this user!" });
    }

    const newRepository = new Repository({
      owner,
      name,
      issues: issues || [],
      content: content || [],
      description: description || "",
      visibility: visibility !== undefined ? visibility : true,
    });

    const result = await newRepository.save();
    await result.populate("owner", "username email");

    return res
      .status(201)
      .json({ message: "Repository created!", repositoryID: result._id, repository: result });
  } catch (error) {
    console.error("Error creating repository:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const getAllRepositories = async (req, res) => {
  try {
    const repositories = await Repository.find({ visibility: true })
      .populate("owner", "username email")
      .populate("issues");

    res.status(200).json({
      message: "All repositories fetched successfully",
      count: repositories.length,
      repositories: repositories || [],
    });
  } catch (error) {
    console.error("Error fetching repositories:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const fetchRepositoryByID = async (req, res) => {
  const { id } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid repository ID!" });
    }

    const repository = await Repository.findById(id)
      .populate("owner", "username email")
      .populate("issues");

    if (!repository) {
      return res.status(404).json({ message: "Repository not found" });
    }

    res.status(200).json({
      message: "Repository fetched successfully",
      repository,
    });
  } catch (error) {
    console.error("Error fetching repository:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const fetchRepositoryByName = async (req, res) => {
  const { name } = req.params;

  try {
    if (!name) {
      return res.status(400).json({ error: "Repository name is required" });
    }

    const repository = await Repository.findOne({
      name,
    })
      .populate("owner", "username email")
      .populate("issues");

    if (!repository) {
      return res.status(404).json({ message: "Repository not found" });
    }

    res.status(200).json({
      message: "Repository fetched successfully",
      repository,
    });
  } catch (error) {
    console.error("Error fetching repository by name:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const fetchRepositoryForCurrentUser = async (req, res) => {
  try {
    const id = req.user || req.params.userID;
    const repositories = await Repository.find({ owner: id })
      .populate("owner", "username email")
      .populate("issues");

    res.status(200).json({
      message: "Repositories fetched successfully",
      count: repositories ? repositories.length : 0,
      repositories: repositories || [],
    });
  } catch (error) {
    console.error("Error fetching repositories for current user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateRepositoryByID = async (req, res) => {
  const { id } = req.params;
  const { content, description } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid repository ID!" });
    }

    const repository = await Repository.findById(id);

    if (!repository) {
      return res.status(404).json({ message: "Repository not found" });
    }

    if (repository.owner.toString() !== req.user.toString()) {
      return res
        .status(403)
        .json({ message: "Unauthorized to update this repository" });
    }

    if (content !== undefined) {
      repository.content = content;
    }

    if (description !== undefined) {
      repository.description = description;
    }

    const updatedRepository = await repository.save();

    res.status(200).json({
      message: "Repository updated successfully",
      repository: updatedRepository,
    });
  } catch (error) {
    console.error("Error updating repository:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const toggleVisibilityByID = async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid repository ID!" });
    }

    const repository = await Repository.findById(id);

    if (!repository) {
      return res.status(404).json({ message: "Repository not found" });
    }

    if (repository.owner.toString() !== req.user.toString()) {
      return res
        .status(403)
        .json({
          message: "Unauthorized to toggle visibility of this repository",
        });
    }

    repository.visibility = !repository.visibility;

    const updatedRepository = await repository.save();

    res.status(200).json({
      message: "Repository visibility toggled successfully",
      repository: updatedRepository,
    });
  } catch (error) {
    console.error("Error toggling repository visibility:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteRepoByID = async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid repository ID!" });
    }

    const repository = await Repository.findById(id);

    if (!repository) {
      return res.status(404).json({ message: "Repository not found" });
    }

    if (repository.owner.toString() !== req.user.toString()) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this repository" });
    }

    await Repository.findByIdAndDelete(id);

    res.status(200).json({
      message: "Repository deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting repository:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const syncPushData = async (req, res) => {
  const { repoName, commits, content } = req.body;
  const userId = req.user;

  try {
    if (typeof repoName !== "string" || !repoName.trim()) {
      return res.status(400).json({ error: "Repository name is required!" });
    }
    if (commits !== undefined && !Array.isArray(commits)) {
      return res.status(400).json({ error: "Commits must be an array." });
    }
    if (content !== undefined && !Array.isArray(content)) {
      return res.status(400).json({ error: "Repository content must be an array." });
    }

    const normalizedRepoName = repoName.trim();
    const repository = await Repository.findOne({ name: normalizedRepoName, owner: userId });

    if (!repository) {
      const newRepository = new Repository({
        owner: userId,
        name: normalizedRepoName,
        description: `Repository for ${normalizedRepoName}`,
        visibility: true,
        content: content || [],
        commits: commits || [],
      });
      await newRepository.save();
      await newRepository.populate("owner", "username email");

      return res.status(200).json({
        message: "Repository successfully synchronized with cloud commits!",
        repository: newRepository,
      });
    }

    if (content !== undefined) {
      repository.content = content;
    }

    if (commits !== undefined) {
      const commitsById = new Map(
        (repository.commits || []).map((commit) => [
          commit.commitID,
          typeof commit.toObject === "function" ? commit.toObject() : commit,
        ]),
      );
      for (const commit of commits) {
        if (!commit || typeof commit.commitID !== "string" || !commit.commitID) {
          return res.status(400).json({ error: "Every commit must have a commit ID." });
        }
        commitsById.set(commit.commitID, commit);
      }
      repository.commits = [...commitsById.values()].sort((first, second) => {
        const firstDate = new Date(first.date).getTime();
        const secondDate = new Date(second.date).getTime();
        const safeFirstDate = Number.isNaN(firstDate) ? 0 : firstDate;
        const safeSecondDate = Number.isNaN(secondDate) ? 0 : secondDate;
        return safeFirstDate - safeSecondDate ||
          first.commitID.localeCompare(second.commitID);
      });
    }

    await repository.save();
    await repository.populate("owner", "username email");

    return res.status(200).json({
      message: "Repository successfully synchronized with cloud commits!",
      repository,
    });
  } catch (error) {
    console.error("Error syncing repository push data:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const fetchRepositoryForSync = async (req, res) => {
  const repoName = req.params.name;

  try {
    const repository = await Repository.findOne({ name: repoName, owner: req.user })
      .select("name owner commits");

    if (!repository) {
      return res.status(404).json({ message: "Repository not found for current user" });
    }

    return res.status(200).json({
      repository: {
        name: repository.name,
        owner: repository.owner.toString(),
        commits: repository.commits || [],
      },
    });
  } catch (error) {
    console.error("Error fetching repository sync metadata:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const fetchFileContent = async (req, res) => {
  const { id } = req.params;
  const requestedFileName = req.params.fileName;
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid repository ID!" });
    }

    const repository = await Repository.findById(id);
    if (!repository) {
      return res.status(404).json({ message: "Repository not found" });
    }

    const fileName = Array.isArray(requestedFileName)
      ? requestedFileName.join("/")
      : requestedFileName;
    const fileSegments = fileName.replace(/\\/g, "/").split("/");
    if (
      !fileName ||
      fileSegments.some((segment) => !segment || segment === "." || segment === "..")
    ) {
      return res.status(400).json({ message: "Invalid file path" });
    }

    const relativeFilePath = fileSegments.join("/");
    const commits = [...(repository.commits || [])].filter((commit) =>
      Array.isArray(commit.files) &&
      commit.files.some((file) => file.replace(/\\/g, "/") === relativeFilePath),
    );
    commits.sort((first, second) => {
      const firstDate = new Date(first.date).getTime();
      const secondDate = new Date(second.date).getTime();
      const safeFirstDate = Number.isNaN(firstDate) ? 0 : firstDate;
      const safeSecondDate = Number.isNaN(secondDate) ? 0 : secondDate;
      return safeSecondDate - safeFirstDate ||
        second.commitID.localeCompare(first.commitID);
    });
    const commitId = commits[0]?.commitID || null;

    let fileText;

    if (
      commitId &&
      (typeof commitId !== "string" ||
        commitId.includes("/") ||
        commitId.includes("\\") ||
        commitId === "." ||
        commitId === "..")
    ) {
      return res.status(404).json({ message: "File not found in repository commits" });
    }

    const localFilePath = path.resolve(
      process.cwd(),
      ".apnaGit",
      "commits",
      commitId || "",
      ...fileSegments,
    );
    const localRelativePath = path.relative(
      path.resolve(process.cwd(), ".apnaGit", "commits"),
      localFilePath,
    );
    if (localRelativePath.startsWith("..") || path.isAbsolute(localRelativePath)) {
      return res.status(400).json({ message: "Invalid file path" });
    }

    if (commitId && S3_BUCKET) {
      try {
        const s3Data = await s3
          .getObject({
            Bucket: S3_BUCKET,
            Key: `${getRepositoryCommitsPrefix(repository.owner.toString(), repository.name)}${commitId}/${relativeFilePath}`,
          })
          .promise();
        fileText = s3Data.Body.toString("utf-8");
      } catch (s3Err) {
        const isMissingScopedObject =
          s3Err.code === "NoSuchKey" ||
          s3Err.code === "NotFound" ||
          s3Err.statusCode === 404;

        if (isMissingScopedObject) {
          try {
            const legacyData = await s3
              .getObject({
                Bucket: S3_BUCKET,
                Key: `commits/${commitId}/${relativeFilePath}`,
              })
              .promise();
            fileText = legacyData.Body.toString("utf-8");
          } catch (legacyError) {
            const isMissingLegacyObject =
              legacyError.code === "NoSuchKey" ||
              legacyError.code === "NotFound" ||
              legacyError.statusCode === 404;
            if (!isMissingLegacyObject) {
              console.warn(
                `Legacy S3 file lookup failed for ${fileName}:`,
                legacyError.message,
              );
            }
          }
        } else {
          console.warn(`S3 getObject failed for ${fileName}:`, s3Err.message);
        }
      }
    }

    if (fileText === undefined && commitId) {
      try {
        fileText = await fs.readFile(localFilePath, "utf-8");
      } catch (localError) {
        if (localError.code !== "ENOENT") {
          console.warn(`Local file read failed for ${fileName}:`, localError.message);
        }
      }
    }

    if (fileText === undefined) {
      return res.status(404).json({ message: "File not found in repository commits" });
    }

    return res.status(200).json({
      fileName,
      commitID: commitId,
      content: fileText,
    });
  } catch (error) {
    console.error("Error fetching file content:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export {
  createRepository,
  getAllRepositories,
  fetchRepositoryByID,
  fetchRepositoryByName,
  fetchRepositoryForCurrentUser,
  deleteRepoByID,
  updateRepositoryByID,
  toggleVisibilityByID,
  syncPushData,
  fetchRepositoryForSync,
  fetchFileContent,
};
