import type { Oheng } from "@/lib/saju";
import { HANJA_DICTIONARY } from "./hanja-dictionary";
import { strokesToJawonOheng } from "./jawon-oheng";
import inmyongFallbackData from "./inmyong-hanja-fallback.json";

/**
 * 대법원 인명용 한자 전체 목록(음절 430개 · 한자 9,055자)에서 가져온 보조 후보.
 * 큐레이션 사전(hanja-dictionary.ts)과 달리 훈(뜻풀이)이 없다.
 */
interface InmyongFallbackEntry {
  char: string;
  stroke: number;
  ohaeng: Oheng;
}

const INMYONG_HANJA_FALLBACK = inmyongFallbackData as Record<string, InmyongFallbackEntry[]>;

/**
 * 한자 후보 하나. 큐레이션 사전에서 왔으면 훈이 채워지고, 인명용 한자 보조
 * 사전에서만 찾았으면 훈이 null이다(UI에서 "뜻 정보 없음"으로 표시).
 */
export interface HanjaCandidate {
  한자: string;
  훈: string | null;
  획수: number;
  오행: Oheng;
}

/** 후보가 이 개수 이상이면 획수 순으로 정렬해 보여준다. */
const SORT_BY_STROKE_THRESHOLD = 20;

/**
 * 한글 음(예: "민")에 대한 한자 후보를 하이브리드로 조회한다.
 * 1) 훈이 있는 300자 큐레이션 사전을 먼저 찾고,
 * 2) 인명용 한자 보조 사전에서 겹치지 않는 한자를 추가로 합친다(훈 없음).
 * 큐레이션 후보는 항상 맨 앞에 오고(훈이 묻히지 않도록), 보조 사전 후보만
 * 전체 개수가 많아지면(20개 이상) 획수 순으로 정렬한다.
 */
export function getHanjaCandidates(reading: string): HanjaCandidate[] {
  const curated = HANJA_DICTIONARY[reading] ?? [];
  const fallback = INMYONG_HANJA_FALLBACK[reading] ?? [];

  const seen = new Set<string>();
  const curatedCandidates: HanjaCandidate[] = [];
  for (const entry of curated) {
    seen.add(entry.한자);
    curatedCandidates.push({ 한자: entry.한자, 훈: entry.훈, 획수: entry.원획, 오행: strokesToJawonOheng(entry.원획) });
  }

  const fallbackCandidates: HanjaCandidate[] = [];
  for (const entry of fallback) {
    if (seen.has(entry.char)) continue;
    seen.add(entry.char);
    fallbackCandidates.push({ 한자: entry.char, 훈: null, 획수: entry.stroke, 오행: entry.ohaeng });
  }

  if (curatedCandidates.length + fallbackCandidates.length >= SORT_BY_STROKE_THRESHOLD) {
    fallbackCandidates.sort((a, b) => a.획수 - b.획수);
  }

  return [...curatedCandidates, ...fallbackCandidates];
}
