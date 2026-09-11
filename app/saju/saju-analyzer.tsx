"use client";

import { useEffect, useState } from "react";
import { setSajuData, useUserProfile } from "@/lib/profile/user-profile";
import {
  calculateOhengDistribution,
  calculateSaju,
  calculateSipseong,
  type OhengDistribution,
  type SajuPillars,
  type SajuSipseong,
} from "@/lib/saju";
import SajuForm, { type Gender, type SajuFormValues } from "./saju-form";
import SajuResult from "./saju-result";

interface SajuAnalysis {
  pillars: SajuPillars;
  sipseong: SajuSipseong;
  oheng: OhengDistribution;
  gender: Gender;
}

/**
 * 계산 자체는 즉시 끝나지만(순수 함수), "계산 중" 상태가 순간적으로 깜빡이며 지나가지
 * 않도록 최소한의 로딩 시간을 준다. 사용자가 버튼을 누른 것이 실제로 반영됐다는
 * 시각적 피드백을 주기 위함이다.
 */
const MIN_LOADING_MS = 400;

export default function SajuAnalyzer() {
  const [analysis, setAnalysis] = useState<SajuAnalysis | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingValues, setPendingValues] = useState<SajuFormValues | null>(null);
  const { updateProfile } = useUserProfile();

  const isSubmitting = pendingValues !== null;

  useEffect(() => {
    if (!pendingValues) return;

    const values = pendingValues;
    const timer = setTimeout(() => {
      try {
        const pillars = calculateSaju({
          year: values.year,
          month: values.month,
          day: values.day,
          hour: values.hour,
          minute: values.minute,
          isLunar: values.isLunar,
          isLeapMonth: values.isLeapMonth,
          isTimeUnknown: values.isTimeUnknown,
        });
        const sipseong = calculateSipseong(pillars);
        const oheng = calculateOhengDistribution(pillars);
        setAnalysis({ pillars, sipseong, oheng, gender: values.gender });
        setErrorMessage(null);
        updateProfile((profile) =>
          setSajuData(profile, { pillars, sipseong, oheng, gender: values.gender }),
        );
      } catch (error) {
        setAnalysis(null);
        setErrorMessage(
          error instanceof Error ? error.message : "입력한 생년월일시를 확인해주세요.",
        );
      } finally {
        setPendingValues(null);
      }
    }, MIN_LOADING_MS);

    return () => clearTimeout(timer);
  }, [pendingValues, updateProfile]);

  function handleSubmit(values: SajuFormValues) {
    setErrorMessage(null);
    setPendingValues(values);
  }

  function handleReset() {
    setAnalysis(null);
    setErrorMessage(null);
    setPendingValues(null);
  }

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      {analysis ? (
        <SajuResult
          pillars={analysis.pillars}
          sipseong={analysis.sipseong}
          oheng={analysis.oheng}
          gender={analysis.gender}
          onReset={handleReset}
        />
      ) : (
        <SajuForm onSubmit={handleSubmit} errorMessage={errorMessage} isSubmitting={isSubmitting} />
      )}
    </div>
  );
}
