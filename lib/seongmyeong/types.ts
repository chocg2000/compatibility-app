import type { Oheng } from "@/lib/saju";
import type { Choseong } from "./choseong";

/** 한자 한 글자의 획수 기반 자원오행 판정 결과 */
export interface HanjaJawonOheng {
  hanja: string;
  /** 사전(필획) 기준 획수 - 원획법 보정 전 */
  dictionaryStrokes: number;
  /** 원획법 보정을 적용한 최종 획수 - 오행 판정은 이 값을 기준으로 한다 */
  strokes: number;
  oheng: Oheng;
}

/** 오행별 글자 수 분포 (lib/saju의 OhengDistribution과 동일한 모양) */
export type JawonOhengDistribution = Record<Oheng, number>;

/** 이름 전체(한자 배열)에 대한 자원오행 분석 결과 */
export interface NameJawonOhengResult {
  /** 입력 순서를 유지한 글자별 판정 결과 */
  characters: HanjaJawonOheng[];
  /** 전체 이름의 오행 분포 */
  distribution: JawonOhengDistribution;
}

/** 한글 음절 한 글자의 초성 기반 발음오행 판정 결과 */
export interface HangulBaleumOheng {
  char: string;
  choseong: Choseong;
  oheng: Oheng;
}

/** 오행별 글자 수 분포 (JawonOhengDistribution과 동일한 모양) */
export type BaleumOhengDistribution = Record<Oheng, number>;

/** 이름 전체(한글 문자열)에 대한 발음오행 분석 결과 */
export interface NameBaleumOhengResult {
  /** 입력 순서를 유지한 글자별 판정 결과 */
  characters: HangulBaleumOheng[];
  /** 전체 이름의 오행 분포 */
  distribution: BaleumOhengDistribution;
}

/** 오행 하나와 그 개수를 함께 담은 값 (부족/과잉 오행을 나타낼 때 쓴다) */
export interface OhengCount {
  oheng: Oheng;
  count: number;
}

/** 사주 오행 분포와 이름 자원오행을 비교한 3단계 판정 */
export type SajuJawonVerdict = "보완" | "상충" | "중립";

/** 사주 오행 분포 vs 이름 자원오행 비교 결과 */
export interface SajuJawonCompatibilityResult {
  verdict: SajuJawonVerdict;
  /** 사주 오행 분포에서 가장 부족한(최솟값) 오행 1~2개 */
  deficientOheng: OhengCount[];
  /** 사주 오행 분포에서 평균보다 많은(이미 과잉인) 오행 */
  excessiveOheng: OhengCount[];
  /** 이름 한자 중 부족한 오행을 보완하는 글자들 */
  complementingCharacters: HanjaJawonOheng[];
  /** 이름 한자 중 과잉한 오행을 더 강화(상충)하는 글자들 */
  conflictingCharacters: HanjaJawonOheng[];
  /** 판정 근거를 사람이 읽을 수 있는 문장으로 정리한 설명 */
  reason: string;
}
