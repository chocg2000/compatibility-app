import { MBTI_QUESTIONS } from "./questions";
import type { MbtiAnswers, MbtiAxis, MbtiPole, MbtiQuestion, MbtiTypeCode } from "./types";

const AXIS_POLES: Record<MbtiAxis, [MbtiPole, MbtiPole]> = {
  EI: ["E", "I"],
  SN: ["S", "N"],
  TF: ["T", "F"],
  JP: ["J", "P"],
};

const AXIS_ORDER: MbtiAxis[] = ["EI", "SN", "TF", "JP"];

export interface MbtiAxisResult {
  axis: MbtiAxis;
  winner: MbtiPole;
  scores: Partial<Record<MbtiPole, number>>;
}

export interface MbtiResult {
  type: MbtiTypeCode;
  axisResults: MbtiAxisResult[];
}

export function isQuizComplete(
  answers: MbtiAnswers,
  questions: MbtiQuestion[] = MBTI_QUESTIONS,
): boolean {
  return questions.every((question) => answers[question.id] !== undefined);
}

export function calculateMbtiResult(
  answers: MbtiAnswers,
  questions: MbtiQuestion[] = MBTI_QUESTIONS,
): MbtiResult {
  const scores: Partial<Record<MbtiPole, number>> = {};

  for (const question of questions) {
    const value = answers[question.id];
    if (value === undefined) continue;
    scores[question.pole] = (scores[question.pole] ?? 0) + value;
  }

  const axisResults: MbtiAxisResult[] = AXIS_ORDER.map((axis) => {
    const [first, second] = AXIS_POLES[axis];
    const firstScore = scores[first] ?? 0;
    const secondScore = scores[second] ?? 0;
    // 동점일 경우 첫 번째 극(E/S/T/J)으로 결정한다.
    const winner = firstScore >= secondScore ? first : second;
    return {
      axis,
      winner,
      scores: { [first]: firstScore, [second]: secondScore },
    };
  });

  const type = axisResults.map((result) => result.winner).join("") as MbtiTypeCode;

  return { type, axisResults };
}
