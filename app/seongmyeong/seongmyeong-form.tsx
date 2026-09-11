"use client";

import { useState } from "react";
import { getHanjaCandidates, type HanjaCandidate } from "@/lib/seongmyeong";
import {
  emptyCharacterEntry,
  resolveCharacterEntry,
  type CharacterEntry,
  type CharacterEntryMode,
} from "./character-entry";

export interface SeongmyeongFormValues {
  name: string;
  entries: CharacterEntry[];
}

interface SeongmyeongFormProps {
  onSubmit: (values: SeongmyeongFormValues) => void;
}

const HANGUL_NAME_PATTERN = /^[가-힣]{1,6}$/;

const fieldLabelClass = "text-sm text-[var(--saju-text-muted)]";
const inputClass =
  "w-full rounded-md border border-[var(--saju-border)] bg-[var(--saju-bg)] px-3 py-2 text-[var(--saju-text)] outline-none focus:border-[var(--saju-accent)] disabled:opacity-40";

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
          className={`px-3 py-1.5 text-xs transition-colors ${
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

function HanjaCandidateList({
  candidates,
  onSelect,
}: {
  candidates: HanjaCandidate[];
  onSelect: (hanja: string) => void;
}) {
  return (
    <div
      className="absolute z-10 mt-1 max-h-56 w-full touch-pan-y overflow-y-auto overscroll-contain rounded-md border border-[var(--saju-border)] bg-[var(--saju-bg-elevated)] shadow-lg"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {candidates.map((candidate) => (
        <button
          key={candidate.한자}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(candidate.한자);
          }}
          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--saju-bg)]"
        >
          <span className="flex items-center gap-2">
            <span className="font-[family-name:var(--font-saju-calligraphy)] text-base text-[var(--saju-text)]">
              {candidate.한자}
            </span>
            {candidate.훈 ? (
              <span className="text-xs text-[var(--saju-text-muted)]">{candidate.훈}</span>
            ) : (
              <span className="text-xs italic text-[var(--saju-text-muted)] opacity-70">뜻 정보 없음</span>
            )}
          </span>
          <span className="shrink-0 text-xs text-[var(--saju-text-muted)]">
            {candidate.오행} · {candidate.획수}획
          </span>
        </button>
      ))}
    </div>
  );
}

function CharacterRow({
  index,
  hangul,
  entry,
  onChange,
}: {
  index: number;
  hangul: string;
  entry: CharacterEntry;
  onChange: (next: CharacterEntry) => void;
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const resolution = resolveCharacterEntry(entry);
  const candidates = getHanjaCandidates(hangul);

  function setMode(mode: CharacterEntryMode) {
    onChange({ ...entry, mode });
  }

  function selectCandidate(hanja: string) {
    onChange({ ...entry, hanja });
    setIsDropdownOpen(false);
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-[var(--saju-border)] bg-[var(--saju-bg)] p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-[var(--saju-text)]">
          {index + 1}번째 글자 ·{" "}
          <span className="font-[family-name:var(--font-saju-calligraphy)] text-lg">{hangul}</span>
        </span>
        <ToggleGroup
          value={entry.mode}
          onChange={setMode}
          options={[
            { value: "auto", label: "한자로 조회" },
            { value: "manual", label: "획수 직접입력" },
          ]}
        />
      </div>

      {entry.mode === "auto" ? (
        <div className="relative">
          <input
            type="text"
            value={entry.hanja}
            maxLength={1}
            placeholder="한자 한 글자 (예: 洪)"
            onChange={(e) => onChange({ ...entry, hanja: e.target.value })}
            onFocus={() => setIsDropdownOpen(true)}
            onBlur={() => setTimeout(() => setIsDropdownOpen(false), 150)}
            className={`${inputClass} font-[family-name:var(--font-saju-calligraphy)] text-lg`}
          />
          {isDropdownOpen && candidates.length > 0 && (
            <HanjaCandidateList candidates={candidates} onSelect={selectCandidate} />
          )}
        </div>
      ) : (
        <input
          type="number"
          min={1}
          value={entry.manualStrokes}
          placeholder="획수 (예: 10)"
          onChange={(e) => onChange({ ...entry, manualStrokes: e.target.value })}
          className={inputClass}
        />
      )}

      {entry.mode === "auto" && candidates.length === 0 && (
        <p className="text-xs text-[var(--saju-text-muted)]">
          사전에 없는 음이에요. 한자를 직접 입력하거나 &apos;획수 직접입력&apos;을 이용해주세요.
        </p>
      )}

      {resolution.status === "ok" && (
        <p className="text-xs text-[var(--saju-text-muted)]">
          {resolution.hanja && `${resolution.hanja} · `}
          필획 {resolution.dictionaryStrokes}획 → 원획 {resolution.strokes}획 · {resolution.oheng}
        </p>
      )}
      {resolution.status === "error" && (
        <p className="text-xs text-[var(--saju-accent)]">{resolution.message}</p>
      )}
    </div>
  );
}

export default function SeongmyeongForm({ onSubmit }: SeongmyeongFormProps) {
  const [name, setName] = useState("");
  const [entries, setEntries] = useState<CharacterEntry[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const nameChars = [...name];

  function handleNameChange(nextName: string) {
    setName(nextName);
    setEntries((prev) => [...nextName].map((_, i) => prev[i] ?? emptyCharacterEntry()));
  }

  function handleEntryChange(index: number, nextEntry: CharacterEntry) {
    setEntries((prev) => prev.map((entry, i) => (i === index ? nextEntry : entry)));
  }

  const isNameValid = HANGUL_NAME_PATTERN.test(name);
  const resolutions = entries.map(resolveCharacterEntry);
  const isEveryEntryResolved =
    entries.length > 0 && resolutions.every((resolution) => resolution.status === "ok");
  const canSubmit = isNameValid && isEveryEntryResolved;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) {
      setErrorMessage("이름과 한자(또는 획수)를 모두 올바르게 입력해주세요.");
      return;
    }
    setErrorMessage(null);
    onSubmit({ name, entries });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-lg flex-col gap-6 rounded-2xl border border-[var(--saju-border)] bg-[var(--saju-bg-elevated)] p-8 sm:p-10"
    >
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-3xl font-medium tracking-wide text-[var(--saju-text)]">성명학 개별분석</h1>
        <p className="text-sm text-[var(--saju-text-muted)]">
          이름 한자의 획수로 자원오행을, 한글 발음으로 발음오행을 풀이하고 사주와의 궁합을 살펴봅니다.
        </p>
      </div>

      <label className="flex flex-col gap-2">
        <span className={fieldLabelClass}>한글 이름</span>
        <input
          type="text"
          value={name}
          maxLength={6}
          placeholder="예: 홍길동"
          onChange={(e) => handleNameChange(e.target.value)}
          className={inputClass}
        />
        {name.length > 0 && !isNameValid && (
          <span className="text-xs text-[var(--saju-accent)]">한글 완성형 글자 1~6자로 입력해주세요.</span>
        )}
      </label>

      {isNameValid && (
        <div className="flex flex-col gap-3">
          <span className={fieldLabelClass}>한자 입력</span>
          {nameChars.map((hangul, index) => (
            <CharacterRow
              key={index}
              index={index}
              hangul={hangul}
              entry={entries[index] ?? emptyCharacterEntry()}
              onChange={(next) => handleEntryChange(index, next)}
            />
          ))}
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

      <button
        type="submit"
        disabled={!canSubmit}
        className="flex items-center justify-center gap-2 rounded-full bg-[var(--saju-accent)] px-6 py-3 text-sm font-medium text-[#15120f] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        성명학 분석하기
      </button>
    </form>
  );
}
