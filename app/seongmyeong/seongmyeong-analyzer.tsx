"use client";

import Link from "next/link";
import { useState } from "react";
import {
  calculateNameBaleumOheng,
  calculateSajuJawonCompatibility,
  SAJU_JAWON_INTERPRETATIONS,
  describeBaleumOhengTrend,
  type HanjaJawonOheng,
  type JawonOhengDistribution,
} from "@/lib/seongmyeong";
import { setSeongmyeongData, useUserProfile } from "@/lib/profile/user-profile";
import { resolveCharacterEntry } from "./character-entry";
import SeongmyeongForm, { type SeongmyeongFormValues } from "./seongmyeong-form";
import SeongmyeongResult, { type SeongmyeongResultProps } from "./seongmyeong-result";

type Analysis = Omit<SeongmyeongResultProps, "onReset">;

function buildJawonDistribution(characters: HanjaJawonOheng[]): JawonOhengDistribution {
  const distribution: JawonOhengDistribution = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  for (const character of characters) {
    distribution[character.oheng] += 1;
  }
  return distribution;
}

export default function SeongmyeongAnalyzer() {
  const { profile, updateProfile } = useUserProfile();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  function handleSubmit(values: SeongmyeongFormValues) {
    if (!profile.saju) return;

    // 폼에서 이미 전부 "ok" 상태로 검증된 값만 제출되므로, 여기서는 안전하게 풀어낸다.
    const jawonCharacters: HanjaJawonOheng[] = values.entries.map((entry) => {
      const resolution = resolveCharacterEntry(entry);
      if (resolution.status !== "ok") {
        throw new Error("검증되지 않은 입력입니다.");
      }
      return {
        hanja: resolution.hanja,
        dictionaryStrokes: resolution.dictionaryStrokes,
        strokes: resolution.strokes,
        oheng: resolution.oheng,
      };
    });
    const jawonDistribution = buildJawonDistribution(jawonCharacters);
    const jawonOheng = { characters: jawonCharacters, distribution: jawonDistribution };

    const baleumOheng = calculateNameBaleumOheng(values.name);

    const compatibility = calculateSajuJawonCompatibility(profile.saju.oheng, jawonOheng);
    const primaryDeficient = compatibility.deficientOheng[0].oheng;
    const interpretation = SAJU_JAWON_INTERPRETATIONS[compatibility.verdict][primaryDeficient];
    const baleumTrend = describeBaleumOhengTrend(baleumOheng.distribution);

    setAnalysis({
      name: values.name,
      jawonCharacters: jawonOheng.characters,
      jawonDistribution: jawonOheng.distribution,
      baleumCharacters: baleumOheng.characters,
      baleumDistribution: baleumOheng.distribution,
      compatibility,
      interpretation,
      baleumTrend,
    });

    updateProfile((current) =>
      setSeongmyeongData(current, { name: values.name, jawonOheng, baleumOheng, compatibility }),
    );
  }

  function handleReset() {
    setAnalysis(null);
  }

  if (!profile.saju) {
    return (
      <div className="flex w-full max-w-lg flex-col items-center gap-4 rounded-2xl border border-[var(--saju-border)] bg-[var(--saju-bg-elevated)] p-8 text-center sm:p-10">
        <h1 className="text-2xl font-medium tracking-wide text-[var(--saju-text)]">성명학 개별분석</h1>
        <p className="text-sm text-[var(--saju-text-muted)]">
          이름과 사주의 궁합을 보려면 먼저 사주 개별분석을 완료해주세요. 사주에서 계산된 오행 분포를
          이름의 자원오행과 비교해 보완/상충 여부를 판정합니다.
        </p>
        <Link
          href="/saju"
          className="rounded-full bg-[var(--saju-accent)] px-6 py-3 text-sm font-medium text-[#15120f] transition-opacity hover:opacity-90"
        >
          사주 개별분석 하러 가기 →
        </Link>
      </div>
    );
  }

  if (analysis) {
    return <SeongmyeongResult {...analysis} onReset={handleReset} />;
  }

  return <SeongmyeongForm onSubmit={handleSubmit} />;
}
