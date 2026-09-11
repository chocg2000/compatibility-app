import type { Oheng, OhengDistribution } from "@/lib/saju";
import type { HanjaJawonOheng, OhengCount, SajuJawonVerdict } from "./types";

const OHENG_ORDER: Oheng[] = ["목", "화", "토", "금", "수"];

/**
 * 오행 분포에서 개수가 가장 적은(=가장 부족한) 오행을 찾는다.
 * 최솟값과 개수가 같은 오행이 여럿이면 목화토금수 순서로 최대 2개까지 반환한다
 * (최솟값이 하나뿐이면 1개, 여럿이 동점이면 2개 - "1~2개 추출"에 대응).
 */
export function findDeficientOheng(distribution: OhengDistribution): OhengCount[] {
  const minCount = Math.min(...OHENG_ORDER.map((oheng) => distribution[oheng]));
  return OHENG_ORDER.filter((oheng) => distribution[oheng] === minCount)
    .slice(0, 2)
    .map((oheng) => ({ oheng, count: distribution[oheng] }));
}

/**
 * 오행 분포에서 평균 개수보다 많은(=이미 과잉인) 오행을 찾는다.
 * 개수가 몇 개든(0~5개) 나올 수 있다 - "이미 과잉한 오행"이라는 조건 자체가
 * 고정된 개수를 뽑는 게 아니라 "평균을 넘는지" 여부를 묻는 것이기 때문이다.
 */
export function findExcessiveOheng(distribution: OhengDistribution): OhengCount[] {
  const total = OHENG_ORDER.reduce((sum, oheng) => sum + distribution[oheng], 0);
  const average = total / OHENG_ORDER.length;
  return OHENG_ORDER.filter((oheng) => distribution[oheng] > average).map((oheng) => ({
    oheng,
    count: distribution[oheng],
  }));
}

/**
 * 이름이 부족한 오행을 채워주면(보완 대상 글자가 있으면) "보완",
 * 그렇지 않으면서 이미 과잉한 오행을 더 강화하면(상충 대상 글자가 있으면) "상충",
 * 둘 다 아니면 "중립"으로 판정한다. 보완 여부를 먼저 확인하므로, 한 이름 안에
 * 보완 글자와 상충 글자가 섞여 있어도 전체 판정은 "보완"이 된다.
 */
export function determineSajuJawonVerdict(
  complementingCharacters: HanjaJawonOheng[],
  conflictingCharacters: HanjaJawonOheng[],
): SajuJawonVerdict {
  if (complementingCharacters.length > 0) return "보완";
  if (conflictingCharacters.length > 0) return "상충";
  return "중립";
}

function formatOhengCounts(list: OhengCount[]): string {
  return list.map((o) => `${o.oheng}(${o.count}개)`).join(", ");
}

function formatCharacters(characters: HanjaJawonOheng[]): string {
  return characters.map((c) => `${c.hanja}(${c.oheng})`).join(", ");
}

/** 판정 근거(어떤 오행이 부족/과잉이었고, 이름의 어떤 글자가 거기 해당하는지)를 문장으로 정리한다. */
export function buildSajuJawonReason(
  verdict: SajuJawonVerdict,
  deficientOheng: OhengCount[],
  excessiveOheng: OhengCount[],
  complementingCharacters: HanjaJawonOheng[],
  conflictingCharacters: HanjaJawonOheng[],
): string {
  const deficientText =
    deficientOheng.length > 0
      ? `사주에 가장 부족한 오행은 ${formatOhengCounts(deficientOheng)}입니다.`
      : "사주 오행 분포에 뚜렷하게 부족한 오행은 없습니다.";

  if (verdict === "보완") {
    return `${deficientText} 이름의 ${formatCharacters(complementingCharacters)}이(가) 부족한 오행을 보완합니다.`;
  }

  if (verdict === "상충") {
    const excessiveText = `사주에 이미 과잉한 오행은 ${formatOhengCounts(excessiveOheng)}입니다.`;
    return `${deficientText} ${excessiveText} 이름의 ${formatCharacters(conflictingCharacters)}이(가) 과잉한 오행을 더 강화합니다.`;
  }

  return `${deficientText} 이름의 오행 구성이 사주의 부족·과잉 오행과 특별히 겹치지 않습니다.`;
}
