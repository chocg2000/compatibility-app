import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

/**
 * 얼굴 랜드마크 좌표만으로 관상 부위별 특징을 규칙 기반(rule-based)으로 근사 판정한다.
 *
 * 입력은 MediaPipe FaceLandmarker가 반환하는 478개 랜드마크(기본 메쉬 468개 + 홍채 10개,
 * lib/gwansang/face-landmarker.ts 참고) 배열 하나뿐이며, 아래 함수들은 전부 순수 함수다 -
 * 같은 랜드마크를 넣으면 항상 같은 결과가 나오고, 외부 상태를 읽거나 바꾸지 않는다.
 * (단, 눈썹/안색 두 함수만 픽셀 값이 필요해 ImageData를 추가로 받는다 - ImageData 역시
 * 호출부가 만들어 넘겨주는 순수한 입력값이므로 함수 자체의 순수성에는 영향이 없다.)
 *
 * 주의: 아래 임계값들은 실측 데이터로 보정한 것이 아니라 기하학적으로 타당해 보이는
 * 근사치다. 실제 사진 데이터를 모아 보정하기 전까지는 "대략적인 경향"으로만 취급해야 한다.
 */

// ============================================================================
// 랜드마크 인덱스 (MediaPipe Face Mesh 468 canonical topology 기준)
// "왼쪽/오른쪽"은 카메라를 보는 인물 본인 기준이다 - 정면 사진에서는 화면상
// 반대쪽(오른쪽 눈은 화면 왼쪽)에 나타난다는 점에 주의한다.
// ============================================================================

const LM = {
  // 얼굴 윤곽(silhouette) - 크기/비율의 기준선으로 쓴다.
  foreheadTop: 10, // 얼굴 윤곽 중 가장 위쪽 점 (헤어라인 부근)
  chin: 152, // 턱 끝
  faceRightEdge: 234, // 화면상 왼쪽 뺨/관자놀이
  faceLeftEdge: 454, // 화면상 오른쪽 뺨/관자놀이
  templeRight: 54, // 오른쪽 이마-옆머리 경계 (이마 폭 측정용)
  templeLeft: 284, // 왼쪽 이마-옆머리 경계

  // 눈썹
  rightEyebrowInner: 107,
  rightEyebrowPeak: 105,
  rightEyebrowOuter: 70,
  rightEyebrowRegion: [46, 53, 52, 65, 55, 70, 63, 105, 66, 107],
  leftEyebrowInner: 336,
  leftEyebrowPeak: 334,
  leftEyebrowOuter: 300,
  leftEyebrowRegion: [276, 283, 282, 295, 285, 300, 293, 334, 296, 336],

  // 눈
  rightEyeOuter: 33,
  rightEyeInner: 133,
  rightEyeTop: 159,
  rightEyeBottom: 145,
  leftEyeOuter: 263,
  leftEyeInner: 362,
  leftEyeTop: 386,
  leftEyeBottom: 374,

  // 코
  noseBridgeTop: 168, // 비근점(미간 바로 아래, 콧대가 시작하는 지점)
  noseTip: 4,
  rightNostrilOuter: 98,
  leftNostrilOuter: 327,

  // 입
  mouthRightCorner: 61,
  mouthLeftCorner: 291,
  upperLipOuterTop: 0, // 윗입술 바깥(위) 경계 중앙
  upperLipInnerBottom: 13, // 윗입술 안쪽(위아래 입술이 맞닿는 선) 중앙
  lowerLipInnerTop: 14, // 아랫입술 안쪽 중앙
  lowerLipOuterBottom: 17, // 아랫입술 바깥(아래) 경계 중앙

  // 턱선
  jawRightCorner: 172, // 오른쪽 턱 모서리(하악각 부근)
  jawLeftCorner: 397, // 왼쪽 턱 모서리

  // 안색 샘플 지점 (볼/이마)
  rightCheek: 50,
  leftCheek: 280,
  glabella: 9, // 미간(눈썹 사이, 이마 하단 중앙)
} as const;

// ============================================================================
// 판정 임계값 (튜닝 가능한 상수로 한곳에 모아둔다)
// ============================================================================

