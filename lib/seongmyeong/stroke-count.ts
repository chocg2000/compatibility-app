import hanjaPackage from "hanja";

/**
 * 한자 한 글자의 사전(필획) 획수를 조회한다.
 *
 * hanja 패키지(rockpicado/hanja)에 내장된 필순 데이터를 사용한다 - 이 데이터는
 * 획 하나당 숫자 한 자리로 인코딩된 문자열로 저장되어 있어(예: "金" -> "34112431"),
 * 그 문자열의 길이가 곧 총 획수다.
 *
 * 주의: 이 값은 사전에 등재된 표준(필획) 획수다. 전통 성명학의 "원획" 계산법은
 * 아래 getHanjaJawonStrokeCount()가 별도로 보정한다.
 */
export function getHanjaStrokeCount(hanja: string): number {
  const characters = [...hanja];
  if (characters.length !== 1) {
    throw new Error(`획수는 한자 한 글자에 대해서만 조회할 수 있습니다: "${hanja}"`);
  }

  const strokes = hanjaPackage.getStrokes(hanja);
  if (!strokes) {
    throw new Error(`획수를 찾을 수 없는 한자입니다: ${hanja}`);
  }

  return strokes.length;
}

// ============================================================================
// 원획법(原劃法) 보정
//
// 부수가 간략화된 형태로 그려지는 한자는, 사전에 등재된 필획수와 성명학에서 쓰는
// "원획"(부수를 생략되기 전 본래 글자 기준으로 센 획수)이 다르다. 예를 들어
// 삼수변(氵)은 3획으로 그리지만 원래 글자인 水(물 수)는 4획이므로, 氵가 들어간
// 한자는 필획보다 원획이 1획 많다.
//
// 이 보정을 프로그램적으로 하려면 한자를 부수 단위로 분해해야 하는데, 그 분해
// 결과(어떤 부수가 어느 위치에 있는지)를 안정적으로 얻을 수 있는 자료가 없다
// (실제로 cnchar-radical 같은 후보를 검토해봤지만, 阝가 왼쪽/오른쪽 중 어디에
// 있는지는 구분하지 못하고, 陳·現·熱처럼 한국 이름에 흔한 정자체도 다수 빠져
// 있었다). 그래서 아래는 자동 분해 대신, 실제로 이름에 쓰일 법한 한자를 부수별로
// 미리 조사해 "보정된 총 획수"를 직접 매핑해 둔 표다. 표에 없는 한자는 보정 없이
// 필획을 그대로 쓴다(getHanjaJawonStrokeCount 참고).
//
// 각 그룹의 보정폭(delta) = 원래 글자 획수 - 간략 부수를 그릴 때의 획수.
// ============================================================================

/** 氵(삼수변, 3획) -> 水(물 수, 4획): +1 */
const SAMSU_CORRECTIONS: Record<string, number> = {
  洪: 10, 淸: 12, 淨: 12, 淵: 12, 泰: 11, 洙: 10, 泳: 9, 潤: 16, 浩: 11, 澈: 15,
  河: 9, 海: 11, 波: 9, 流: 10, 清: 12, 治: 9, 法: 9, 活: 10, 深: 12, 漢: 15,
  滿: 15, 潭: 16, 澤: 17, 湖: 13, 洛: 10, 汶: 8, 渡: 13, 溶: 14, 滋: 13, 漂: 15,
  漣: 15, 渼: 13, 溪: 14, 滉: 14, 汎: 7, 浚: 11, 淳: 12, 湜: 13, 澄: 16, 準: 14,
  洌: 10, 洵: 10, 泫: 9, 洧: 10, 沈: 8, 池: 7, 源: 14, 潾: 16, 洗: 10,
  演: 15, 溫: 14, 江: 7, 澔: 16, 泓: 9, 沅: 8,
};

/** 忄(심방변, 3획) -> 心(마음 심, 4획): +1 */
const SIMBANG_CORRECTIONS: Record<string, number> = {
  情: 12, 快: 8, 恒: 10, 恩: 11, 悅: 11, 愼: 15, 愛: 14, 惠: 13, 悌: 11, 慧: 16,
  恪: 10, 恬: 10, 悳: 13, 愁: 14, 悼: 12, 惟: 12, 恰: 10, 恕: 11, 悛: 11, 懃: 18,
  慊: 14, 恆: 10,
};

/** 扌(재방변, 3획) -> 手(손 수, 4획): +1 */
const JAEBANG_CORRECTIONS: Record<string, number> = {
  打: 6, 把: 8, 指: 10, 持: 10, 擇: 17, 擁: 17, 揆: 13, 振: 11, 接: 12, 提: 13,
  揚: 13, 撫: 16, 撤: 15, 擎: 18, 搜: 14, 援: 13, 抗: 8, 拓: 9, 括: 10, 控: 12,
  推: 12, 損: 14, 揮: 13,
};

