import type { Metadata } from "next";
import SajuAnalyzer from "./saju-analyzer";

export const metadata: Metadata = {
  title: "사주 개별분석",
  description: "생년월일시로 사주 여덟 글자와 오행, 십성을 풀이합니다.",
};

export default function SajuPage() {
  return <SajuAnalyzer />;
}
