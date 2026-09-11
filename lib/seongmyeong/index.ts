export { getHanjaJawonStrokeCount, getHanjaStrokeCount } from "./stroke-count";
export { HANJA_DICTIONARY, type HanjaDictionaryEntry } from "./hanja-dictionary";
export { getHanjaCandidates, type HanjaCandidate } from "./hanja-candidates";
export { strokesToJawonOheng } from "./jawon-oheng";
export { extractChoseong, type Choseong } from "./choseong";
export { choseongToBaleumOheng } from "./baleum-oheng";
export { describeBaleumOhengTrend } from "./baleum-trend";
export {
  buildSajuJawonReason,
  determineSajuJawonVerdict,
  findDeficientOheng,
  findExcessiveOheng,
} from "./saju-jawon-compatibility";
export { SAJU_JAWON_INTERPRETATIONS } from "./saju-jawon-interpretations";
export type {
  SajuJawonInterpretationSnippet,
  SajuJawonInterpretationTable,
} from "./saju-jawon-interpretations";
export {
  calculateHanjaJawonOheng,
  calculateNameJawonOheng,
  calculateHangulBaleumOheng,
  calculateNameBaleumOheng,
  calculateSajuJawonCompatibility,
} from "./calculate";
export type {
  HanjaJawonOheng,
  JawonOhengDistribution,
  NameJawonOhengResult,
  HangulBaleumOheng,
  BaleumOhengDistribution,
  NameBaleumOhengResult,
  OhengCount,
  SajuJawonVerdict,
  SajuJawonCompatibilityResult,
} from "./types";
