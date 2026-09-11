import type { Metadata } from "next";
import CompatibilityAnalyzer from "./compatibility-analyzer";

export const metadata: Metadata = {
  title: "종합궁합",
  description: "MBTI·사주·관상·성명학 네 가지를 종합해 두 사람의 궁합을 풀이합니다.",
};

export default function CompatibilityPage() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      <CompatibilityAnalyzer />
    </div>
  );
}
