"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CompositionEvent,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import {
  AssistantRuntimeProvider,
  useAui,
  useAuiState,
  useLocalRuntime,
  type ChatModelAdapter,
} from "@assistant-ui/react";
import { Thread, makeMarkdownText } from "@assistant-ui/react-ui";
import { useSelector } from "react-redux";
import { aiQueryStream, resolveBook } from "@/services/bookAwareApi";
import type { RootState } from "@/lib/store";
import { ThColorScheme } from "@/core/Hooks/useColorScheme";
import { usePreferences } from "@/preferences/hooks/usePreferences";
import remarkGfm from "remark-gfm";

const MarkdownText = makeMarkdownText({ remarkPlugins: [remarkGfm] });

export type AiAction = "ask" | "dictionary" | "summarize" | "analyze";

export interface AiChatPanelProps {
  selectedText: string;
  initialAction?: AiAction;
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

const IconMinimize = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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

function AutoSend({ question }: { question: string }) {
  const aui = useAui();
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    const id = setTimeout(() => {
      aui.composer().setText(question);
      aui.composer().send();
    }, 50);
    return () => clearTimeout(id);
  }, [aui, question]);

  return null;
}

function RunningBridge({ onRunningChange }: { onRunningChange: (running: boolean) => void }) {
  const isRunning = useAuiState((s) => s.thread.isRunning);
  useEffect(() => {
    onRunningChange(isRunning);
  }, [isRunning, onRunningChange]);
  return null;
}

