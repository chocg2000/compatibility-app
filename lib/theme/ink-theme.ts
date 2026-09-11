import type { CSSProperties } from "react";

/**
 * 먹색/인주색 톤을 쓰는 라우트(예: /saju, /gwansang)가 공유하는 CSS 변수.
 * 전역 디자인 토큰(app/globals.css)과는 분리해 해당 라우트의 layout wrapper에만 스코프한다.
 */
export const INK_THEME_VARS = {
  "--saju-bg": "#15120f",
  "--saju-bg-elevated": "#1e1a16",
  "--saju-text": "#eae2d1",
  "--saju-text-muted": "#a89d89",
  "--saju-border": "#3a3227",
  "--saju-accent": "#c1443a",
} as CSSProperties;
