import React, { useState } from "react";
import { Terminal, Copy, Check } from "lucide-react";

const CliQuickStart = ({ repoName }) => {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const commands = [
    {
      title: "1. Initialize local repository",
      code: "apnagit init",
    },
    {
      title: "2. Stage your files",
      code: "apnagit add .",
    },
    {
      title: "3. Commit changes",
      code: `apnagit commit "Initial commit for ${repoName}"`,
    },
    {
      title: "4. Push commits to remote (S3)",
      code: "apnagit push",
    },
    {
      title: "5. Pull commits anytime",
      code: "apnagit pull",
    },
  ];

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAll = () => {
    const allCode = commands.map((c) => c.code).join("\n");
    handleCopy(allCode, "all");
  };

  return (
    <div className="bg-gh-surface border border-gh-border rounded-lg p-5 my-6">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-gh-border">
        <div className="flex items-center gap-2 text-gh-heading font-semibold text-sm">
          <Terminal className="w-4 h-4 text-gh-accent" />
          <span>Quick Setup — Push an existing local project via CLI</span>
        </div>
        <button
          onClick={copyAll}
          className="flex items-center gap-1.5 text-xs text-gh-text hover:text-gh-heading bg-gh-subtle hover:bg-gh-border px-3 py-1 rounded border border-gh-border transition-colors"
        >
          {copiedIndex === "all" ? (
            <>
              <Check className="w-3.5 h-3.5 text-gh-success" />
              <span>Copied All</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy All Commands</span>
            </>
          )}
        </button>
      </div>

      <div className="space-y-3 font-mono text-xs">
        {commands.map((cmd, idx) => (
          <div key={idx} className="bg-gh-bg border border-gh-border rounded p-3 flex items-center justify-between gap-4">
            <div className="truncate">
              <span className="text-gh-muted block mb-1 font-sans">{cmd.title}:</span>
              <span className="text-gh-heading font-medium">{cmd.code}</span>
            </div>
            <button
              onClick={() => handleCopy(cmd.code, idx)}
              className="text-gh-muted hover:text-gh-heading p-1.5 rounded hover:bg-gh-subtle transition-colors flex-shrink-0"
              title="Copy snippet"
            >
              {copiedIndex === idx ? (
                <Check className="w-4 h-4 text-gh-success" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CliQuickStart;
