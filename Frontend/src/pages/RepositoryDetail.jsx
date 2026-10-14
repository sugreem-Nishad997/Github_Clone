import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { repoApi, issueApi } from "../api/client";
import {
  GitBranch,
  Code,
  GitCommit,
  CircleDot,
  Settings,
  Star,
  Lock,
  Globe,
  Plus,
  Trash2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import CliQuickStart from "../components/repo/CliQuickStart";
import FileExplorer from "../components/repo/FileExplorer";
import CommitTimeline from "../components/repo/CommitTimeline";
import ReadmeViewer from "../components/repo/ReadmeViewer";
import FileViewerModal from "../components/repo/FileViewerModal";
import IssueCard from "../components/issues/IssueCard";
import NewIssueModal from "../components/issues/NewIssueModal";

const RepositoryDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [repo, setRepo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("code"); // code, commits, issues, settings
  const [issueFilter, setIssueFilter] = useState("open"); // open, closed, all
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [isStarred, setIsStarred] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // File Viewer & README states
  const [selectedFile, setSelectedFile] = useState(null);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [readmeContent, setReadmeContent] = useState(null);
  const [readmeFileName, setReadmeFileName] = useState(null);

  const fetchRepoData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await repoApi.getById(id);
      console.log("Fetched repository data:", res.data);
      setRepo(res.data.repository);
    } catch (err) {
      console.error("Failed to load repository:", err);
      setError("Repository not found or network error.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepoData();
  }, [id]);

  useEffect(() => {
    if (repo && repo.content && repo.content.length > 0) {
      const foundReadme = repo.content.find((f) => {
        const name = typeof f === "string" ? f : f?.name;
        return name && (name.toLowerCase() === "readme.md" || name.toLowerCase() === "readme");
      });

      if (foundReadme) {
        const fname = typeof foundReadme === "string" ? foundReadme : foundReadme.name;
        setReadmeFileName(fname);
        repoApi
          .getFileContent(repo._id, fname)
          .then((res) => {
            setReadmeContent(res.data?.content || "");
          })
          .catch((err) => {
            console.error("Failed to load README:", err);
            setReadmeContent(null);
          });
      } else {
        setReadmeFileName(null);
        setReadmeContent(null);
      }
    } else {
      setReadmeFileName(null);
      setReadmeContent(null);
    }
  }, [repo]);

  const isOwner =
    user && repo && (repo.owner?._id === user._id || repo.owner === user._id || repo.owner?._id === user.id);

  const handleToggleVisibility = async () => {
    setActionLoading(true);
    try {
      const res = await repoApi.toggleVisibility(id);
      setRepo(res.data.repository);
    } catch (err) {
      console.error("Toggle visibility failed:", err);
      alert("Failed to change repository visibility.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRepo = async () => {
    if (
      !window.confirm(
        `Are you absolutely sure you want to delete "${repo.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setActionLoading(true);
    try {
      await repoApi.delete(id);
      navigate("/");
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete repository.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleIssueCreated = (newIssue) => {
    setRepo((prev) => ({
      ...prev,
      issues: [...(prev.issues || []), newIssue],
    }));
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gh-accent mb-3"></div>
        <p className="text-xs text-gh-muted">Loading repository...</p>
      </div>
    );
  }

  if (error || !repo) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-gh-surface border border-gh-border rounded-xl p-8 shadow-md">
          <AlertTriangle className="w-10 h-10 text-gh-warning mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gh-heading mb-2">Repository Not Found</h2>
          <p className="text-xs text-gh-muted mb-4">{error || "Could not retrieve repository."}</p>
          <Link
            to="/"
            className="bg-gh-subtle hover:bg-gh-border text-gh-heading text-xs font-semibold px-4 py-2 rounded-md border border-gh-border transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const hasFiles = Boolean(repo?.content && repo.content.length > 0);
  const issuesList = repo.issues || [];
  const openIssues = issuesList.filter((i) => i.status === "open");
  const closedIssues = issuesList.filter((i) => i.status === "closed");
  const filteredIssues =
    issueFilter === "all"
      ? issuesList
      : issueFilter === "open"
      ? openIssues
      : closedIssues;

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
      {/* Repo Header */}
      <div className="border-b border-gh-border pb-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-9 h-9 rounded-full bg-gh-accent/20 border border-gh-accent/40 flex items-center justify-center text-gh-accent">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-gh-muted text-sm font-normal">
                  {repo.owner?.username || "user"}
                </span>
                <span className="text-gh-muted text-sm">/</span>
                <h1 className="text-lg sm:text-xl font-bold text-gh-heading">
                  {repo.name}
                </h1>
                <span className="text-[11px] font-medium bg-gh-subtle border border-gh-border text-gh-muted px-2 py-0.5 rounded-full flex items-center gap-1">
                  {repo.visibility ? (
                    <>
                      <Globe className="w-3 h-3" /> Public
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3 text-gh-warning" /> Private
                    </>
                  )}
                </span>
              </div>
              {repo.description && (
                <p className="text-xs text-gh-muted mt-1">{repo.description}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsStarred(!isStarred)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border transition-colors ${
                isStarred
                  ? "bg-yellow-500/10 border-yellow-500/40 text-yellow-400"
                  : "bg-gh-subtle hover:bg-gh-border border-gh-border text-gh-heading"
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${isStarred ? "fill-yellow-400" : ""}`} />
              <span>{isStarred ? "Starred" : "Star"}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 sm:gap-2 mt-6 border-b border-gh-border -mb-[17px] overflow-x-auto">
          <button
            onClick={() => setActiveTab("code")}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "code"
                ? "border-gh-accent text-gh-heading"
                : "border-transparent text-gh-muted hover:text-gh-heading"
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Code</span>
          </button>

          <button
            onClick={() => setActiveTab("commits")}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "commits"
                ? "border-gh-accent text-gh-heading"
                : "border-transparent text-gh-muted hover:text-gh-heading"
            }`}
          >
            <GitCommit className="w-4 h-4" />
            <span>Commits</span>
          </button>

          <button
            onClick={() => setActiveTab("issues")}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "issues"
                ? "border-gh-accent text-gh-heading"
                : "border-transparent text-gh-muted hover:text-gh-heading"
            }`}
          >
            <CircleDot className="w-4 h-4" />
            <span>Issues</span>
            <span className="bg-gh-subtle border border-gh-border text-[10px] text-gh-muted px-1.5 py-0.2 rounded-full">
              {openIssues.length}
            </span>
          </button>

          {isOwner && (
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                activeTab === "settings"
                  ? "border-gh-accent text-gh-heading"
                  : "border-transparent text-gh-muted hover:text-gh-heading"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {/* 1. CODE TAB */}
        {activeTab === "code" && (
          <div className="space-y-6">
            {!hasFiles && <CliQuickStart repoName={repo.name} />}
            <FileExplorer
              files={hasFiles ? repo.content : []}
              onSelectFile={(fileName) => {
                setSelectedFile(fileName);
                setIsFileModalOpen(true);
              }}
            />
            {hasFiles && readmeContent && (
              <ReadmeViewer content={readmeContent} fileName={readmeFileName || "README.md"} />
            )}
          </div>
        )}

        {/* 2. COMMITS TAB */}
        {activeTab === "commits" && (
          <div>
            <CommitTimeline commits={repo.commits || []} />
          </div>
        )}

        {/* 3. ISSUES TAB */}
        {activeTab === "issues" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Filter Pills */}
              <div className="flex items-center gap-2 bg-gh-surface border border-gh-border p-1 rounded-lg text-xs font-medium">
                <button
                  onClick={() => setIssueFilter("open")}
                  className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                    issueFilter === "open"
                      ? "bg-gh-subtle text-gh-heading font-semibold"
                      : "text-gh-muted hover:text-gh-heading"
                  }`}
                >
                  <CircleDot className="w-3.5 h-3.5 text-gh-success" />
                  <span>{openIssues.length} Open</span>
                </button>
                <button
                  onClick={() => setIssueFilter("closed")}
                  className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                    issueFilter === "closed"
                      ? "bg-gh-subtle text-gh-heading font-semibold"
                      : "text-gh-muted hover:text-gh-heading"
                  }`}
                >
                  <span>{closedIssues.length} Closed</span>
                </button>
                <button
                  onClick={() => setIssueFilter("all")}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    issueFilter === "all"
                      ? "bg-gh-subtle text-gh-heading font-semibold"
                      : "text-gh-muted hover:text-gh-heading"
                  }`}
                >
                  All ({issuesList.length})
                </button>
              </div>

              <button
                onClick={() => setIsIssueModalOpen(true)}
                className="bg-gh-success hover:bg-gh-successHover text-white text-xs font-semibold px-3.5 py-1.5 rounded-md border border-gh-border transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                New Issue
              </button>
            </div>

            {/* Issue List Card */}
            <div className="bg-gh-surface border border-gh-border rounded-lg overflow-hidden shadow-sm">
              {filteredIssues.length === 0 ? (
                <div className="text-center py-12 px-4 text-xs text-gh-muted">
                  <CircleDot className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="font-semibold text-gh-heading">No {issueFilter} issues found</p>
                  <p className="mt-1">
                    {issueFilter === "open"
                      ? "There are currently no open issues in this repository."
                      : "No issues match this filter."}
                  </p>
                </div>
              ) : (
                filteredIssues.map((issue) => (
                  <IssueCard key={issue._id || issue.id} issue={issue} repoId={repo._id} />
                ))
              )}
            </div>
          </div>
        )}

        {/* 4. SETTINGS TAB */}
        {activeTab === "settings" && isOwner && (
          <div className="max-w-2xl space-y-6">
            {/* Visibility card */}
            <div className="bg-gh-surface border border-gh-border rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gh-heading mb-1">
                Change Repository Visibility
              </h3>
              <p className="text-xs text-gh-muted mb-4">
                Currently, this repository is{" "}
                <span className="font-semibold text-gh-heading">
                  {repo.visibility ? "Public" : "Private"}
                </span>
                .
              </p>
              <button
                onClick={handleToggleVisibility}
                disabled={actionLoading}
                className="bg-gh-subtle hover:bg-gh-border text-gh-heading text-xs font-semibold px-4 py-2 rounded-md border border-gh-border transition-colors flex items-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? "animate-spin" : ""}`} />
                Make {repo.visibility ? "Private" : "Public"}
              </button>
            </div>

            {/* Danger Zone */}
            <div className="bg-gh-surface border border-gh-danger/40 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gh-danger mb-1 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Danger Zone
              </h3>
              <p className="text-xs text-gh-muted mb-4">
                Deleting this repository will remove all associated files, commit history, and issues.
              </p>
              <button
                onClick={handleDeleteRepo}
                disabled={actionLoading}
                className="bg-gh-danger hover:bg-gh-dangerHover text-white text-xs font-semibold px-4 py-2 rounded-md border border-gh-border transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete this repository
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Issue Modal */}
      <NewIssueModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        repoId={repo._id}
        onIssueCreated={handleIssueCreated}
      />

      
      {/* File Viewer Modal */}
      <FileViewerModal
        isOpen={isFileModalOpen}
        onClose={() => {
          setIsFileModalOpen(false);
          setSelectedFile(null);
        }}
        repoId={repo._id}
        fileName={selectedFile}
      />
    </div>
  );
};

export default RepositoryDetail;
