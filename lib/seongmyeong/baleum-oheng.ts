import type { Oheng } from "@/lib/saju";
import type { Choseong } from "./choseong";

/**
 * 초성(오음: 아설순치후) -> 오행 매핑.
 * 훈민정음 제자원리의 조음 위치(어디서 소리가 나는지) 분류를 그대로 따른다.
 * 쌍자음(ㄲㄸㅃㅆㅉ)은 조음 위치가 같은 예사소리와 한 그룹으로 묶는다
 * (된소리/예사소리 구분은 소리의 세기 차이일 뿐, 오음 분류 기준인 조음 위치와는 무관하다).
 */
const OHENG_BY_CHOSEONG: Record<Choseong, Oheng> = {
  // 아음(牙音, 어금닛소리) -> 목
  ㄱ: "목",
  ㄲ: "목",
  ㅋ: "목",
  // 설음(舌音, 혓소리) -> 화
  ㄴ: "화",
  ㄷ: "화",
  ㄸ: "화",
  ㄹ: "화",
  ㅌ: "화",
  // 순음(脣音, 입술소리) -> 수
  ㅁ: "수",
  ㅂ: "수",
  ㅃ: "수",
  ㅍ: "수",
  // 치음(齒音, 잇소리) -> 금
  ㅅ: "금",
  ㅆ: "금",
  ㅈ: "금",
  ㅉ: "금",
  ㅊ: "금",
  // 후음(喉音, 목구멍소리) -> 토
  ㅇ: "토",
  ㅎ: "토",
};

/** 초성 자음의 발음오행을 판정한다. */
export function choseongToBaleumOheng(choseong: Choseong): Oheng {
  return OHENG_BY_CHOSEONG[choseong];
}
