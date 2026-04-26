"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CompositionEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  AssistantRuntimeProvider,
  useAui,
  useAuiState,
  useLocalRuntime,
  type ChatModelAdapter,
} from "@assistant-ui/react";
import { Thread, makeMarkdownText } from "@assistant-ui/react-ui";
import { aiQuery, resolveBook } from "@/services/bookAwareApi";

const MarkdownText = makeMarkdownText();

export interface AiChatPanelProps {
  selectedText: string;
  bookId?: string;
  bookTitle?: string;
  bookAuthor?: string;
  chapter?: string;
  progress?: number;
  onClose: () => void;
}

const IconSend = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M8 13V3M3 8l5-5 5 5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconStop = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
    <rect width="10" height="10" rx="1.5" />
  </svg>
);

function ImeSafeComposer() {
  const aui = useAui();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isComposingRef = useRef(false);
  const composerText = useAuiState((s) => s.composer.text);
  const isDisabled = useAuiState(
    (s) => s.thread.isDisabled || !!s.composer.dictation?.inputDisabled,
  );
  const isRunning = useAuiState((s) => s.thread.isRunning);
  const canCancel = useAuiState((s) => s.composer.canCancel);
  const hasQueue = useAuiState((s) => s.thread.capabilities.queue);
  const [text, setText] = useState(composerText);

  useEffect(() => {
    if (!isComposingRef.current) setText(composerText);
  }, [composerText]);

  useEffect(() => {
    textareaRef.current?.focus({ preventScroll: true });
  }, []);

  const syncText = useCallback((value: string) => {
    setText(value);
    if (!isComposingRef.current) {
      aui.composer().setText(value);
    }
  }, [aui]);

  const send = useCallback(() => {
    const value = text.trim();
    if (!value || isDisabled || (isRunning && !hasQueue)) return;

    aui.composer().setText(text);
    aui.composer().send();
  }, [aui, hasQueue, isDisabled, isRunning, text]);

  const handleSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    send();
  }, [send]);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLTextAreaElement>) => {
    event.stopPropagation();

    const nativeEvent = event.nativeEvent as KeyboardEvent<HTMLTextAreaElement>["nativeEvent"] & {
      isComposing?: boolean;
      keyCode?: number;
    };

    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !isComposingRef.current &&
      !nativeEvent.isComposing &&
      nativeEvent.keyCode !== 229
    ) {
      event.preventDefault();
      send();
    }
  }, [send]);

  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback((event: CompositionEvent<HTMLTextAreaElement>) => {
    isComposingRef.current = false;
    const value = event.currentTarget.value;
    setText(value);
    aui.composer().setText(value);
  }, [aui]);

  const handleCancel = useCallback(() => {
    aui.composer().cancel();
  }, [aui]);

  const sendDisabled = !text.trim() || isDisabled || (isRunning && !hasQueue);

  return (
    <form className="aui-composer-root" onSubmit={handleSubmit}>
      <textarea
        ref={textareaRef}
        className="aui-composer-input"
        rows={1}
        placeholder="输入你的问题…"
        value={text}
        disabled={isDisabled}
        onChange={(event) => syncText(event.currentTarget.value)}
        onKeyDown={handleKeyDown}
        onKeyUp={(event) => event.stopPropagation()}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
      />

      {isRunning && canCancel ? (
        <button
          type="button"
          className="aui-composer-cancel aichat-composer-icon-btn"
          aria-label="停止生成"
          onClick={handleCancel}
        >
          <IconStop />
        </button>
      ) : (
        <button
          type="submit"
          className="aui-composer-send aichat-composer-icon-btn"
          aria-label="发送"
          disabled={sendDisabled}
        >
          <IconSend />
        </button>
      )}
    </form>
  );
}

