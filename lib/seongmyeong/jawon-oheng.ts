import type { Oheng } from "@/lib/saju";

/**
 * 획수의 일의 자리(1~10)를 오행에 대응시킨 표.
 * 1·2=목, 3·4=화, 5·6=토, 7·8=금, 9·10=수. 10의 배수는 나머지가 0이 되므로
 * "수"(10 자리)로 취급한다.
 */
const OHENG_BY_LAST_DIGIT: Record<number, Oheng> = {
  1: "목",
  2: "목",
  3: "화",
  4: "화",
  5: "토",
  6: "토",
  7: "금",
  8: "금",
  9: "수",
  0: "수",
};

/**
 * 획수 -> 자원오행(字源五行) 매핑.
 * 10을 넘는 획수는 10으로 나눈 나머지를 기준으로 순환 매핑한다(11=목, 20=수 ...).
 */
export function strokesToJawonOheng(strokes: number): Oheng {
  if (!Number.isInteger(strokes) || strokes <= 0) {
    throw new Error(`획수는 1 이상의 정수여야 합니다: ${strokes}`);
  }
  return OHENG_BY_LAST_DIGIT[strokes % 10];
}
