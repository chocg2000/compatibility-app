import { GWANSANG_FEATURE_KEYS, type GwansangFeatureKey } from "@/lib/gwansang/categories";

/**
 * 부위별로 쓰는 라벨 어휘는 lib/gwansang/gwansang-interpretations.ts의 스니펫 키(예:
 * "콧대 높다", "쌍꺼풀 있음")와 동일하게 맞췄다 - analyzer.ts의 원자적 필드값("높다",
 * "쌍꺼풀")이 아니라, 이미 앱에서 실제로 조합해 쓰는 복합 라벨 문자열이다.
 */
export type ForeheadCompatLabel = "넓다" | "좁다" | "둥글다" | "각지다";
export type EyeCompatLabel = "크다" | "작다" | "처졌다" | "올라갔다" | "쌍꺼풀 있음" | "쌍꺼풀 없음";
export type NoseCompatLabel = "콧대 높다" | "콧대 낮다" | "코끝 둥글다" | "코끝 뾰족하다";
export type MouthCompatLabel = "두껍다" | "얇다" | "크다" | "작다";
export type ChinCompatLabel = "각지다" | "둥글다" | "뾰족하다" | "이중턱";
export type EyebrowCompatLabel = "짙다" | "옅다" | "일자형" | "아치형";
export type ComplexionCompatLabel = "밝다" | "붉은기 있음" | "창백함" | "윤기 있음";

/** 한 사람의 관상 부위별 라벨(7개 부위 전부). */
export interface GwansangCompatibilityLabels {
  이마: ForeheadCompatLabel;
  눈: EyeCompatLabel;
  코: NoseCompatLabel;
  "입/입술": MouthCompatLabel;
  턱: ChinCompatLabel;
  눈썹: EyebrowCompatLabel;
  안색: ComplexionCompatLabel;
}

/** 부위별로 유효한 라벨 전체 목록 (입력 검증용). */
const VALID_LABELS: Record<GwansangFeatureKey, readonly string[]> = {
  이마: ["넓다", "좁다", "둥글다", "각지다"],
  눈: ["크다", "작다", "처졌다", "올라갔다", "쌍꺼풀 있음", "쌍꺼풀 없음"],
  코: ["콧대 높다", "콧대 낮다", "코끝 둥글다", "코끝 뾰족하다"],
  "입/입술": ["두껍다", "얇다", "크다", "작다"],
  턱: ["각지다", "둥글다", "뾰족하다", "이중턱"],
  눈썹: ["짙다", "옅다", "일자형", "아치형"],
  안색: ["밝다", "붉은기 있음", "창백함", "윤기 있음"],
};

/**
 * 부위별 "보완" 라벨 쌍. 대립 개념이 뚜렷한 라벨끼리만 묶었다 - 뾰족한 턱이나
 * "이중턱"(있음만 라벨로 존재, "없음"은 애초에 라벨이 아니다), 안색의 "붉은기
 * 있음"·"윤기 있음"처럼 자연스러운 반대말이 없는 라벨은 어떤 쌍에도 넣지 않고
 * "일반" 취급되게 둔다.
 */
const COMPLEMENT_PAIRS: Record<GwansangFeatureKey, ReadonlyArray<readonly [string, string]>> = {
  이마: [
    ["넓다", "좁다"],
    ["각지다", "둥글다"],
  ],
  눈: [
    ["크다", "작다"],
    ["처졌다", "올라갔다"],
    ["쌍꺼풀 있음", "쌍꺼풀 없음"],
  ],
  코: [
    ["콧대 높다", "콧대 낮다"],
    ["코끝 둥글다", "코끝 뾰족하다"],
  ],
  "입/입술": [
    ["두껍다", "얇다"],
    ["크다", "작다"],
  ],
  턱: [["각지다", "둥글다"]],
  눈썹: [
    ["짙다", "옅다"],
    ["일자형", "아치형"],
  ],
  안색: [["밝다", "창백함"]],
};

const SAME_LABEL_SCORE = 70;
const COMPLEMENT_LABEL_SCORE = 90;
const OTHER_SCORE = 60;

export type GwansangLabelRelation = "동일" | "보완" | "일반";

/** 부위 하나에 대한 궁합 판정 결과. */
export interface GwansangFeatureCompatibility {
  feature: GwansangFeatureKey;
  labelA: string;
  labelB: string;
  relation: GwansangLabelRelation;
  score: number;
  reason: string;
}

export interface GwansangCompatibilityResult {
  /** 7개 부위 점수의 평균 (반올림, 0~100) */
  totalScore: number;
  featureResults: GwansangFeatureCompatibility[];
}

function validateLabel(feature: GwansangFeatureKey, label: string): void {
  if (!VALID_LABELS[feature].includes(label)) {
    throw new Error(
      `"${feature}" 부위에 유효하지 않은 라벨입니다: "${label}" (가능한 값: ${VALID_LABELS[feature].join(", ")})`,
    );
  }
}

function isComplementPair(feature: GwansangFeatureKey, labelA: string, labelB: string): boolean {
  return COMPLEMENT_PAIRS[feature].some(
    ([x, y]) => (x === labelA && y === labelB) || (x === labelB && y === labelA),
  );
}

/**
 * 부위 하나의 두 라벨을 비교해 관계와 점수를 정한다.
 * 같은 라벨이면 "동일"(70점), 미리 정의한 보완 쌍이면 "보완"(90점),
 * 그 외에는 "일반"(60점)이다.
 */
function compareFeatureLabels(
  feature: GwansangFeatureKey,
  labelA: string,
  labelB: string,
): GwansangFeatureCompatibility {
  validateLabel(feature, labelA);
  validateLabel(feature, labelB);

  let relation: GwansangLabelRelation;
  let score: number;
  if (labelA === labelB) {
    relation = "동일";
    score = SAME_LABEL_SCORE;
  } else if (isComplementPair(feature, labelA, labelB)) {
    relation = "보완";
    score = COMPLEMENT_LABEL_SCORE;
  } else {
    relation = "일반";
    score = OTHER_SCORE;
  }

  return {
    feature,
    labelA,
    labelB,
    relation,
    score,
    reason: `${feature}: "${labelA}" vs "${labelB}" → ${relation}(${score}점)`,
  };
}

/**
 * 두 사람의 관상 부위별 라벨(7개 부위)을 비교해 궁합 점수를 계산한다.
 * 부위마다 같은 라벨(70점)/보완 라벨(90점)/그 외(60점)로 채점한 뒤, 7개 부위
 * 점수를 평균 내 최종 점수(0~100, 반올림)를 낸다.
 */
export function calculateGwansangCompatibility(
  labelsA: GwansangCompatibilityLabels,
  labelsB: GwansangCompatibilityLabels,
): GwansangCompatibilityResult {
  const featureResults = GWANSANG_FEATURE_KEYS.map((feature) =>
    compareFeatureLabels(feature, labelsA[feature], labelsB[feature]),
  );

  const totalScore = Math.round(
    featureResults.reduce((sum, result) => sum + result.score, 0) / featureResults.length,
  );

  return { totalScore, featureResults };
}
