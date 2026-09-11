import { getEumYang, getOheng, OHENG_GEUK, OHENG_SAENG } from "./five-elements";
import type { SajuPillars } from "./types";

/** 십성(十星) */
export type Sipseong =
  | "비견"
  | "겁재"
  | "식신"
  | "상관"
  | "편재"
  | "정재"
  | "편관"
  | "정관"
  | "편인"
  | "정인";

/** 십성을 순서대로 나열한 목록 (전체 조합을 순회할 때 사용) */
export const SIPSEONG_LIST: Sipseong[] = [
  "비견",
  "겁재",
  "식신",
  "상관",
  "편재",
  "정재",
  "편관",
  "정관",
  "편인",
  "정인",
];

export interface SajuSipseong {
  year: { gan: Sipseong; zhi: Sipseong };
  month: { gan: Sipseong; zhi: Sipseong };
  /** 일간(日干) 자신은 십성 판별의 기준점이므로 대상에서 제외하고, 일지(日支)만 계산한다. */
  day: { zhi: Sipseong };
  time: { gan: Sipseong; zhi: Sipseong } | null;
}

/**
 * 일간(day gan) 기준으로 대상 글자(천간 또는 지지)의 십성을 판별한다.
 *
 * 오행 상생상극과 음양의 동이(同異)로 열 가지 관계를 가른다:
 * - 같은 오행: 음양이 같으면 비견, 다르면 겁재
 * - 일간이 생(生)하는 오행: 음양이 같으면 식신, 다르면 상관
 * - 일간이 극(剋)하는 오행: 음양이 같으면 편재, 다르면 정재
 * - 일간을 극(剋)하는 오행: 음양이 같으면 편관, 다르면 정관
 * - 일간을 생(生)하는 오행: 음양이 같으면 편인, 다르면 정인
 */
export function determineSipseong(dayGanHanja: string, targetHanja: string): Sipseong {
  const dayOheng = getOheng(dayGanHanja);
  const dayEumYang = getEumYang(dayGanHanja);
  const targetOheng = getOheng(targetHanja);
  const targetEumYang = getEumYang(targetHanja);
  const sameEumYang = dayEumYang === targetEumYang;

  if (dayOheng === targetOheng) {
    return sameEumYang ? "비견" : "겁재";
  }
  if (OHENG_SAENG[dayOheng] === targetOheng) {
    return sameEumYang ? "식신" : "상관";
  }
  if (OHENG_GEUK[dayOheng] === targetOheng) {
    return sameEumYang ? "편재" : "정재";
  }
  if (OHENG_GEUK[targetOheng] === dayOheng) {
    return sameEumYang ? "편관" : "정관";
  }
  // 남은 경우는 대상 오행이 일간을 생(生)하는 관계뿐이다 (OHENG_SAENG[targetOheng] === dayOheng).
  return sameEumYang ? "편인" : "정인";
}

/**
 * 사주 네 기둥을 입력받아, 일간을 기준으로 나머지 일곱 글자
 * (년간/년지/월간/월지/일지/시간/시지)의 십성을 계산하는 순수 함수.
 * 시간을 모르면(time이 null) 결과의 time도 null이다.
 */
export function calculateSipseong(pillars: SajuPillars): SajuSipseong {
  const dayGan = pillars.day.gan.hanja;

  return {
    year: {
      gan: determineSipseong(dayGan, pillars.year.gan.hanja),
      zhi: determineSipseong(dayGan, pillars.year.zhi.hanja),
    },
    month: {
      gan: determineSipseong(dayGan, pillars.month.gan.hanja),
      zhi: determineSipseong(dayGan, pillars.month.zhi.hanja),
    },
    day: {
      zhi: determineSipseong(dayGan, pillars.day.zhi.hanja),
    },
    time: pillars.time
      ? {
          gan: determineSipseong(dayGan, pillars.time.gan.hanja),
          zhi: determineSipseong(dayGan, pillars.time.zhi.hanja),
        }
      : null,
  };
}