const THRESHOLDS = {
  foreheadWide: 0.86,
  foreheadNarrow: 0.74,
  foreheadTallForRound: 0.58,
  eyeBigAspect: 0.32,
  eyelidGapLowerBound: 0.18,
  eyelidGapUpperBound: 0.32,
  noseBridgeHighRatio: 0.12,
  noseTipSharpDeg: 62,
  lipThickRatio: 0.34,
  mouthWideRatio: 0.52,
  chinPointedDeg: 52,
  chinSquareDeg: 158,
  doubleChinLowerFaceRatio: 0.32,
  eyebrowDarkPixelRatio: 0.32,
  eyebrowArchRatio: 0.12,
  complexionGlowScore: 55,
  complexionRedness: 12,
  complexionBrightThreshold: 150,
  complexionLowSaturation: 0.08,
} as const;

// ============================================================================
// 기본 타입 & 벡터 유틸리티
// ============================================================================

type Point3 = { x: number; y: number; z: number };

function at(landmarks: NormalizedLandmark[], index: number): NormalizedLandmark {
  const point = landmarks[index];
  if (!point) {
    throw new Error(`랜드마크 인덱스가 배열 범위를 벗어났습니다: ${index}`);
  }
  return point;
}

function distance2D(a: Point3, b: Point3): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpoint(a: Point3, b: Point3): Point3 {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 };
}

function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** vertex에서 p1, p2로 향하는 두 벡터 사이의 각도(도 단위)를 구한다. */
function angleAtVertexDeg(vertex: Point3, p1: Point3, p2: Point3, use3D: boolean): number {
  const v1 = { x: p1.x - vertex.x, y: p1.y - vertex.y, z: use3D ? p1.z - vertex.z : 0 };
  const v2 = { x: p2.x - vertex.x, y: p2.y - vertex.y, z: use3D ? p2.z - vertex.z : 0 };
  const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const mag1 = Math.hypot(v1.x, v1.y, v1.z);
  const mag2 = Math.hypot(v2.x, v2.y, v2.z);
  if (mag1 === 0 || mag2 === 0) return 0;
  const cos = Math.min(1, Math.max(-1, dot / (mag1 * mag2)));
  return (Math.acos(cos) * 180) / Math.PI;
}

/** point에서 line(a-b) 직선까지의 수직 거리 (2D). */
function perpendicularDistance2D(point: Point3, lineA: Point3, lineB: Point3): number {
  const lineLength = distance2D(lineA, lineB);
  if (lineLength === 0) return 0;
  // 삼각형의 넓이 공식을 이용한 점-직선 거리.
  const cross = (lineB.x - lineA.x) * (lineA.y - point.y) - (lineA.x - point.x) * (lineB.y - lineA.y);
  return Math.abs(cross) / lineLength;
}

function landmarksToPoints(landmarks: NormalizedLandmark[], indices: readonly number[]): Point3[] {
  return indices.map((i) => at(landmarks, i));
}

// ============================================================================
// 얼굴 스케일 기준값 (모든 비율 계산의 분모로 사용)
// ============================================================================

interface FaceScale {
  faceWidth: number;
  faceHeight: number;
  interocularDistance: number;
}

function getFaceScale(landmarks: NormalizedLandmark[]): FaceScale {
  const faceWidth = distance2D(at(landmarks, LM.faceRightEdge), at(landmarks, LM.faceLeftEdge));
  const faceHeight = distance2D(at(landmarks, LM.foreheadTop), at(landmarks, LM.chin));
  const interocularDistance = distance2D(at(landmarks, LM.rightEyeInner), at(landmarks, LM.leftEyeInner));
  return { faceWidth, faceHeight, interocularDistance };
}

// ============================================================================
// 1. 이마
// ============================================================================

export type ForeheadShape = "넓다" | "좁다" | "둥글다" | "각지다";

export interface ForeheadAnalysis {
  shape: ForeheadShape;
  widthRatio: number;
  heightRatio: number;
}

export function analyzeForehead(landmarks: NormalizedLandmark[]): ForeheadAnalysis {
  const { faceWidth, faceHeight } = getFaceScale(landmarks);

  const foreheadWidth = distance2D(at(landmarks, LM.templeRight), at(landmarks, LM.templeLeft));
  const eyebrowLine = midpoint(at(landmarks, LM.rightEyebrowPeak), at(landmarks, LM.leftEyebrowPeak));
  const foreheadHeight = distance2D(at(landmarks, LM.foreheadTop), eyebrowLine);

  const widthRatio = foreheadWidth / faceWidth;
  const heightRatio = foreheadHeight / faceHeight;

  let shape: ForeheadShape;
  if (widthRatio >= THRESHOLDS.foreheadWide) {
    shape = "넓다";
  } else if (widthRatio <= THRESHOLDS.foreheadNarrow) {
    shape = "좁다";
  } else {
    // 폭이 중간 범위면 이마 높이 비율로 각짐/둥긂을 근사한다.
    shape = heightRatio >= THRESHOLDS.foreheadTallForRound ? "각지다" : "둥글다";
  }

  return { shape, widthRatio, heightRatio };
}

