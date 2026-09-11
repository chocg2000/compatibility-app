"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MBTI_QUESTIONS } from "@/lib/mbti/questions";
import { LIKERT_OPTIONS } from "@/lib/mbti/types";
import type { MbtiAnswers, MbtiAxis, MbtiQuestion } from "@/lib/mbti/types";
import { calculateMbtiResult, isQuizComplete, type MbtiResult } from "@/lib/mbti/scoring";
import { MBTI_TYPE_DESCRIPTIONS } from "@/lib/mbti/type-descriptions";
import { setMbtiData, useUserProfile } from "@/lib/profile/user-profile";

const AXIS_LABELS: Record<MbtiAxis, string> = {
  EI: "외향 (E) · 내향 (I)",
  SN: "감각 (S) · 직관 (N)",
  TF: "사고 (T) · 감정 (F)",
  JP: "판단 (J) · 인식 (P)",
};

function groupByAxis(questions: MbtiQuestion[]) {
  const groups = new Map<MbtiAxis, MbtiQuestion[]>();
  for (const question of questions) {
    const list = groups.get(question.axis) ?? [];
    list.push(question);
    groups.set(question.axis, list);
  }
  return groups;
}

export default function MbtiQuiz() {
  const [answers, setAnswers] = useState<MbtiAnswers>({});
  const [result, setResult] = useState<MbtiResult | null>(null);
  const { updateProfile } = useUserProfile();

  const questionsByAxis = useMemo(() => groupByAxis(MBTI_QUESTIONS), []);
  const totalCount = MBTI_QUESTIONS.length;
  const answeredCount = Object.keys(answers).length;
  const complete = isQuizComplete(answers);

  function handleAnswer(questionId: string, value: number) {
    setAnswers((prev) => ({ ...prev, [questionId]: value as MbtiAnswers[string] }));
  }

  function handleSubmit() {
    if (!complete) return;
    const mbtiResult = calculateMbtiResult(answers);
    setResult(mbtiResult);
    updateProfile((profile) => setMbtiData(profile, mbtiResult));
  }

  function handleReset() {
    setAnswers({});
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

  return (
    <div className="flex w-full max-w-2xl flex-col gap-10">
      <div className="flex flex-col gap-2 text-center sm:text-left">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          MBTI 간이진단
        </h1>
        <p className="text-base text-zinc-600 dark:text-zinc-400">
          각 문항을 읽고 자신에게 가장 가까운 정도를 선택해주세요. ({answeredCount}/{totalCount})
        </p>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-foreground transition-all"
            style={{ width: `${(answeredCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {[...questionsByAxis.entries()].map(([axis, questions]) => (
        <section key={axis} className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            {AXIS_LABELS[axis]}
          </h2>
          <div className="flex flex-col gap-4">
            {questions.map((question) => (
              <fieldset
                key={question.id}
                className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <legend className="px-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {question.text}
                </legend>
                <div className="grid grid-cols-5 gap-1 text-center text-[11px] text-zinc-500 dark:text-zinc-400 sm:text-xs">
                  {LIKERT_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className="flex cursor-pointer flex-col items-center gap-1 rounded-lg py-2 hover:bg-black/[.04] dark:hover:bg-white/[.06]"
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={option.value}
                        checked={answers[question.id] === option.value}
                        onChange={() => handleAnswer(question.id, option.value)}
                        className="h-4 w-4 accent-foreground"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        </section>
      ))}

      <button
        type="button"
        disabled={!complete}
        onClick={handleSubmit}
        className="flex h-12 w-full items-center justify-center rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-[#ccc]"
      >
        결과 보기
      </button>
    </div>
  );
}