function AiThread({
  runtime,
  selectedText,
  initialAction,
  onRunningChange,
}: {
  runtime: ReturnType<typeof useLocalRuntime>;
  selectedText: string;
  initialAction: AiAction;
  onRunningChange: (running: boolean) => void;
}) {
  const autoSendText =
    initialAction === "dictionary" ? selectedText :
    initialAction === "analyze" ? "分析" :
    null;

  const suggestions = selectedText
    ? [
        { prompt: "解释这段文字", text: "解释这段文字" },
        { prompt: "总结这段文字的要点", text: "总结要点" },
        { prompt: "这段文字里有哪些关键信息？", text: "提取关键信息" },
        { prompt: "为我导读当前章节", text: "章节导读" },
      ]
    : [
        { prompt: "为我导读当前章节", text: "章节导读" },
        { prompt: "总结当前章节", text: "总结当前章节" },
        { prompt: "这本书主要讲什么？", text: "概括本书" },
        { prompt: "帮我梳理人物和关系", text: "梳理人物关系" },
      ];

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <RunningBridge onRunningChange={onRunningChange} />
      {autoSendText && <AutoSend question={autoSendText} />}
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

const ACTION_CONTEXT_LABEL: Record<AiAction, string> = {
  ask: "选中文字",
  dictionary: "查词",
  summarize: "总结选中文字",
  analyze: "分析选中文字",
};

const MINIMIZE_THRESHOLD = 80;
const RESTORE_THRESHOLD = 40;
const CLOSE_ANIMATION_MS = 180;

const DARK_THEME_KEYS = new Set([
  "dark",
  "contrast1",
  "contrast2",
  "solarizedDark",
  "gruvboxMaterialDark",
]);

function relativeLuminanceFromColor(color?: string): number | null {
  if (!color) return null;

  const normalized = color.trim().toLowerCase();
  let red: number;
  let green: number;
  let blue: number;

  const hexMatch = normalized.match(/^#([\da-f]{3}|[\da-f]{6})$/i);
  if (hexMatch) {
    const hex = hexMatch[1].length === 3
      ? hexMatch[1].split("").map((char) => char + char).join("")
      : hexMatch[1];
    red = Number.parseInt(hex.slice(0, 2), 16);
    green = Number.parseInt(hex.slice(2, 4), 16);
    blue = Number.parseInt(hex.slice(4, 6), 16);
  } else {
    const rgbMatch = normalized.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!rgbMatch) return null;
    red = Number(rgbMatch[1]);
    green = Number(rgbMatch[2]);
    blue = Number(rgbMatch[3]);
  }

  const toLinear = (value: number) => {
    const channel = value / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  };

  return 0.2126 * toLinear(red) + 0.7152 * toLinear(green) + 0.0722 * toLinear(blue);
}

export function AiChatPanel({
  selectedText,
  initialAction = "ask",
  bookId,
  bookTitle,
  bookAuthor,
  chapter,
  progress,
  onClose,
}: AiChatPanelProps) {
  const { preferences } = usePreferences();
  const isFXL = useSelector((state: RootState) => state.publication.isFXL);
  const themeObject = useSelector((state: RootState) => state.theming.theme);
  const colorScheme = useSelector((state: RootState) => state.theming.colorScheme);
  const sessionIdRef = useRef<string | undefined>(undefined);
  const bookCacheRef = useRef<{ sha256: string; title: string; author: string } | null>(null);
  const [messageSent, setMessageSent] = useState(false);

  const [minimized, setMinimized] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isAiRunning, setIsAiRunning] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartYRef = useRef<number | null>(null);
  const hasDraggedRef = useRef(false);
  const minimizedRef = useRef(minimized);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => { minimizedRef.current = minimized; }, [minimized]);

  useEffect(() => () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  }, []);

  const MINIMIZED_H = 38;

  const isDarkPanel = useMemo(() => {
    const requestedTheme = isFXL ? themeObject.fxl : themeObject.reflow;
    const resolvedTheme = requestedTheme === "auto" || !requestedTheme
      ? preferences.theming.themes.systemThemes?.[colorScheme] ?? (
        colorScheme === ThColorScheme.dark ? "dark" : "light"
      )
      : requestedTheme;

    const themeKeys = preferences.theming.themes.keys;
    const themeBackground = Object.prototype.hasOwnProperty.call(themeKeys, resolvedTheme)
      ? themeKeys[resolvedTheme as keyof typeof themeKeys]?.background
      : undefined;
    const luminance = relativeLuminanceFromColor(themeBackground);

    return luminance !== null ? luminance < 0.42 : DARK_THEME_KEYS.has(resolvedTheme);
  }, [colorScheme, isFXL, preferences.theming.themes.keys, preferences.theming.themes.systemThemes, themeObject.fxl, themeObject.reflow]);

  const requestClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    closeTimerRef.current = setTimeout(onClose, CLOSE_ANIMATION_MS);
  }, [isClosing, onClose]);

  const handleMinimize = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    setMinimized(true);
  }, []);

  const handleHeaderPointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    dragStartYRef.current = e.clientY;
    hasDraggedRef.current = false;
    setIsDragging(true);
    setDragY(0);
    setDragHeight(null);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handleHeaderPointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (dragStartYRef.current === null) return;
    const delta = e.clientY - dragStartYRef.current;
    if (Math.abs(delta) > 4) hasDraggedRef.current = true;

    if (!minimizedRef.current) {
      // 展开 → 最小化：panel 跟着手指向下位移
      setDragY(Math.max(0, delta));
      setDragHeight(null);
    } else {
      // 最小化 → 展开：从底部向上撑开高度，不做位移
      const maxH = window.innerHeight * 0.92;
      const newH = Math.min(maxH, MINIMIZED_H + Math.max(0, -delta));
      setDragHeight(newH);
      setDragY(0);
    }
  }, [MINIMIZED_H]);

  const handleHeaderPointerUp = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (dragStartYRef.current === null) return;
    const delta = e.clientY - dragStartYRef.current;
    dragStartYRef.current = null;
    setIsDragging(false);
    setDragY(0);
    setDragHeight(null);

    if (hasDraggedRef.current) {
      if (!minimizedRef.current && delta > MINIMIZE_THRESHOLD) {
        setMinimized(true);
      } else if (minimizedRef.current && delta < -RESTORE_THRESHOLD) {
        setMinimized(false);
      }
    } else {
      if (minimizedRef.current) setMinimized(false);
    }
  }, []);

  const handleHeaderPointerCancel = useCallback(() => {
    dragStartYRef.current = null;
    setIsDragging(false);
    setDragY(0);
    setDragHeight(null);
  }, []);

  const adapter = useMemo<ChatModelAdapter>(() => ({
    async *run({ messages, abortSignal }) {
      setMessageSent(true);
      const userMessages = messages.filter((m) => m.role === "user");
      const action = userMessages.length === 1 ? initialAction : "ask";

      const lastUser = [...messages].reverse().find((m) => m.role === "user");
      const question =
        lastUser?.content
          .filter((c): c is { type: "text"; text: string } => c.type === "text")
          .map((c) => c.text)
          .join("") ?? "";

      if (!bookCacheRef.current) {
        const book = await resolveBook(bookId, bookTitle);
        bookCacheRef.current = { sha256: book.sha256, title: book.title, author: book.author || bookAuthor || "" };
      }

      let fullText = "";

      for await (const event of aiQueryStream({
        action,
        text: selectedText,
        question,
        book: bookCacheRef.current,
        location: { chapter, progress },
        session_id: sessionIdRef.current,
      }, abortSignal)) {
        if (event.type === "delta") {
          fullText += event.text;
          yield { content: [{ type: "text", text: fullText }] };
        } else if (event.type === "final") {
          if (event.session_id) sessionIdRef.current = event.session_id;
          yield { content: [{ type: "text", text: event.answer.text }] };
        } else if (event.type === "error") {
          throw new Error(event.message);
        }
      }
    },
  }), [selectedText, initialAction, bookId, bookTitle, bookAuthor, chapter, progress]);

  const runtime = useLocalRuntime(adapter);

  const panelStyle: CSSProperties = {
    transform: dragY !== 0 ? `translateY(${dragY}px)` : undefined,
    height: dragHeight !== null ? `${dragHeight}px` : undefined,
    transition: isDragging ? "none" : undefined,
  };

  const overlayClassName = [
    "aichat-overlay",
    isDarkPanel ? "aichat-overlay--dark" : "aichat-overlay--light",
    minimized ? "aichat-overlay--minimized" : "",
    isClosing ? "aichat-overlay--closing" : "",
  ].filter(Boolean).join(" ");

  const panelClassName = [
    "aichat-panel",
    isDarkPanel ? "dark aichat-panel--dark" : "aichat-panel--light",
    minimized ? "aichat-panel--minimized" : "",
    isClosing ? "aichat-panel--closing" : "",
  ].filter(Boolean).join(" ");

  return (
    <>
      <div
        className={overlayClassName}
        onClick={minimized ? undefined : requestClose}
      >
        <div
          className={panelClassName}
          style={panelStyle}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          onKeyUp={(e) => e.stopPropagation()}
        >
          <div
            className="aichat-header"
            onPointerDown={handleHeaderPointerDown}
            onPointerMove={handleHeaderPointerMove}
            onPointerUp={handleHeaderPointerUp}
            onPointerCancel={handleHeaderPointerCancel}
          >
            <div className="aichat-header-row">
              <span className="aichat-header-title">
                READER AI
                {minimized && isAiRunning && (
                  <span className="aichat-running-dot" aria-label="AI 回复中" />
                )}
                {minimized && !isAiRunning && (
                  <span className="aichat-tap-hint"> · 点击展开</span>
                )}
              </span>
              <div className="aichat-header-actions">
                {!minimized && (
                  <button
                    className="aichat-header-btn"
                    onClick={handleMinimize}
                    aria-label="最小化"
                  >
                    <IconMinimize />
                  </button>
                )}
                <button className="aichat-header-close" onClick={requestClose} aria-label="关闭">
                  ✕
                </button>
              </div>
            </div>
          </div>

          {selectedText && !messageSent && (
            <div className="aichat-context">
              <span className="aichat-context-label">{ACTION_CONTEXT_LABEL[initialAction]}</span>
              <p className="aichat-context-text">
                {selectedText.length > 160
                  ? selectedText.slice(0, 160) + "…"
                  : selectedText}
              </p>
            </div>
          )}

          <div className="aichat-thread-wrap">
            <AiThread
              runtime={runtime}
              selectedText={selectedText}
              initialAction={initialAction}
              onRunningChange={setIsAiRunning}
            />
          </div>
        </div>
      </div>

      <style jsx global>{`
        .aichat-overlay {
          position: fixed;
          inset: 0;
          z-index: 20000;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          transition: background 0.28s ease;
          animation: aichat-overlay-in 180ms ease-out;
        }

        .aichat-overlay--dark {
          background: rgba(0, 0, 0, 0.55);
        }

        .aichat-overlay--light {
          background: rgba(190, 197, 178, 0.24);
        }

        .aichat-overlay--minimized,
        .aichat-overlay--closing {
          background: transparent;
          pointer-events: none;
        }

        .aichat-panel {
          --aui-radius: 0.75rem;
          --aui-thread-max-width: 42rem;
          --aichat-bg: #212121;
          --aichat-header-bg: #212121;
          --aichat-text: #eeeeee;
          --aichat-strong-text: #ffffff;
          --aichat-muted-text: #9b9b9b;
          --aichat-subtle-text: #777777;
          --aichat-faint-text: #5a5a5a;
          --aichat-border: rgba(255, 255, 255, 0.12);
          --aichat-border-subtle: rgba(255, 255, 255, 0.06);
          --aichat-soft-bg: rgba(255, 255, 255, 0.055);
          --aichat-context-bg: rgba(255, 255, 255, 0.035);
          --aichat-control-hover: rgba(255, 255, 255, 0.08);
          --aichat-chip-bg: rgba(255, 255, 255, 0.04);
          --aichat-chip-hover-bg: rgba(255, 255, 255, 0.08);
          --aichat-user-bg: rgba(255, 255, 255, 0.08);
          --aichat-button-bg: #ffffff;
          --aichat-button-text: #000000;
          --aichat-scrollbar: rgba(255, 255, 255, 0.16);
          --aichat-shadow: none;

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

          background: var(--aichat-bg);
          border-radius: 20px 20px 0 0;
          width: 100%;
          max-width: 840px;
          height: 92vh;
          display: flex;
          flex-direction: column;
          color: var(--aichat-text);
          box-shadow: var(--aichat-shadow);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          overflow: hidden;
          opacity: 1;
          transition: height 0.32s cubic-bezier(0.4, 0, 0.2, 1),
                      transform 0.28s cubic-bezier(0.4, 0, 0.2, 1),
                      opacity 0.18s ease;
          animation: aichat-panel-in 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .aichat-panel--light {
          --aichat-bg: #fffbef;
          --aichat-header-bg: #f8f5e4;
          --aichat-text: #24251f;
          --aichat-strong-text: #1b1d18;
          --aichat-muted-text: #66705c;
          --aichat-subtle-text: #7f8775;
          --aichat-faint-text: #9aa18e;
          --aichat-border: #e8e5d5;
          --aichat-border-subtle: #edeada;
          --aichat-soft-bg: #f2efdf;
          --aichat-context-bg: #f8f5e4;
          --aichat-control-hover: #edeada;
          --aichat-chip-bg: #f2efdf;
          --aichat-chip-hover-bg: #edeada;
          --aichat-user-bg: #f0f2d4;
          --aichat-button-bg: #2f3329;
          --aichat-button-text: #fffbef;
          --aichat-scrollbar: #bec5b2;
          --aichat-shadow: 0 -8px 28px rgba(190, 197, 178, 0.24);

          --aui-background: 38 42% 94%;
          --aui-foreground: 35 18% 12%;
          --aui-card: 38 42% 94%;
          --aui-card-foreground: 35 18% 12%;
          --aui-popover: 38 42% 96%;
          --aui-popover-foreground: 35 18% 12%;
          --aui-primary: 35 18% 16%;
          --aui-primary-foreground: 38 60% 96%;
          --aui-secondary: 38 30% 88%;
          --aui-secondary-foreground: 35 18% 16%;
          --aui-muted: 38 24% 88%;
          --aui-muted-foreground: 35 12% 42%;
          --aui-accent: 38 30% 88%;
          --aui-accent-foreground: 35 18% 16%;
          --aui-border: 35 18% 78%;
          --aui-input: 35 18% 78%;
          --aui-ring: 35 18% 38%;
        }

        .aichat-panel--minimized {
          height: 38px;
          pointer-events: auto;
          cursor: pointer;
        }

        .aichat-panel--closing {
          opacity: 0;
          transform: translateY(12px);
          animation: none;
        }

        @keyframes aichat-overlay-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes aichat-panel-in {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .aichat-overlay,
          .aichat-panel {
            animation: none;
          }
        }

        .aichat-header {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          height: 38px;
          padding: 0 16px;
          flex-shrink: 0;
          border-bottom: 1px solid var(--aichat-border-subtle);
          background: var(--aichat-header-bg);
          cursor: grab;
          user-select: none;
          touch-action: none;
        }

        .aichat-header:active {
          cursor: grabbing;
        }

        .aichat-header-row {
          display: contents;
        }

        .aichat-header-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--aichat-muted-text);
          display: flex;
          align-items: center;
          gap: 0;
        }

        .aichat-header-actions {
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .aichat-header-btn {
          background: transparent;
          border: none;
          color: var(--aichat-muted-text);
          cursor: pointer;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: background 0.15s, color 0.15s;
        }

        .aichat-header-btn:hover {
          background: var(--aichat-control-hover);
          color: var(--aichat-strong-text);
        }

        .aichat-header-close {
          background: transparent;
          border: none;
          color: var(--aichat-muted-text);
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
          background: var(--aichat-control-hover);
          color: var(--aichat-strong-text);
        }

        @keyframes aichat-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.85); }
        }

        .aichat-running-dot {
          display: inline-block;
          width: 7px;
          height: 7px;
          background: #4ade80;
          border-radius: 50%;
          margin-left: 7px;
          vertical-align: middle;
          animation: aichat-pulse 1.2s ease-in-out infinite;
        }

        .aichat-tap-hint {
          font-size: 11px;
          color: var(--aichat-faint-text);
          margin-left: 4px;
          font-weight: 400;
          letter-spacing: 0;
        }

        .aichat-context {
          padding: 10px 20px;
          background: var(--aichat-context-bg);
          border-bottom: 1px solid var(--aichat-border-subtle);
          flex-shrink: 0;
        }
        .aichat-context-label {
          display: block;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--aichat-muted-text);
          margin-bottom: 4px;
        }
        .aichat-context-text {
          margin: 0;
          font-size: 13px;
          color: var(--aichat-text);
          line-height: 1.5;
          white-space: pre-wrap;
        }

        .aichat-thread-wrap {
          flex: 1;
          min-height: 0;
          background: var(--aichat-bg);
        }

        .aichat-thread-wrap .aui-thread-root {
          background: var(--aichat-bg);
        }
        .aichat-thread-wrap .aui-thread-viewport {
          padding-top: 24px;
          scrollbar-width: thin;
          scrollbar-color: var(--aichat-scrollbar) transparent;
        }
        .aichat-thread-wrap .aui-thread-viewport-footer {
          padding-bottom: 16px;
          background: linear-gradient(to bottom, transparent, var(--aichat-bg) 28%);
        }
        .aichat-thread-wrap .aui-thread-viewport-footer::after {
          content: "READER AI 基于书籍内容生成，仅供参考。";
          margin-top: 8px;
          font-size: 11px;
          color: var(--aichat-subtle-text);
          text-align: center;
        }
        .aichat-thread-wrap .aui-thread-scroll-to-bottom {
          background: var(--aichat-soft-bg);
          border-color: var(--aichat-border);
          color: var(--aichat-text);
        }
        .aichat-thread-wrap .aui-thread-welcome-message {
          color: var(--aichat-strong-text);
          font-size: 20px;
        }
        .aichat-thread-wrap .aui-thread-welcome-suggestions {
          flex-wrap: wrap;
          gap: 10px;
        }
        .aichat-thread-wrap .aui-thread-welcome-suggestion {
          background: var(--aichat-chip-bg);
          border-color: var(--aichat-border);
          color: var(--aichat-text);
          padding: 5px 12px;
          border-radius: 999px;
        }
        .aichat-thread-wrap .aui-thread-welcome-suggestion-text {
          font-size: 12px;
          font-weight: 400;
        }
        .aichat-thread-wrap .aui-thread-welcome-suggestion:hover {
          background: var(--aichat-chip-hover-bg);
        }
        .aichat-thread-wrap .aui-composer-root {
          border-radius: 24px;
          border-color: var(--aichat-border);
          background: var(--aichat-soft-bg);
          box-shadow: none;
        }
        .aichat-thread-wrap .aui-composer-input {
          color: var(--aichat-text);
          padding-top: 12px;
          padding-bottom: 12px;
          min-height: 48px;
          max-height: 120px;
          overflow-y: auto;
        }
        .aichat-thread-wrap .aui-composer-send,
        .aichat-thread-wrap .aui-composer-cancel {
          border-radius: 999px;
          background: var(--aichat-button-bg);
          color: var(--aichat-button-text);
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
          background: var(--aichat-user-bg);
          color: var(--aichat-text);
        }
        .aichat-thread-wrap .aui-assistant-message-content {
          color: var(--aichat-text);
        }
        .aichat-thread-wrap .aui-avatar-root {
          width: 28px;
          height: 28px;
          font-size: 11px;
          background: transparent;
          border: 1px solid var(--aichat-border);
          color: var(--aichat-text);
          margin-top: 6px;
        }
        .aichat-thread-wrap .aui-assistant-action-bar-root,
        .aichat-thread-wrap .aui-branch-picker-root {
          color: var(--aichat-muted-text);
        }
      `}</style>
    </>
  );
}
