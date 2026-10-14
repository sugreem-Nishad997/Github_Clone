import React from "react";
import ReactMarkdown from "react-markdown";
import { BookOpen } from "lucide-react";

const ReadmeViewer = ({ content, fileName = "README.md" }) => {
  if (!content) return null;

  return (
    <div className="bg-gh-surface border border-gh-border rounded-lg overflow-hidden my-6">
      <div className="bg-gh-subtle/50 px-4 py-2.5 border-b border-gh-border flex items-center gap-2 text-xs font-semibold text-gh-heading">
        <BookOpen className="w-4 h-4 text-gh-muted" />
        <span>{fileName}</span>
      </div>
      <div className="p-6 markdown-body text-gh-heading">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
};

export default ReadmeViewer;
