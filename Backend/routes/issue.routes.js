import express from "express";
import {
  updateIssueByID,
  createIssue,
  deleteIssueByID,
  getAllIssues,
  getIssueByID,
} from "../controllers/issueController.js";
const issueRouter = express.Router();

issueRouter.post("/issue/create", createIssue);
issueRouter.put("/issue/update/:id", updateIssueByID);
issueRouter.delete("/issue/delete/:id", deleteIssueByID);
issueRouter.get("/issue/all", getAllIssues);
issueRouter.get("/issue/:id", getIssueByID);

export default issueRouter;
