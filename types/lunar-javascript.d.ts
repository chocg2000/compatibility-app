/**
 * lunar-javascript는 타입 선언을 제공하지 않으므로, 이 프로젝트에서 실제로
 * 사용하는 API 표면만 최소한으로 선언한다.
 * https://github.com/6tail/lunar-javascript
 */
declare module "lunar-javascript" {
  /** 사주팔자(년주/월주/일주/시주)의 간지(干支) 정보. 각 값은 한자 한 글자다. */
  export class EightChar {
    getYearGan(): string;
    getYearZhi(): string;
    getMonthGan(): string;
    getMonthZhi(): string;
    getDayGan(): string;
    getDayZhi(): string;
    getTimeGan(): string;
    getTimeZhi(): string;
  }

  export class Lunar {
    /**
     * 음력 날짜로부터 Lunar 인스턴스를 생성한다.
     * month에 음수를 전달하면 윤달을 의미한다 (예: 윤4월 -> -4).
     */
    static fromYmdHms(
      lunarYear: number,
      lunarMonth: number,
      lunarDay: number,
      hour: number,
      minute: number,
      second: number,
    ): Lunar;
    getEightChar(): EightChar;
  }

  export class Solar {
    static fromYmdHms(
      year: number,
      month: number,
      day: number,
      hour: number,
      minute: number,
      second: number,
    ): Solar;
    getLunar(): Lunar;
  }
}
