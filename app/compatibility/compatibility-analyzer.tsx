"use client";

import { useState } from "react";
import { useUserProfile, type UserProfile } from "@/lib/profile/user-profile";
import { calculateOverallCompatibility, type OverallCompatibilityResult } from "@/lib/compatibility";
import { buildOverallCompatibilityInput, isProfileComplete } from "./adapters";
import PersonInputWizard from "./person-input-wizard";
import CompatibilityResult from "./compatibility-result";

function emptyProfile(): UserProfile {
  return { updatedAt: new Date().toISOString() };
}

export default function CompatibilityAnalyzer() {
  const { profile: myProfile, updateProfile: updateMyProfile } = useUserProfile();
  const [partnerProfile, setPartnerProfile] = useState<UserProfile>(emptyProfile);
  const [result, setResult] = useState<OverallCompatibilityResult | null>(null);

  function updatePartnerProfile(updater: (current: UserProfile) => UserProfile) {
    setPartnerProfile((current) => updater(current));
  }

  const myComplete = isProfileComplete(myProfile);
  const partnerComplete = isProfileComplete(partnerProfile);

  function handleCompare() {
    const input = buildOverallCompatibilityInput(myProfile, partnerProfile);
    if (!input) return;
    setResult(calculateOverallCompatibility(input));
  }

  function handleReset() {
    setResult(null);
    setPartnerProfile(emptyProfile());
  }

  if (result) {
    return <CompatibilityResult result={result} onReset={handleReset} />;
  }

  return (
    <div className="flex w-full max-w-3xl flex-col gap-10">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-3xl font-medium tracking-wide text-[var(--saju-text)]">종합궁합</h1>
        <p className="text-sm text-[var(--saju-text-muted)]">
          MBTI·사주·관상·성명학 네 가지 분석을 종합해 두 사람의 궁합을 살펴봅니다.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <section className="flex flex-col gap-4 rounded-2xl border border-[var(--saju-border)] bg-[var(--saju-bg-elevated)] p-6">
          <h2 className="text-lg font-medium text-[var(--saju-text)]">나의 프로필</h2>
          {myComplete ? (
            <p className="text-sm text-[var(--saju-text-muted)]">
              저장된 프로필을 불러왔습니다. (MBTI·사주·관상·성명학 모두 완료)
            </p>
          ) : (
            <PersonInputWizard profile={myProfile} updateProfile={updateMyProfile} />
          )}
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-[var(--saju-border)] bg-[var(--saju-bg-elevated)] p-6">
          <h2 className="text-lg font-medium text-[var(--saju-text)]">상대방 프로필</h2>
          {partnerComplete ? (
            <p className="text-sm text-[var(--saju-text-muted)]">상대방 정보 입력을 완료했습니다.</p>
          ) : (
            <PersonInputWizard profile={partnerProfile} updateProfile={updatePartnerProfile} />
          )}
        </section>
      </div>

      <button
        type="button"
        onClick={handleCompare}
        disabled={!myComplete || !partnerComplete}
        className="flex items-center justify-center gap-2 self-center rounded-full bg-[var(--saju-accent)] px-8 py-3 text-sm font-medium text-[#15120f] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        궁합 분석하기
      </button>
    </div>
  );
}
