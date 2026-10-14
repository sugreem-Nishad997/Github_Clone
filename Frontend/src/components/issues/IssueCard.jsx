import React from "react";
import { Link } from "react-router-dom";
import { CircleDot, CheckCircle2, MessageSquare } from "lucide-react";

const IssueCard = ({ issue, repoId }) => {
  const isOpen = issue.status === "open";

  return (
    <div className="flex items-start justify-between px-4 py-3 hover:bg-gh-subtle/50 transition-colors border-b border-gh-border last:border-b-0">
      <div className="flex items-start gap-3">
        {isOpen ? (
          <CircleDot className="w-4 h-4 text-gh-success flex-shrink-0 mt-0.5" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-gh-purple flex-shrink-0 mt-0.5" />
        )}

        <div>
          <Link
            to={`/repo/${repoId}/issues/${issue._id || issue.id}`}
            className="text-sm font-semibold text-gh-heading hover:text-gh-accent transition-colors"
          >
            {issue.title}
          </Link>

          <p className="text-xs text-gh-muted mt-1">
            #{issue._id ? issue._id.slice(-4) : "1"} opened by contributor • Status:{" "}
            <span
              className={`font-medium ${
                isOpen ? "text-gh-success" : "text-gh-purple"
              }`}
            >
              {issue.status}
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 text-xs text-gh-muted">
        <MessageSquare className="w-3.5 h-3.5" />
        <span>1</span>
      </div>
    </div>
  );
};

export default IssueCard;
