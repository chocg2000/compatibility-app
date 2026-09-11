import {
  cheonganHanjaToKorean,
  getSipseongInterpretation,
  type GanZhiPillar,
  type Oheng,
  type OhengDistribution,
  type SajuPillars,
  type SajuSipseong,
} from "@/lib/saju";
import type { Gender } from "./saju-form";

interface SajuResultProps {
  pillars: SajuPillars;
  sipseong: SajuSipseong;
  oheng: OhengDistribution;
  gender: Gender;
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

type PillarKey = "year" | "month" | "day" | "time";

const PILLAR_LABELS: Record<PillarKey, string> = {
  year: "년주",
  month: "월주",
  day: "일주",
  time: "시주",
};

function GanZhiCell({ value }: { value: GanZhiPillar["gan"] }) {
  return (
    <div className="flex flex-col items-center gap-1 py-3">
      <span className="font-[family-name:var(--font-saju-calligraphy)] text-4xl leading-none text-[var(--saju-text)]">
        {value.hanja}
      </span>
      <span className="text-xs text-[var(--saju-text-muted)]">{value.hangeul}</span>
    </div>
  );
}

/**
 * 시간을 모르면(pillars.time === null) 시주 열 자체를 렌더링하지 않는다.
 * "미상" 같은 빈 칸을 보여주는 대신, 열 개수를 3개로 줄이고 아래에 안내 문구를 덧붙인다.
 */
function EightCharTable({ pillars }: { pillars: SajuPillars }) {
  const columns: { key: PillarKey; pillar: GanZhiPillar }[] = [
    { key: "year", pillar: pillars.year },
    { key: "month", pillar: pillars.month },
    { key: "day", pillar: pillars.day },
    ...(pillars.time ? [{ key: "time" as const, pillar: pillars.time }] : []),
  ];
  const lastKey = columns[columns.length - 1].key;

  return (
    <div className="flex flex-col gap-2">
      <table className="w-full table-fixed border-separate border-spacing-0 overflow-hidden rounded-xl border border-[var(--saju-border)]">
        <thead>
          <tr>
            {columns.map(({ key }) => (
              <th
                key={key}
                className={`border-b border-[var(--saju-border)] py-2 text-sm font-normal text-[var(--saju-text-muted)] ${
                  key === "day" ? "bg-[var(--saju-accent)]/10 text-[var(--saju-accent)]" : ""
                }`}
              >
                {PILLAR_LABELS[key]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {columns.map(({ key, pillar }) => (
              <td
                key={key}
                className={`border-b border-[var(--saju-border)] text-center ${
                  key !== lastKey ? "border-r border-[var(--saju-border)]" : ""
                } ${key === "day" ? "bg-[var(--saju-accent)]/10" : ""}`}
              >
                <GanZhiCell value={pillar.gan} />
              </td>
            ))}
          </tr>
          <tr>
            {columns.map(({ key, pillar }) => (
              <td
                key={key}
                className={`text-center ${key !== lastKey ? "border-r border-[var(--saju-border)]" : ""} ${
                  key === "day" ? "bg-[var(--saju-accent)]/10" : ""
                }`}
              >
                <GanZhiCell value={pillar.zhi} />
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      {!pillars.time && (
        <p className="text-xs text-[var(--saju-text-muted)]">
          태어난 시각을 몰라 시주는 표시하지 않았습니다. 년주·월주·일주만으로 풀이합니다.
        </p>
      )}
    </div>
  );
}

function OhengChart({ distribution }: { distribution: OhengDistribution }) {
  const total = OHENG_ORDER.reduce((sum, key) => sum + distribution[key], 0);

  return (
    <div className="flex flex-col gap-3">
      {OHENG_ORDER.map((key) => {
        const count = distribution[key];
        const percent = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={key} className="flex items-center gap-3">
            <span className="w-6 shrink-0 text-center text-sm text-[var(--saju-text-muted)]">
              {key}
            </span>
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-[var(--saju-bg)]">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${percent}%`, backgroundColor: OHENG_COLORS[key] }}
              />
            </div>
            <span className="w-16 shrink-0 text-right text-xs text-[var(--saju-text-muted)]">
              {count}개 ({percent}%)
            </span>
          </div>
        );
      })}
    </div>
  );
}

function InterpretationSection({
  title,
  basisLabel,
  text,
}: {
  title: string;
  basisLabel: string;
  text: string | undefined;
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-[var(--saju-border)] pt-6 first:border-t-0 first:pt-0">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-lg font-medium text-[var(--saju-text)]">{title}</h3>
        <span className="text-xs text-[var(--saju-text-muted)]">{basisLabel}</span>
      </div>
      <p className="text-sm leading-7 text-[var(--saju-text)]">
        {text ?? "아직 이 조합의 해석 데이터가 준비되지 않았습니다. (lib/saju/interpretations.ts 에 채워주세요)"}
      </p>
    </div>
  );
}

export default function SajuResult({ pillars, sipseong, oheng, gender, onReset }: SajuResultProps) {
  const ilganKorean = cheonganHanjaToKorean(pillars.day.gan.hanja);

  // 월지 십성은 성격/직업의 기반이 되는 격(格)을, 일지 십성은 배우자궁(연애·결혼)을 나타낸다는
  // 전통적인 해석 기준에 따라 각 섹션의 대표 조합을 고른다.
  const personalityAndCareer = getSipseongInterpretation(ilganKorean, sipseong.month.zhi);
  const love = getSipseongInterpretation(ilganKorean, sipseong.day.zhi);

  return (
    <div className="flex w-full max-w-2xl flex-col gap-10">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-sm text-[var(--saju-text-muted)]">
          {gender === "male" ? "남성" : "여성"} · 일간 {ilganKorean}({pillars.day.gan.hanja})
        </p>
        <h1 className="text-3xl font-medium tracking-wide text-[var(--saju-text)]">
          사주 개별분석 결과
        </h1>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm text-[var(--saju-text-muted)]">사주 여덟 글자</h2>
        <EightCharTable pillars={pillars} />
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-[var(--saju-border)] bg-[var(--saju-bg-elevated)] p-6">
        <h2 className="text-sm text-[var(--saju-text-muted)]">오행 분포</h2>
        <OhengChart distribution={oheng} />
      </section>

      <section className="flex flex-col gap-6 rounded-2xl border border-[var(--saju-border)] bg-[var(--saju-bg-elevated)] p-6">
        <InterpretationSection
          title="성격"
          basisLabel={`월지 · ${sipseong.month.zhi} 기준`}
          text={personalityAndCareer?.성격}
        />
        <InterpretationSection
          title="직업 / 적성"
          basisLabel={`월지 · ${sipseong.month.zhi} 기준`}
          text={personalityAndCareer?.["직업/적성"]}
        />
        <InterpretationSection
          title="연애운"
          basisLabel={`일지 · ${sipseong.day.zhi} 기준`}
          text={love?.연애운}
        />
      </section>

      <button
        type="button"
        onClick={onReset}
        className="self-center rounded-full border border-[var(--saju-border)] px-6 py-3 text-sm text-[var(--saju-text-muted)] transition-colors hover:border-[var(--saju-accent)] hover:text-[var(--saju-text)]"
      >
        다시 입력하기
      </button>
    </div>
  );
}
