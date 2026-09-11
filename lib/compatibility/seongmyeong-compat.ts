import { OHENG_GEUK, OHENG_SAENG, type Oheng } from "@/lib/saju";
import type { BaleumOhengDistribution, JawonOhengDistribution } from "@/lib/seongmyeong";

const OHENG_ORDER: Oheng[] = ["목", "화", "토", "금", "수"];

/** 궁합 계산에 필요한 한 사람의 이름 오행 + 사주 부족 정보. */
export interface SeongmyeongCompatibilityPerson {
  /** 이름 한자 획수 기반 자원오행 분포 */
  jawonOheng: JawonOhengDistribution;
  /** 이름 한글 발음 기반 발음오행 분포 */
  baleumOheng: BaleumOhengDistribution;
  /** 이 사람의 사주에서 부족한 오행 목록 (예: findDeficientOheng으로 이미 구한 값을 그대로 전달) */
  sajuDeficientOheng: Oheng[];
}

export type BaleumRelation = "상생" | "상극" | "무관계";

/** 항목 1: 이름-상대 사주 보완(0~60점) 판정 결과. */
export interface NameSajuComplementResult {
  score: number;
  /** B의 사주 부족 오행 중 A의 이름 자원오행이 채워주는 오행 */
  personASuppliesForB: Oheng[];
  /** A의 사주 부족 오행 중 B의 이름 자원오행이 채워주는 오행 */
  personBSuppliesForA: Oheng[];
  reason: string;
}

/** 항목 2: 발음오행 상생상극(0/20/40점) 판정 결과. */
export interface BaleumRelationResult {
  score: number;
  /** 각 사람 발음오행 분포에서 개수가 가장 많은(대표) 오행 */
  baleumRepresentativeA: Oheng;
  baleumRepresentativeB: Oheng;
  relation: BaleumRelation;
  reason: string;
}

export interface SeongmyeongCompatibilityResult {
  /** 두 항목 점수 합산 (0~100) */
  totalScore: number;
  nameSajuComplement: NameSajuComplementResult;
  baleumRelation: BaleumRelationResult;
}

function formatOhengList(list: Oheng[]): string {
  return list.length > 0 ? list.join("·") : "없음";
}

/** 이름 자원오행 분포에 해당 오행 글자가 하나라도 있는지(=그 오행을 "채워주는지"). */
function hasOheng(distribution: JawonOhengDistribution, oheng: Oheng): boolean {
  return distribution[oheng] > 0;
}

/**
 * 발음오행 분포에서 개수가 가장 많은(=대표) 오행을 고른다.
 * 동점이면 목화토금수 순서상 먼저 나오는 오행을 대표로 삼는다.
 */
function getRepresentativeOheng(distribution: BaleumOhengDistribution): Oheng {
  let representative: Oheng = OHENG_ORDER[0];
  let bestCount = -1;
  for (const oheng of OHENG_ORDER) {
    if (distribution[oheng] > bestCount) {
      bestCount = distribution[oheng];
      representative = oheng;
    }
  }
  return representative;
}

function buildComplementReason(
  personASuppliesForB: Oheng[],
  personBSuppliesForA: Oheng[],
  score: number,
): string {
  return (
    `B의 사주 부족 오행을 A의 이름이 보완: ${formatOhengList(personASuppliesForB)}, ` +
    `A의 사주 부족 오행을 B의 이름이 보완: ${formatOhengList(personBSuppliesForA)} → ${score}점`
  );
}

/**
 * 항목 1: 이름-상대 사주 보완(60점 만점).
 * A의 이름 자원오행이 B의 사주 부족 오행을 채워주는 비율과, 그 반대 방향(B의
 * 이름이 A의 사주 부족 오행을 채워주는 비율)을 각각 구해 평균 낸 값을 60점
 * 만점으로 환산한다. 부족한 오행이 없는 쪽은(채울 것이 없으므로) 그 방향을
 * 만점(비율 1)으로 취급한다.
 */
