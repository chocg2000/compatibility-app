import { getOheng, OHENG_GEUK, OHENG_SAENG, type Oheng, type OhengDistribution } from "@/lib/saju";

const OHENG_ORDER: Oheng[] = ["목", "화", "토", "금", "수"];

/** 궁합 계산에 필요한 한 사람의 사주 정보. */
export interface SajuCompatibilityPerson {
  ohengDistribution: OhengDistribution;
  /** 일간(日干) 천간 한자. 예: "丙" */
  dayGanHanja: string;
}

export type IlganRelation = "상생" | "상극" | "무관계";

/** 항목 1: 상호보완(0~40점) 판정 결과. */
export interface SajuComplementResult {
  score: number;
  personADeficient: Oheng[];
  personBDeficient: Oheng[];
  /** A가 부족한 오행 중 B가 채워주는(충분히 갖고 있는) 오행 */
  personBSuppliesForA: Oheng[];
  /** B가 부족한 오행 중 A가 채워주는(충분히 갖고 있는) 오행 */
  personASuppliesForB: Oheng[];
  reason: string;
}

/** 항목 2: 일간 상생상극(0/20/40점) 판정 결과. */
export interface IlganRelationResult {
  score: number;
  ilganOhengA: Oheng;
  ilganOhengB: Oheng;
  relation: IlganRelation;
  reason: string;
}

/** 항목 3: 중복 결핍/과잉(0/20점) 판정 결과. */
export interface DuplicateImbalanceResult {
  score: number;
  overlappingDeficient: Oheng[];
  overlappingExcessive: Oheng[];
  reason: string;
}

export interface SajuCompatibilityResult {
  /** 세 항목 점수 합산 (0~100) */
  totalScore: number;
  complement: SajuComplementResult;
  ilganRelation: IlganRelationResult;
  duplicateImbalance: DuplicateImbalanceResult;
}

function totalOf(distribution: OhengDistribution): number {
  return OHENG_ORDER.reduce((sum, oheng) => sum + distribution[oheng], 0);
}

/** 분포에서 개수가 가장 적은(=가장 부족한) 오행을 모두 찾는다(동점이면 여러 개). */
function findDeficient(distribution: OhengDistribution): Oheng[] {
  const minCount = Math.min(...OHENG_ORDER.map((oheng) => distribution[oheng]));
  return OHENG_ORDER.filter((oheng) => distribution[oheng] === minCount);
}

/** 분포에서 평균 개수보다 많은(=과잉인) 오행을 모두 찾는다. */
function findExcessive(distribution: OhengDistribution): Oheng[] {
  const average = totalOf(distribution) / OHENG_ORDER.length;
  return OHENG_ORDER.filter((oheng) => distribution[oheng] > average);
}

/** 해당 오행을 평균 이상으로("충분히") 갖고 있는지 여부. */
function hasSufficient(distribution: OhengDistribution, oheng: Oheng): boolean {
  const average = totalOf(distribution) / OHENG_ORDER.length;
  return distribution[oheng] >= average;
}

function formatOhengList(list: Oheng[]): string {
  return list.length > 0 ? list.join("·") : "없음";
}

function buildComplementReason(
  personADeficient: Oheng[],
  personBDeficient: Oheng[],
  personBSuppliesForA: Oheng[],
  personASuppliesForB: Oheng[],
  score: number,
): string {
  return (
    `A의 부족 오행: ${formatOhengList(personADeficient)} (B가 보완: ${formatOhengList(personBSuppliesForA)}), ` +
    `B의 부족 오행: ${formatOhengList(personBDeficient)} (A가 보완: ${formatOhengList(personASuppliesForB)}) → ${score}점`
  );
}

/**
 * 항목 1: 상호보완(40점 만점).
 * A가 부족한 오행을 B가 충분히(평균 이상) 갖고 있는지, 그 반대 방향도 확인해
 * 두 방향의 충족 비율을 평균 낸 값을 40점 만점으로 환산한다.
 */
function calculateComplement(a: OhengDistribution, b: OhengDistribution): SajuComplementResult {
  const personADeficient = findDeficient(a);
  const personBDeficient = findDeficient(b);

  const personBSuppliesForA = personADeficient.filter((oheng) => hasSufficient(b, oheng));
  const personASuppliesForB = personBDeficient.filter((oheng) => hasSufficient(a, oheng));

  const bToARatio = personBSuppliesForA.length / personADeficient.length;
  const aToBRatio = personASuppliesForB.length / personBDeficient.length;
  const score = Math.round(((bToARatio + aToBRatio) / 2) * 40);

  return {
    score,
    personADeficient,
    personBDeficient,
    personBSuppliesForA,
    personASuppliesForB,
    reason: buildComplementReason(personADeficient, personBDeficient, personBSuppliesForA, personASuppliesForB, score),
  };
}

/**
 * 항목 2: 일간 상생상극(40/0/20점).
 * 두 일간의 오행이 상생 관계면 40점, 상극 관계면 0점을 준다. 오행이 같아서
 * 상생·상극 어느 쪽도 아니면(비화) 20점을 준다. 서로 다른 두 오행은 항상
 * 상생 또는 상극 중 하나이므로(오행 순환 구조상), "무관계"는 실질적으로
 * 두 일간의 오행이 같은 경우에만 나온다.
 */
