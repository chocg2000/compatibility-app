import { Lunar, Solar } from "lunar-javascript";
import { CHEONGAN_HANGEUL, JIJI_HANGEUL } from "./constants";
import type { GanZhiPillar, SajuInput, SajuPillars } from "./types";

/**
 * 시간을 모를 때 년/월/일주 계산에 사용하는 기준 시각.
 * 정자시(23시~24시를 다음 날로 보는 방식) 등 자정 부근의 날짜 경계 문제를 피하기 위해
 * 하루의 정중앙인 정오(12:00)를 사용한다.
 *
 * 주의: 생시가 절기 전환 시각(예: 입춘) 근처인 경우 실제로는 연주/월주가
 * 달라질 수 있으나, 시간을 모르는 입력에서는 이 오차를 감수한다.
 */
const NOON_HOUR = 12;

/** 이 계산기가 지원하는 연도 범위 (lunar-javascript의 만세력 데이터 범위에 맞춘 안전한 하한/상한) */
const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

function isGregorianLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** 양력 기준 해당 연/월의 일수 (윤년 2월 처리 포함) */
export function getDaysInSolarMonth(year: number, month: number): number {
  const daysByMonth = [31, isGregorianLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return daysByMonth[month - 1];
}

function buildPillar(ganHanja: string, zhiHanja: string): GanZhiPillar {
  const gan = { hangeul: CHEONGAN_HANGEUL[ganHanja] ?? ganHanja, hanja: ganHanja };
  const zhi = { hangeul: JIJI_HANGEUL[zhiHanja] ?? zhiHanja, hanja: zhiHanja };
  return {
    gan,
    zhi,
    hangeul: `${gan.hangeul}${zhi.hangeul}`,
    hanja: `${gan.hanja}${zhi.hanja}`,
  };
}

/**
 * 생년월일시로부터 사주(년주/월주/일주/시주)를 계산하는 순수 함수.
 * 외부 상태를 읽거나 변경하지 않으며, 같은 입력에는 항상 같은 결과를 반환한다.
 * UI와 무관하므로 서버/클라이언트 어디서든 사용할 수 있다.
 */
export function calculateSaju(input: SajuInput): SajuPillars {
  const {
    year,
    month,
    day,
    hour = 0,
    minute = 0,
    isLunar = false,
    isLeapMonth = false,
    isTimeUnknown = false,
  } = input;

  if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR) {
    throw new RangeError(`연도는 ${MIN_YEAR}년부터 ${MAX_YEAR}년 사이로 입력해주세요: ${year}`);
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError(`유효하지 않은 월입니다: ${month}`);
  }
  if (!Number.isInteger(day) || day < 1 || day > 31) {
    throw new RangeError(`유효하지 않은 일입니다: ${day}`);
  }
  if (!isTimeUnknown) {
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
      throw new RangeError(`유효하지 않은 시입니다: ${hour}`);
    }
    if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
      throw new RangeError(`유효하지 않은 분입니다: ${minute}`);
    }
  }
  // lunar-javascript의 Solar는 일(day)이 1~31 범위인지만 확인하고, 실제 해당 월의
  // 마지막 날짜(예: 2월 30일)는 검증하지 않는다. 조용히 잘못된 결과를 내는 대신
  // 여기서 먼저 막는다. 음력의 일수 검증은 아래에서 Lunar.fromYmdHms가 직접 해준다.
  if (!isLunar) {
    const daysInMonth = getDaysInSolarMonth(year, month);
    if (day > daysInMonth) {
      throw new RangeError(`${year}년 ${month}월은 ${daysInMonth}일까지 있습니다. 입력한 일자(${day}일)를 확인해주세요.`);
    }
  }

  const effectiveHour = isTimeUnknown ? NOON_HOUR : hour;
  const effectiveMinute = isTimeUnknown ? 0 : minute;

  let lunar: Lunar;
  try {
    lunar = isLunar
      ? Lunar.fromYmdHms(year, isLeapMonth ? -month : month, day, effectiveHour, effectiveMinute, 0)
      : Solar.fromYmdHms(year, month, day, effectiveHour, effectiveMinute, 0).getLunar();
  } catch {
    if (isLunar) {
      throw new RangeError(
        `입력한 음력 날짜(${year}년 ${isLeapMonth ? "윤" : ""}${month}월 ${day}일)가 유효하지 않습니다. 그 해에 해당 월(윤달 포함)이 없거나, 일자가 그 달의 날짜 수를 초과했을 수 있습니다.`,
      );
    }
    throw new RangeError("입력한 날짜를 계산할 수 없습니다. 날짜를 다시 확인해주세요.");
  }

  const eightChar = lunar.getEightChar();

  return {
    year: buildPillar(eightChar.getYearGan(), eightChar.getYearZhi()),
    month: buildPillar(eightChar.getMonthGan(), eightChar.getMonthZhi()),
    day: buildPillar(eightChar.getDayGan(), eightChar.getDayZhi()),
    time: isTimeUnknown ? null : buildPillar(eightChar.getTimeGan(), eightChar.getTimeZhi()),
  };
}
