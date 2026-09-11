/** 오행(五行) */
export type Oheng = "목" | "화" | "토" | "금" | "수";

/** 음양(陰陽) */
export type EumYang = "양" | "음";

/** 십천간(天干)의 한글 이름 */
export type CheonganKorean = "갑" | "을" | "병" | "정" | "무" | "기" | "경" | "신" | "임" | "계";

/** 십천간을 순서대로 나열한 목록 (전체 조합을 순회할 때 사용) */
export const CHEONGAN_KOREAN_LIST: CheonganKorean[] = [
  "갑",
  "을",
  "병",
  "정",
  "무",
  "기",
  "경",
  "신",
  "임",
  "계",
];

/** 십천간(天干) 한자 -> 오행 */
export const CHEONGAN_OHENG: Record<string, Oheng> = {
  "甲": "목",
  "乙": "목",
  "丙": "화",
  "丁": "화",
  "戊": "토",
  "己": "토",
  "庚": "금",
  "辛": "금",
  "壬": "수",
  "癸": "수",
};

/** 십천간(天干) 한자 -> 음양 */
export const CHEONGAN_EUMYANG: Record<string, EumYang> = {
  "甲": "양",
  "乙": "음",
  "丙": "양",
  "丁": "음",
  "戊": "양",
  "己": "음",
  "庚": "양",
  "辛": "음",
  "壬": "양",
  "癸": "음",
};

/**
 * 십이지지(地支) 한자 -> 오행 (본기 기준의 단순 매핑).
 * 지장간(숨은 천간)의 가중치는 고려하지 않는다.
 */
export const JIJI_OHENG: Record<string, Oheng> = {
  "子": "수",
  "丑": "토",
  "寅": "목",
  "卯": "목",
  "辰": "토",
  "巳": "화",
  "午": "화",
  "未": "토",
  "申": "금",
  "酉": "금",
  "戌": "토",
  "亥": "수",
};

/** 십이지지(地支) 한자 -> 음양 */
export const JIJI_EUMYANG: Record<string, EumYang> = {
  "子": "양",
  "丑": "음",
  "寅": "양",
  "卯": "음",
  "辰": "양",
  "巳": "음",
  "午": "양",
  "未": "음",
  "申": "양",
  "酉": "음",
  "戌": "양",
  "亥": "음",
};

/** 오행 상생(相生): key 오행이 value 오행을 생(生)한다. 목생화, 화생토, 토생금, 금생수, 수생목 */
export const OHENG_SAENG: Record<Oheng, Oheng> = {
  "목": "화",
  "화": "토",
  "토": "금",
  "금": "수",
  "수": "목",
};

/** 오행 상극(相剋): key 오행이 value 오행을 극(剋)한다. 목극토, 토극수, 수극화, 화극금, 금극목 */
export const OHENG_GEUK: Record<Oheng, Oheng> = {
  "목": "토",
  "토": "수",
  "수": "화",
  "화": "금",
  "금": "목",
};

/** 한자 한 글자(천간 또는 지지)의 오행을 반환한다. */
export function getOheng(hanja: string): Oheng {
  const oheng = CHEONGAN_OHENG[hanja] ?? JIJI_OHENG[hanja];
  if (!oheng) {
    throw new Error(`알 수 없는 간지 문자입니다: ${hanja}`);
  }
  return oheng;
}

/** 한자 한 글자(천간 또는 지지)의 음양을 반환한다. */
export function getEumYang(hanja: string): EumYang {
  const eumYang = CHEONGAN_EUMYANG[hanja] ?? JIJI_EUMYANG[hanja];
  if (!eumYang) {
    throw new Error(`알 수 없는 간지 문자입니다: ${hanja}`);
  }
  return eumYang;
}
