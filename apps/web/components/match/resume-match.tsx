"use client";

import { uploadResume } from "@/api/resumes";
import styles from "@/app/match/match.module.css";
import { Navbar } from "@/components/landing/navbar";
import { type ChangeEvent, type DragEvent, useRef, useState } from "react";
import { MatchResults } from "./match-results";
import type { MatchResponse } from "./resume-match-data";
import { UploadCard, type UploadPhase } from "./upload-card";

const BENEFITS = [
  {
    icon: "◎",
    title: "Get matched, not lost",
    desc: "Our engine ranks you against every open role that fits — automatically.",
  },
  {
    icon: "↗",
    title: "Recruiters come to you",
    desc: "Approved companies message you directly. Skip the application black hole.",
  },
  {
    icon: "⚑",
    title: "One résumé, every job",
    desc: "Update it once; every match refreshes across all live roles.",
  },
];

export function ResumeMatch() {
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<MatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startUpload = async (file: File) => {
    setFileName(file.name);
    setError(null);
    setPhase("uploading");
    try {
      const res = await uploadResume(file);
      setResult(res);
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setPhase("error");
    }
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (file) startUpload(file);
  };

  const stop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onReset = () => {
    setPhase("idle");
    setFileName("");
    setResult(null);
    setError(null);
  };

  const onViewMatches = () => {
    document.getElementById("match-results")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className={styles.page}>
      <div className="w-full">
        <div className={styles.panel}>
          <div className={styles.sunGlow} />
          <div className={styles.sunGlow2} />

          <Navbar />

          {/* BODY */}
          <div className="relative z-[4] flex flex-wrap items-center gap-11 px-10 pb-11 pt-3.5">
            {/* LEFT */}
            <div className="min-w-[300px] max-w-[560px] flex-1 basis-[420px]">
              <div className="mb-[22px] inline-flex items-center gap-[9px] rounded-[30px] border border-white/[0.18] bg-white/10 px-3.5 py-[7px]">
                <span className="h-2 w-2 rounded-full bg-[#36d6a6] shadow-[0_0_0_3px_rgba(54,214,166,0.25)]" />
                <span className="text-[13px] font-semibold text-[#e7f2f0]">
                  Free · takes 30 seconds
                </span>
              </div>

              <h1 className="text-[42px] font-extrabold leading-[1.04] tracking-tight text-[#f7f1e3] md:text-[56px]">
                Drop your résumé.
                <br />
                <span className="text-[#ffc164]">Let jobs find you.</span>
              </h1>

              <p className="mb-[30px] mt-[22px] max-w-[480px] text-[17px] font-medium leading-[1.6] text-[#bcd2d3]">
                Upload once and our matching engine surfaces the roles that fit you across
                Indonesia. No endless applications — the best matches come to the top.
              </p>

              <div className="flex max-w-[440px] flex-col gap-4">
                {BENEFITS.map((b) => (
                  <div key={b.title} className="flex items-start gap-[13px]">
                    <span className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[9px] border border-[#ffb84d]/30 bg-[#ffb84d]/[0.16] text-[15px] font-extrabold text-[#ffc164]">
                      {b.icon}
                    </span>
                    <div>
                      <div className="text-[15px] font-bold text-[#f7f1e3]">{b.title}</div>
                      <div className="text-[13.5px] font-medium leading-[1.45] text-[#9fbabb]">
                        {b.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-[26px] flex max-w-[460px] items-start gap-[13px] rounded-[16px] border border-[#ffc164]/28 bg-gradient-to-br from-[#ffb84d]/[0.14] to-[#ff7a5c]/[0.08] px-[17px] py-[15px]">
                <span className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-b from-[#ffd587] to-[#ef9f3c] shadow-[0_8px_18px_rgba(239,159,60,0.35)]">
                  <SparkleIcon />
                </span>
                <div>
                  <div className="text-[15px] font-extrabold text-[#f7f1e3]">
                    AI-powered matching
                  </div>
                  <div className="text-[13.5px] font-medium leading-[1.5] text-[#c4d6d6]">
                    Our AI reads your skills, experience and goals — then ranks the roles
                    you&apos;re most likely to land, so you get{" "}
                    <strong className="text-[#ffc164]">the best matches</strong>, not just the
                    newest listings.
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex min-w-[340px] flex-1 basis-[440px] justify-center">
              <UploadCard
                phase={phase}
                dragging={dragging}
                fileName={fileName}
                matchCount={result?.items.length ?? 0}
                error={error}
                fileInputRef={fileInputRef}
                onPick={() => fileInputRef.current?.click()}
                onFileChange={onFileChange}
                onDragOver={(e) => {
                  stop(e);
                  if (!dragging) setDragging(true);
                }}
                onDragLeave={(e) => {
                  stop(e);
                  setDragging(false);
                }}
                onDrop={(e) => {
                  stop(e);
                  setDragging(false);
                  const file = e.dataTransfer?.files?.[0];
                  if (file) startUpload(file);
                }}
                onReset={onReset}
                onViewMatches={onViewMatches}
              />
            </div>
          </div>
        </div>

        {result && <MatchResults result={result} />}
      </div>
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#06222b"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15l-1.9-4.1L5.5 9l4.6-1.4L12 3z" />
      <path d="M19 14l.8 2 .2.8.8.2L23 18l-2.2.8-.8.2-.2.8L19 22l-.8-2.2-.2-.8-.8-.2L15 18l2.2-.8.8-.2.2-.8L19 14z" />
    </svg>
  );
}
