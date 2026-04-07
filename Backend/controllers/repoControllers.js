import Repository from "../models/repoModel.js";
import Issue from "../models/issueModel.js";
import Users from "../models/userModel.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const createRepository = async (req, res) => {
  const { owner, name, issues, content, description, visibility } = req.body;

  try {
    if (!name) {
      res.status(400).json({ error: "Repository name is required!" });
    }

    if (!mongoose.Types.ObjectId.isValid(owner)) {
      res.status(400).json({ error: "Invalid User Id!" });
    }

    const newRepository = new Repository({
      owner,
      name,
      issues,
      content,
      description,
      visibility,
    });

    const result = await newRepository.save();
    res
      .status(201)
      .json({ message: "Repository created!", repositoryID: result._id });
  } catch (error) {
    console.error("Error during updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
  res.send("Repository created");
};

const getAllRepositories = async (req, res) => {
  try {
    const repositories = await Repository.find()
      .populate("owner")
      .populate("issues");

    if (!repositories || repositories.length === 0) {
      return res.status(404).json({ message: "No repositories found" });
    }

    res.status(200).json({
      message: "All repositories fetched successfully",
      count: repositories.length,
      repositories,
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
      .populate("owner")
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

    const repository = await Repository.find({
      name,
    })
      .populate("owner")
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
    const id = req.user;
    const repositories = await Repository.find({ owner: id })
      .populate("owner", "name email")
      .populate("issues");

    if (!repositories || repositories.length === 0) {
      return res
        .status(404)
        .json({ message: "No repositories found for current user" });
    }

    res.status(200).json({
      message: "Repositories fetched successfully",
      count: repositories.length,
      repositories,
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

export {
  createRepository,
  getAllRepositories,
  fetchRepositoryByID,
  fetchRepositoryByName,
  fetchRepositoryForCurrentUser,
  deleteRepoByID,
  updateRepositoryByID,
  toggleVisibilityByID,
};