// ============================================================================
// 2. 눈
// ============================================================================

export type EyeSize = "크다" | "작다";
export type EyeTilt = "처졌다" | "올라갔다";
export type EyelidType = "쌍꺼풀" | "무쌍꺼풀" | "판단 어려움";

export interface EyeAnalysis {
  size: EyeSize;
  tilt: EyeTilt;
  eyelid: EyelidType;
  eyelidConfidence: "low" | "high";
  aspectRatio: number;
  tiltRatio: number;
}

export function analyzeEyes(landmarks: NormalizedLandmark[]): EyeAnalysis {
  const rightOuter = at(landmarks, LM.rightEyeOuter);
  const rightInner = at(landmarks, LM.rightEyeInner);
  const rightTop = at(landmarks, LM.rightEyeTop);
  const rightBottom = at(landmarks, LM.rightEyeBottom);
  const leftOuter = at(landmarks, LM.leftEyeOuter);
  const leftInner = at(landmarks, LM.leftEyeInner);
  const leftTop = at(landmarks, LM.leftEyeTop);
  const leftBottom = at(landmarks, LM.leftEyeBottom);

  const rightWidth = distance2D(rightOuter, rightInner);
  const leftWidth = distance2D(leftOuter, leftInner);
  const rightHeight = distance2D(rightTop, rightBottom);
  const leftHeight = distance2D(leftTop, leftBottom);

  // 눈 가로/세로 비율(세로/가로)이 클수록 눈이 둥글고 크게 보인다.
  const aspectRatio = average([rightHeight / rightWidth, leftHeight / leftWidth]);
  const size: EyeSize = aspectRatio >= THRESHOLDS.eyeBigAspect ? "크다" : "작다";

  // 눈꼬리 각도(canthal tilt): 눈 바깥쪽 끝이 안쪽 끝보다 위에 있으면(y가 작으면) 올라간 눈매다.
  const rightTiltRatio = (rightInner.y - rightOuter.y) / rightWidth;
  const leftTiltRatio = (leftInner.y - leftOuter.y) / leftWidth;
  const tiltRatio = average([rightTiltRatio, leftTiltRatio]);
  const tilt: EyeTilt = tiltRatio >= 0 ? "올라갔다" : "처졌다";

  // 쌍꺼풀: 468개 기본 메쉬에는 눈꺼풀 주름을 직접 가리키는 랜드마크가 없다.
  // 눈썹 하단~눈 상단 사이 간격(미간 대비 정규화)을 약한 대리 지표로만 사용하고,
  // 애매한 구간은 항상 "판단 어려움"으로 돌려보내 과신을 피한다.
  const rightBrowGap = distance2D(midpoint(at(landmarks, LM.rightEyebrowInner), at(landmarks, LM.rightEyebrowPeak)), rightTop);
  const leftBrowGap = distance2D(midpoint(at(landmarks, LM.leftEyebrowInner), at(landmarks, LM.leftEyebrowPeak)), leftTop);
  const { interocularDistance } = getFaceScale(landmarks);
  const browGapRatio = average([rightBrowGap, leftBrowGap]) / interocularDistance;

  let eyelid: EyelidType;
  let eyelidConfidence: "low" | "high";
  if (browGapRatio <= THRESHOLDS.eyelidGapLowerBound) {
    eyelid = "무쌍꺼풀";
    eyelidConfidence = "low";
  } else if (browGapRatio >= THRESHOLDS.eyelidGapUpperBound) {
    eyelid = "쌍꺼풀";
    eyelidConfidence = "low";
  } else {
    eyelid = "판단 어려움";
    eyelidConfidence = "low";
  }

  return { size, tilt, eyelid, eyelidConfidence, aspectRatio, tiltRatio };
}

// ============================================================================
// 3. 코
// ============================================================================

