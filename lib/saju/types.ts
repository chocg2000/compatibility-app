/** 생년월일시 입력. year/month/day/hour/minute는 isLunar 값에 따라 양력 또는 음력으로 해석된다. */
export interface SajuInput {
  year: number;
  month: number;
  day: number;
  /** 시간을 아는 경우에만 사용됨 (0-23) */
  hour?: number;
  /** 시간을 아는 경우에만 사용됨 (0-59) */
  minute?: number;
  /** true면 year/month/day를 음력 날짜로 해석한다. 기본값 false(양력). */
  isLunar?: boolean;
  /** isLunar가 true이고 윤달인 경우 true (예: 음력 윤4월) */
  isLeapMonth?: boolean;
  /** true면 태어난 시간을 모르는 것으로 간주하고, 결과의 time은 null이 된다. */
  isTimeUnknown?: boolean;
}

/** 한글 표기와 한자 표기를 함께 담는 값 */
export interface HangeulHanja {
  hangeul: string;
  hanja: string;
}

/** 천간(gan) + 지지(zhi) 한 기둥(柱) */
export interface GanZhiPillar {
  gan: HangeulHanja;
  zhi: HangeulHanja;
  /** 두 글자 한글 표기 (예: "갑자") */
  hangeul: string;
  /** 두 글자 한자 표기 (예: "甲子") */
  hanja: string;
}

/** 사주(四柱): 년주/월주/일주/시주. 시간을 모르면 time은 null이다. */
export interface SajuPillars {
  year: GanZhiPillar;
  month: GanZhiPillar;
  day: GanZhiPillar;
  time: GanZhiPillar | null;
}
