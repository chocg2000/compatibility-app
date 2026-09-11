import { Noto_Serif_KR, Song_Myung } from "next/font/google";
import { INK_THEME_VARS } from "@/lib/theme/ink-theme";

const notoSerifKr = Noto_Serif_KR({
  variable: "--font-saju-serif",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const songMyung = Song_Myung({
  variable: "--font-saju-calligraphy",
  weight: "400",
});

export default function SajuLayout({ children }: LayoutProps<"/saju">) {
  return (
    <div
      className={`${notoSerifKr.variable} ${songMyung.variable} flex flex-1 flex-col bg-[var(--saju-bg)] font-[family-name:var(--font-saju-serif)] text-[var(--saju-text)]`}
      style={INK_THEME_VARS}
    >
      {children}
    </div>
  );
}
