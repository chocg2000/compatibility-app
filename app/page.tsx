import Link from "next/link";

interface FeatureCard {
  href: string;
  title: string;
  description: string;
  emoji: string;
}

const FEATURE_CARDS: FeatureCard[] = [
  {
    href: "/mbti",
    title: "MBTI 간이진단",
    description: "24개 문항으로 알아보는 나의 MBTI 성격 유형 (E/I, S/N, T/F, J/P)",
    emoji: "🧭",
  },
  {
    href: "/saju",
    title: "사주 개별분석",
    description: "생년월일시로 풀어보는 사주 여덟 글자와 오행, 십성 해석",
    emoji: "🀄",
  },
  {
    href: "/gwansang",
    title: "관상 개별분석",
    description: "얼굴 사진 한 장으로 풀어보는 이목구비 특징과 성격·직업·연애 관상 해석",
    emoji: "🪞",
  },
  {
    href: "/seongmyeong",
    title: "성명학 개별분석",
    description: "이름 한자의 자원오행과 발음오행을 사주와 비교해 풀어보는 이름 궁합 해석",
    emoji: "🖌️",
  },
  {
    href: "/compatibility",
    title: "종합궁합",
    description: "MBTI·사주·관상·성명학 네 가지를 종합해 풀어보는 두 사람의 궁합 점수",
    emoji: "💞",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black sm:py-24">
      <div className="flex w-full max-w-3xl flex-col gap-10">
        <div className="flex flex-col gap-3 text-center sm:text-left">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Compatibility App
          </h1>
          <p className="text-base text-zinc-600 dark:text-zinc-400">
            간단한 진단으로 나와 상대를 더 잘 이해해보세요.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FEATURE_CARDS.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className="group flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
            >
              <span className="text-2xl">{feature.emoji}</span>
              <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {feature.title}
              </span>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {feature.description}
              </span>
              <span className="mt-2 text-sm font-medium text-zinc-900 group-hover:underline dark:text-zinc-50">
                시작하기 →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
