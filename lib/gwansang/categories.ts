/** 관상학 분석에서 다루는 얼굴 부위 (7개) */
export type GwansangFeatureKey = "이마" | "눈" | "코" | "입/입술" | "턱" | "눈썹" | "안색";

/** 부위를 순서대로 나열한 목록 (결과 순회, 화면 표시 순서 등에 사용) */
export const GWANSANG_FEATURE_KEYS: GwansangFeatureKey[] = [
  "이마",
  "눈",
  "코",
  "입/입술",
  "턱",
  "눈썹",
  "안색",
];

const FOREHEAD_LABELS = [
  "넓고 둥근 이마",
  "좁은 이마",
  "각진 이마",
  "M자형 이마",
  "돌출된 이마",
  "평평하고 낮은 이마",
  "주름이 뚜렷한 이마",
] as const;

const EYE_LABELS = [
  "크고 또렷한 눈",
  "가늘고 긴 눈",
  "처진 눈매",
  "올라간 눈매",
  "쌍꺼풀이 짙은 눈",
  "무쌍꺼풀 눈",
  "눈 사이가 넓은 눈",
  "깊게 들어간 눈",
] as const;

const NOSE_LABELS = [
  "콧대가 높고 곧은 코",
  "매부리코",
  "둥글고 살집 있는 코",
  "낮고 평평한 코",
  "콧볼이 넓은 코",
  "가늘고 뾰족한 코",
] as const;

const MOUTH_LABELS = [
  "두툼한 입술",
  "얇은 입술",
  "크고 시원한 입",
  "작고 오므린 입",
  "입꼬리가 올라간 입",
  "입꼬리가 처진 입",
] as const;

const CHIN_LABELS = [
  "각진 사각턱",
  "둥근 턱",
  "뾰족한 턱",
  "이중턱",
  "짧은 턱",
  "길고 뾰족한 주걱턱",
] as const;

const EYEBROW_LABELS = [
  "짙고 진한 눈썹",
  "옅고 가는 눈썹",
  "일자 눈썹",
  "활 모양(아치형) 눈썹",
  "미간이 좁은 눈썹",
  "미간이 넓은 눈썹",
  "눈썹 끝이 처진 눈썹",
] as const;

const COMPLEXION_LABELS = [
  "밝고 화사한 안색",
  "창백한 안색",
  "붉은 기가 도는 안색",
  "어둡고 칙칙한 안색",
  "윤기 있고 생기 있는 피부",
  "건조하고 푸석한 피부",
] as const;

/**
 * 부위별 라벨 목록.
 *
 * 현재 관상 분석(lib/gwansang/analyzer.ts)은 이 라벨을 직접 쓰지 않고, 얼굴 랜드마크
 * 좌표를 기반으로 한 자체 라벨 체계를 쓴다. 이 목록은 초기 Claude Vision 기반 분석에서
 * 쓰였던 부위별 카테고리 정의로, 나중에 다시 참고하거나 재사용할 수 있도록 남겨둔다.
 */
export const GWANSANG_CATEGORIES = {
  이마: FOREHEAD_LABELS,
  눈: EYE_LABELS,
  코: NOSE_LABELS,
  "입/입술": MOUTH_LABELS,
  턱: CHIN_LABELS,
  눈썹: EYEBROW_LABELS,
  안색: COMPLEXION_LABELS,
} as const satisfies Record<GwansangFeatureKey, readonly string[]>;

/** 특정 부위(F)에서 고를 수 있는 라벨의 리터럴 유니온 타입 */
export type GwansangLabel<F extends GwansangFeatureKey> = (typeof GWANSANG_CATEGORIES)[F][number];
