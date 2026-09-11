import type { Oheng } from "@/lib/saju";
import type { BaleumOhengDistribution } from "./types";

const OHENG_ORDER: Oheng[] = ["목", "화", "토", "금", "수"];

/** 발음오행 분포에서 특정 오행이 두드러질 때 보여줄 짧은 코멘트. */
const BALEUM_TREND_COMMENTS: Record<Oheng, string> = {
  목: "발음오행에서는 목(木) 기운이 두드러져, 이름을 부를 때 성장과 추진력이 느껴지는 인상을 줍니다.",
  화: "발음오행에서는 화(火) 기운이 두드러져, 이름을 부를 때 밝고 표현력 있는 인상을 줍니다.",
  토: "발음오행에서는 토(土) 기운이 두드러져, 이름을 부를 때 안정감과 신뢰감이 느껴지는 인상을 줍니다.",
  금: "발음오행에서는 금(金) 기운이 두드러져, 이름을 부를 때 단단하고 결단력 있는 인상을 줍니다.",
  수: "발음오행에서는 수(水) 기운이 두드러져, 이름을 부를 때 유연하고 지혜로운 인상을 줍니다.",
};

/**
 * 발음오행 분포에서 가장 많이 나온(두드러진) 오행에 대한 짧은 코멘트를 만든다.
 * 여러 오행이 동점으로 두드러지면 그만큼 문장을 모두 이어붙인다.
 */
export function describeBaleumOhengTrend(distribution: BaleumOhengDistribution): string {
  const maxCount = Math.max(...OHENG_ORDER.map((oheng) => distribution[oheng]));
  if (maxCount === 0) {
    return "이름의 발음오행 분포를 판단할 수 없습니다.";
  }

  const dominantOheng = OHENG_ORDER.filter((oheng) => distribution[oheng] === maxCount);
  return dominantOheng.map((oheng) => BALEUM_TREND_COMMENTS[oheng]).join(" ");
}
