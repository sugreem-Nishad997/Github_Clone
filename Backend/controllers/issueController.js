import Issue from "../models/issueModel.js";
import Repository from "../models/repoModel.js";
import mongoose from "mongoose";

const createIssue = async (req, res) => {
  const { title, description, status, repository } = req.body;

  if (!title || !description || !repository) {
    return res.status(400).json({
      message: "title, description and repository are required",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(repository)) {
    return res.status(400).json({ message: "Invalid repository ID" });
  }

  try {
    const repo = await Repository.findById(repository);
    if (!repo) {
      return res.status(404).json({ message: "Repository not found" });
    }

    const issue = new Issue({ title, description, status, repository });
    const savedIssue = await issue.save();

    repo.issues = [...repo.issues, savedIssue._id];
    await repo.save();

    res.status(201).json({
      message: "Issue created successfully",
      issue: savedIssue,
    });
  } catch (error) {
    console.error("Error creating issue:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateIssueByID = async (req, res) => {
  const { id } = req.params;
  const { title, description, status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid issue ID" });
  }

  try {
    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    if (title !== undefined) issue.title = title;
    if (description !== undefined) issue.description = description;
    if (status !== undefined) {
      if (!["open", "closed"].includes(status)) {
        return res
          .status(400)
          .json({ message: "Invalid status value (open/closed only)" });
      }
      issue.status = status;
    }

    const updatedIssue = await issue.save();
    res.status(200).json({ message: "Issue updated", issue: updatedIssue });
  } catch (error) {
    console.error("Error updating issue:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteIssueByID = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid issue ID" });
  }

  try {
    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    await Issue.findByIdAndDelete(id);

    if (issue.repository) {
      await Repository.findByIdAndUpdate(issue.repository, {
        $pull: { issues: issue._id },
      });
    }

    res.status(200).json({ message: "Issue deleted successfully" });
  } catch (error) {
    console.error("Error deleting issue:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getAllIssues = async (req, res) => {
  try {
    const issues = await Issue.find().populate("repository");
    if (!issues || issues.length === 0) {
      return res.status(404).json({ message: "No issues found" });
    }

    res.status(200).json({
      message: "All issues fetched successfully",
      count: issues.length,
      issues,
    });
  } catch (error) {
    console.error("Error fetching issues:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getIssueByID = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid issue ID" });
  }

  try {
    const issue = await Issue.findById(id).populate("repository");
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    res.status(200).json({ message: "Issue fetched successfully", issue });
  } catch (error) {
    console.error("Error fetching issue:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export {
  createIssue,
  updateIssueByID,
  deleteIssueByID,
  getAllIssues,
  getIssueByID,
};
