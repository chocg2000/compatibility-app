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

/**
 * "처음부터 다시하기" 확인 팝업.
 * 브라우저 네이티브 confirm() 대신 페이지 톤에 맞춘 오버레이로 직접 구현했다.
 */
function ResetConfirmDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
      <div className="flex w-full max-w-sm flex-col gap-5 rounded-2xl border border-[var(--saju-border)] bg-[var(--saju-bg-elevated)] p-6 text-center shadow-xl">
        <p className="text-sm leading-6 text-[var(--saju-text)]">
          정말 처음부터 다시 시작하시겠어요? 입력한 내용이 모두 사라집니다.
        </p>
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-[var(--saju-border)] px-5 py-2 text-sm text-[var(--saju-text-muted)] transition-colors hover:text-[var(--saju-text)]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-[var(--saju-accent)] px-5 py-2 text-sm font-medium text-[#15120f] transition-opacity hover:opacity-90"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CompatibilityAnalyzer() {
  const { profile: myProfile, updateProfile: updateMyProfile } = useUserProfile();
  const [partnerProfile, setPartnerProfile] = useState<UserProfile>(emptyProfile);
  const [result, setResult] = useState<OverallCompatibilityResult | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  // PersonInputWizard에 key로 넘겨 리셋 시 강제로 다시 마운트한다 - profile을
  // 비우는 것만으로는 위저드 내부의 임시 UI 상태(예: 아직 분석 전인 업로드
  // 사진 파일)까지는 지워지지 않기 때문이다.
  const [resetCount, setResetCount] = useState(0);

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
    setResetCount((count) => count + 1);
  }

  function handleConfirmReset() {
    handleReset();
    setIsResetConfirmOpen(false);
  }

  if (result) {
    return <CompatibilityResult result={result} onReset={handleReset} />;
  }

  return (
    <div className="flex w-full max-w-3xl flex-col gap-10">
      <div className="flex flex-col gap-4">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="rounded-full border border-[var(--saju-border)] px-4 py-1.5 text-xs text-[var(--saju-text-muted)] transition-colors hover:border-[var(--saju-accent)] hover:text-[var(--saju-text)]"
          >
            ↺ 처음부터 다시하기
          </button>
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-3xl font-medium tracking-wide text-[var(--saju-text)]">종합궁합</h1>
          <p className="text-sm text-[var(--saju-text-muted)]">
            MBTI·사주·관상·성명학 네 가지 분석을 종합해 두 사람의 궁합을 살펴봅니다.
          </p>
        </div>
      </div>

      {isResetConfirmOpen && (
        <ResetConfirmDialog onConfirm={handleConfirmReset} onCancel={() => setIsResetConfirmOpen(false)} />
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <section className="flex flex-col gap-4 rounded-2xl border border-[var(--saju-border)] bg-[var(--saju-bg-elevated)] p-6">
          <h2 className="text-lg font-medium text-[var(--saju-text)]">나의 프로필</h2>
          {myComplete ? (
            <p className="text-sm text-[var(--saju-text-muted)]">
              저장된 프로필을 불러왔습니다. (MBTI·사주·관상·성명학 모두 완료)
            </p>
          ) : (
            <PersonInputWizard key={resetCount} profile={myProfile} updateProfile={updateMyProfile} />
          )}
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-[var(--saju-border)] bg-[var(--saju-bg-elevated)] p-6">
          <h2 className="text-lg font-medium text-[var(--saju-text)]">상대방 프로필</h2>
          {partnerComplete ? (
            <p className="text-sm text-[var(--saju-text-muted)]">상대방 정보 입력을 완료했습니다.</p>
          ) : (
            <PersonInputWizard key={resetCount} profile={partnerProfile} updateProfile={updatePartnerProfile} />
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
