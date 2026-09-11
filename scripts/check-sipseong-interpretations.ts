/**
 * lib/saju/interpretations.ts 구조/진행 상황 검증용 콘솔 출력 스크립트.
 * 실행: npx tsx scripts/check-sipseong-interpretations.ts
 */
import {
  calculateSaju,
  calculateSipseong,
  CHEONGAN_KOREAN_LIST,
  cheonganHanjaToKorean,
  getSipseongInterpretation,
  SIPSEONG_LIST,
} from "../lib/saju";

// 1) 100개 조합(일간 10 x 십성 10) 중 몇 개가 채워졌는지 커버리지 집계
let filled = 0;
const total = CHEONGAN_KOREAN_LIST.length * SIPSEONG_LIST.length;
const missingByIlgan = new Map<string, number>();

for (const ilgan of CHEONGAN_KOREAN_LIST) {
  let missing = 0;
  for (const sipseong of SIPSEONG_LIST) {
    if (getSipseongInterpretation(ilgan, sipseong)) {
      filled += 1;
    } else {
      missing += 1;
    }
  }
  missingByIlgan.set(ilgan, missing);
}

console.log(`=== 해석 데이터 커버리지: ${filled} / ${total} ===`);
for (const [ilgan, missing] of missingByIlgan) {
  const status = missing === 0 ? "완료" : `${SIPSEONG_LIST.length - missing}/${SIPSEONG_LIST.length}`;
  console.log(`  ${ilgan}: ${status}`);
}

// 2) 샘플 조회: 갑 일간 + 정관
const sample = getSipseongInterpretation("갑", "정관");
console.log("\n=== 샘플 조회: 갑 일간 x 정관 ===");
console.log(sample);

// 3) 실제 사주 계산 결과와 연결해서 조회 (Stage 1~2 모듈과의 통합 확인)
const pillars = calculateSaju({ year: 1990, month: 5, day: 15, hour: 14, minute: 30, isLunar: false });
const sipseong = calculateSipseong(pillars);
const ilganKorean = cheonganHanjaToKorean(pillars.day.gan.hanja);

console.log(`\n=== 실제 사주 연결 조회: 일간 ${ilganKorean}(${pillars.day.gan.hanja}), 월간 십성 ${sipseong.month.gan} ===`);
console.log(getSipseongInterpretation(ilganKorean, sipseong.month.gan) ?? "(아직 채워지지 않은 조합)");
