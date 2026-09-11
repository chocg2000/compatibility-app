"use client";

import { useMemo, useState } from "react";
import { MBTI_QUESTIONS } from "@/lib/mbti/questions";
import { LIKERT_OPTIONS } from "@/lib/mbti/types";
import type { MbtiAnswers, MbtiAxis, MbtiQuestion } from "@/lib/mbti/types";
import { calculateMbtiResult, isQuizComplete, type MbtiResult } from "@/lib/mbti/scoring";

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

export interface MbtiQuizFormProps {
  onSubmit: (result: MbtiResult) => void;
}

/**
 * MBTI 24문항 응답 + 채점 폼.
 * 완료 후 처리(프로필 저장, 결과 화면 전환 등)는 onSubmit 호출자에게 맡기고
 * 이 컴포넌트는 답변 상태와 채점만 담당한다 - /mbti 페이지와 종합궁합 위저드의
 * "MBTI를 몰라요" 경로 양쪽에서 재사용하기 위해 분리했다.
 */
export default function MbtiQuizForm({ onSubmit }: MbtiQuizFormProps) {
  const [answers, setAnswers] = useState<MbtiAnswers>({});

  const questionsByAxis = useMemo(() => groupByAxis(MBTI_QUESTIONS), []);
  const totalCount = MBTI_QUESTIONS.length;
  const answeredCount = Object.keys(answers).length;
  const complete = isQuizComplete(answers);

  function handleAnswer(questionId: string, value: number) {
    setAnswers((prev) => ({ ...prev, [questionId]: value as MbtiAnswers[string] }));
  }

  function handleSubmit() {
    if (!complete) return;
    onSubmit(calculateMbtiResult(answers));
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
        className="flex h-12 w-full items-center justify-center rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
      >
        결과 보기
      </button>
    </div>
  );
}
