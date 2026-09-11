import type { UserProfile } from "@/lib/profile/user-profile";
import type { MbtiAxis, MbtiTypeCode } from "@/lib/mbti/types";
import type { MbtiAxisResult, MbtiResult } from "@/lib/mbti/scoring";
import { findDeficientOheng } from "@/lib/seongmyeong";
import type { GwansangGeometryAnalysis } from "@/lib/gwansang/analyzer";
import {
  type GwansangCompatibilityLabels,
  type OverallCompatibilityInput,
  type SajuCompatibilityPerson,
  type SeongmyeongCompatibilityPerson,
} from "@/lib/compatibility";

const MBTI_AXES: MbtiAxis[] = ["EI", "SN", "TF", "JP"];

/**
 * 상대방 MBTI처럼 4글자 유형 코드만 아는 경우(24문항 검사를 대신 풀 수 없으므로),
 * 궁합 계산과 프로필 저장에 필요한 최소한의 MbtiResult를 만들어준다.
 * scores는 실제 응답 점수가 아니라 "이 극을 골랐다"는 placeholder(1점)일 뿐이다.
 */
export function buildMbtiResultFromType(type: MbtiTypeCode): MbtiResult {
  const axisResults: MbtiAxisResult[] = MBTI_AXES.map((axis, index) => {
    const winner = type[index] as MbtiAxisResult["winner"];
    return { axis, winner, scores: { [winner]: 1 } };
  });
  return { type, axisResults };
}

export function toSajuCompatibilityPerson(saju: NonNullable<UserProfile["saju"]>): SajuCompatibilityPerson {
  return {
    ohengDistribution: saju.oheng,
    dayGanHanja: saju.pillars.day.gan.hanja,
  };
}

/**
 * analyzer.ts의 원자적 판정값을 gwansang-compat.ts가 쓰는 복합 라벨 어휘로 변환한다.
 * (예: nose.bridgeHeight "높다" -> "콧대 높다") - 이 변환은 gwansang-interpretations.ts의
 * collectLookupKeys와 동일한 어휘를 따른다. 부위마다 여러 특징 중 대표값 하나만 쓴다
 * (예: 눈은 크기만, 처짐/쌍꺼풀 여부는 궁합 계산에 반영하지 않는다).
 */
export function toGwansangCompatibilityLabels(geometry: GwansangGeometryAnalysis): GwansangCompatibilityLabels {
  return {
    이마: geometry.forehead.shape,
    눈: geometry.eyes.size,
    코: geometry.nose.bridgeHeight === "높다" ? "콧대 높다" : "콧대 낮다",
    "입/입술": geometry.mouth.lipThickness,
    턱: geometry.chin.jawShape,
    눈썹: geometry.eyebrows.thickness,
    안색: geometry.complexion.tone,
  };
}

export function toSeongmyeongCompatibilityPerson(
  seongmyeong: NonNullable<UserProfile["seongmyeong"]>,
  saju: NonNullable<UserProfile["saju"]>,
): SeongmyeongCompatibilityPerson {
  return {
    jawonOheng: seongmyeong.jawonOheng.distribution,
    baleumOheng: seongmyeong.baleumOheng.distribution,
    sajuDeficientOheng: findDeficientOheng(saju.oheng).map((entry) => entry.oheng),
  };
}

/** MBTI/사주/관상/성명학 네 항목이 모두 채워졌는지. */
export function isProfileComplete(profile: UserProfile): boolean {
  return Boolean(profile.mbti && profile.saju && profile.gwansang && profile.seongmyeong);
}

/**
 * 두 사람의 통합 프로필이 모두 완료됐을 때, calculateOverallCompatibility에 넘길
 * 입력으로 변환한다. 어느 한쪽이라도 미완료면 null을 반환한다.
 */
export function buildOverallCompatibilityInput(
  profileA: UserProfile,
  profileB: UserProfile,
): OverallCompatibilityInput | null {
  if (!isProfileComplete(profileA) || !isProfileComplete(profileB)) return null;
  // isProfileComplete가 이미 각 필드의 존재를 보장했지만, 타입스크립트가 이를
  // 좁혀주지 않으므로 non-null 단언 대신 각 필드를 안전하게 다시 꺼내 쓴다.
  const a = profileA;
  const b = profileB;
  if (!a.mbti || !a.saju || !a.gwansang || !a.seongmyeong) return null;
  if (!b.mbti || !b.saju || !b.gwansang || !b.seongmyeong) return null;

  return {
    mbti: { typeA: a.mbti.result.type, typeB: b.mbti.result.type },
    saju: { personA: toSajuCompatibilityPerson(a.saju), personB: toSajuCompatibilityPerson(b.saju) },
    gwansang: {
      labelsA: toGwansangCompatibilityLabels(a.gwansang.result.geometry),
      labelsB: toGwansangCompatibilityLabels(b.gwansang.result.geometry),
    },
    seongmyeong: {
      personA: toSeongmyeongCompatibilityPerson(a.seongmyeong, a.saju),
      personB: toSeongmyeongCompatibilityPerson(b.seongmyeong, b.saju),
    },
  };
}
