const MAX_EDGE = 1600;
const TARGET_MAX = 500_000;

export async function compressHomeworkPhoto(file: File) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not prepare the photo");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  let quality = 0.82;
  let blob = await canvasToJpeg(canvas, quality);
  while (blob.size > TARGET_MAX && quality > 0.4) {
    quality -= 0.08;
    blob = await canvasToJpeg(canvas, quality);
  }
  return blob;
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not compress the photo"))),
      "image/jpeg",
      quality,
    );
  });
}
