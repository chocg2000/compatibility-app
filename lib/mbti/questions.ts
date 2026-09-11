import type { MbtiQuestion } from "./types";

/**
 * 간이 진단용 기본 문항 (축당 6개, 총 24개).
 * 각 축마다 두 극(pole)을 3문항씩 균형 있게 배치해 응답 편향을 줄였다.
 *
 * 정밀 모드를 만들 때는 mode: "precise" 문항을 이 배열에 추가하기만 하면 된다.
 * 화면/채점 로직은 배열 순회 방식이라 문항 추가와 무관하게 그대로 동작한다.
 */
export const MBTI_QUESTIONS: MbtiQuestion[] = [
  // E - I
  {
    id: "ei-1",
    axis: "EI",
    pole: "E",
    mode: "basic",
    text: "새로운 사람들과 만나는 자리에서 쉽게 에너지를 얻는다.",
  },
  {
    id: "ei-2",
    axis: "EI",
    pole: "E",
    mode: "basic",
    text: "혼자 있는 시간보다 여러 사람과 함께 있는 시간이 더 즐겁다.",
  },
  {
    id: "ei-3",
    axis: "EI",
    pole: "E",
    mode: "basic",
    text: "처음 만난 사람에게도 먼저 말을 거는 편이다.",
  },
  {
    id: "ei-4",
    axis: "EI",
    pole: "I",
    mode: "basic",
    text: "하루 일과 후에는 혼자만의 시간을 가져야 재충전이 된다.",
  },
  {
    id: "ei-5",
    axis: "EI",
    pole: "I",
    mode: "basic",
    text: "많은 사람이 모이는 자리보다 소수와의 깊은 대화를 선호한다.",
  },
  {
    id: "ei-6",
    axis: "EI",
    pole: "I",
    mode: "basic",
    text: "생각을 말로 꺼내기 전에 머릿속으로 먼저 정리하는 편이다.",
  },

  // S - N
  {
    id: "sn-1",
    axis: "SN",
    pole: "S",
    mode: "basic",
    text: "구체적인 사실과 세부 정보를 바탕으로 판단하는 것을 선호한다.",
  },
  {
    id: "sn-2",
    axis: "SN",
    pole: "S",
    mode: "basic",
    text: "이론보다는 실제 경험과 사례를 더 신뢰한다.",
  },
  {
    id: "sn-3",
    axis: "SN",
    pole: "S",
    mode: "basic",
    text: "일을 할 때 정해진 절차와 방법을 따르는 것이 편하다.",
  },
  {
    id: "sn-4",
    axis: "SN",
    pole: "N",
    mode: "basic",
    text: "현재보다 미래의 가능성과 아이디어에 더 관심이 많다.",
  },
  {
    id: "sn-5",
    axis: "SN",
    pole: "N",
    mode: "basic",
    text: "사물이나 현상 이면의 숨은 의미와 패턴을 찾는 것을 좋아한다.",
  },
  {
    id: "sn-6",
    axis: "SN",
    pole: "N",
    mode: "basic",
    text: "이미 검증된 방식보다 새로운 방식을 시도해보는 것을 즐긴다.",
  },

  // T - F
  {
    id: "tf-1",
    axis: "TF",
    pole: "T",
    mode: "basic",
    text: "결정을 내릴 때 감정보다 논리와 원칙을 우선시한다.",
  },
  {
    id: "tf-2",
    axis: "TF",
    pole: "T",
    mode: "basic",
    text: "문제를 해결할 때 옳고 그름을 객관적인 기준으로 판단하려 한다.",
  },
  {
    id: "tf-3",
    axis: "TF",
    pole: "T",
    mode: "basic",
    text: "상대방의 기분보다 사실관계를 먼저 짚고 넘어가는 편이다.",
  },
  {
    id: "tf-4",
    axis: "TF",
    pole: "F",
    mode: "basic",
    text: "결정을 내릴 때 그로 인해 영향을 받는 사람들의 감정을 먼저 고려한다.",
  },
  {
    id: "tf-5",
    axis: "TF",
    pole: "F",
    mode: "basic",
    text: "갈등 상황에서는 논리적인 승패보다 관계의 조화를 더 중요하게 생각한다.",
  },
  {
    id: "tf-6",
    axis: "TF",
    pole: "F",
    mode: "basic",
    text: "다른 사람의 감정 변화를 민감하게 알아차리는 편이다.",
  },

  // J - P
  {
    id: "jp-1",
    axis: "JP",
    pole: "J",
    mode: "basic",
    text: "미리 계획을 세우고 그 계획대로 움직일 때 마음이 편하다.",
  },
  {
    id: "jp-2",
    axis: "JP",
    pole: "J",
    mode: "basic",
    text: "마감 기한보다 여유 있게 일을 끝내는 것을 선호한다.",
  },
  {
    id: "jp-3",
    axis: "JP",
    pole: "J",
    mode: "basic",
    text: "정리정돈이 잘 된 환경에서 더 집중이 잘 된다.",
  },
  {
    id: "jp-4",
    axis: "JP",
    pole: "P",
    mode: "basic",
    text: "상황에 따라 즉흥적으로 대응하는 것을 즐기는 편이다.",
  },
  {
    id: "jp-5",
    axis: "JP",
    pole: "P",
    mode: "basic",
    text: "계획이 바뀌어도 크게 스트레스를 받지 않는다.",
  },
  {
    id: "jp-6",
    axis: "JP",
    pole: "P",
    mode: "basic",
    text: "마감이 다가올수록 오히려 집중력이 높아지는 편이다.",
  },
];