export type NoseBridgeHeight = "높다" | "낮다";
export type NoseTipShape = "둥글다" | "뾰족하다";

export interface NoseAnalysis {
  bridgeHeight: NoseBridgeHeight;
  tipShape: NoseTipShape;
  bridgeProminenceRatio: number;
  tipAngleDeg: number;
}

export function analyzeNose(landmarks: NormalizedLandmark[]): NoseAnalysis {
  const { interocularDistance } = getFaceScale(landmarks);

  // z는 값이 작을수록 카메라에 더 가깝다(더 튀어나와 있다). 눈 안쪽 모서리 평면을
  // 기준면으로 삼아, 콧대가 그보다 얼마나 카메라 쪽으로 나와 있는지를 비율로 본다.
  const eyePlaneZ = average([at(landmarks, LM.rightEyeInner).z, at(landmarks, LM.leftEyeInner).z]);
  const bridgeZ = at(landmarks, LM.noseBridgeTop).z;
  const bridgeProminenceRatio = (eyePlaneZ - bridgeZ) / interocularDistance;
  const bridgeHeight: NoseBridgeHeight =
    bridgeProminenceRatio >= THRESHOLDS.noseBridgeHighRatio ? "높다" : "낮다";

  // 코끝 각도: 코끝을 꼭짓점으로 양쪽 콧볼까지의 3D 각도가 좁을수록(뾰족할수록) 예리한 코끝이다.
  const tipAngleDeg = angleAtVertexDeg(
    at(landmarks, LM.noseTip),
    at(landmarks, LM.rightNostrilOuter),
    at(landmarks, LM.leftNostrilOuter),
    true,
  );
  const tipShape: NoseTipShape = tipAngleDeg <= THRESHOLDS.noseTipSharpDeg ? "뾰족하다" : "둥글다";

  return { bridgeHeight, tipShape, bridgeProminenceRatio, tipAngleDeg };
}

// ============================================================================
// 4. 입 / 입술
// ============================================================================

export type LipThickness = "두껍다" | "얇다";
export type MouthSize = "크다" | "작다";

export interface MouthAnalysis {
  lipThickness: LipThickness;
  mouthSize: MouthSize;
  lipThicknessRatio: number;
  mouthWidthRatio: number;
}

export function analyzeMouth(landmarks: NormalizedLandmark[]): MouthAnalysis {
  const { faceWidth } = getFaceScale(landmarks);

  const mouthWidth = distance2D(at(landmarks, LM.mouthRightCorner), at(landmarks, LM.mouthLeftCorner));
  const upperLipThickness = distance2D(at(landmarks, LM.upperLipOuterTop), at(landmarks, LM.upperLipInnerBottom));
  const lowerLipThickness = distance2D(at(landmarks, LM.lowerLipInnerTop), at(landmarks, LM.lowerLipOuterBottom));

  const lipThicknessRatio = (upperLipThickness + lowerLipThickness) / mouthWidth;
  const mouthWidthRatio = mouthWidth / faceWidth;

  const lipThickness: LipThickness = lipThicknessRatio >= THRESHOLDS.lipThickRatio ? "두껍다" : "얇다";
  const mouthSize: MouthSize = mouthWidthRatio >= THRESHOLDS.mouthWideRatio ? "크다" : "작다";

  return { lipThickness, mouthSize, lipThicknessRatio, mouthWidthRatio };
}

// ============================================================================
// 5. 턱
// ============================================================================

export type JawShape = "각지다" | "둥글다" | "뾰족하다";

export interface ChinAnalysis {
  jawShape: JawShape;
  doubleChin: "있음" | "없음";
  doubleChinConfidence: "low" | "high";
  chinTipAngleDeg: number;
  jawCornerAngleDeg: number;
}

