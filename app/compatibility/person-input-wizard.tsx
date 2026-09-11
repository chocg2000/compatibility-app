"use client";

import { useState } from "react";
import {
  setGwansangData,
  setMbtiData,
  setSajuData,
  setSeongmyeongData,
  type UserProfile,
} from "@/lib/profile/user-profile";
import type { MbtiPole, MbtiTypeCode } from "@/lib/mbti/types";
import { calculateOhengDistribution, calculateSaju, calculateSipseong } from "@/lib/saju";
import { analyzeFaceGeometry } from "@/lib/gwansang/analyzer";
import { extractFaceLandmarks, getImageData, loadImageFromFile } from "@/lib/gwansang/face-landmarker";
import { composeGwansangInterpretation, type GwansangAnalysisResult } from "@/lib/gwansang/gwansang-interpretations";
import {
  calculateNameBaleumOheng,
  calculateSajuJawonCompatibility,
  type HanjaJawonOheng,
  type JawonOhengDistribution,
} from "@/lib/seongmyeong";
import { resolveCharacterEntry } from "@/app/seongmyeong/character-entry";
import SeongmyeongForm, { type SeongmyeongFormValues } from "@/app/seongmyeong/seongmyeong-form";
import SajuForm, { type SajuFormValues } from "@/app/saju/saju-form";
import PhotoUpload from "@/app/gwansang/photo-upload";
import { buildMbtiResultFromType } from "./adapters";

type WizardStep = "mbti" | "saju" | "gwansang" | "seongmyeong";

const STEPS: WizardStep[] = ["mbti", "saju", "gwansang", "seongmyeong"];

const STEP_LABELS: Record<WizardStep, string> = {
  mbti: "MBTI",
  saju: "사주",
  gwansang: "관상",
  seongmyeong: "성명학",
};

const MBTI_AXIS_OPTIONS: { axis: string; poles: [MbtiPole, MbtiPole] }[] = [
  { axis: "외향(E) · 내향(I)", poles: ["E", "I"] },
  { axis: "감각(S) · 직관(N)", poles: ["S", "N"] },
  { axis: "사고(T) · 감정(F)", poles: ["T", "F"] },
  { axis: "판단(J) · 인식(P)", poles: ["J", "P"] },
];

function ToggleGroup<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (next: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-[var(--saju-border)]">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`px-4 py-2 text-sm transition-colors ${
            value === option.value
              ? "bg-[var(--saju-accent)] text-[#15120f]"
              : "bg-transparent text-[var(--saju-text-muted)] hover:text-[var(--saju-text)]"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-[var(--saju-accent)]/40 bg-[var(--saju-accent)]/10 px-4 py-3 text-sm text-[var(--saju-text)]"
    >
      <span aria-hidden="true">⚠</span>
      <span>{message}</span>
    </div>
  );
}

