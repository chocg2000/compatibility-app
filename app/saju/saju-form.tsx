"use client";

import { useState } from "react";
import { getDaysInSolarMonth } from "@/lib/saju";

export type Gender = "male" | "female";

export interface SajuFormValues {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  isLunar: boolean;
  isLeapMonth: boolean;
  isTimeUnknown: boolean;
  gender: Gender;
}

interface SajuFormProps {
  onSubmit: (values: SajuFormValues) => void;
  errorMessage: string | null;
  /** 부모가 계산을 진행 중일 때 입력을 잠그고 버튼에 로딩 상태를 보여준다. */
  isSubmitting: boolean;
}

const CURRENT_YEAR = new Date().getFullYear();
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);
/** 음력 달은 항상 29일 또는 30일이므로(31일은 없음) 최대 30일까지만 보여준다. */
const MAX_LUNAR_MONTH_DAYS = 30;
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => i);

const fieldLabelClass = "text-sm text-[var(--saju-text-muted)]";
const selectClass =
  "w-full rounded-md border border-[var(--saju-border)] bg-[var(--saju-bg)] px-3 py-2 text-[var(--saju-text)] outline-none focus:border-[var(--saju-accent)] disabled:opacity-40";

function ToggleGroup<T extends string>({
  value,
  onChange,
  disabled,
  options,
}: {
  value: T;
  onChange: (next: T) => void;
  disabled?: boolean;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-[var(--saju-border)]">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={`px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
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

function Spinner() {
  return (
    <span
      className="h-4 w-4 animate-spin rounded-full border-2 border-[#15120f]/30 border-t-[#15120f]"
      aria-hidden="true"
    />
  );
}

export default function SajuForm({ onSubmit, errorMessage, isSubmitting }: SajuFormProps) {
  const [year, setYear] = useState(1990);
  const [month, setMonth] = useState(1);
  const [day, setDay] = useState(1);
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(0);
  const [isLunar, setIsLunar] = useState(false);
  const [isLeapMonth, setIsLeapMonth] = useState(false);
  const [isTimeUnknown, setIsTimeUnknown] = useState(false);
  const [gender, setGender] = useState<Gender>("male");

  const safeYear = Number.isFinite(year) ? year : CURRENT_YEAR;
  const maxDay = isLunar ? MAX_LUNAR_MONTH_DAYS : getDaysInSolarMonth(safeYear, month);
  const dayOptions = Array.from({ length: maxDay }, (_, i) => i + 1);

  // '일'이 그 달의 날짜 수를 넘어가면 변경이 일어난 그 자리에서 바로 줄여준다.
  // (effect로 뒤늦게 clamp하지 않고, 연/월/양음력을 바꾸는 이벤트 핸들러 안에서 함께 처리)
  function clampDayTo(nextMax: number) {
    setDay((current) => Math.min(current, nextMax));
  }

  function handleYearChange(nextYear: number) {
    setYear(nextYear);
    const safeNextYear = Number.isFinite(nextYear) ? nextYear : CURRENT_YEAR;
    clampDayTo(isLunar ? MAX_LUNAR_MONTH_DAYS : getDaysInSolarMonth(safeNextYear, month));
  }

  function handleMonthChange(nextMonth: number) {
    setMonth(nextMonth);
    clampDayTo(isLunar ? MAX_LUNAR_MONTH_DAYS : getDaysInSolarMonth(safeYear, nextMonth));
  }

  function handleCalendarTypeChange(next: "solar" | "lunar") {
    const nextIsLunar = next === "lunar";
    setIsLunar(nextIsLunar);
    if (!nextIsLunar) {
      // 양력으로 전환하면 윤달 개념이 없으므로 초기화한다.
      setIsLeapMonth(false);
    }
    clampDayTo(nextIsLunar ? MAX_LUNAR_MONTH_DAYS : getDaysInSolarMonth(safeYear, month));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onSubmit({
      year,
      month,
      day,
      hour,
      minute,
      isLunar,
      isLeapMonth,
      isTimeUnknown,
      gender,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-lg flex-col gap-8 rounded-2xl border border-[var(--saju-border)] bg-[var(--saju-bg-elevated)] p-8 sm:p-10"
    >
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-3xl font-medium tracking-wide text-[var(--saju-text)]">
          사주 개별분석
        </h1>
        <p className="text-sm text-[var(--saju-text-muted)]">
          생년월일시를 입력하면 사주 여덟 글자와 오행, 십성을 풀이해 드립니다.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span className={fieldLabelClass}>양력 / 음력</span>
        <div className="flex flex-wrap items-center gap-3">
          <ToggleGroup
            value={isLunar ? "lunar" : "solar"}
            onChange={handleCalendarTypeChange}
            disabled={isSubmitting}
            options={[
              { value: "solar", label: "양력" },
              { value: "lunar", label: "음력" },
            ]}
          />
          {isLunar && (
            <label className="flex items-center gap-2 text-sm text-[var(--saju-text-muted)]">
              <input
                type="checkbox"
                checked={isLeapMonth}
                disabled={isSubmitting}
                onChange={(e) => setIsLeapMonth(e.target.checked)}
                className="h-4 w-4 accent-[var(--saju-accent)]"
              />
              윤달
            </label>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <label className="flex flex-col gap-2">
          <span className={fieldLabelClass}>년</span>
          <input
            type="number"
            value={year}
            min={1900}
            max={CURRENT_YEAR}
            disabled={isSubmitting}
            onChange={(e) => handleYearChange(Number(e.target.value))}
            className={selectClass}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className={fieldLabelClass}>월</span>
          <select
            value={month}
            disabled={isSubmitting}
            onChange={(e) => handleMonthChange(Number(e.target.value))}
            className={selectClass}
          >
            {MONTH_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {isLunar && isLeapMonth ? `윤${m}월` : `${m}월`}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className={fieldLabelClass}>일</span>
          <select
            value={day}
            disabled={isSubmitting}
            onChange={(e) => setDay(Number(e.target.value))}
            className={selectClass}
          >
            {dayOptions.map((d) => (
              <option key={d} value={d}>
                {d}일
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className={fieldLabelClass}>태어난 시각</span>
          <label className="flex items-center gap-2 text-sm text-[var(--saju-text-muted)]">
            <input
              type="checkbox"
              checked={isTimeUnknown}
              disabled={isSubmitting}
              onChange={(e) => setIsTimeUnknown(e.target.checked)}
              className="h-4 w-4 accent-[var(--saju-accent)]"
            />
            시간 모름
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <select
            aria-label="시"
            value={hour}
            disabled={isTimeUnknown || isSubmitting}
            onChange={(e) => setHour(Number(e.target.value))}
            className={selectClass}
          >
            {HOUR_OPTIONS.map((h) => (
              <option key={h} value={h}>
                {h}시
              </option>
            ))}
          </select>
          <select
            aria-label="분"
            value={minute}
            disabled={isTimeUnknown || isSubmitting}
            onChange={(e) => setMinute(Number(e.target.value))}
            className={selectClass}
          >
            {MINUTE_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m}분
              </option>
            ))}
          </select>
        </div>
        {isTimeUnknown && (
          <p className="text-xs text-[var(--saju-text-muted)]">
            시간을 모르면 시주는 계산에서 빠지고, 년주·월주·일주만 풀이해 드립니다.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className={fieldLabelClass}>성별</span>
        <ToggleGroup
          value={gender}
          onChange={setGender}
          disabled={isSubmitting}
          options={[
            { value: "male", label: "남성" },
            { value: "female", label: "여성" },
          ]}
        />
      </div>

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
        disabled={isSubmitting}
        className="flex items-center justify-center gap-2 rounded-full bg-[var(--saju-accent)] px-6 py-3 text-sm font-medium text-[#15120f] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? (
          <>
            <Spinner />
            계산하는 중...
          </>
        ) : (
          "사주 계산하기"
        )}
      </button>
    </form>
  );
}