export function analyzeChin(landmarks: NormalizedLandmark[]): ChinAnalysis {
  const chin = at(landmarks, LM.chin);
  const jawRight = at(landmarks, LM.jawRightCorner);
  const jawLeft = at(landmarks, LM.jawLeftCorner);

  // 턱끝 각도: 턱끝을 꼭짓점으로 양쪽 턱 모서리까지의 각도가 좁을수록 뾰족한(V라인) 턱이다.
  const chinTipAngleDeg = angleAtVertexDeg(chin, jawRight, jawLeft, false);

  // 턱 모서리(하악각)의 국소 곡률: 뺨 옆(faceRightEdge/faceLeftEdge)에서 턱까지 이어지는
  // 윤곽선이 jawRight/jawLeft 지점에서 얼마나 꺾이는지를 본다. 각도가 180°에 가까우면
  // (거의 안 꺾이면) 완만하게 이어지는 둥근 턱, 확 꺾이면(각도가 작으면) 각진 턱이다.
  const rightCornerAngle = angleAtVertexDeg(jawRight, at(landmarks, LM.faceRightEdge), chin, false);
  const leftCornerAngle = angleAtVertexDeg(jawLeft, at(landmarks, LM.faceLeftEdge), chin, false);
  const jawCornerAngleDeg = average([rightCornerAngle, leftCornerAngle]);

  const jawShape: JawShape =
    chinTipAngleDeg <= THRESHOLDS.chinPointedDeg
      ? "뾰족하다"
      : jawCornerAngleDeg <= THRESHOLDS.chinSquareDeg
        ? "각지다"
        : "둥글다";

  // 이중턱: FaceLandmarker의 기본 얼굴 메쉬에는 목 랜드마크가 없어 "목-턱 거리"를 직접
  // 잴 수 없다. 대신 코 밑~턱 끝(하안면) 길이가 얼굴 전체 높이에 비해 유난히 짧은지를
  // 약한 대리 지표로 쓴다 - 정확도가 낮으므로 confidence를 항상 "low"로 표시한다.
  const { faceHeight } = getFaceScale(landmarks);
  const lowerFaceRatio = distance2D(at(landmarks, LM.noseTip), chin) / faceHeight;
  const doubleChin = lowerFaceRatio <= THRESHOLDS.doubleChinLowerFaceRatio ? "있음" : "없음";

  return {
    jawShape,
    doubleChin,
    doubleChinConfidence: "low",
    chinTipAngleDeg,
    jawCornerAngleDeg,
  };
}

// ============================================================================
// 픽셀 샘플링 유틸리티 (눈썹 짙기 / 안색 판정에 공용으로 사용)
// ============================================================================

interface RgbSample {
  r: number;
  g: number;
  b: number;
}

function getPixel(imageData: ImageData, x: number, y: number): RgbSample {
  const clampedX = Math.min(Math.max(Math.round(x), 0), imageData.width - 1);
  const clampedY = Math.min(Math.max(Math.round(y), 0), imageData.height - 1);
  const index = (clampedY * imageData.width + clampedX) * 4;
  const d = imageData.data;
  return { r: d[index], g: d[index + 1], b: d[index + 2] };
}

function luminance({ r, g, b }: RgbSample): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function toPixel(point: Point3, imageData: ImageData): { x: number; y: number } {
  return { x: point.x * imageData.width, y: point.y * imageData.height };
}

interface PixelBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

function boundingBoxOf(points: { x: number; y: number }[], marginRatio: number): PixelBox {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const marginX = (maxX - minX) * marginRatio;
  const marginY = (maxY - minY) * marginRatio;
  return { minX: minX - marginX, maxX: maxX + marginX, minY: minY - marginY, maxY: maxY + marginY };
}

interface RegionStats {
  avgR: number;
  avgG: number;
  avgB: number;
  avgLuminance: number;
  maxLuminance: number;
  darkPixelRatio: (threshold: number) => number;
}

/** box 영역 안의 픽셀을 일정 간격(step)으로 훑어 평균 색상/밝기 통계를 낸다. */
function sampleRegionStats(imageData: ImageData, box: PixelBox, step = 2): RegionStats {
  const samples: RgbSample[] = [];
  const minX = Math.max(0, Math.floor(box.minX));
  const maxX = Math.min(imageData.width - 1, Math.ceil(box.maxX));
  const minY = Math.max(0, Math.floor(box.minY));
  const maxY = Math.min(imageData.height - 1, Math.ceil(box.maxY));

  for (let y = minY; y <= maxY; y += step) {
    for (let x = minX; x <= maxX; x += step) {
      samples.push(getPixel(imageData, x, y));
    }
  }

  if (samples.length === 0) {
    return { avgR: 0, avgG: 0, avgB: 0, avgLuminance: 0, maxLuminance: 0, darkPixelRatio: () => 0 };
  }

  const luminances = samples.map(luminance);
  const avgR = average(samples.map((s) => s.r));
  const avgG = average(samples.map((s) => s.g));
  const avgB = average(samples.map((s) => s.b));
  const avgLuminance = average(luminances);
  const maxLuminance = Math.max(...luminances);

  return {
    avgR,
    avgG,
    avgB,
    avgLuminance,
    maxLuminance,
    darkPixelRatio: (threshold: number) => luminances.filter((l) => l < threshold).length / luminances.length,
  };
}

