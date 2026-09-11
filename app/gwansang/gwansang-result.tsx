import { GWANSANG_FEATURE_KEYS, type GwansangFeatureKey } from "@/lib/gwansang/categories";
import type { GwansangGeometryAnalysis } from "@/lib/gwansang/analyzer";
import type {
  GwansangAnalysisResult,
  GwansangComposedInterpretation,
} from "@/lib/gwansang/gwansang-interpretations";

interface GwansangResultProps {
  /** 업로드했던 사진의 미리보기 URL (objectURL). */
  photoUrl: string;
  result: GwansangAnalysisResult;
  onReset: () => void;
}

/**
 * 부위별 랜드마크 포인트의 대략적인 위치(사진 영역 대비 %).
 * 실제 얼굴 인식 좌표가 아니라, 정면 인물 사진의 일반적인 비율을 기준으로 한
 * 참고용 표시다. 번호는 GWANSANG_FEATURE_KEYS 순서와 맞춘다.
 */
const LANDMARK_POSITIONS: Record<GwansangFeatureKey, { top: string; left: string }> = {
  이마: { top: "15%", left: "50%" },
  눈: { top: "40%", left: "50%" },
  코: { top: "54%", left: "50%" },
  "입/입술": { top: "70%", left: "50%" },
  턱: { top: "87%", left: "50%" },
  눈썹: { top: "32%", left: "50%" },
  안색: { top: "58%", left: "78%" },
};

const INTERPRETATION_SECTIONS: { key: keyof GwansangComposedInterpretation; title: string }[] = [
  { key: "성격", title: "성격 / 기질" },
  { key: "직업/적성", title: "직업 / 적성" },
  { key: "연애운", title: "연애운" },
];

/** 부위 하나에 해당하는 판정 라벨(들)을 요약 카드에 보여줄 문자열 배열로 변환한다. */
function describeFeature(feature: GwansangFeatureKey, geometry: GwansangGeometryAnalysis): string[] {
  switch (feature) {
    case "이마":
      return [geometry.forehead.shape];
    case "눈": {
      const labels: string[] = [geometry.eyes.size, geometry.eyes.tilt];
      if (geometry.eyes.eyelid !== "판단 어려움") labels.push(geometry.eyes.eyelid);
      return labels;
    }
    case "코":
      return [geometry.nose.bridgeHeight, geometry.nose.tipShape];
    case "입/입술":
      return [geometry.mouth.lipThickness, geometry.mouth.mouthSize];
    case "턱":
      return [geometry.chin.jawShape, `이중턱 ${geometry.chin.doubleChin}`];
    case "눈썹":
      return [geometry.eyebrows.thickness, geometry.eyebrows.shape];
    case "안색":
      return [geometry.complexion.tone];
  }
}

function LandmarkBadge({ index }: { index: number }) {
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[var(--saju-accent)] bg-[var(--saju-bg)] text-[10px] font-medium text-[var(--saju-accent)]">
      {index}
    </span>
  );
}

function PhotoWithLandmarks({ photoUrl }: { photoUrl: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="relative mx-auto w-full max-w-xs overflow-hidden rounded-xl border border-[var(--saju-border)]">
        {/* eslint-disable-next-line @next/next/no-img-element -- 로컬 objectURL 미리보기라 next/image 대상이 아님 */}
        <img src={photoUrl} alt="업로드한 관상 분석 사진" className="block w-full" />
        {GWANSANG_FEATURE_KEYS.map((feature, index) => {
          const position = LANDMARK_POSITIONS[feature];
          return (
            <span
              key={feature}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ top: position.top, left: position.left }}
              title={feature}
            >
              <LandmarkBadge index={index + 1} />
            </span>
          );
        })}
      </div>
      <p className="text-center text-xs text-[var(--saju-text-muted)]">
        표시된 번호는 실제 얼굴 인식 좌표가 아닌, 분석 부위를 안내하는 참고용 표시입니다.
      </p>
    </div>
  );
}

function FeatureSummaryCard({ geometry }: { geometry: GwansangGeometryAnalysis }) {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {GWANSANG_FEATURE_KEYS.map((feature, index) => (
        <li
          key={feature}
          className="flex items-start gap-3 rounded-lg border border-[var(--saju-border)] bg-[var(--saju-bg)] px-4 py-3"
        >
          <LandmarkBadge index={index + 1} />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-[var(--saju-text-muted)]">{feature}</span>
            <span className="text-sm text-[var(--saju-text)]">
              {describeFeature(feature, geometry).join(" · ")}
            </span>
          </div>
        </li>
      ))}
    </ul>
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

export default function GwansangResult({ photoUrl, result, onReset }: GwansangResultProps) {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-10">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-sm text-[var(--saju-text-muted)]">관상 개별분석 결과</p>
        <h1 className="text-3xl font-medium tracking-wide text-[var(--saju-text)]">
          얼굴에 담긴 인상을 읽어드립니다
        </h1>
      </div>

      <section className="flex flex-col gap-4 rounded-2xl border border-[var(--saju-border)] bg-[var(--saju-bg-elevated)] p-6">
        <h2 className="text-sm text-[var(--saju-text-muted)]">분석 사진</h2>
        <PhotoWithLandmarks photoUrl={photoUrl} />
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-[var(--saju-border)] bg-[var(--saju-bg-elevated)] p-6">
        <h2 className="text-sm text-[var(--saju-text-muted)]">얼굴 특징 요약</h2>
        <FeatureSummaryCard geometry={result.geometry} />
      </section>

      <section className="flex flex-col gap-6 rounded-2xl border border-[var(--saju-border)] bg-[var(--saju-bg-elevated)] p-6">
        {INTERPRETATION_SECTIONS.map(({ key, title }) => (
          <InterpretationSection key={key} title={title} text={result.interpretation[key]} />
        ))}
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
