"use client";

import { FaceLandmarker, FilesetResolver, type NormalizedLandmark } from "@mediapipe/tasks-vision";

/**
 * @mediapipe/tasks-vision의 WASM 런타임을 내려받는 CDN 경로.
 * package.json에 고정된 @mediapipe/tasks-vision 버전과 반드시 맞춰야 한다
 * (패키지를 업데이트하면 이 상수도 같은 버전으로 함께 올려야 한다).
 */
const WASM_BASE_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";

/** Google이 배포하는 FaceLandmarker 공식 모델 자산(약 3.6MB, float16). */
const MODEL_ASSET_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task";

/**
 * 한 장의 사진에서 감지를 시도할 최대 얼굴 수.
 * "여러 명이 감지되었는지"를 구분하려면 1보다 커야 한다 - 1로 두면 얼굴이 여럿이어도
 * 모델이 가장 확실한 한 명만 돌려주기 때문에 다중 얼굴 여부를 판별할 수 없다.
 */
const MAX_FACES_TO_DETECT = 5;

let landmarkerPromise: Promise<FaceLandmarker> | null = null;

/** FaceLandmarker 인스턴스를 지연 생성하고 캐싱한다(최초 1회만 모델을 내려받는다). */
function loadFaceLandmarker(): Promise<FaceLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = FilesetResolver.forVisionTasks(WASM_BASE_URL).then((vision) =>
      FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_ASSET_URL,
          delegate: "GPU",
        },
        runningMode: "IMAGE",
        numFaces: MAX_FACES_TO_DETECT,
      }),
    );
    // 초기화 실패 시(네트워크 오류 등) 다음 호출에서 다시 시도할 수 있도록 캐시를 비운다.
    landmarkerPromise.catch(() => {
      landmarkerPromise = null;
    });
  }
  return landmarkerPromise;
}

export type FaceLandmarkExtraction =
  | { status: "ok"; landmarks: NormalizedLandmark[] }
  | { status: "no_face" }
  | { status: "multiple_faces"; faceCount: number };

/**
 * 이미 디코딩된 이미지에서 얼굴 랜드마크(478개: 기본 메쉬 468 + 홍채 10)를 추출한다.
 * 얼굴이 하나도 없거나 둘 이상 감지되면 랜드마크 대신 그 사실을 담은 상태를 반환한다
 * (분석은 얼굴이 정확히 1명일 때만 의미가 있으므로, 호출부가 바로 예외 처리를 분기할 수 있게 한다).
 */
export async function extractFaceLandmarks(
  image: HTMLImageElement | ImageBitmap,
): Promise<FaceLandmarkExtraction> {
  const landmarker = await loadFaceLandmarker();
  const result = landmarker.detect(image);
  const faces = result.faceLandmarks;

  if (faces.length === 0) {
    return { status: "no_face" };
  }
  if (faces.length > 1) {
    return { status: "multiple_faces", faceCount: faces.length };
  }
  return { status: "ok", landmarks: faces[0] };
}

/** 업로드된 File(정적 이미지)을 디코딩된 HTMLImageElement로 로드한다. */
export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지를 불러오지 못했습니다."));
    };
    image.src = url;
  });
}

/**
 * 이미지 전체를 캔버스에 그려 픽셀 데이터를 얻는다.
 * 눈썹 짙기/안색처럼 좌표만으로는 판단할 수 없는 규칙(analyzer.ts)에서 사용한다.
 */
export function getImageData(image: HTMLImageElement): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("캔버스 컨텍스트를 생성하지 못했습니다.");
  }
  ctx.drawImage(image, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}