// ============================================================================
// 6. 눈썹 (랜드마크 각도 + Canvas 픽셀 분석)
// ============================================================================

export type EyebrowThickness = "짙다" | "옅다";
export type EyebrowShape = "일자형" | "아치형";

export interface EyebrowAnalysis {
  thickness: EyebrowThickness;
  shape: EyebrowShape;
  darkPixelRatio: number;
  archDeviationRatio: number;
}

export function analyzeEyebrows(landmarks: NormalizedLandmark[], imageData: ImageData): EyebrowAnalysis {
  // --- 모양(일자형/아치형): 눈썹 안쪽-바깥쪽을 잇는 직선에서 정점(peak)이 얼마나 벗어나는지 ---
  const rightInner = at(landmarks, LM.rightEyebrowInner);
  const rightPeak = at(landmarks, LM.rightEyebrowPeak);
  const rightOuter = at(landmarks, LM.rightEyebrowOuter);
  const leftInner = at(landmarks, LM.leftEyebrowInner);
  const leftPeak = at(landmarks, LM.leftEyebrowPeak);
  const leftOuter = at(landmarks, LM.leftEyebrowOuter);

  const rightBrowLength = distance2D(rightInner, rightOuter);
  const leftBrowLength = distance2D(leftInner, leftOuter);
  const rightArchDeviation = perpendicularDistance2D(rightPeak, rightInner, rightOuter) / rightBrowLength;
  const leftArchDeviation = perpendicularDistance2D(leftPeak, leftInner, leftOuter) / leftBrowLength;
  const archDeviationRatio = average([rightArchDeviation, leftArchDeviation]);
  const shape: EyebrowShape = archDeviationRatio >= THRESHOLDS.eyebrowArchRatio ? "아치형" : "일자형";

  // --- 짙기(짙다/옅다): 눈썹 영역을 크롭해 피부(눈썹 바로 위 이마) 대비 어두운 픽셀 비율로 근사 ---
  const rightRegionPoints = landmarksToPoints(landmarks, LM.rightEyebrowRegion).map((p) => toPixel(p, imageData));
  const leftRegionPoints = landmarksToPoints(landmarks, LM.leftEyebrowRegion).map((p) => toPixel(p, imageData));
  const rightBox = boundingBoxOf(rightRegionPoints, 0.15);
  const leftBox = boundingBoxOf(leftRegionPoints, 0.15);

  const browHeightPx = Math.max(rightBox.maxY - rightBox.minY, leftBox.maxY - leftBox.minY, 1);
  // 눈썹 바로 위(이마 쪽)로 눈썹 높이만큼 이동한 영역을 피부 기준(baseline)으로 삼는다.
  const rightSkinBox: PixelBox = {
    minX: rightBox.minX,
    maxX: rightBox.maxX,
    minY: rightBox.minY - browHeightPx * 1.2,
    maxY: rightBox.minY - browHeightPx * 0.2,
  };
  const leftSkinBox: PixelBox = {
    minX: leftBox.minX,
    maxX: leftBox.maxX,
    minY: leftBox.minY - browHeightPx * 1.2,
    maxY: leftBox.minY - browHeightPx * 0.2,
  };

  const rightBrowStats = sampleRegionStats(imageData, rightBox);
  const leftBrowStats = sampleRegionStats(imageData, leftBox);
  const rightSkinStats = sampleRegionStats(imageData, rightSkinBox);
  const leftSkinStats = sampleRegionStats(imageData, leftSkinBox);

  const skinBaselineLuminance = average([rightSkinStats.avgLuminance, leftSkinStats.avgLuminance]);
  // 피부 기준보다 눈에 띄게 어두운(약 20% 이상 어두운) 픽셀만 "눈썹 털"로 센다.
  const darkThreshold = skinBaselineLuminance * 0.8;
  const darkPixelRatio = average([
    rightBrowStats.darkPixelRatio(darkThreshold),
    leftBrowStats.darkPixelRatio(darkThreshold),
  ]);
  const thickness: EyebrowThickness =
    darkPixelRatio >= THRESHOLDS.eyebrowDarkPixelRatio ? "짙다" : "옅다";

  return { thickness, shape, darkPixelRatio, archDeviationRatio };
}