/** 犭(개사슴록변, 3획) -> 犬(개 견, 4획): +1 */
const GAESASLUM_CORRECTIONS: Record<string, number> = {
  犯: 6, 狂: 8, 獨: 17, 猛: 12, 猶: 13, 獻: 21, 猝: 12, 狹: 11, 狀: 9, 獄: 15,
  獅: 14, 猿: 14, 狩: 10, 猩: 13,
};

/** 阝(글자 왼쪽, 좌부변, 3획) -> 阜(언덕 부, 8획): +5 */
const JWABU_CORRECTIONS: Record<string, number> = {
  陳: 16, 陽: 17, 院: 15, 防: 12, 陸: 16, 降: 14, 限: 14, 除: 15, 陵: 16, 隆: 17,
  陟: 15, 隊: 17, 階: 17, 隣: 20, 隱: 22, 阿: 13, 陰: 16, 陷: 16, 陝: 15, 隨: 21,
};

/** 阝(글자 오른쪽, 우부방, 3획) -> 邑(고을 읍, 7획): +4 */
const UBU_CORRECTIONS: Record<string, number> = {
  郡: 14, 都: 15, 郭: 15, 邦: 11, 那: 11, 邵: 12, 郁: 13, 邨: 11, 鄕: 17, 鄭: 19,
  部: 15, 郊: 13, 邸: 12, 鄒: 17, 邱: 12, 郞: 14, 邢: 11,
};

/** 辶(책받침, 3획) -> 辵(쉬엄쉬엄갈 착, 7획): +4 */
const CHAEKBATCHIM_CORRECTIONS: Record<string, number> = {
  道: 17, 近: 12, 進: 16, 運: 17, 遠: 18, 逵: 16, 逸: 16, 造: 15, 連: 15, 達: 17,
  過: 17, 邊: 23, 邀: 21, 逍: 15, 逑: 15, 遊: 17, 遇: 17, 遂: 17, 逐: 15, 迎: 12,
  迅: 11, 述: 13, 迪: 13, 迦: 13,
};

/** 月(육달월, 4획) -> 肉(고기 육, 6획): +2. 몸/신체와 관련된 한자에서만 쓰는 月이다. */
const YUKDALWOL_CORRECTIONS: Record<string, number> = {
  肝: 9, 育: 9, 胃: 11, 肺: 10, 脈: 12, 腦: 15, 腸: 15, 脚: 13, 脣: 13, 背: 11,
  脂: 12, 胎: 11, 胞: 11, 腎: 14, 膽: 19, 臟: 24, 肩: 10, 股: 10, 肪: 10, 脅: 12,
};

/** 王(옥변, 4획) -> 玉(구슬 옥, 5획): +1. 구슬/보석과 관련된 한자에서 쓰는 王이다. */
const OKBYEON_CORRECTIONS: Record<string, number> = {
  現: 12, 珍: 10, 理: 12, 球: 12, 琳: 13, 瑞: 14, 珠: 11, 琪: 13, 瑛: 14, 珉: 10,
  瑚: 14, 璟: 17, 琇: 12, 玹: 10, 瑄: 14, 琯: 13, 瑗: 14, 璡: 17, 珽: 12, 瑾: 16,
  玟: 9, 珊: 10, 璇: 16, 珪: 11, 瓚: 24,
};

/**
 * 灬(연화발, 4획) -> 火(불 화, 4획): +0.
 * 획수 자체는 필획과 같지만(4획), "灬은 火로 본다"는 원획법 규칙을 명시적으로
 * 반영하기 위해 나머지 그룹과 동일한 방식으로 등재해 둔다.
 */
const YEONHWABAL_CORRECTIONS: Record<string, number> = {
  熱: 15, 烈: 10, 然: 12, 熙: 14, 無: 12, 燕: 16, 焦: 12, 煮: 12, 熊: 14, 熏: 14,
};

/** 위 부수별 보정표를 한자 하나당 보정된 총 획수로 합친 조회용 맵. */
const JAWON_STROKE_CORRECTIONS: Record<string, number> = {
  ...SAMSU_CORRECTIONS,
  ...SIMBANG_CORRECTIONS,
  ...JAEBANG_CORRECTIONS,
  ...GAESASLUM_CORRECTIONS,
  ...JWABU_CORRECTIONS,
  ...UBU_CORRECTIONS,
  ...CHAEKBATCHIM_CORRECTIONS,
  ...YUKDALWOL_CORRECTIONS,
  ...OKBYEON_CORRECTIONS,
  ...YEONHWABAL_CORRECTIONS,
};

/**
 * 성명학 원획법을 적용한 획수를 조회한다.
 * 보정표(JAWON_STROKE_CORRECTIONS)에 있는 한자는 보정된 값을, 없는 한자는
 * getHanjaStrokeCount()가 반환하는 필획 값을 그대로 돌려준다(안전한 기본값).
 */
export function getHanjaJawonStrokeCount(hanja: string): number {
  const dictionaryStrokes = getHanjaStrokeCount(hanja);
  return JAWON_STROKE_CORRECTIONS[hanja] ?? dictionaryStrokes;
}
