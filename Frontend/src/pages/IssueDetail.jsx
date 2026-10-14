import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { issueApi } from "../api/client";
import {
  CircleDot,
  CheckCircle2,
  ArrowLeft,
  Trash2,
  Clock,
  User,
  AlertCircle,
} from "lucide-react";

const IssueDetail = () => {
  const { repoId, issueId } = useParams();
  const navigate = useNavigate();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchIssue = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await issueApi.getById(issueId);
      setIssue(res.data.issue);
    } catch (err) {
      console.error("Failed to load issue:", err);
      setError("Issue not found or network error.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssue();
  }, [issueId]);

  const handleToggleStatus = async () => {
    if (!issue) return;
    const newStatus = issue.status === "open" ? "closed" : "open";
    setActionLoading(true);

    try {
      const res = await issueApi.update(issueId, { status: newStatus });
      setIssue(res.data.issue);
    } catch (err) {
      console.error("Failed to toggle status:", err);
      alert("Failed to update issue status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteIssue = async () => {
    if (!window.confirm("Are you sure you want to delete this issue?")) return;

    setActionLoading(true);
    try {
      await issueApi.delete(issueId);
      navigate(`/repo/${repoId}`);
    } catch (err) {
      console.error("Failed to delete issue:", err);
      alert("Failed to delete issue.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gh-accent mb-3"></div>
        <p className="text-xs text-gh-muted">Loading issue details...</p>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="bg-gh-surface border border-gh-border rounded-xl p-8 shadow-md">
          <AlertCircle className="w-10 h-10 text-gh-danger mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gh-heading mb-2">Issue Not Found</h2>
          <p className="text-xs text-gh-muted mb-4">{error || "Could not retrieve issue."}</p>
          <Link
            to={`/repo/${repoId}`}
            className="bg-gh-subtle hover:bg-gh-border text-gh-heading text-xs font-semibold px-4 py-2 rounded-md border border-gh-border transition-colors"
          >
            Back to Repository
          </Link>
        </div>
      </div>
    );
  }

  const isOpen = issue.status === "open";

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Back button */}
      <Link
        to={`/repo/${repoId}`}
        className="inline-flex items-center gap-1.5 text-xs text-gh-muted hover:text-gh-heading mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to issues list
      </Link>

      {/* Header */}
      <div className="border-b border-gh-border pb-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gh-heading tracking-tight">
            {issue.title} <span className="text-gh-muted font-normal">#{issue._id.slice(-4)}</span>
          </h1>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleToggleStatus}
              disabled={actionLoading}
              className={`text-xs font-semibold px-3.5 py-1.5 rounded-md border transition-colors flex items-center gap-1.5 ${
                isOpen
                  ? "bg-gh-subtle hover:bg-gh-border border-gh-border text-gh-heading"
                  : "bg-gh-success hover:bg-gh-successHover text-white border-gh-border"
              }`}
            >
              {isOpen ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-gh-purple" />
                  <span>Close issue</span>
                </>
              ) : (
                <>
                  <CircleDot className="w-3.5 h-3.5 text-white" />
                  <span>Reopen issue</span>
                </>
              )}
            </button>

            <button
              onClick={handleDeleteIssue}
              disabled={actionLoading}
              className="text-xs text-gh-danger hover:bg-gh-danger/10 border border-gh-border p-2 rounded-md transition-colors"
              title="Delete issue"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Status Pill & Subtitle */}
        <div className="flex items-center gap-3 mt-3 text-xs text-gh-muted flex-wrap">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold text-xs text-white ${
              isOpen ? "bg-gh-success" : "bg-gh-purple"
            }`}
          >
            {isOpen ? <CircleDot className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            <span className="capitalize">{issue.status}</span>
          </div>

          <span className="flex items-center gap-1">
            <User className="w-3.5 h-3.5" /> Created by contributor
          </span>

          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Status active
          </span>
        </div>
      </div>

      {/* Issue Content Card */}
      <div className="bg-gh-surface border border-gh-border rounded-xl overflow-hidden shadow-sm">
        <div className="bg-gh-subtle/50 px-5 py-3 border-b border-gh-border flex items-center justify-between text-xs text-gh-muted">
          <span>Description</span>
          <span>Markdown rendered</span>
        </div>

        <div className="p-6 markdown-body">
          <ReactMarkdown>{issue.description || "*No description provided.*"}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default IssueDetail;