// ============================================================================
// 7. 안색 (혈색) - Canvas 픽셀 분석
// ============================================================================

export type ComplexionTone = "밝다" | "붉은기 있음" | "창백함" | "윤기 있음";

export interface ComplexionAnalysis {
  tone: ComplexionTone;
  brightness: number;
  redness: number;
  saturation: number;
  glowScore: number;
}

export function analyzeComplexion(landmarks: NormalizedLandmark[], imageData: ImageData): ComplexionAnalysis {
  const rightCheekPx = toPixel(at(landmarks, LM.rightCheek), imageData);
  const leftCheekPx = toPixel(at(landmarks, LM.leftCheek), imageData);
  const foreheadPx = toPixel(midpoint(at(landmarks, LM.glabella), at(landmarks, LM.foreheadTop)), imageData);
  const { faceWidth } = getFaceScale(landmarks);
  const sampleRadius = faceWidth * imageData.width * 0.06;

  const regions: PixelBox[] = [rightCheekPx, leftCheekPx, foreheadPx].map((center) => ({
    minX: center.x - sampleRadius,
    maxX: center.x + sampleRadius,
    minY: center.y - sampleRadius,
    maxY: center.y + sampleRadius,
  }));

  const stats = regions.map((box) => sampleRegionStats(imageData, box));
  const avgR = average(stats.map((s) => s.avgR));
  const avgG = average(stats.map((s) => s.avgG));
  const avgB = average(stats.map((s) => s.avgB));
  const brightness = average(stats.map((s) => s.avgLuminance));
  const maxBrightness = Math.max(...stats.map((s) => s.maxLuminance));
  const glowScore = maxBrightness - brightness;

  const redness = avgR - (avgG + avgB) / 2;
  const maxChannel = Math.max(avgR, avgG, avgB);
  const minChannel = Math.min(avgR, avgG, avgB);
  const saturation = maxChannel === 0 ? 0 : (maxChannel - minChannel) / maxChannel;

  let tone: ComplexionTone;
  if (glowScore >= THRESHOLDS.complexionGlowScore) {
    tone = "윤기 있음";
  } else if (redness >= THRESHOLDS.complexionRedness) {
    tone = "붉은기 있음";
  } else if (brightness < THRESHOLDS.complexionBrightThreshold || saturation < THRESHOLDS.complexionLowSaturation) {
    tone = "창백함";
  } else {
    tone = "밝다";
  }

  return { tone, brightness, redness, saturation, glowScore };
}

// ============================================================================
// 종합
// ============================================================================

export interface GwansangGeometryAnalysis {
  forehead: ForeheadAnalysis;
  eyes: EyeAnalysis;
  nose: NoseAnalysis;
  mouth: MouthAnalysis;
  chin: ChinAnalysis;
  eyebrows: EyebrowAnalysis;
  complexion: ComplexionAnalysis;
}

/**
 * 478개 랜드마크(단일 얼굴)와 원본 이미지 픽셀 데이터를 받아 7개 부위를 모두 분석한다.
 * 얼굴 검출 자체의 성공/실패(없음/여러 명)는 이 함수의 책임이 아니다 - 그건 랜드마크를
 * 추출하는 단계(face-landmarker.ts의 extractFaceLandmarks)에서 이미 걸러진다.
 */
export function analyzeFaceGeometry(
  landmarks: NormalizedLandmark[],
  imageData: ImageData,
): GwansangGeometryAnalysis {
  if (landmarks.length < 468) {
    throw new Error(
      `유효한 얼굴 랜드마크가 아닙니다 (기대: 468개 이상, 실제: ${landmarks.length}개). ` +
        "얼굴이 없거나 여러 명인 사진은 face-landmarker.ts의 extractFaceLandmarks에서 먼저 걸러야 합니다.",
    );
  }

  return {
    forehead: analyzeForehead(landmarks),
    eyes: analyzeEyes(landmarks),
    nose: analyzeNose(landmarks),
    mouth: analyzeMouth(landmarks),
    chin: analyzeChin(landmarks),
    eyebrows: analyzeEyebrows(landmarks, imageData),
    complexion: analyzeComplexion(landmarks, imageData),
  };
}
