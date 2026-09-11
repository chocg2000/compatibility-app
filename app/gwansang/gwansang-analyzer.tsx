"use client";

import { useState, useTransition } from "react";
import { analyzeFaceGeometry } from "@/lib/gwansang/analyzer";
import { extractFaceLandmarks, getImageData, loadImageFromFile } from "@/lib/gwansang/face-landmarker";
import {
  composeGwansangInterpretation,
  type GwansangAnalysisResult,
} from "@/lib/gwansang/gwansang-interpretations";
import { setGwansangData, useUserProfile } from "@/lib/profile/user-profile";
import GwansangResult from "./gwansang-result";
import PhotoUpload from "./photo-upload";

interface Analysis {
  photoUrl: string;
  result: GwansangAnalysisResult;
}

function Spinner() {
  return (
    <span
      className="h-4 w-4 animate-spin rounded-full border-2 border-[#15120f]/30 border-t-[#15120f]"
      aria-hidden="true"
    />
  );
}

export default function GwansangAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isPending, startTransition] = useTransition();
  const { updateProfile } = useUserProfile();

  function handleFileSelect(next: File | null) {
    setFile(next);
    setError(null);
  }

  function handleAnalyze() {
    if (!file) return;
    setError(null);

    // 분석 전체가 브라우저 안에서(MediaPipe FaceLandmarker + 규칙 기반 분류) 끝난다 -
    // 사진이 서버로 전송되지 않는다.
    startTransition(async () => {
      const image = await loadImageFromFile(file).catch(() => null);
      if (!image) {
        setError("이미지를 불러오지 못했습니다. 다른 사진으로 다시 시도해주세요.");
        return;
      }

      const extraction = await extractFaceLandmarks(image).catch(() => null);
      if (!extraction) {
        setError("분석 모델을 불러오지 못했습니다. 네트워크 연결을 확인한 뒤 다시 시도해주세요.");
        return;
      }

      if (extraction.status === "no_face") {
        setError("사진에서 얼굴을 인식하지 못했습니다. 정면이 잘 보이는 사진으로 다시 시도해주세요.");
        return;
      }
      if (extraction.status === "multiple_faces") {
        setError("사진에서 여러 명의 얼굴이 감지되었습니다. 분석하려는 한 사람만 나온 사진으로 다시 업로드해주세요.");
        return;
      }

      const geometry = analyzeFaceGeometry(extraction.landmarks, getImageData(image));
      const interpretation = composeGwansangInterpretation(geometry);
      const result: GwansangAnalysisResult = { geometry, interpretation };
      const photoUrl = URL.createObjectURL(file);

      setAnalysis({ photoUrl, result });
      updateProfile((profile) => setGwansangData(profile, result));
    });
  }

  function handleReset() {
    if (analysis) URL.revokeObjectURL(analysis.photoUrl);
    setAnalysis(null);
    setFile(null);
    setError(null);
  }

  if (analysis) {
    return <GwansangResult photoUrl={analysis.photoUrl} result={analysis.result} onReset={handleReset} />;
  }

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <PhotoUpload onFileSelect={handleFileSelect} disabled={isPending} />

      {error && (
        <div
          role="alert"
          className="flex w-full max-w-lg items-start gap-2 rounded-lg border border-[var(--saju-accent)]/40 bg-[var(--saju-accent)]/10 px-4 py-3 text-sm text-[var(--saju-text)]"
        >
          <span aria-hidden="true">⚠</span>
          <span>{error}</span>
        </div>
      )}

      <button
        type="button"
        onClick={handleAnalyze}
        disabled={!file || isPending}
        className="flex items-center justify-center gap-2 rounded-full bg-[var(--saju-accent)] px-6 py-3 text-sm font-medium text-[#15120f] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Spinner />
            분석하는 중...
          </>
        ) : (
          "관상 분석하기"
        )}
      </button>
    </div>
  );
}
