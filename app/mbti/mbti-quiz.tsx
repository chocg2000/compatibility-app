"use client";

import { useState } from "react";
import Link from "next/link";
import type { MbtiAxis } from "@/lib/mbti/types";
import type { MbtiResult } from "@/lib/mbti/scoring";
import { MBTI_TYPE_DESCRIPTIONS } from "@/lib/mbti/type-descriptions";
import { setMbtiData, useUserProfile } from "@/lib/profile/user-profile";
import MbtiQuizForm from "./mbti-quiz-form";

const AXIS_LABELS: Record<MbtiAxis, string> = {
  EI: "외향 (E) · 내향 (I)",
  SN: "감각 (S) · 직관 (N)",
  TF: "사고 (T) · 감정 (F)",
  JP: "판단 (J) · 인식 (P)",
};

export default function MbtiQuiz() {
  const [result, setResult] = useState<MbtiResult | null>(null);
  const { updateProfile } = useUserProfile();

  function handleSubmit(mbtiResult: MbtiResult) {
    setResult(mbtiResult);
    updateProfile((profile) => setMbtiData(profile, mbtiResult));
  }

  function handleReset() {
    setResult(null);
  }

  if (result) {
    const info = MBTI_TYPE_DESCRIPTIONS[result.type];
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          진단 결과
        </p>
        <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {result.type}
        </h1>
        <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
          {info.title}
        </h2>
        <p className="max-w-md text-base leading-7 text-zinc-600 dark:text-zinc-400">
          {info.summary}
        </p>

        <div className="mt-2 grid w-full max-w-md grid-cols-2 gap-3 text-left">
          {result.axisResults.map((axisResult) => (
            <div
              key={axisResult.axis}
              className="rounded-xl border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {AXIS_LABELS[axisResult.axis]}
              </p>
              <p className="mt-1 font-semibold text-zinc-900 dark:text-zinc-50">
                {axisResult.winner}
              </p>
            </div>
          ))}
        </div>

        <p className="max-w-md text-xs text-zinc-500 dark:text-zinc-500">
          이 결과는 24문항으로 구성된 간이 진단으로, 참고용 지표입니다.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleReset}
            className="flex h-12 items-center justify-center rounded-full bg-foreground px-6 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            다시 진단하기
          </button>
          <Link
            href="/"
            className="flex h-12 items-center justify-center rounded-full border border-solid border-black/[.08] px-6 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
          >
            홈으로
          </Link>
        </div>
      </div>
    );
  }

  return <MbtiQuizForm onSubmit={handleSubmit} />;
}
