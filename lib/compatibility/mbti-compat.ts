import type { MbtiAxis, MbtiTypeCode } from "@/lib/mbti/types";

/** 축의 순서(MbtiTypeCode 문자열에서의 자리)와, 각 자리에 올 수 있는 두 극. */
const AXIS_POLES: Record<MbtiAxis, readonly [string, string]> = {
  EI: ["E", "I"],
  SN: ["S", "N"],
  TF: ["T", "F"],
  JP: ["J", "P"],
};

const AXIS_ORDER: MbtiAxis[] = ["EI", "SN", "TF", "JP"];

const AXIS_LABELS: Record<MbtiAxis, string> = {
  EI: "외향(E)·내향(I)",
  SN: "감각(S)·직관(N)",
  TF: "사고(T)·감정(F)",
  JP: "판단(J)·인식(P)",
};

/** 축별 "다른 경우"/"같은 경우" 배점. */
const AXIS_SCORES: Record<MbtiAxis, { different: number; same: number }> = {
  EI: { different: 25, same: 15 },
  SN: { different: 15, same: 25 },
  TF: { different: 25, same: 15 },
  JP: { different: 10, same: 25 },
};

/** 축 하나에 대한 궁합 판정 결과. */
export interface MbtiAxisCompatibility {
  axis: MbtiAxis;
  /** 두 사람의 이 축 극(pole). 예: EI 축이면 "E" 또는 "I". */
  poleA: string;
  poleB: string;
  isSame: boolean;
  score: number;
  /** "외향(E)·내향(I): 다름(E/I) → 25점"처럼 사람이 읽을 수 있는 판정 근거. */
  reason: string;
}

export interface MbtiCompatibilityResult {
  /** 4개 축 점수 합산. 55~100 사이 값이다. */
  totalScore: number;
  axisResults: MbtiAxisCompatibility[];
}

function validateMbtiType(type: string): asserts type is MbtiTypeCode {
  if (type.length !== 4) {
    throw new Error(`MBTI 유형은 4글자여야 합니다: "${type}"`);
  }
  AXIS_ORDER.forEach((axis, index) => {
    const [poleA, poleB] = AXIS_POLES[axis];
    const char = type[index];
    if (char !== poleA && char !== poleB) {
      throw new Error(`"${type}"의 ${index + 1}번째 글자는 ${poleA} 또는 ${poleB}여야 합니다: "${char}"`);
    }
  });
}

/**
 * 두 사람의 MBTI 유형을 비교해 궁합 점수를 계산한다.
 * 축별로 같은 극이면 "same" 배점을, 다른 극이면 "different" 배점을 매겨
 * 4개 축 점수를 합산한다(총점 범위: 55~100).
 */
export function calculateMbtiCompatibility(
  typeA: MbtiTypeCode,
  typeB: MbtiTypeCode,
): MbtiCompatibilityResult {
  validateMbtiType(typeA);
  validateMbtiType(typeB);

  const axisResults: MbtiAxisCompatibility[] = AXIS_ORDER.map((axis, index) => {
    const poleA = typeA[index];
    const poleB = typeB[index];
    const isSame = poleA === poleB;
    const score = isSame ? AXIS_SCORES[axis].same : AXIS_SCORES[axis].different;
    const sameOrDifferent = isSame ? `같음(${poleA})` : `다름(${poleA}/${poleB})`;
    const reason = `${AXIS_LABELS[axis]}: ${sameOrDifferent} → ${score}점`;

    return { axis, poleA, poleB, isSame, score, reason };
  });

  const totalScore = axisResults.reduce((sum, result) => sum + result.score, 0);

  return { totalScore, axisResults };
}
