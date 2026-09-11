import { CHEONGAN_HANGEUL } from "./constants";
import type { CheonganKorean } from "./five-elements";
import { sajuInterpretations } from "./interpretations-data";
import type { SipseongInterpretation, SipseongInterpretationTable } from "./interpretation-types";
import type { Sipseong } from "./sipseong";

/** 일간 × 십성 해석 데이터. 실제 데이터는 ./interpretations-data 에서 관리한다. */
export const SIPSEONG_INTERPRETATIONS: SipseongInterpretationTable = sajuInterpretations;

/** 일간의 한자(예: "甲")를 해석 표의 키인 한글(예: "갑")로 변환한다. */
export function cheonganHanjaToKorean(hanja: string): CheonganKorean {
  const korean = CHEONGAN_HANGEUL[hanja];
  if (!korean) {
    throw new Error(`알 수 없는 천간 문자입니다: ${hanja}`);
  }
  return korean as CheonganKorean;
}

/**
 * 일간(한글)과 십성으로 해석 문구를 조회하는 순수 함수.
 * 아직 채워지지 않은 조합이면 undefined를 반환한다.
 */
export function getSipseongInterpretation(
  ilgan: CheonganKorean,
  sipseong: Sipseong,
  table: SipseongInterpretationTable = SIPSEONG_INTERPRETATIONS,
): SipseongInterpretation | undefined {
  return table[ilgan]?.[sipseong];
}
