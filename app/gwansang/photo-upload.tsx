"use client";

import { useEffect, useId, useRef, useState } from "react";

const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png"];
const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png"];
const DEFAULT_MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export interface PhotoUploadProps {
  /** 파일이 선택/해제될 때마다 호출된다. 검증에 실패한 파일은 전달되지 않는다. */
  onFileSelect?: (file: File | null) => void;
  /** 허용할 최대 파일 크기(byte). 기본 10MB. */
  maxSizeBytes?: number;
  disabled?: boolean;
}

function formatFileSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function hasAcceptedExtension(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function validateFile(file: File, maxSizeBytes: number): string | null {
  const hasAcceptedType = ACCEPTED_MIME_TYPES.includes(file.type) || hasAcceptedExtension(file.name);
  if (!hasAcceptedType) {
    return "JPG 또는 PNG 형식의 이미지만 업로드할 수 있습니다.";
  }
  if (file.size > maxSizeBytes) {
    return `파일 크기는 ${formatFileSize(maxSizeBytes)} 이하여야 합니다.`;
  }
  return null;
}

function UploadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className="h-8 w-8 text-[var(--saju-text-muted)]"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 16V4m0 0-4 4m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
      />
    </svg>
  );
}

/**
 * 관상 개별분석용 사진 업로드 컴포넌트.
 * 드래그앤드롭/클릭 업로드, 업로드 전 미리보기, 형식·용량 검증을 담당하며
 * 실제 분석 요청 전송은 하지 않는다(파일 선택 결과만 onFileSelect로 알려준다).
 */
export default function PhotoUpload({
  onFileSelect,
  maxSizeBytes = DEFAULT_MAX_SIZE_BYTES,
  disabled = false,
}: PhotoUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 미리보기용 objectURL은 컴포넌트가 언마운트되거나 다른 파일로 교체될 때 반드시 해제한다.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function applyFile(candidate: File) {
    const validationError = validateFile(candidate, maxSizeBytes);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }
    setErrorMessage(null);
    setFile(candidate);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(candidate);
    });
    onFileSelect?.(candidate);
  }

  function handleFiles(fileList: FileList | null) {
    const candidate = fileList?.[0];
    if (!candidate) return;
    applyFile(candidate);
  }

  function handleRemove() {
    setFile(null);
    setErrorMessage(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (inputRef.current) inputRef.current.value = "";
    onFileSelect?.(null);
  }

  return (
    <div className="flex w-full max-w-lg flex-col gap-6 rounded-2xl border border-[var(--saju-border)] bg-[var(--saju-bg-elevated)] p-8 sm:p-10">
      <div className="flex flex-col gap-2 text-center">
        <h2 className="text-2xl font-medium tracking-wide text-[var(--saju-text)]">
          관상 사진 업로드
        </h2>
        <p className="text-sm text-[var(--saju-text-muted)]">
          정면을 바라보고, 이목구비가 또렷하게 나온 밝은 사진일수록 분석 정확도가 높아집니다.
        </p>
      </div>

      <label
        htmlFor={inputId}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          if (disabled) return;
          handleFiles(event.dataTransfer.files);
        }}
        className={`flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        } ${
          isDragging
            ? "border-[var(--saju-accent)] bg-[var(--saju-accent)]/10"
            : "border-[var(--saju-border)] hover:border-[var(--saju-accent)]/60"
        }`}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={[...ACCEPTED_MIME_TYPES, ...ACCEPTED_EXTENSIONS].join(",")}
          disabled={disabled}
          onChange={(event) => handleFiles(event.target.files)}
          className="sr-only"
        />
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- 로컬 objectURL 미리보기라 next/image 최적화 대상이 아님
          <img
            src={previewUrl}
            alt="업로드한 사진 미리보기"
            className="max-h-56 rounded-lg object-contain"
          />
        ) : (
          <>
            <UploadIcon />
            <div className="flex flex-col gap-1">
              <p className="text-sm text-[var(--saju-text)]">
                클릭하거나 사진을 이 영역으로 끌어다 놓으세요
              </p>
              <p className="text-xs text-[var(--saju-text-muted)]">
                JPG, PNG · 최대 {formatFileSize(maxSizeBytes)}
              </p>
            </div>
          </>
        )}
      </label>

      {file && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--saju-border)] bg-[var(--saju-bg)] px-4 py-2 text-sm">
          <span className="truncate text-[var(--saju-text-muted)]">{file.name}</span>
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="shrink-0 text-[var(--saju-accent)] hover:underline disabled:cursor-not-allowed disabled:opacity-40"
          >
            다시 선택
          </button>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-[var(--saju-accent)]/40 bg-[var(--saju-accent)]/10 px-4 py-3 text-sm text-[var(--saju-text)]"
        >
          <span aria-hidden="true">⚠</span>
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="flex items-start gap-2 border-t border-[var(--saju-border)] pt-4 text-xs text-[var(--saju-text-muted)]">
        <span aria-hidden="true">🔒</span>
        <p>사진은 분석 후 저장되지 않습니다. 업로드한 이미지는 분석이 끝나면 즉시 삭제됩니다.</p>
      </div>
    </div>
  );
}
