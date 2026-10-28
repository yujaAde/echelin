// 브라우저 전용: 업로드 전에 이미지를 줄여 JPEG 으로 변환한다.
// EXIF 회전 정보는 createImageBitmap 의 imageOrientation 옵션으로 반영한다.

export const MAX_IMAGE_EDGE = 1600;
export const JPEG_QUALITY = 0.85;
export const MAX_IMAGES_PER_POST = 10;

export async function resizeImage(
  file: File,
  maxEdge: number = MAX_IMAGE_EDGE,
  quality: number = JPEG_QUALITY,
): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("캔버스를 사용할 수 없는 브라우저입니다.");
    // PNG 투명 영역은 흰색으로
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob) throw new Error("이미지 변환에 실패했습니다.");
    return blob;
  } finally {
    bitmap.close();
  }
}

export function isSupportedImage(file: File): boolean {
  // HEIC 는 브라우저 캔버스가 디코딩하지 못한다. (iPhone 은 보통 선택 시 JPEG 으로 변환해 준다)
  return ["image/jpeg", "image/png", "image/webp"].includes(file.type);
}