function AiThread({
  runtime,
  selectedText,
}: {
  runtime: ReturnType<typeof useLocalRuntime>;
  selectedText: string;
}) {
  const suggestions = selectedText
    ? [
        { prompt: "解释这段文字", text: "解释这段文字" },
        { prompt: "总结这段文字的要点", text: "总结要点" },
        { prompt: "这段文字里有哪些关键信息？", text: "提取关键信息" },
      ]
    : [
        { prompt: "总结当前章节", text: "总结当前章节" },
        { prompt: "这本书主要讲什么？", text: "概括本书" },
        { prompt: "帮我梳理人物和关系", text: "梳理人物关系" },
      ];

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <Thread
        assistantAvatar={{ fallback: "AI" }}
        composer={{ allowAttachments: false }}
        branchPicker={{ allowBranchPicker: true }}
        components={{ Composer: ImeSafeComposer }}
        welcome={{
          message: "有什么想了解的？",
          suggestions,
        }}
        assistantMessage={{
          allowCopy: true,
          allowReload: true,
          allowSpeak: false,
          allowFeedbackPositive: false,
          allowFeedbackNegative: false,
          components: {
            Text: MarkdownText,
          },
        }}
        strings={{
          thread: {
            scrollToBottom: { tooltip: "滚动到底部" },
          },
          welcome: {
            message: "有什么想了解的？",
          },
          assistantMessage: {
            reload: { tooltip: "重新生成" },
            copy: { tooltip: "复制" },
          },
          branchPicker: {
            previous: { tooltip: "上一条" },
            next: { tooltip: "下一条" },
          },
          composer: {
            send: { tooltip: "发送" },
            cancel: { tooltip: "停止生成" },
            input: { placeholder: "输入你的问题…" },
          },
          userMessage: {
            edit: { tooltip: "编辑" },
          },
          editComposer: {
            send: { label: "发送" },
            cancel: { label: "取消" },
          },
          code: {
            header: {
              copy: { tooltip: "复制代码" },
            },
          },
        }}
      />
    </AssistantRuntimeProvider>
  );
}

