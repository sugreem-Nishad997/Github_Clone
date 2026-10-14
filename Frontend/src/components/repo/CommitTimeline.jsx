import React, { useState } from "react";
import { GitCommit, Copy, Check, Clock, User, FileText } from "lucide-react";

const CommitTimeline = ({ commits = [] }) => {
  const [copiedHash, setCopiedHash] = useState(null);

  const handleCopy = (hash) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const displayCommits = Array.isArray(commits) ? commits : [];

  if (displayCommits.length === 0) {
    return (
      <div className="bg-gh-surface border border-gh-border rounded-lg p-10 text-center text-gh-muted my-4">
        <GitCommit className="w-10 h-10 mx-auto mb-3 opacity-30 text-gh-accent" />
        <h4 className="text-sm font-semibold text-gh-heading mb-1">No commits pushed yet</h4>
        <p className="text-xs text-gh-muted">
          Commit your changes locally and run <code className="bg-gh-bg px-1.5 py-0.5 rounded text-gh-accent">apnagit push</code> to see your commit history here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gh-surface border border-gh-border rounded-lg p-4 my-4">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gh-border text-sm font-semibold text-gh-heading">
        <GitCommit className="w-4 h-4 text-gh-accent" />
        <span>Commit History ({displayCommits.length})</span>
      </div>

      <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-gh-border">
        {displayCommits.map((commit, idx) => {
          const rawHash = commit.commitID || commit.id || commit._id || "unknown";
          const shortHash = rawHash.slice(0, 8);
          const commitFiles = Array.isArray(commit.files) ? commit.files : [];

          return (
            <div key={idx} className="relative flex items-start gap-4 pl-8 group">
              {/* Dot icon on the timeline */}
              <div className="absolute left-1.5 top-1.5 w-4 h-4 rounded-full bg-gh-surface border-2 border-gh-accent flex items-center justify-center -translate-x-1/2">
                <div className="w-1.5 h-1.5 rounded-full bg-gh-accent"></div>
              </div>

              <div className="flex-1 bg-gh-bg border border-gh-border rounded-md p-3 hover:border-gh-muted transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gh-heading">
                      {commit.message || "Commit update"}
                    </h4>

                    <div className="flex items-center gap-3 text-xs text-gh-muted mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {commit.author || "User"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {commit.date
                          ? new Date(commit.date).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Recently"}
                      </span>
                      {commitFiles.length > 0 && (
                        <span className="flex items-center gap-1 text-[11px] bg-gh-subtle border border-gh-border px-1.5 py-0.2 rounded text-gh-muted">
                          <FileText className="w-2.5 h-2.5" />
                          {commitFiles.length} file{commitFiles.length !== 1 ? "s" : ""} changed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hash & Copy Button */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="font-mono text-xs text-gh-accent bg-gh-accent/10 border border-gh-accent/20 px-2 py-0.5 rounded">
                      {shortHash}
                    </span>
                    <button
                      onClick={() => handleCopy(rawHash)}
                      className="p-1 text-gh-muted hover:text-gh-heading rounded hover:bg-gh-subtle transition-colors"
                      title="Copy full commit UUID"
                    >
                      {copiedHash === rawHash ? (
                        <Check className="w-3.5 h-3.5 text-gh-success" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CommitTimeline;
