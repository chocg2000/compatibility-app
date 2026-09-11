/**
 * lib/saju 모듈 테스트용 콘솔 출력 스크립트.
 * 실행: npx tsx scripts/saju-example.ts
 */
import { calculateOhengDistribution, calculateSaju, calculateSipseong } from "../lib/saju";
import type { GanZhiPillar, SajuPillars } from "../lib/saju";

function printPillar(label: string, pillar: GanZhiPillar | null) {
  if (!pillar) {
    console.log(`  ${label}: 모름`);
    return;
  }
  console.log(
    `  ${label}: ${pillar.hangeul}(${pillar.hanja})  [천간 ${pillar.gan.hangeul}(${pillar.gan.hanja}) / 지지 ${pillar.zhi.hangeul}(${pillar.zhi.hanja})]`,
  );
}

function printSaju(title: string, result: SajuPillars) {
  console.log(`\n=== ${title} ===`);
  printPillar("년주", result.year);
  printPillar("월주", result.month);
  printPillar("일주", result.day);
  printPillar("시주", result.time);

  const oheng = calculateOhengDistribution(result);
  console.log(
    `  오행 분포: 목 ${oheng.목} / 화 ${oheng.화} / 토 ${oheng.토} / 금 ${oheng.금} / 수 ${oheng.수}`,
  );

  const sipseong = calculateSipseong(result);
  console.log(
    `  십성: 년간 ${sipseong.year.gan} / 년지 ${sipseong.year.zhi} / 월간 ${sipseong.month.gan} / 월지 ${sipseong.month.zhi} / 일지 ${sipseong.day.zhi} / 시간 ${sipseong.time?.gan ?? "모름"} / 시지 ${sipseong.time?.zhi ?? "모름"}`,
  );
}

// 1) 양력 + 시간을 아는 경우
printSaju(
  "양력 1990-05-15 14:30",
  calculateSaju({ year: 1990, month: 5, day: 15, hour: 14, minute: 30, isLunar: false }),
);

// 2) 음력 + 시간을 아는 경우
printSaju(
  "음력 1990-04-21 14:30",
  calculateSaju({ year: 1990, month: 4, day: 21, hour: 14, minute: 30, isLunar: true }),
);

// 3) 음력 윤달 + 시간을 아는 경우
printSaju(
  "음력 윤4월 2020-윤4-15 09:00 (예: 2020년에 실제 존재한 윤4월)",
  calculateSaju({
    year: 2020,
    month: 4,
    day: 15,
    hour: 9,
    minute: 0,
    isLunar: true,
    isLeapMonth: true,
  }),
);

// 4) 양력 + 시간을 모르는 경우 (시주는 null)
printSaju(
  "양력 1990-05-15, 시간 모름",
  calculateSaju({ year: 1990, month: 5, day: 15, isLunar: false, isTimeUnknown: true }),
);
