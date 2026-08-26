import { loadImageElement } from "./imageProcessor";

export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FlipState {
  horizontal: boolean;
  vertical: boolean;
}

export const createImage = (url: string): Promise<HTMLImageElement> => loadImageElement(url);

export function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

/**
 * Returns the new bounding area of a rotated rectangle.
 */
export function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

/**
 * Crops an image with support for rotation and flip transforms
 */
export default async function getCroppedImg(
  imageSrc: string,
  pixelCrop: PixelCrop,
  rotation = 0,
  flip: FlipState = { horizontal: false, vertical: false },
  format: "image/png" | "image/jpeg" | "image/webp" = "image/png",
  quality = 0.92
): Promise<{
  fileUrl: string;
  blob: Blob;
  width: number;
  height: number;
  size: number;
}> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  const rotRad = getRadianAngle(rotation);

  // calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  // set canvas size to match the bounding boxes
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // translate canvas context to a central location to allow rotating and flipping around the center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  ctx.translate(-image.width / 2, -image.height / 2);

  // draw rotated image
  ctx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement("canvas");
  const croppedCtx = croppedCanvas.getContext("2d");

  if (!croppedCtx) {
    throw new Error("No 2d context for crop canvas");
  }

  // Set the size of the cropped canvas
  croppedCanvas.width = Math.max(1, Math.round(pixelCrop.width));
  croppedCanvas.height = Math.max(1, Math.round(pixelCrop.height));

  // If format is JPEG, paint white background for transparent pixels
  if (format === "image/jpeg") {
    croppedCtx.fillStyle = "#FFFFFF";
    croppedCtx.fillRect(0, 0, croppedCanvas.width, croppedCanvas.height);
  }

  // Draw the cropped image onto the new canvas
  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Return as Blob & Object URL
  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        const fileUrl = URL.createObjectURL(blob);
        resolve({
          fileUrl,
          blob,
          width: croppedCanvas.width,
          height: croppedCanvas.height,
          size: blob.size,
        });
      },
      format,
      quality
    );
  });
}
