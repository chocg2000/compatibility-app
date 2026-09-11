/**
 * 초성(19개)을 유니코드 한글 음절 인덱스 순서 그대로 나열한 목록.
 * 순서 자체가 곧 조합형 코드포인트 계산에 쓰이는 인덱스라 순서를 바꾸면 안 된다.
 */
const CHOSEONG_LIST = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ",
  "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
] as const;

export type Choseong = (typeof CHOSEONG_LIST)[number];

/** 완성형 한글 음절 유니코드 블록(가~힣)의 시작/끝 코드포인트 */
const HANGUL_SYLLABLE_START = 0xac00;
const HANGUL_SYLLABLE_END = 0xd7a3;

const JUNGSEONG_COUNT = 21;
const JONGSEONG_COUNT = 28;

/**
 * 한글 음절 한 글자에서 초성 자음을 분리한다.
 *
 * 완성형 한글 음절(가~힣)은 "((초성 * 21) + 중성) * 28 + 종성 + 0xAC00" 규칙으로
 * 조합되어 있는 유니코드 표준 구조라, 사전이나 별도 데이터 없이 코드포인트
 * 산술만으로 초성 인덱스를 정확히 구해낼 수 있다.
 */
export function extractChoseong(char: string): Choseong {
  const characters = [...char];
  if (characters.length !== 1) {
    throw new Error(`초성은 글자 한 개에 대해서만 추출할 수 있습니다: "${char}"`);
  }

  const code = char.codePointAt(0);
  if (code === undefined || code < HANGUL_SYLLABLE_START || code > HANGUL_SYLLABLE_END) {
    throw new Error(`초성을 분리할 수 없는 문자입니다(완성형 한글 음절이 아님): "${char}"`);
  }

  const syllableIndex = code - HANGUL_SYLLABLE_START;
  const choseongIndex = Math.floor(syllableIndex / (JUNGSEONG_COUNT * JONGSEONG_COUNT));
  return CHOSEONG_LIST[choseongIndex];
}
