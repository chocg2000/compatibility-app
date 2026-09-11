export type MbtiAxis = "EI" | "SN" | "TF" | "JP";

export type MbtiPole = "E" | "I" | "S" | "N" | "T" | "F" | "J" | "P";

/**
 * "basic" 문항은 간이 진단에서 사용된다.
 * 나중에 "precise" 문항을 추가하면 정밀 모드에서 basic + precise 문항을 함께 사용할 수 있다.
 */
export type QuizMode = "basic" | "precise";

export interface MbtiQuestion {
  id: string;
  axis: MbtiAxis;
  /** 이 문항에 "그렇다"고 응답할수록 가까워지는 축의 극(pole) */
  pole: MbtiPole;
  text: string;
  mode: QuizMode;
}

export const LIKERT_OPTIONS = [
  { value: 5, label: "매우 그렇다" },
  { value: 4, label: "그렇다" },
  { value: 3, label: "보통이다" },
  { value: 2, label: "그렇지 않다" },
  { value: 1, label: "매우 그렇지 않다" },
] as const;

export type LikertValue = (typeof LIKERT_OPTIONS)[number]["value"];

export type MbtiAnswers = Record<string, LikertValue>;

export type MbtiTypeCode =
  | "ISTJ"
  | "ISFJ"
  | "INFJ"
  | "INTJ"
  | "ISTP"
  | "ISFP"
  | "INFP"
  | "INTP"
  | "ESTP"
  | "ESFP"
  | "ENFP"
  | "ENTP"
  | "ESTJ"
  | "ESFJ"
  | "ENFJ"
  | "ENTJ";
