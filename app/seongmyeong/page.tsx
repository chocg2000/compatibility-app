import type { Metadata } from "next";
import SeongmyeongAnalyzer from "./seongmyeong-analyzer";

export const metadata: Metadata = {
  title: "성명학 개별분석",
  description: "이름 한자의 자원오행과 발음오행을 사주와 비교해 풀이합니다.",
};

export default function SeongmyeongPage() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      <SeongmyeongAnalyzer />
    </div>
  );
}