function calculateIlganRelation(dayGanHanjaA: string, dayGanHanjaB: string): IlganRelationResult {
  const ilganOhengA = getOheng(dayGanHanjaA);
  const ilganOhengB = getOheng(dayGanHanjaB);

  if (ilganOhengA === ilganOhengB) {
    return {
      score: 20,
      ilganOhengA,
      ilganOhengB,
      relation: "무관계",
      reason: `두 사람의 일간 오행이 모두 ${ilganOhengA}(으)로 같아 상생·상극 관계가 없습니다(비화). → 20점`,
    };
  }

  if (OHENG_SAENG[ilganOhengA] === ilganOhengB) {
    return {
      score: 40,
      ilganOhengA,
      ilganOhengB,
      relation: "상생",
      reason: `일간 오행이 ${ilganOhengA}→${ilganOhengB}로 상생 관계입니다. → 40점`,
    };
  }
  if (OHENG_SAENG[ilganOhengB] === ilganOhengA) {
    return {
      score: 40,
      ilganOhengA,
      ilganOhengB,
      relation: "상생",
      reason: `일간 오행이 ${ilganOhengB}→${ilganOhengA}로 상생 관계입니다. → 40점`,
    };
  }
  if (OHENG_GEUK[ilganOhengA] === ilganOhengB) {
    return {
      score: 0,
      ilganOhengA,
      ilganOhengB,
      relation: "상극",
      reason: `일간 오행이 ${ilganOhengA}→${ilganOhengB}로 상극 관계입니다. → 0점`,
    };
  }
  if (OHENG_GEUK[ilganOhengB] === ilganOhengA) {
    return {
      score: 0,
      ilganOhengA,
      ilganOhengB,
      relation: "상극",
      reason: `일간 오행이 ${ilganOhengB}→${ilganOhengA}로 상극 관계입니다. → 0점`,
    };
  }

  // 오행 순환 구조상 이론적으로는 도달하지 않는 경로(서로 다른 두 오행은 항상
  // 상생 또는 상극 관계다). 방어적으로 무관계·20점 처리한다.
  return {
    score: 20,
    ilganOhengA,
    ilganOhengB,
    relation: "무관계",
    reason: `일간 오행 ${ilganOhengA}·${ilganOhengB} 사이에 뚜렷한 상생·상극 관계가 없습니다. → 20점`,
  };
}

function buildDuplicateImbalanceReason(
  overlappingDeficient: Oheng[],
  overlappingExcessive: Oheng[],
  score: number,
): string {
  if (score === 0) {
    const parts: string[] = [];
    if (overlappingDeficient.length > 0) parts.push(`둘 다 ${formatOhengList(overlappingDeficient)} 오행이 부족합니다`);
    if (overlappingExcessive.length > 0) parts.push(`둘 다 ${formatOhengList(overlappingExcessive)} 오행이 과잉입니다`);
    return `${parts.join(", ")}. → 0점`;
  }
  return "두 사람의 부족·과잉 오행이 겹치지 않아 서로 균형을 보완할 여지가 있습니다. → 20점";
}

/**
 * 항목 3: 중복 결핍/과잉(20/0점).
 * 같은 오행이 두 사람 모두에게 부족하거나, 두 사람 모두에게 과잉이면
 * (서로 채워줄 수 없는 공통의 약점/불균형이므로) 0점, 그렇지 않으면 20점.
 */
function calculateDuplicateImbalance(a: OhengDistribution, b: OhengDistribution): DuplicateImbalanceResult {
  const deficientA = findDeficient(a);
  const deficientB = findDeficient(b);
  const excessiveA = findExcessive(a);
  const excessiveB = findExcessive(b);

  const overlappingDeficient = deficientA.filter((oheng) => deficientB.includes(oheng));
  const overlappingExcessive = excessiveA.filter((oheng) => excessiveB.includes(oheng));

  const score = overlappingDeficient.length > 0 || overlappingExcessive.length > 0 ? 0 : 20;

  return {
    score,
    overlappingDeficient,
    overlappingExcessive,
    reason: buildDuplicateImbalanceReason(overlappingDeficient, overlappingExcessive, score),
  };
}

/**
 * 두 사람의 사주 오행 분포 + 일간을 비교해 궁합 점수를 계산한다.
 * 상호보완(40) + 일간 상생상극(40) + 중복 결핍/과잉(20) = 총 100점 만점.
 */
export function calculateSajuCompatibility(
  personA: SajuCompatibilityPerson,
  personB: SajuCompatibilityPerson,
): SajuCompatibilityResult {
  const complement = calculateComplement(personA.ohengDistribution, personB.ohengDistribution);
  const ilganRelation = calculateIlganRelation(personA.dayGanHanja, personB.dayGanHanja);
  const duplicateImbalance = calculateDuplicateImbalance(personA.ohengDistribution, personB.ohengDistribution);

  const totalScore = complement.score + ilganRelation.score + duplicateImbalance.score;

  return { totalScore, complement, ilganRelation, duplicateImbalance };
}
