"use client";

import styles from "@/app/match/match.module.css";
import type { ChangeEvent, DragEvent, RefObject } from "react";

export type UploadPhase = "idle" | "uploading" | "done" | "error";

interface UploadCardProps {
  phase: UploadPhase;
  dragging: boolean;
  fileName: string;
  matchCount: number;
  error: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onPick: () => void;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onDragOver: (e: DragEvent) => void;
  onDragLeave: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
  onReset: () => void;
  onViewMatches: () => void;
}

export function UploadCard(props: UploadCardProps) {
  const { phase, dragging, fileName, matchCount, error } = props;

  return (
    <div className="relative w-full max-w-[480px]">
      <div className={styles.card}>
        {phase === "idle" && (
          <button
            type="button"
            onClick={props.onPick}
            onDragOver={props.onDragOver}
            onDragLeave={props.onDragLeave}
            onDrop={props.onDrop}
            className={`${styles.dropzone} ${dragging ? styles.dropzoneActive : ""} w-full`}
          >
            <span
              className={`${styles.iconBadge} ${styles.floaty} h-[76px] w-[76px] rounded-[20px]`}
            >
              <UploadArrowIcon />
            </span>
            <span className="mt-5 text-[20px] font-extrabold text-[#f7f1e3]">
              {dragging ? "Release to upload" : "Drag & drop your résumé here"}
            </span>
            <span className="mt-1.5 text-[14px] font-medium text-[#9fbabb]">
              or click to browse your files
            </span>
            <span className="mt-5 inline-flex items-center gap-2 rounded-[13px] bg-[#ffb84d] px-[26px] py-[13px] text-[15px] font-bold text-[#06222b] shadow-[0_10px_24px_rgba(255,184,77,0.32)]">
              Choose file
            </span>
            <span className="mt-[18px] text-[12.5px] font-semibold text-[#7fa0a2]">
              PDF or DOCX · max 10 MB
            </span>
          </button>
        )}

        {phase === "uploading" && (
          <div className="rounded-[20px] border border-white/12 px-[26px] py-[34px] text-center">
            <div className="mx-auto h-[76px] w-[76px]">
              <svg
                aria-hidden="true"
                className={styles.spin}
                width="76"
                height="76"
                viewBox="0 0 76 76"
              >
                <circle
                  cx="38"
                  cy="38"
                  r="33"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="6"
                />
                <circle
                  cx="38"
                  cy="38"
                  r="33"
                  fill="none"
                  stroke="#ffc164"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray="60 200"
                />
              </svg>
            </div>
            <div className="mt-5 text-[17px] font-extrabold text-[#f7f1e3]">
              Analyzing your résumé…
            </div>
            <div className="mt-1.5 text-[13.5px] font-semibold text-[#9fbabb]">{fileName}</div>
            <div className="mt-1 text-[12.5px] font-medium text-[#7fa0a2]">
              Reading your skills and matching live roles
            </div>
          </div>
        )}

        {phase === "done" && (
          <div className="px-1 pb-1 pt-2 text-center">
            <div
              className={`${styles.pop} mx-auto flex h-[74px] w-[74px] items-center justify-center rounded-full border border-[#36d6a6]/40 bg-[#36d6a6]/15`}
            >
              <CheckIcon />
            </div>
            <div className="mt-[18px] text-[21px] font-extrabold text-[#f7f1e3]">
              You&apos;re in the pool! 🎉
            </div>
            <div className="mt-2 text-[14px] font-medium leading-[1.5] text-[#bcd2d3]">
              We matched <strong className="text-[#f7f1e3]">{fileName}</strong> against live roles
              and found{" "}
              <strong className="text-[#ffc164]">
                {matchCount} {matchCount === 1 ? "match" : "matches"}
              </strong>
              .
            </div>

            <div className="mt-[22px] flex items-center gap-[11px] rounded-[14px] border border-white/12 bg-white/5 px-[15px] py-[13px] text-left">
              <span className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[10px] bg-[#ff7a5c]">
                <FileIcon />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-bold text-[#f7f1e3]">
                  {fileName}
                </span>
                <span className="text-[12.5px] font-bold text-[#36d6a6]">Uploaded ✓</span>
              </span>
              <button
                type="button"
                onClick={props.onReset}
                className="cursor-pointer text-[13px] font-bold text-[#9fbabb] hover:text-[#f7f1e3]"
              >
                Replace
              </button>
            </div>

            <button
              type="button"
              onClick={props.onViewMatches}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-[13px] bg-[#ffb84d] px-4 py-[14px] text-[15px] font-bold text-[#06222b] shadow-[0_10px_24px_rgba(255,184,77,0.32)]"
            >
              View matching jobs
              <ArrowIcon />
            </button>
          </div>
        )}

        {phase === "error" && (
          <div className="rounded-[20px] border border-[#ff7a5c]/40 bg-[#ff7a5c]/10 px-[26px] py-[34px] text-center">
            <div className="text-[17px] font-extrabold text-[#f7f1e3]">Something went wrong</div>
            <div className="mt-2 text-[13.5px] font-medium text-[#bcd2d3]">
              {error ?? "Please try a different file."}
            </div>
            <button
              type="button"
              onClick={props.onReset}
              className="mt-5 inline-flex items-center rounded-[13px] bg-[#ffb84d] px-[26px] py-[13px] text-[15px] font-bold text-[#06222b]"
            >
              Try again
            </button>
          </div>
        )}

        <input
          ref={props.fileInputRef}
          type="file"
          accept=".pdf,.docx"
          onChange={props.onFileChange}
          className="hidden"
        />

        {phase !== "uploading" && (
          <div className="mt-5 flex items-center justify-center gap-2">
            <LockIcon />
            <span className="text-[12.5px] font-semibold text-[#7fa0a2]">
              Used only to compute your matches
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* --- inline icons (mirroring the design mockup) --- */

function UploadArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      width="34"
      height="34"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#06222b"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 16V4" />
      <path d="M7 9l5-5 5 5" />
      <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      width="34"
      height="34"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#36d6a6"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12.5l5 5 11-11" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" width="15" height="15" viewBox="0 0 15 15">
      <path
        d="M2 7.5h10M8 3.5l4 4-4 4"
        fill="none"
        stroke="#06222b"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      aria-hidden="true"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#7fa0a2"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
