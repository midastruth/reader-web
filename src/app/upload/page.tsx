"use client";

import { useCallback, useRef, useState } from "react";
import { Link } from "react-aria-components";
import "../reset.css";
import styles from "./upload.module.css";

type UploadState =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "error"; message: string }
  | { type: "success"; book: UploadedBook; indexChunks: number | null };

type UploadedBook = {
  id: string;
  sha256: string;
  title: string;
  author: string;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix (e.g. "data:application/epub+zip;base64,")
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [state, setState] = useState<UploadState>({ type: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);

  const pickFile = (f: File) => {
    if (!f.name.endsWith(".epub")) {
      setState({ type: "error", message: "请选择 .epub 格式的文件。" });
      return;
    }
    setFile(f);
    setState({ type: "idle" });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) pickFile(dropped);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragging(false), []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) pickFile(selected);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setState({ type: "loading" });

    try {
      const base64 = await fileToBase64(file);

      const res = await fetch("/api/book-aware/books/import/epub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_base64: base64,
          filename: file.name,
        }),
      });

      const data = await res.json() as Record<string, unknown>;

      if (!res.ok || !data.ok) {
        const errMsg = (data.error as Record<string, unknown>)?.message as string
          ?? data.error as string
          ?? `服务器返回 ${res.status}`;
        setState({ type: "error", message: errMsg });
        return;
      }

      const book = data.book as UploadedBook;
      const index = data.index as { chunks?: number } | null;
      setState({
        type: "success",
        book,
        indexChunks: index?.chunks ?? null,
      });
    } catch (err) {
      setState({ type: "error", message: err instanceof Error ? err.message : "上传失败，请重试。" });
    }
  };

  const reset = () => {
    setFile(null);
    setState({ type: "idle" });
    if (inputRef.current) inputRef.current.value = "";
  };

  const isLoading = state.type === "loading";

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.backLink}>
          ← 返回书库
        </Link>
        <h1>上传书籍</h1>
        <p className={styles.subtitle}>支持 EPUB 格式，上传后自动建立索引以供 AI 检索。</p>
      </header>

      {state.type !== "success" && (
        <>
          <div
            className={[
              styles.dropZone,
              dragging ? styles.dropZoneActive : "",
              file ? styles.dropZoneHasFile : "",
            ].join(" ")}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" || e.key === " " ? inputRef.current?.click() : undefined}
            role="button"
            tabIndex={0}
            aria-label="选择或拖拽 EPUB 文件"
          >
            <input
              ref={inputRef}
              type="file"
              accept=".epub,application/epub+zip"
              className={styles.fileInput}
              onChange={handleInputChange}
            />

            {file ? (
              <div className={styles.fileInfo} onClick={(e) => e.stopPropagation()}>
                <svg className={styles.fileIcon} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                <div className={styles.fileMeta}>
                  <div className={styles.fileName}>{file.name}</div>
                  <div className={styles.fileSize}>{formatBytes(file.size)}</div>
                </div>
                <button
                  className={styles.clearButton}
                  onClick={(e) => { e.stopPropagation(); reset(); }}
                  aria-label="移除文件"
                  title="移除文件"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <line x1="1" y1="1" x2="13" y2="13"/>
                    <line x1="13" y1="1" x2="1" y2="13"/>
                  </svg>
                </button>
              </div>
            ) : (
              <>
                <svg className={styles.dropIcon} width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="16 16 12 12 8 16"/>
                  <line x1="12" y1="12" x2="12" y2="21"/>
                  <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                </svg>
                <p className={styles.dropLabel}>拖拽 EPUB 文件到此处</p>
                <p className={styles.dropHint}>或点击选择文件</p>
                <span className={styles.browseButton}>选择文件</span>
              </>
            )}
          </div>

          <button
            className={styles.submitButton}
            disabled={!file || isLoading}
            onClick={handleSubmit}
          >
            {isLoading ? (
              <>
                <div className={styles.spinner} />
                上传中…
              </>
            ) : "上传并建立索引"}
          </button>
        </>
      )}

      {state.type === "loading" && (
        <div className={`${styles.status} ${styles.statusLoading}`}>
          <span>正在上传并解析书籍内容，请稍候…</span>
        </div>
      )}

      {state.type === "error" && (
        <div className={`${styles.status} ${styles.statusError}`}>
          上传失败：{state.message}
        </div>
      )}

      {state.type === "success" && (
        <div className={`${styles.status} ${styles.statusSuccess}`}>
          <div className={styles.successTitle}>上传成功</div>
          <div className={styles.successMeta}>
            <span><strong>{state.book.title || "（无标题）"}</strong></span>
            {state.book.author && <span>{state.book.author}</span>}
            {state.indexChunks !== null && (
              <span>已建立 AI 索引，共 {state.indexChunks} 个文本块</span>
            )}
          </div>
          <div className={styles.successActions}>
            <Link href="/" className={styles.readButton}>
              前往书库
            </Link>
            <button className={styles.uploadAnotherButton} onClick={reset}>
              继续上传
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
