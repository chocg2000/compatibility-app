import type { OhengDistribution } from "@/lib/saju";
import { choseongToBaleumOheng } from "./baleum-oheng";
import { extractChoseong } from "./choseong";
import { strokesToJawonOheng } from "./jawon-oheng";
import {
  buildSajuJawonReason,
  determineSajuJawonVerdict,
  findDeficientOheng,
  findExcessiveOheng,
} from "./saju-jawon-compatibility";
import { getHanjaJawonStrokeCount, getHanjaStrokeCount } from "./stroke-count";
import type {
  BaleumOhengDistribution,
  HangulBaleumOheng,
  HanjaJawonOheng,
  JawonOhengDistribution,
  NameBaleumOhengResult,
  NameJawonOhengResult,
  SajuJawonCompatibilityResult,
} from "./types";

/**
 * 한자 한 글자의 획수를 조회해 자원오행까지 판정하는 순수 함수.
 * 오행 판정은 원획법 보정을 적용한 획수를 기준으로 한다(사전 필획 값은
 * dictionaryStrokes로 함께 반환해, 보정 전/후를 비교하거나 화면에 "원획 기준
 * N획"처럼 표시할 때 쓸 수 있게 한다).
 */
export function calculateHanjaJawonOheng(hanja: string): HanjaJawonOheng {
  const dictionaryStrokes = getHanjaStrokeCount(hanja);
  const strokes = getHanjaJawonStrokeCount(hanja);
  return { hanja, dictionaryStrokes, strokes, oheng: strokesToJawonOheng(strokes) };
}

/**
 * 이름 한자 배열(예: ["洪","吉","童"])을 받아 글자별 획수·자원오행과
 * 이름 전체의 오행 분포를 계산하는 순수 함수.
 */
export function calculateNameJawonOheng(hanjaList: string[]): NameJawonOhengResult {
  const characters = hanjaList.map(calculateHanjaJawonOheng);

  const distribution: JawonOhengDistribution = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  for (const character of characters) {
    distribution[character.oheng] += 1;
  }

  return { characters, distribution };
}

/** 한글 음절 한 글자의 초성을 분리해 발음오행까지 판정하는 순수 함수. */
export function calculateHangulBaleumOheng(char: string): HangulBaleumOheng {
  const choseong = extractChoseong(char);
  return { char, choseong, oheng: choseongToBaleumOheng(choseong) };
}

/**
 * 한글 이름 문자열(예: "홍길동")을 받아 글자별 초성·발음오행과
 * 이름 전체의 오행 분포를 계산하는 순수 함수.
 */
export function calculateNameBaleumOheng(name: string): NameBaleumOhengResult {
  const characters = [...name].map(calculateHangulBaleumOheng);

  const distribution: BaleumOhengDistribution = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  for (const character of characters) {
    distribution[character.oheng] += 1;
  }

  return { characters, distribution };
}

/**
 * 사주 오행 분포(lib/saju의 calculateOhengDistribution 결과)와 이름의 자원오행
 * 분석 결과(calculateNameJawonOheng 결과)를 비교해 "보완/상충/중립"을 판정한다.
 *
 * - 사주에서 가장 부족한 오행을 이름 글자가 채워주면 "보완"
 * - (보완이 아니면서) 사주에서 이미 과잉인 오행을 이름 글자가 더 강화하면 "상충"
 * - 그 외에는 "중립"
 */
export function calculateSajuJawonCompatibility(
  sajuOheng: OhengDistribution,
  nameJawon: NameJawonOhengResult,
): SajuJawonCompatibilityResult {
  const deficientOheng = findDeficientOheng(sajuOheng);
  const excessiveOheng = findExcessiveOheng(sajuOheng);

  const deficientSet = new Set(deficientOheng.map((d) => d.oheng));
  const excessiveSet = new Set(excessiveOheng.map((e) => e.oheng));

  const complementingCharacters = nameJawon.characters.filter((c) => deficientSet.has(c.oheng));
  const conflictingCharacters = nameJawon.characters.filter((c) => excessiveSet.has(c.oheng));

  const verdict = determineSajuJawonVerdict(complementingCharacters, conflictingCharacters);
  const reason = buildSajuJawonReason(
    verdict,
    deficientOheng,
    excessiveOheng,
    complementingCharacters,
    conflictingCharacters,
  );

  return { verdict, deficientOheng, excessiveOheng, complementingCharacters, conflictingCharacters, reason };
}
