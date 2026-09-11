"use client";

import { useCallback, useState } from "react";
import type { GwansangAnalysisResult } from "@/lib/gwansang/gwansang-interpretations";
import type { MbtiResult } from "@/lib/mbti/scoring";
import type { OhengDistribution, SajuPillars, SajuSipseong } from "@/lib/saju";
import type { NameBaleumOhengResult, NameJawonOhengResult, SajuJawonCompatibilityResult } from "@/lib/seongmyeong";

/** MBTI 간이진단 결과 페이지에서 저장하는 데이터 */
export interface MbtiProfileData {
  result: MbtiResult;
  completedAt: string;
}

/** 사주 개별분석 결과 페이지에서 저장하는 데이터 */
export interface SajuProfileData {
  pillars: SajuPillars;
  sipseong: SajuSipseong;
  oheng: OhengDistribution;
  gender: "male" | "female";
  completedAt: string;
}

/** 관상 개별분석 결과 페이지에서 저장하는 데이터 */
export interface GwansangProfileData {
  result: GwansangAnalysisResult;
  completedAt: string;
}

/** 성명학 개별분석 결과 페이지에서 저장하는 데이터 */
export interface SeongmyeongProfileData {
  name: string;
  jawonOheng: NameJawonOhengResult;
  baleumOheng: NameBaleumOhengResult;
  /** 사주 오행 분포와 비교한 보완/상충/중립 판정 - 프로필에 사주 결과가 없으면 undefined다. */
  compatibility?: SajuJawonCompatibilityResult;
  completedAt: string;
}

/**
 * MBTI/사주/관상/성명학 결과를 한데 모으는 통합 사용자 프로필.
 *
 * 각 모듈은 사용자가 아직 진단을 안 했거나 다시 하기 전까지는 비어 있을 수 있으므로
 * 모든 결과 필드는 optional이다. 이 타입은 데이터를 담는 그릇 역할만 하며,
 * 종합궁합을 계산하는 로직은 여기 두지 않는다 - 그건 이 네 가지 필드가 모두(혹은 일부)
 * 채워진 프로필 두 개를 입력받는 별도 모듈에서, 나중에 다룬다.
 */
export interface UserProfile {
  mbti?: MbtiProfileData;
  saju?: SajuProfileData;
  gwansang?: GwansangProfileData;
  seongmyeong?: SeongmyeongProfileData;
  updatedAt: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function emptyProfile(): UserProfile {
  return { updatedAt: nowIso() };
}

export function setMbtiData(profile: UserProfile, result: MbtiResult): UserProfile {
  return { ...profile, mbti: { result, completedAt: nowIso() }, updatedAt: nowIso() };
}

export function setSajuData(
  profile: UserProfile,
  data: Omit<SajuProfileData, "completedAt">,
): UserProfile {
  return { ...profile, saju: { ...data, completedAt: nowIso() }, updatedAt: nowIso() };
}

export function setGwansangData(
  profile: UserProfile,
  result: GwansangAnalysisResult,
): UserProfile {
  return { ...profile, gwansang: { result, completedAt: nowIso() }, updatedAt: nowIso() };
}

export function setSeongmyeongData(
  profile: UserProfile,
  data: Omit<SeongmyeongProfileData, "completedAt">,
): UserProfile {
  return { ...profile, seongmyeong: { ...data, completedAt: nowIso() }, updatedAt: nowIso() };
}

const STORAGE_KEY = "compatibility-app:user-profile";

function readProfile(): UserProfile {
  if (typeof window === "undefined") return emptyProfile();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProfile();
    return JSON.parse(raw) as UserProfile;
  } catch {
    return emptyProfile();
  }
}

function writeProfile(profile: UserProfile) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // 프라이빗 모드 등 localStorage 접근이 막힌 환경에서는 조용히 무시한다.
  }
}

/**
 * 통합 프로필을 읽고 갱신하는 훅.
 * MBTI/사주/관상 각 결과 페이지는 분석이 끝나는 시점에 updateProfile로
 * 자기 영역만 갱신한다 - 다른 모듈이 이미 채워둔 데이터는 건드리지 않는다.
 */
export function useUserProfile() {
  // 지연 초기화로 최초 렌더 시 한 번만 localStorage를 읽는다(SSR에서는 window가
  // 없으므로 readProfile이 빈 프로필을 반환한다).
  const [profile, setProfile] = useState<UserProfile>(() => readProfile());

  const updateProfile = useCallback((updater: (current: UserProfile) => UserProfile) => {
    setProfile((current) => {
      const next = updater(current);
      writeProfile(next);
      return next;
    });
  }, []);

  return { profile, updateProfile };
}
