import type { Metadata } from "next";
import GwansangAnalyzer from "./gwansang-analyzer";

export const metadata: Metadata = {
  title: "관상 개별분석",
  description: "정면 사진을 업로드해 관상을 개별분석합니다.",
};

export default function GwansangPage() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      <GwansangAnalyzer />
    </div>
  );
}
