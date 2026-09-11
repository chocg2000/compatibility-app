import type { Metadata } from "next";
import MbtiQuiz from "./mbti-quiz";

export const metadata: Metadata = {
  title: "MBTI 간이진단",
  description: "24개 문항으로 알아보는 나의 MBTI 유형 간이 진단",
};

export default function MbtiPage() {
  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black sm:py-24">
      <MbtiQuiz />
    </div>
  );
}
