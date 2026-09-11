import type { CheonganKorean } from "./five-elements";
import type { Sipseong } from "./sipseong";

/** 일간 × 십성 한 조합에 대한 해석 문구 세 가지 */
export interface SipseongInterpretation {
  성격: string;
  "직업/적성": string;
  연애운: string;
}

/** 하나의 일간에 대한, 십성 10개 전체의 해석 (완성된 상태) */
export type IlganSipseongInterpretations = Record<Sipseong, SipseongInterpretation>;

/**
 * 일간(10개) × 십성(10개) = 100개 조합의 해석 문구 전체 표.
 * 채워야 할 최종 형태를 나타내며, 실제 데이터는 아래 SipseongInterpretationTable(부분 완성)로 관리한다.
 */
export type FullSipseongInterpretationTable = Record<CheonganKorean, IlganSipseongInterpretations>;

/**
 * 실제로 채워 나가는 중인 해석 표.
 * 일간과 십성 모두 선택적(optional)이라, 일부 조합만 채운 상태로도 타입 오류 없이 관리할 수 있다.
 * (필드 이름이 틀리면 여전히 타입 오류가 나므로 구조 검증에는 문제가 없다.)
 */
export type SipseongInterpretationTable = {
  [Ilgan in CheonganKorean]?: {
    [S in Sipseong]?: SipseongInterpretation;
  };
};
