// Phone photos are routinely 4-10 MB, over the API's 5 MB cap and far more
// pixels than a vision model needs to read a receipt. Shrink to a JPEG with
// a 1600px long edge; if the browser can't decode the file (e.g. HEIC on
// desktop Chrome), send the original and let the API judge it.
const MAX_EDGE = 1600;

export async function prepareReceiptImage(file: File): Promise<{ blob: Blob; name: string }> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (blob) return { blob, name: "receipt.jpg" };
  } catch {
    // fall through to the original file
  }
  return { blob: file, name: file.name };
}