export function AiChatPanel({
  selectedText,
  bookId,
  bookTitle,
  bookAuthor,
  chapter,
  progress,
  onClose,
}: AiChatPanelProps) {
  const sessionIdRef = useRef<string | undefined>(undefined);
  const bookCacheRef = useRef<{ sha256: string; title: string; author: string } | null>(null);
  const [messageSent, setMessageSent] = useState(false);

  const adapter = useMemo<ChatModelAdapter>(() => ({
    async run({ messages }) {
      setMessageSent(true);
      const lastUser = [...messages].reverse().find((m) => m.role === "user");
      const question =
        lastUser?.content
          .filter((c): c is { type: "text"; text: string } => c.type === "text")
          .map((c) => c.text)
          .join("") ?? "";

      if (!bookCacheRef.current) {
        const book = await resolveBook(bookId, bookTitle);
        bookCacheRef.current = { sha256: book.sha256, title: book.title, author: book.author };
      }

      const result = await aiQuery({
        action: "ask",
        text: selectedText,
        question,
        book: bookCacheRef.current,
        location: { chapter, progress },
        session_id: sessionIdRef.current,
      });

      if (result.session_id) sessionIdRef.current = result.session_id;

      return {
        content: [{ type: "text", text: result.answer.text }],
      };
    },
  }), [selectedText, bookId, bookTitle, chapter, progress]);

  const runtime = useLocalRuntime(adapter);

  return (
    <>
      <div className="aichat-overlay" onClick={onClose}>
        <div
          className="aichat-panel dark"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          onKeyUp={(e) => e.stopPropagation()}
        >
          <div className="aichat-header">
            <span className="aichat-header-title">READER AI</span>
            <button className="aichat-header-close" onClick={onClose} aria-label="关闭">
              ✕
            </button>
          </div>

          {selectedText && !messageSent && (
            <div className="aichat-context">
              <span className="aichat-context-label">选中文字</span>
              <p className="aichat-context-text">
                {selectedText.length > 160
                  ? selectedText.slice(0, 160) + "…"
                  : selectedText}
              </p>
            </div>
          )}

          <div className="aichat-thread-wrap">
            <AiThread runtime={runtime} selectedText={selectedText} />
          </div>
        </div>
      </div>

      <style jsx global>{`
        .aichat-overlay {
          position: fixed;
          inset: 0;
          z-index: 20000;
          background: rgba(0, 0, 0, 0.55);
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }

        .aichat-panel {
          --aui-background: 0 0% 13%;
          --aui-foreground: 0 0% 93%;
          --aui-card: 0 0% 13%;
          --aui-card-foreground: 0 0% 93%;
          --aui-popover: 0 0% 16%;
          --aui-popover-foreground: 0 0% 93%;
          --aui-primary: 0 0% 98%;
          --aui-primary-foreground: 0 0% 4%;
          --aui-secondary: 0 0% 16%;
          --aui-secondary-foreground: 0 0% 93%;
          --aui-muted: 0 0% 18%;
          --aui-muted-foreground: 0 0% 67%;
          --aui-accent: 0 0% 18%;
          --aui-accent-foreground: 0 0% 93%;
          --aui-border: 0 0% 24%;
          --aui-input: 0 0% 24%;
          --aui-ring: 0 0% 80%;
          --aui-radius: 0.75rem;
          --aui-thread-max-width: 42rem;

          background: #212121;
          border-radius: 20px 20px 0 0;
          width: 100%;
          max-width: 840px;
          height: 82vh;
          display: flex;
          flex-direction: column;
          color: #eee;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          overflow: hidden;
        }

        .aichat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 20px;
          flex-shrink: 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          background: #212121;
        }
        .aichat-header-title {
          font-size: 15px;
          font-weight: 700;
          color: #9b9b9b;
        }
        .aichat-header-close {
          background: transparent;
          border: none;
          color: #9b9b9b;
          font-size: 16px;
          cursor: pointer;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: background 0.15s, color 0.15s;
        }
        .aichat-header-close:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
        }

        .aichat-context {
          padding: 10px 20px;
          background: rgba(255, 255, 255, 0.035);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          flex-shrink: 0;
        }
        .aichat-context-label {
          display: block;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #8f8f8f;
          margin-bottom: 4px;
        }
        .aichat-context-text {
          margin: 0;
          font-size: 13px;
          color: #b6b6b6;
          line-height: 1.5;
          white-space: pre-wrap;
        }

        .aichat-thread-wrap {
          flex: 1;
          min-height: 0;
          background: #212121;
        }

        .aichat-thread-wrap .aui-thread-root {
          background: #212121;
        }
        .aichat-thread-wrap .aui-thread-viewport {
          padding-top: 24px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.16) transparent;
        }
        .aichat-thread-wrap .aui-thread-viewport-footer {
          padding-bottom: 16px;
          background: linear-gradient(to bottom, transparent, #212121 28%);
        }
        .aichat-thread-wrap .aui-thread-viewport-footer::after {
          content: "READER AI 基于书籍内容生成，仅供参考。";
          margin-top: 8px;
          font-size: 11px;
          color: #777;
          text-align: center;
        }
        .aichat-thread-wrap .aui-thread-scroll-to-bottom {
          background: #2a2a2a;
          border-color: rgba(255, 255, 255, 0.12);
          color: #c7c7c7;
        }
        .aichat-thread-wrap .aui-thread-welcome-message {
          color: #fff;
          font-size: 20px;
        }
        .aichat-thread-wrap .aui-thread-welcome-suggestions {
          flex-wrap: wrap;
          gap: 10px;
        }
        .aichat-thread-wrap .aui-thread-welcome-suggestion {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.12);
          color: #eee;
        }
        .aichat-thread-wrap .aui-thread-welcome-suggestion:hover {
          background: rgba(255, 255, 255, 0.08);
        }
        .aichat-thread-wrap .aui-composer-root {
          border-radius: 24px;
          border-color: rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.055);
          box-shadow: none;
        }
        .aichat-thread-wrap .aui-composer-input {
          color: #eee;
          padding-top: 12px;
          padding-bottom: 12px;
          min-height: 48px;
          max-height: 120px;
          overflow-y: auto;
        }
        .aichat-thread-wrap .aui-composer-send,
        .aichat-thread-wrap .aui-composer-cancel {
          border-radius: 999px;
          background: #fff;
          color: #000;
        }
        .aichat-thread-wrap .aichat-composer-icon-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          flex-shrink: 0;
          cursor: pointer;
        }
        .aichat-thread-wrap .aichat-composer-icon-btn:disabled {
          opacity: 0.2;
          cursor: default;
        }
        .aichat-thread-wrap .aui-user-message-content {
          background: rgba(255, 255, 255, 0.08);
          color: #eee;
        }
        .aichat-thread-wrap .aui-assistant-message-content {
          color: #eee;
        }
        .aichat-thread-wrap .aui-avatar-root {
          width: 28px;
          height: 28px;
          font-size: 11px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.18);
          color: #eee;
        }
        .aichat-thread-wrap .aui-assistant-action-bar-root,
        .aichat-thread-wrap .aui-branch-picker-root {
          color: #8d8d8d;
        }
      `}</style>
    </>
  );
}