function MbtiPicker({ onSubmit }: { onSubmit: (type: MbtiTypeCode) => void }) {
  const [poles, setPoles] = useState<[MbtiPole, MbtiPole, MbtiPole, MbtiPole]>(["E", "S", "T", "J"]);

  function setPoleAt(index: number, pole: MbtiPole) {
    setPoles((prev) => {
      const next = [...prev] as typeof prev;
      next[index] = pole;
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-[var(--saju-text-muted)]">이미 알고 있는 MBTI 유형을 선택해주세요.</p>
      {MBTI_AXIS_OPTIONS.map(({ axis, poles: axisPoles }, index) => (
        <div key={axis} className="flex items-center justify-between gap-3">
          <span className="text-sm text-[var(--saju-text-muted)]">{axis}</span>
          <ToggleGroup
            value={poles[index]}
            onChange={(pole) => setPoleAt(index, pole)}
            options={axisPoles.map((pole) => ({ value: pole, label: pole }))}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => onSubmit(poles.join("") as MbtiTypeCode)}
        className="self-end rounded-full bg-[var(--saju-accent)] px-6 py-2.5 text-sm font-medium text-[#15120f] transition-opacity hover:opacity-90"
      >
        다음
      </button>
    </div>
  );
}

function buildJawonDistribution(characters: HanjaJawonOheng[]): JawonOhengDistribution {
  const distribution: JawonOhengDistribution = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  for (const character of characters) {
    distribution[character.oheng] += 1;
  }
  return distribution;
}

export interface PersonInputWizardProps {
  profile: UserProfile;
  updateProfile: (updater: (current: UserProfile) => UserProfile) => void;
}

/**
 * MBTI -> 사주 -> 관상 -> 성명학 순서로, profile에 아직 없는 단계 하나만 보여주는
 * 4단계 입력 위저드. 진행 상태는 profile prop에서 그대로 파생한다(부모가
 * updateProfile로 profile을 갱신하면 다음 단계로 자연스럽게 넘어간다) - 위저드
 * 자신은 "지금 몇 단계인지"를 별도 상태로 들고 있지 않는다.
 */
export default function PersonInputWizard({ profile, updateProfile }: PersonInputWizardProps) {
  const [gwansangFile, setGwansangFile] = useState<File | null>(null);
  const [isAnalyzingGwansang, setIsAnalyzingGwansang] = useState(false);
  const [gwansangError, setGwansangError] = useState<string | null>(null);

  const currentStep = STEPS.find((step) => !profile[step]) ?? null;
  if (!currentStep) return null;

  const stepIndex = STEPS.indexOf(currentStep);

  async function handleGwansangAnalyze() {
    if (!gwansangFile) return;
    setGwansangError(null);
    setIsAnalyzingGwansang(true);
    try {
      const image = await loadImageFromFile(gwansangFile).catch(() => null);
      if (!image) {
        setGwansangError("이미지를 불러오지 못했습니다. 다른 사진으로 다시 시도해주세요.");
        return;
      }

      const extraction = await extractFaceLandmarks(image).catch(() => null);
      if (!extraction) {
        setGwansangError("분석 모델을 불러오지 못했습니다. 네트워크 연결을 확인한 뒤 다시 시도해주세요.");
        return;
      }
      if (extraction.status === "no_face") {
        setGwansangError("사진에서 얼굴을 인식하지 못했습니다. 정면이 잘 보이는 사진으로 다시 시도해주세요.");
        return;
      }
      if (extraction.status === "multiple_faces") {
        setGwansangError("사진에서 여러 명의 얼굴이 감지되었습니다. 한 사람만 나온 사진으로 다시 업로드해주세요.");
        return;
      }

      const geometry = analyzeFaceGeometry(extraction.landmarks, getImageData(image));
      const interpretation = composeGwansangInterpretation(geometry);
      const result: GwansangAnalysisResult = { geometry, interpretation };
      updateProfile((current) => setGwansangData(current, result));
    } finally {
      setIsAnalyzingGwansang(false);
    }
  }

  function handleSeongmyeongSubmit(values: SeongmyeongFormValues) {
    if (!profile.saju) return;

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
    const jawonOheng = { characters: jawonCharacters, distribution: buildJawonDistribution(jawonCharacters) };
    const baleumOheng = calculateNameBaleumOheng(values.name);
    const compatibility = calculateSajuJawonCompatibility(profile.saju.oheng, jawonOheng);

    updateProfile((current) =>
      setSeongmyeongData(current, { name: values.name, jawonOheng, baleumOheng, compatibility }),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-[var(--saju-text-muted)]">
        {stepIndex + 1} / {STEPS.length}단계 · {STEP_LABELS[currentStep]}
      </p>

      {currentStep === "mbti" && (
        <MbtiPicker
          onSubmit={(type) => updateProfile((current) => setMbtiData(current, buildMbtiResultFromType(type)))}
        />
      )}

      {currentStep === "saju" && (
        <SajuForm
          errorMessage={null}
          isSubmitting={false}
          onSubmit={(values: SajuFormValues) => {
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
            updateProfile((current) => setSajuData(current, { pillars, sipseong, oheng, gender: values.gender }));
          }}
        />
      )}

      {currentStep === "gwansang" && (
        <div className="flex flex-col gap-4">
          <PhotoUpload onFileSelect={setGwansangFile} disabled={isAnalyzingGwansang} />
          {gwansangError && <ErrorBox message={gwansangError} />}
          <button
            type="button"
            onClick={handleGwansangAnalyze}
            disabled={!gwansangFile || isAnalyzingGwansang}
            className="self-end rounded-full bg-[var(--saju-accent)] px-6 py-2.5 text-sm font-medium text-[#15120f] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isAnalyzingGwansang ? "분석하는 중..." : "관상 분석하기"}
          </button>
        </div>
      )}

      {currentStep === "seongmyeong" && <SeongmyeongForm onSubmit={handleSeongmyeongSubmit} />}
    </div>
  );
}
