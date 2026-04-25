import React, { useCallback, useState } from "react";
import { aiQuery, resolveBook, type AiAction, type AiQueryResponse } from "@/services/bookAwareApi";

export interface AiQueryPanelProps {
  selectedText: string;
  /** Publication identifier — used as sha256 if it is 64 hex chars */
  bookId?: string;
  bookTitle?: string;
  bookAuthor?: string;
  chapter?: string;
  progress?: number;
  onClose: () => void;
}

const ACTIONS: Array<{ key: AiAction; label: string }> = [
  { key: "dictionary", label: "词典" },
  { key: "ask",        label: "提问" },
  { key: "summarize",  label: "摘要" },
  { key: "analyze",    label: "分析" },
];

export function AiQueryPanel({
  selectedText,
  bookId,
  bookTitle,
  bookAuthor,
  chapter,
  progress,
  onClose,
}: AiQueryPanelProps) {
  const [action, setAction] = useState<AiAction>("dictionary");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AiQueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const book = await resolveBook(bookId, bookTitle);

      const result = await aiQuery({
        action,
        text: selectedText,
        question: question.trim() || (action === "dictionary" ? "Dictionary lookup with 中文 translation" : ""),
        book: { sha256: book.sha256, title: book.title, author: book.author },
        location: { chapter, progress },
      });

      setResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setLoading(false);
    }
  }, [action, question, selectedText, bookId, bookTitle, chapter, progress]);

  const answerText = response?.answer?.text ?? "";

  return (
    <div className="ai-panel-overlay" onClick={onClose}>
      <div className="ai-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ai-panel-header">
          <span className="ai-panel-title">AI 助读</span>
          <button className="ai-panel-close" onClick={onClose} aria-label="关闭">✕</button>
        </div>

        {/* Selected text preview */}
        <div className="ai-panel-selection">
          <span className="ai-panel-selection-label">选中文字</span>
          <p className="ai-panel-selection-text">
            {selectedText.length > 200 ? selectedText.slice(0, 200) + "…" : selectedText}
          </p>
        </div>

        {/* Action tabs */}
        <div className="ai-panel-actions">
          {ACTIONS.map(({ key, label }) => (
            <button
              key={key}
              className={`ai-panel-action-btn ${action === key ? "active" : ""}`}
              onClick={() => setAction(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Question input (not needed for dictionary) */}
        {action !== "dictionary" && (
          <div className="ai-panel-question">
            <input
              className="ai-panel-question-input"
              type="text"
              placeholder={action === "ask" ? "输入你的问题…" : "附加说明（可选）…"}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void handleSubmit(); }}
            />
          </div>
        )}

        {/* Submit */}
        {!response && (
          <button
            className="ai-panel-submit"
            onClick={() => void handleSubmit()}
            disabled={loading}
          >
            {loading ? "请求中…" : "发送"}
          </button>
        )}

        {/* Error */}
        {error && (
          <div className="ai-panel-error">{error}</div>
        )}

        {/* Response */}
        {response && (
          <div className="ai-panel-response">
            <div className="ai-panel-response-text">{answerText}</div>
            <button
              className="ai-panel-again"
              onClick={() => { setResponse(null); setError(null); }}
            >
              再次提问
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .ai-panel-overlay {
          position: fixed;
          inset: 0;
          z-index: 20000;
          background: rgba(0, 0, 0, 0.35);
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }

        .ai-panel {
          background: #fff;
          border-radius: 16px 16px 0 0;
          width: 100%;
          max-width: 680px;
          max-height: 80vh;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.18);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .ai-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .ai-panel-title {
          font-size: 16px;
          font-weight: 700;
          color: #111;
        }

        .ai-panel-close {
          border: none;
          background: transparent;
          font-size: 16px;
          color: #666;
          cursor: pointer;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
        }

        .ai-panel-close:hover {
          background: #f0f0f0;
          color: #111;
        }

        .ai-panel-selection {
          background: #f8f8f8;
          border-radius: 8px;
          padding: 10px 12px;
        }

        .ai-panel-selection-label {
          font-size: 11px;
          font-weight: 600;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: block;
          margin-bottom: 4px;
        }

        .ai-panel-selection-text {
          font-size: 14px;
          color: #333;
          line-height: 1.5;
          margin: 0;
          white-space: pre-wrap;
        }

        .ai-panel-actions {
          display: flex;
          gap: 8px;
        }

        .ai-panel-action-btn {
          flex: 1;
          padding: 8px 0;
          border: 1.5px solid #e0e0e0;
          border-radius: 8px;
          background: transparent;
          font-size: 13px;
          font-weight: 600;
          color: #555;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .ai-panel-action-btn:hover {
          border-color: #999;
          color: #111;
        }

        .ai-panel-action-btn.active {
          border-color: #1a73e8;
          background: #e8f0fe;
          color: #1a73e8;
        }

        .ai-panel-question-input {
          width: 100%;
          padding: 10px 12px;
          border: 1.5px solid #e0e0e0;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          box-sizing: border-box;
        }

        .ai-panel-question-input:focus {
          border-color: #1a73e8;
        }

        .ai-panel-submit {
          width: 100%;
          padding: 12px;
          background: #1a73e8;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .ai-panel-submit:hover:not(:disabled) {
          background: #1557b0;
        }

        .ai-panel-submit:disabled {
          background: #a0b9e8;
          cursor: default;
        }

        .ai-panel-error {
          color: #c62828;
          background: #ffebee;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 13px;
          line-height: 1.6;
        }

        .ai-panel-response {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .ai-panel-response-text {
          font-size: 15px;
          color: #222;
          line-height: 1.7;
          white-space: pre-wrap;
        }

        .ai-panel-again {
          align-self: flex-start;
          padding: 7px 14px;
          border: 1.5px solid #e0e0e0;
          border-radius: 8px;
          background: transparent;
          font-size: 13px;
          font-weight: 600;
          color: #555;
          cursor: pointer;
        }

        .ai-panel-again:hover {
          border-color: #999;
          color: #111;
        }

        @media (prefers-color-scheme: dark) {
          .ai-panel {
            background: #1e1e1e;
          }

          .ai-panel-title {
            color: #f0f0f0;
          }

          .ai-panel-close {
            color: #aaa;
          }

          .ai-panel-close:hover {
            background: #2a2a2a;
            color: #f0f0f0;
          }

          .ai-panel-selection {
            background: #2a2a2a;
          }

          .ai-panel-selection-label {
            color: #888;
          }

          .ai-panel-selection-text {
            color: #ddd;
          }

          .ai-panel-action-btn {
            border-color: #444;
            color: #aaa;
          }

          .ai-panel-action-btn:hover {
            border-color: #888;
            color: #f0f0f0;
          }

          .ai-panel-action-btn.active {
            border-color: #4a90e8;
            background: rgba(74, 144, 232, 0.15);
            color: #4a90e8;
          }

          .ai-panel-question-input {
            background: #2a2a2a;
            border-color: #444;
            color: #f0f0f0;
          }

          .ai-panel-question-input:focus {
            border-color: #4a90e8;
          }

          .ai-panel-response-text {
            color: #ddd;
          }

          .ai-panel-again {
            border-color: #444;
            color: #aaa;
          }

          .ai-panel-again:hover {
            border-color: #888;
            color: #f0f0f0;
          }
        }
      `}</style>
    </div>
  );
}
