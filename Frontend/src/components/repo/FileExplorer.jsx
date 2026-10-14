import React, { useState } from "react";
import { File, Folder, FileCode, FileText, ChevronRight, Eye } from "lucide-react";

const FileExplorer = ({ files = [], onSelectFile }) => {
  const [selectedFile, setSelectedFile] = useState(null);

  const getFileIcon = (fileName) => {
    if (fileName.endsWith("/")) return <Folder className="w-4 h-4 text-gh-accent" />;
    if (fileName.endsWith(".js") || fileName.endsWith(".jsx") || fileName.endsWith(".ts"))
      return <FileCode className="w-4 h-4 text-yellow-400" />;
    if (fileName.endsWith(".json")) return <FileCode className="w-4 h-4 text-emerald-400" />;
    if (fileName.endsWith(".md")) return <FileText className="w-4 h-4 text-blue-400" />;
    return <File className="w-4 h-4 text-gh-muted" />;
  };

  const handleRowClick = (fileName) => {
    setSelectedFile(fileName);
    if (onSelectFile) onSelectFile(fileName);
  };

  if (!files || files.length === 0) {
    return (
      <div className="bg-gh-surface border border-gh-border rounded-lg p-8 text-center text-gh-muted">
        <p>This repository doesn't have any files committed yet.</p>
        <p className="text-xs mt-1">Use the CLI setup commands above to push your files.</p>
      </div>
    );
  }

  return (
    <div className="bg-gh-surface border border-gh-border rounded-lg overflow-hidden my-4">
      <div className="bg-gh-subtle/50 px-4 py-2.5 border-b border-gh-border flex items-center justify-between text-xs text-gh-muted font-medium">
        <span>Files in Repository</span>
        <span>{files.length} item{files.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="divide-y divide-gh-border">
        {files.map((file, idx) => (
          <div
            key={idx}
            onClick={() => handleRowClick(typeof file === "string" ? file : file.name || "file")}
            className="flex items-center justify-between px-4 py-2.5 hover:bg-gh-subtle/70 cursor-pointer text-sm text-gh-heading transition-colors group"
          >
            <div className="flex items-center gap-3">
              {getFileIcon(typeof file === "string" ? file : file.name || "")}
              <span className="font-mono text-xs group-hover:text-gh-accent transition-colors">
                {typeof file === "string" ? file : file.name}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gh-muted text-xs">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-gh-accent">
                <Eye className="w-3.5 h-3.5" /> View
              </span>
              <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileExplorer;
