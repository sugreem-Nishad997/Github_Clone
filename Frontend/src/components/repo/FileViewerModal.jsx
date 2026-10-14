import React, { useState, useEffect, useCallback, useRef } from "react";
import { X, Copy, Check, FileCode, FileText, File, Loader2, Code2, Eye } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { repoApi } from "../../api/client";

const FileViewerModal = ({ isOpen, onClose, repoId, fileName }) => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState("code"); // 'code' or 'preview'
  const requestIdRef = useRef(0);
  const copyTimeoutRef = useRef(null);

  const isMarkdown = fileName && (fileName.toLowerCase().endsWith(".md") || fileName.toLowerCase().endsWith(".markdown"));

  const loadFileContent = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const res = await repoApi.getFileContent(repoId, fileName);
      if (requestId === requestIdRef.current) {
        setContent(res.data?.content || "");
      }
    } catch (err) {
      console.error("Failed to load file content:", err);
      if (requestId === requestIdRef.current) {
        setError("Unable to load file content from cloud storage or server.");
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [repoId, fileName]);

  useEffect(() => {
    if (isOpen && fileName && repoId) {
      loadFileContent();
      setViewMode(isMarkdown ? "preview" : "code");
    } else {
      requestIdRef.current += 1;
      setContent("");
      setError(null);
      setLoading(false);
    }

    return () => {
      requestIdRef.current += 1;
    };
  }, [isOpen, fileName, repoId, isMarkdown, loadFileContent]);

  useEffect(() => () => {
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleCopy = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy file content:", err);
    }
  };

  if (!isOpen || !fileName) return null;

  const lines = content ? content.split("\n") : [];

  const getFileIcon = () => {
    if (isMarkdown) return <FileText className="w-4 h-4 text-blue-400" />;
    if (fileName.match(/\.(js|jsx|ts|tsx|json|html|css|py|go|rs|c|cpp|java|php)$/i)) {
      return <FileCode className="w-4 h-4 text-yellow-400" />;
    }
    return <File className="w-4 h-4 text-gh-muted" />;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-gh-surface border border-gh-border rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Viewing ${fileName}`}
      >
        {/* Modal Header */}
        <div className="bg-gh-subtle/70 px-4 py-3 border-b border-gh-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {getFileIcon()}
            <span className="font-mono text-sm font-semibold text-gh-heading truncate">
              {fileName}
            </span>
            {!loading && !error && (
              <span className="text-[11px] text-gh-muted bg-gh-surface px-2 py-0.5 rounded border border-gh-border hidden sm:inline-block">
                {lines.length} line{lines.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {isMarkdown && !loading && !error && (
              <div className="flex items-center bg-gh-bg border border-gh-border rounded p-0.5 text-xs">
                <button
                  onClick={() => setViewMode("preview")}
                  className={`px-2.5 py-1 rounded flex items-center gap-1 transition-colors ${
                    viewMode === "preview"
                      ? "bg-gh-subtle text-gh-heading font-medium"
                      : "text-gh-muted hover:text-gh-heading"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
                <button
                  onClick={() => setViewMode("code")}
                  className={`px-2.5 py-1 rounded flex items-center gap-1 transition-colors ${
                    viewMode === "code"
                      ? "bg-gh-subtle text-gh-heading font-medium"
                      : "text-gh-muted hover:text-gh-heading"
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Code</span>
                </button>
              </div>
            )}

            <button
              onClick={handleCopy}
              disabled={loading || !content}
              className="flex items-center gap-1.5 text-xs text-gh-muted hover:text-gh-heading bg-gh-surface hover:bg-gh-border px-2.5 py-1.5 rounded border border-gh-border transition-colors disabled:opacity-50"
              title="Copy file content"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-gh-success" />
                  <span className="text-gh-success">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Copy</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="text-gh-muted hover:text-gh-heading p-1.5 rounded hover:bg-gh-subtle transition-colors"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-auto bg-gh-bg p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gh-muted text-xs">
              <Loader2 className="w-7 h-7 animate-spin text-gh-accent mb-3" />
              <span>Fetching file content from storage...</span>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-gh-muted">
              <p className="text-gh-danger text-sm font-semibold mb-1">{error}</p>
              <button
                onClick={loadFileContent}
                className="mt-3 text-xs bg-gh-subtle hover:bg-gh-border text-gh-heading px-3 py-1.5 rounded border border-gh-border transition-colors"
              >
                Retry
              </button>
            </div>
          ) : isMarkdown && viewMode === "preview" ? (
            <div className="p-6 markdown-body text-gh-heading bg-gh-surface min-h-full">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          ) : (
            <div className="font-mono text-xs leading-relaxed overflow-x-auto min-h-full flex">
              {/* Line numbers column */}
              <div className="bg-gh-surface/80 border-r border-gh-border py-4 px-3 select-none text-right text-gh-muted text-[11px] flex flex-col font-mono flex-shrink-0 min-w-[48px]">
                {lines.map((_, i) => (
                  <span key={i} className="leading-6 opacity-60">
                    {i + 1}
                  </span>
                ))}
              </div>

              {/* Code lines */}
              <div className="py-4 px-4 flex-1 overflow-x-auto">
                {lines.map((line, i) => (
                  <div key={i} className="leading-6 text-gh-heading whitespace-pre hover:bg-gh-subtle/40 px-1 rounded">
                    {line || "\u00A0"}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-gh-subtle/50 px-4 py-2 border-t border-gh-border flex items-center justify-between text-[11px] text-gh-muted">
          <span>Viewing commit snapshot</span>
          <button
            onClick={onClose}
            className="hover:text-gh-heading transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileViewerModal;
