import type { Oheng } from "@/lib/saju";
import { getHanjaJawonStrokeCount, getHanjaStrokeCount, strokesToJawonOheng } from "@/lib/seongmyeong";

export type CharacterEntryMode = "auto" | "manual";

/**
 * 이름 한 글자에 대한 입력 상태.
 * mode가 "auto"면 한자를 입력해 획수를 자동 조회하고, "manual"이면 획수를
 * 직접 입력한다(사전에 없는 한자를 쓸 때 우회로).
 */
export interface CharacterEntry {
  mode: CharacterEntryMode;
  hanja: string;
  manualStrokes: string;
}

export function emptyCharacterEntry(): CharacterEntry {
  return { mode: "auto", hanja: "", manualStrokes: "" };
}

export type CharacterEntryResolution =
  | { status: "empty" }
  | { status: "error"; message: string }
  | { status: "ok"; hanja: string; dictionaryStrokes: number; strokes: number; oheng: Oheng };

/**
 * 한 글자 입력(한자 자동조회 또는 직접 획수 입력)을 자원오행 판정 결과로 변환한다.
 * 아직 아무것도 입력하지 않았으면 "empty", 잘못된 입력이면 "error"를 반환해
 * 폼에서 실시간 미리보기와 제출 가능 여부 판단에 그대로 쓸 수 있게 한다.
 */
export function resolveCharacterEntry(entry: CharacterEntry): CharacterEntryResolution {
  if (entry.mode === "auto") {
    const hanja = entry.hanja.trim();
    if (!hanja) return { status: "empty" };

    try {
      const dictionaryStrokes = getHanjaStrokeCount(hanja);
      const strokes = getHanjaJawonStrokeCount(hanja);
      return { status: "ok", hanja, dictionaryStrokes, strokes, oheng: strokesToJawonOheng(strokes) };
    } catch (error) {
      return { status: "error", message: error instanceof Error ? error.message : "알 수 없는 한자입니다." };
    }
  }

  const raw = entry.manualStrokes.trim();
  if (!raw) return { status: "empty" };

  const strokes = Number(raw);
  if (!Number.isInteger(strokes) || strokes <= 0) {
    return { status: "error", message: "획수는 1 이상의 정수로 입력해주세요." };
  }

  return {
    status: "ok",
    hanja: entry.hanja.trim(),
    dictionaryStrokes: strokes,
    strokes,
    oheng: strokesToJawonOheng(strokes),
  };
}