function calculateNameSajuComplement(
  personA: SeongmyeongCompatibilityPerson,
  personB: SeongmyeongCompatibilityPerson,
): NameSajuComplementResult {
  const personASuppliesForB = personB.sajuDeficientOheng.filter((oheng) => hasOheng(personA.jawonOheng, oheng));
  const personBSuppliesForA = personA.sajuDeficientOheng.filter((oheng) => hasOheng(personB.jawonOheng, oheng));

  const aToBRatio = personB.sajuDeficientOheng.length > 0
    ? personASuppliesForB.length / personB.sajuDeficientOheng.length
    : 1;
  const bToARatio = personA.sajuDeficientOheng.length > 0
    ? personBSuppliesForA.length / personA.sajuDeficientOheng.length
    : 1;

  const score = Math.round(((aToBRatio + bToARatio) / 2) * 60);

  return {
    score,
    personASuppliesForB,
    personBSuppliesForA,
    reason: buildComplementReason(personASuppliesForB, personBSuppliesForA, score),
  };
}

/**
 * 항목 2: 발음오행 상생상극(40/0/20점).
 * 두 이름의 발음오행 대표값(가장 많이 나온 오행) 사이가 상생이면 40점, 상극이면
 * 0점을 준다. 두 대표값이 같은 오행이면(비화) 상생·상극 어느 쪽도 아니므로
 * 20점을 준다. 서로 다른 두 오행은 오행 순환 구조상 항상 상생 또는 상극 중
 * 하나이므로, "무관계"는 실질적으로 두 대표 오행이 같은 경우에만 나온다.
 */
function calculateBaleumRelation(
  baleumA: BaleumOhengDistribution,
  baleumB: BaleumOhengDistribution,
): BaleumRelationResult {
  const baleumRepresentativeA = getRepresentativeOheng(baleumA);
  const baleumRepresentativeB = getRepresentativeOheng(baleumB);

  if (baleumRepresentativeA === baleumRepresentativeB) {
    return {
      score: 20,
      baleumRepresentativeA,
      baleumRepresentativeB,
      relation: "무관계",
      reason: `두 이름의 발음오행 대표값이 모두 ${baleumRepresentativeA}(으)로 같아 상생·상극 관계가 없습니다(비화). → 20점`,
    };
  }

  if (OHENG_SAENG[baleumRepresentativeA] === baleumRepresentativeB) {
    return {
      score: 40,
      baleumRepresentativeA,
      baleumRepresentativeB,
      relation: "상생",
      reason: `발음오행이 ${baleumRepresentativeA}→${baleumRepresentativeB}로 상생 관계입니다. → 40점`,
    };
  }
  if (OHENG_SAENG[baleumRepresentativeB] === baleumRepresentativeA) {
    return {
      score: 40,
      baleumRepresentativeA,
      baleumRepresentativeB,
      relation: "상생",
      reason: `발음오행이 ${baleumRepresentativeB}→${baleumRepresentativeA}로 상생 관계입니다. → 40점`,
    };
  }
  if (OHENG_GEUK[baleumRepresentativeA] === baleumRepresentativeB) {
    return {
      score: 0,
      baleumRepresentativeA,
      baleumRepresentativeB,
      relation: "상극",
      reason: `발음오행이 ${baleumRepresentativeA}→${baleumRepresentativeB}로 상극 관계입니다. → 0점`,
    };
  }
  if (OHENG_GEUK[baleumRepresentativeB] === baleumRepresentativeA) {
    return {
      score: 0,
      baleumRepresentativeA,
      baleumRepresentativeB,
      relation: "상극",
      reason: `발음오행이 ${baleumRepresentativeB}→${baleumRepresentativeA}로 상극 관계입니다. → 0점`,
    };
  }

  // 오행 순환 구조상 이론적으로는 도달하지 않는 경로. 방어적으로 무관계·20점 처리한다.
  return {
    score: 20,
    baleumRepresentativeA,
    baleumRepresentativeB,
    relation: "무관계",
    reason: `발음오행 대표값 ${baleumRepresentativeA}·${baleumRepresentativeB} 사이에 뚜렷한 상생·상극 관계가 없습니다. → 20점`,
  };
}

/**
 * 두 사람의 이름 자원오행/발음오행과 각자의 사주 부족 오행을 비교해 궁합
 * 점수를 계산한다. 이름-상대 사주 보완(60) + 발음오행 상생상극(40) = 총 100점.
 */
export function calculateSeongmyeongCompatibility(
  personA: SeongmyeongCompatibilityPerson,
  personB: SeongmyeongCompatibilityPerson,
): SeongmyeongCompatibilityResult {
  const nameSajuComplement = calculateNameSajuComplement(personA, personB);
  const baleumRelation = calculateBaleumRelation(personA.baleumOheng, personB.baleumOheng);

  const totalScore = nameSajuComplement.score + baleumRelation.score;

  return { totalScore, nameSajuComplement, baleumRelation };
}
