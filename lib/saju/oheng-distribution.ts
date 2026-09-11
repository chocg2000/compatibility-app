import { getOheng, type Oheng } from "./five-elements";
import type { SajuPillars } from "./types";

/** 오행별 글자 수 분포 */
export type OhengDistribution = Record<Oheng, number>;

function pillarsToHanjaChars(pillars: SajuPillars): string[] {
  const chars = [
    pillars.year.gan.hanja,
    pillars.year.zhi.hanja,
    pillars.month.gan.hanja,
    pillars.month.zhi.hanja,
    pillars.day.gan.hanja,
    pillars.day.zhi.hanja,
  ];
  if (pillars.time) {
    chars.push(pillars.time.gan.hanja, pillars.time.zhi.hanja);
  }
  return chars;
}

/**
 * 사주 네 기둥(년/월/일/시)에 나온 여덟 글자(시간을 모르면 여섯 글자)를 세어
 * 오행(목화토금수) 분포를 계산하는 순수 함수.
 * 천간/지지 각 글자를 그대로 오행 매핑표에 대입해 셀 뿐, 지장간은 고려하지 않는다.
 */
export function calculateOhengDistribution(pillars: SajuPillars): OhengDistribution {
  const distribution: OhengDistribution = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };

  for (const hanja of pillarsToHanjaChars(pillars)) {
    distribution[getOheng(hanja)] += 1;
  }

  return distribution;
}
