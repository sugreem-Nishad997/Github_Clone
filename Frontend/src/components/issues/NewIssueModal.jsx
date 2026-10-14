import React, { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { issueApi } from "../../api/client";

const NewIssueModal = ({ isOpen, onClose, repoId, onIssueCreated }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await issueApi.create({
        title,
        description,
        status: "open",
        repository: repoId,
      });

      setTitle("");
      setDescription("");
      if (onIssueCreated) onIssueCreated(res.data.issue);
      onClose();
    } catch (err) {
      console.error("Failed to create issue:", err);
      setError(err.response?.data?.message || "Failed to create issue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gh-surface border border-gh-border rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gh-border">
          <h3 className="font-semibold text-gh-heading text-sm">Create New Issue</h3>
          <button
            onClick={onClose}
            className="text-gh-muted hover:text-gh-heading p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-gh-danger/10 border border-gh-danger/30 rounded-md p-3 text-xs text-gh-dangerHover flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gh-heading mb-1.5">
              Title
            </label>
            <input
              type="text"
              placeholder="e.g. Bug: S3 upload fails on large files"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gh-bg border border-gh-border rounded-md px-3 py-2 text-sm text-gh-heading placeholder-gh-muted focus:outline-none focus:border-gh-accent focus:ring-1 focus:ring-gh-accent transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gh-heading mb-1.5">
              Description (Markdown supported)
            </label>
            <textarea
              rows={5}
              placeholder="Describe the issue in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gh-bg border border-gh-border rounded-md px-3 py-2 text-sm text-gh-heading placeholder-gh-muted focus:outline-none focus:border-gh-accent focus:ring-1 focus:ring-gh-accent font-mono text-xs transition-all"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gh-text hover:text-gh-heading bg-gh-subtle hover:bg-gh-border border border-gh-border rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-gh-success hover:bg-gh-successHover border border-gh-border rounded-md transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? "Submitting..." : "Submit New Issue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewIssueModal;
