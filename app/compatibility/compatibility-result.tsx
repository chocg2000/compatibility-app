"use client";

import { useState } from "react";
import { COMPATIBILITY_WEIGHTS, type OverallCompatibilityResult } from "@/lib/compatibility";

interface RadarAxis {
  label: string;
  score: number;
}

/** 4개 항목 점수를 순수 SVG로 그리는 레이더 차트 (별도 차트 라이브러리 없이 구현). */
function RadarChart({ axes }: { axes: RadarAxis[] }) {
  const size = 260;
  const center = size / 2;
  const maxRadius = center - 44;
  const angleStep = (2 * Math.PI) / axes.length;
  const rings = [25, 50, 75, 100];

  function pointAt(index: number, value: number) {
    const angle = -Math.PI / 2 + index * angleStep;
    const radius = (Math.max(0, Math.min(100, value)) / 100) * maxRadius;
    return { x: center + radius * Math.cos(angle), y: center + radius * Math.sin(angle) };
  }

  const polygonPoints = axes.map((axis, index) => pointAt(index, axis.score)).map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-xs" role="img" aria-label="4개 항목 궁합 점수 레이더 차트">
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={axes.map((_, index) => pointAt(index, ring)).map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          style={{ stroke: "var(--saju-border)" }}
          strokeWidth={1}
        />
      ))}
      {axes.map((_, index) => {
        const p = pointAt(index, 100);
        return (
          <line
            key={index}
            x1={center}
            y1={center}
            x2={p.x}
            y2={p.y}
            style={{ stroke: "var(--saju-border)" }}
            strokeWidth={1}
          />
        );
      })}
      <polygon
        points={polygonPoints}
        style={{ fill: "var(--saju-accent)", stroke: "var(--saju-accent)" }}
        fillOpacity={0.3}
        strokeWidth={2}
      />
      {axes.map((axis, index) => {
        const p = pointAt(index, axis.score);
        return <circle key={axis.label} cx={p.x} cy={p.y} r={3} style={{ fill: "var(--saju-accent)" }} />;
      })}
      {axes.map((axis, index) => {
        const labelPoint = pointAt(index, 100 + 32);
        return (
          <text
            key={axis.label}
            x={labelPoint.x}
            y={labelPoint.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={12}
            style={{ fill: "var(--saju-text-muted)" }}
          >
            {axis.label} {axis.score}
          </text>
        );
      })}
    </svg>
  );
}

function ScoreDisclosure({ title, score, reasons }: { title: string; score: number; reasons: string[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--saju-border)] bg-[var(--saju-bg)]">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm text-[var(--saju-text)]">{title}</span>
        <span className="flex items-center gap-3">
          <span className="text-sm font-medium text-[var(--saju-accent)]">{score}점</span>
          <span className="text-xs text-[var(--saju-text-muted)]" aria-hidden="true">
            {isOpen ? "▲" : "▼"}
          </span>
        </span>
      </button>
      {isOpen && (
        <ul className="flex flex-col gap-1.5 border-t border-[var(--saju-border)] px-4 py-3 text-xs leading-6 text-[var(--saju-text-muted)]">
          {reasons.map((reason, index) => (
            <li key={index}>{reason}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function scoreBand(totalScore: number): string {
  if (totalScore >= 85) return "네 가지 지표가 고르게 좋은, 매우 잘 맞는 궁합입니다.";
  if (totalScore >= 70) return "전반적으로 잘 어울리는 궁합입니다.";
  if (totalScore >= 55) return "잘 맞는 부분과 보완이 필요한 부분이 함께 있는 궁합입니다.";
  return "여러 면에서 결이 다른 궁합입니다. 서로 다른 점을 이해하려는 노력이 필요합니다.";
}

function buildOverallSummary(result: OverallCompatibilityResult): string {
  const categories = [
    { label: "사주", score: result.saju.totalScore },
    { label: "MBTI", score: result.mbti.totalScore },
    { label: "관상", score: result.gwansang.totalScore },
    { label: "성명학", score: result.seongmyeong.totalScore },
  ];
  const best = categories.reduce((a, b) => (b.score > a.score ? b : a));
  const worst = categories.reduce((a, b) => (b.score < a.score ? b : a));

  return (
    `${scoreBand(result.totalScore)} 네 항목 중에서는 ${best.label}(${best.score}점) 궁합이 가장 좋고, ` +
    `${worst.label}(${worst.score}점) 궁합이 상대적으로 아쉽습니다. ` +
    `총점은 사주 ${COMPATIBILITY_WEIGHTS.saju * 100}%·MBTI ${COMPATIBILITY_WEIGHTS.mbti * 100}%·` +
    `관상 ${COMPATIBILITY_WEIGHTS.gwansang * 100}%·성명학 ${COMPATIBILITY_WEIGHTS.seongmyeong * 100}% 가중치로 계산됩니다.`
  );
}

export interface CompatibilityResultProps {
  result: OverallCompatibilityResult;
  onReset: () => void;
}

export default function CompatibilityResult({ result, onReset }: CompatibilityResultProps) {
  const axes: RadarAxis[] = [
    { label: "사주", score: result.saju.totalScore },
    { label: "MBTI", score: result.mbti.totalScore },
    { label: "관상", score: result.gwansang.totalScore },
    { label: "성명학", score: result.seongmyeong.totalScore },
  ];

  return (
    <div className="flex w-full max-w-2xl flex-col gap-10">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-sm text-[var(--saju-text-muted)]">종합궁합 결과</p>
        <p className="text-6xl font-bold text-[var(--saju-accent)]">
          {result.totalScore}
          <span className="text-2xl font-normal text-[var(--saju-text-muted)]">/100</span>
        </p>
      </div>

      <section className="flex flex-col items-center gap-4 rounded-2xl border border-[var(--saju-border)] bg-[var(--saju-bg-elevated)] p-6">
        <h2 className="self-start text-sm text-[var(--saju-text-muted)]">항목별 점수</h2>
        <RadarChart axes={axes} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm text-[var(--saju-text-muted)]">항목별 판정 근거</h2>
        <ScoreDisclosure
          title="사주 (가중치 40%)"
          score={result.saju.totalScore}
          reasons={[
            result.saju.complement.reason,
            result.saju.ilganRelation.reason,
            result.saju.duplicateImbalance.reason,
          ]}
        />
        <ScoreDisclosure
          title="MBTI (가중치 30%)"
          score={result.mbti.totalScore}
          reasons={result.mbti.axisResults.map((axis) => axis.reason)}
        />
        <ScoreDisclosure
          title="관상 (가중치 20%)"
          score={result.gwansang.totalScore}
          reasons={result.gwansang.featureResults.map((feature) => feature.reason)}
        />
        <ScoreDisclosure
          title="성명학 (가중치 10%)"
          score={result.seongmyeong.totalScore}
          reasons={[result.seongmyeong.nameSajuComplement.reason, result.seongmyeong.baleumRelation.reason]}
        />
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-[var(--saju-border)] bg-[var(--saju-bg-elevated)] p-6">
        <h2 className="text-sm text-[var(--saju-text-muted)]">종합 총평</h2>
        <p className="text-sm leading-7 text-[var(--saju-text)]">{buildOverallSummary(result)}</p>
      </section>

      <button
        type="button"
        onClick={onReset}
        className="self-center rounded-full border border-[var(--saju-border)] px-6 py-3 text-sm text-[var(--saju-text-muted)] transition-colors hover:border-[var(--saju-accent)] hover:text-[var(--saju-text)]"
      >
        다시 분석하기
      </button>
    </div>
  );
}
