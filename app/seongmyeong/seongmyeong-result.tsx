import type { Oheng } from "@/lib/saju";
import type {
  BaleumOhengDistribution,
  HangulBaleumOheng,
  HanjaJawonOheng,
  JawonOhengDistribution,
  SajuJawonCompatibilityResult,
  SajuJawonInterpretationSnippet,
} from "@/lib/seongmyeong";

export interface SeongmyeongResultProps {
  name: string;
  jawonCharacters: HanjaJawonOheng[];
  jawonDistribution: JawonOhengDistribution;
  baleumCharacters: HangulBaleumOheng[];
  baleumDistribution: BaleumOhengDistribution;
  compatibility: SajuJawonCompatibilityResult;
  interpretation: SajuJawonInterpretationSnippet;
  baleumTrend: string;
  onReset: () => void;
}

const OHENG_ORDER: Oheng[] = ["목", "화", "토", "금", "수"];

const OHENG_COLORS: Record<Oheng, string> = {
  목: "#7ba05b",
  화: "#c1443a",
  토: "#c9a227",
  금: "#d9d4c3",
  수: "#5c7fa6",
};

const VERDICT_STYLE: Record<SajuJawonCompatibilityResult["verdict"], { color: string; label: string }> = {
  보완: { color: "#7ba05b", label: "보완" },
  상충: { color: "var(--saju-accent)", label: "상충" },
  중립: { color: "var(--saju-text-muted)", label: "중립" },
};

function OhengMiniChart({ distribution }: { distribution: Record<Oheng, number> }) {
  const total = OHENG_ORDER.reduce((sum, o) => sum + distribution[o], 0);
  return (
    <div className="flex flex-col gap-1.5">
      {OHENG_ORDER.map((oheng) => {
        const count = distribution[oheng];
        const percent = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={oheng} className="flex items-center gap-2">
            <span className="w-4 shrink-0 text-center text-xs text-[var(--saju-text-muted)]">{oheng}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--saju-bg)]">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${percent}%`, backgroundColor: OHENG_COLORS[oheng] }}
              />
            </div>
            <span className="w-6 shrink-0 text-right text-xs text-[var(--saju-text-muted)]">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

function JawonColumn({ characters, distribution }: { characters: HanjaJawonOheng[]; distribution: JawonOhengDistribution }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm text-[var(--saju-text-muted)]">자원오행 (한자 획수 기준)</h3>
      <ul className="flex flex-col gap-1.5">
        {characters.map((c, i) => (
          <li key={i} className="flex items-center justify-between rounded-md bg-[var(--saju-bg)] px-3 py-1.5 text-sm">
            <span className="flex items-center gap-2">
              {c.hanja && (
                <span className="font-[family-name:var(--font-saju-calligraphy)] text-lg text-[var(--saju-text)]">
                  {c.hanja}
                </span>
              )}
              <span className="text-xs text-[var(--saju-text-muted)]">원획 {c.strokes}획</span>
            </span>
            <span className="text-[var(--saju-text)]">{c.oheng}</span>
          </li>
        ))}
      </ul>
      <OhengMiniChart distribution={distribution} />
    </div>
  );
}

function BaleumColumn({ characters, distribution }: { characters: HangulBaleumOheng[]; distribution: BaleumOhengDistribution }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm text-[var(--saju-text-muted)]">발음오행 (초성 기준)</h3>
      <ul className="flex flex-col gap-1.5">
        {characters.map((c, i) => (
          <li key={i} className="flex items-center justify-between rounded-md bg-[var(--saju-bg)] px-3 py-1.5 text-sm">
            <span className="flex items-center gap-2">
              <span className="text-[var(--saju-text)]">{c.char}</span>
              <span className="text-xs text-[var(--saju-text-muted)]">초성 {c.choseong}</span>
            </span>
            <span className="text-[var(--saju-text)]">{c.oheng}</span>
          </li>
        ))}
      </ul>
      <OhengMiniChart distribution={distribution} />
    </div>
  );
}

function VerdictBadge({ verdict }: { verdict: SajuJawonCompatibilityResult["verdict"] }) {
  const style = VERDICT_STYLE[verdict];
  return (
    <span
      className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium text-[#15120f]"
      style={{ backgroundColor: style.color }}
    >
      {style.label}
    </span>
  );
}

function InterpretationSection({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex flex-col gap-2 border-t border-[var(--saju-border)] pt-6 first:border-t-0 first:pt-0">
      <h3 className="text-lg font-medium text-[var(--saju-text)]">{title}</h3>
      <p className="text-sm leading-7 text-[var(--saju-text)]">{text}</p>
    </div>
  );
}

export default function SeongmyeongResult({
  name,
  jawonCharacters,
  jawonDistribution,
  baleumCharacters,
  baleumDistribution,
  compatibility,
  interpretation,
  baleumTrend,
  onReset,
}: SeongmyeongResultProps) {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-10">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-sm text-[var(--saju-text-muted)]">성명학 개별분석 결과</p>
        <h1 className="font-[family-name:var(--font-saju-calligraphy)] text-4xl tracking-wide text-[var(--saju-text)]">
          {name}
        </h1>
      </div>

      <section className="flex flex-col gap-4 rounded-2xl border border-[var(--saju-border)] bg-[var(--saju-bg-elevated)] p-6">
        <h2 className="text-sm text-[var(--saju-text-muted)]">이름 오행 프로필</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <JawonColumn characters={jawonCharacters} distribution={jawonDistribution} />
          <BaleumColumn characters={baleumCharacters} distribution={baleumDistribution} />
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-[var(--saju-border)] bg-[var(--saju-bg-elevated)] p-6">
        <h2 className="text-sm text-[var(--saju-text-muted)]">사주 궁합도</h2>
        <div className="flex items-start gap-3">
          <VerdictBadge verdict={compatibility.verdict} />
          <p className="text-sm text-[var(--saju-text-muted)]">{compatibility.reason}</p>
        </div>
      </section>

      <section className="flex flex-col gap-6 rounded-2xl border border-[var(--saju-border)] bg-[var(--saju-bg-elevated)] p-6">
        <InterpretationSection title="이름이 기질에 미치는 영향" text={interpretation["이름이 기질에 미치는 영향"]} />
        <InterpretationSection title="보완/상충 총평" text={interpretation["보완/상충 총평"]} />
        <InterpretationSection title="발음오행 트렌드" text={baleumTrend} />
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
