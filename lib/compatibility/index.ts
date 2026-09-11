import type { MbtiTypeCode } from "@/lib/mbti/types";
import { calculateMbtiCompatibility } from "./mbti-compat";
import type { MbtiCompatibilityResult } from "./mbti-compat";
import { calculateSajuCompatibility } from "./saju-compat";
import type { SajuCompatibilityPerson, SajuCompatibilityResult } from "./saju-compat";
import { calculateGwansangCompatibility } from "./gwansang-compat";
import type { GwansangCompatibilityLabels, GwansangCompatibilityResult } from "./gwansang-compat";
import { calculateSeongmyeongCompatibility } from "./seongmyeong-compat";
import type { SeongmyeongCompatibilityPerson, SeongmyeongCompatibilityResult } from "./seongmyeong-compat";

export { calculateMbtiCompatibility } from "./mbti-compat";
export type { MbtiAxisCompatibility, MbtiCompatibilityResult } from "./mbti-compat";

export { calculateSajuCompatibility } from "./saju-compat";
export type {
  DuplicateImbalanceResult,
  IlganRelation,
  IlganRelationResult,
  SajuCompatibilityPerson,
  SajuCompatibilityResult,
  SajuComplementResult,
} from "./saju-compat";

export { calculateGwansangCompatibility } from "./gwansang-compat";
export type {
  ChinCompatLabel,
  ComplexionCompatLabel,
  EyeCompatLabel,
  EyebrowCompatLabel,
  ForeheadCompatLabel,
  GwansangCompatibilityLabels,
  GwansangCompatibilityResult,
  GwansangFeatureCompatibility,
  GwansangLabelRelation,
  MouthCompatLabel,
  NoseCompatLabel,
} from "./gwansang-compat";

export { calculateSeongmyeongCompatibility } from "./seongmyeong-compat";
export type {
  BaleumRelation,
  BaleumRelationResult,
  NameSajuComplementResult,
  SeongmyeongCompatibilityPerson,
  SeongmyeongCompatibilityResult,
} from "./seongmyeong-compat";

/**
 * Stage 1~4 서브스코어를 최종 총점으로 합칠 때 쓰는 가중치.
 * 사주 40% + MBTI 30% + 관상 20% + 성명학 10% = 100%.
 */
export const COMPATIBILITY_WEIGHTS = {
  saju: 0.4,
  mbti: 0.3,
  gwansang: 0.2,
  seongmyeong: 0.1,
} as const;

/** calculateOverallCompatibility 입력 - 두 사람(A/B)에 대한 4단계 각각의 원본 입력을 모은 것. */
export interface OverallCompatibilityInput {
  mbti: { typeA: MbtiTypeCode; typeB: MbtiTypeCode };
  saju: { personA: SajuCompatibilityPerson; personB: SajuCompatibilityPerson };
  gwansang: { labelsA: GwansangCompatibilityLabels; labelsB: GwansangCompatibilityLabels };
  seongmyeong: { personA: SeongmyeongCompatibilityPerson; personB: SeongmyeongCompatibilityPerson };
}

export interface OverallCompatibilityResult {
  /** 4단계 서브스코어를 COMPATIBILITY_WEIGHTS로 가중합산한 총점 (반올림, 0~100) */
  totalScore: number;
  saju: SajuCompatibilityResult;
  mbti: MbtiCompatibilityResult;
  gwansang: GwansangCompatibilityResult;
  seongmyeong: SeongmyeongCompatibilityResult;
}

/**
 * Stage 1(사주)~4(성명학) 궁합 서브스코어를 각각 계산한 뒤, 사주 40%·MBTI 30%·
 * 관상 20%·성명학 10% 가중치로 합산해 종합궁합 총점을 낸다.
 */
export function calculateOverallCompatibility(input: OverallCompatibilityInput): OverallCompatibilityResult {
  const saju = calculateSajuCompatibility(input.saju.personA, input.saju.personB);
  const mbti = calculateMbtiCompatibility(input.mbti.typeA, input.mbti.typeB);
  const gwansang = calculateGwansangCompatibility(input.gwansang.labelsA, input.gwansang.labelsB);
  const seongmyeong = calculateSeongmyeongCompatibility(input.seongmyeong.personA, input.seongmyeong.personB);

  const totalScore = Math.round(
    saju.totalScore * COMPATIBILITY_WEIGHTS.saju +
      mbti.totalScore * COMPATIBILITY_WEIGHTS.mbti +
      gwansang.totalScore * COMPATIBILITY_WEIGHTS.gwansang +
      seongmyeong.totalScore * COMPATIBILITY_WEIGHTS.seongmyeong,
  );

  return { totalScore, saju, mbti, gwansang, seongmyeong };
}
