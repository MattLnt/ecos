'use client';

import type { ImageSegmenter } from '@mediapipe/tasks-vision';

/**
 * Détourage d'une photo de joueur : on ne garde que la personne.
 *
 * Les cartes de l'application fondent le portrait dans leur fond. Une photo
 * avec son décor de gymnase y apparaît comme un rectangle collé ; détourée,
 * elle s'y incruste. Le découpage se fait entièrement dans le navigateur, avec
 * le segmenteur « selfie » de MediaPipe — aucune image n'est envoyée ailleurs.
 *
 * Le modèle et son runtime sont chargés depuis un CDN au premier usage
 * seulement, puis gardés en mémoire pour les photos suivantes.
 */

const WASM_PATH = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.0/wasm';
const MODEL_PATH =
  'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite';

let segmenterPromise: Promise<ImageSegmenter> | null = null;

async function getSegmenter(): Promise<ImageSegmenter> {
  if (!segmenterPromise) {
    segmenterPromise = (async () => {
      const { FilesetResolver, ImageSegmenter } = await import('@mediapipe/tasks-vision');
      const fileset = await FilesetResolver.forVisionTasks(WASM_PATH);

      try {
        return await ImageSegmenter.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_PATH, delegate: 'GPU' },
          runningMode: 'IMAGE',
          outputCategoryMask: true,
          outputConfidenceMasks: false,
        });
      } catch {
        // Pas de WebGL utilisable (vieux téléphone, navigateur bridé) : le
        // calcul se fait sur le processeur, plus lentement mais sûrement.
        return ImageSegmenter.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_PATH, delegate: 'CPU' },
          runningMode: 'IMAGE',
          outputCategoryMask: true,
          outputConfidenceMasks: false,
        });
      }
    })().catch((error) => {
      // Un échec ne doit pas condamner les tentatives suivantes.
      segmenterPromise = null;
      throw error;
    });
  }

  return segmenterPromise;
}

/**
 * La catégorie « personne » n'a pas d'indice garanti selon les versions du
 * modèle. On regarde le centre de l'image : sur une photo de portrait, c'est
 * le sujet qui s'y trouve.
 */
function personCategory(mask: Uint8Array, width: number, height: number): number {
  const counts = new Map<number, number>();
  const x0 = Math.floor(width * 0.35);
  const x1 = Math.ceil(width * 0.65);
  const y0 = Math.floor(height * 0.3);
  const y1 = Math.ceil(height * 0.6);

  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const value = mask[y * width + x];
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }

  let best = 1;
  let bestCount = -1;
  counts.forEach((count, value) => {
    if (count > bestCount) {
      bestCount = count;
      best = value;
    }
  });

  return best;
}

export interface CutoutResult {
  /** La photo détourée, en PNG avec transparence. */
  dataUrl: string;
  /** Part de l'image conservée, entre 0 et 1. Sert à flairer un ratage. */
  coverage: number;
}

/**
 * Retire le fond d'une image carrée déjà recadrée.
 *
 * Lève une erreur si le modèle est injoignable : l'appelant retombe alors sur
 * la photo d'origine plutôt que de bloquer l'enregistrement.
 */
export async function removeBackground(source: HTMLCanvasElement): Promise<CutoutResult> {
  const segmenter = await getSegmenter();
  const size = source.width;

  const result = segmenter.segment(source);
  const categoryMask = result.categoryMask;
  if (!categoryMask) {
    result.close();
    throw new Error('Segmentation sans masque');
  }

  const maskWidth = categoryMask.width;
  const maskHeight = categoryMask.height;
  const mask = categoryMask.getAsUint8Array();
  const person = personCategory(mask, maskWidth, maskHeight);

  /*
    Le masque sort à la résolution du modèle (plus petite que la photo). On le
    peint à sa taille, puis on l'étire à celle de la photo en laissant le
    navigateur interpoler : le lissage adoucit les bords du découpage, qui
    seraient sinon en escalier.
  */
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = maskWidth;
  maskCanvas.height = maskHeight;
  const maskCtx = maskCanvas.getContext('2d');

  const scaledCanvas = document.createElement('canvas');
  scaledCanvas.width = size;
  scaledCanvas.height = size;
  const scaledCtx = scaledCanvas.getContext('2d');

  const sourceCtx = source.getContext('2d');
  if (!maskCtx || !scaledCtx || !sourceCtx) {
    result.close();
    throw new Error('Canvas indisponible');
  }

  const maskImage = maskCtx.createImageData(maskWidth, maskHeight);
  for (let i = 0; i < mask.length; i += 1) {
    const value = mask[i] === person ? 255 : 0;
    const offset = i * 4;
    maskImage.data[offset] = 255;
    maskImage.data[offset + 1] = 255;
    maskImage.data[offset + 2] = 255;
    maskImage.data[offset + 3] = value;
  }
  maskCtx.putImageData(maskImage, 0, 0);

  scaledCtx.imageSmoothingEnabled = true;
  scaledCtx.imageSmoothingQuality = 'high';
  scaledCtx.drawImage(maskCanvas, 0, 0, size, size);

  const photo = sourceCtx.getImageData(0, 0, size, size);
  const scaled = scaledCtx.getImageData(0, 0, size, size);

  let kept = 0;
  for (let i = 3; i < photo.data.length; i += 4) {
    const alpha = scaled.data[i];
    photo.data[i] = alpha;
    if (alpha > 127) kept += 1;
  }

  const output = document.createElement('canvas');
  output.width = size;
  output.height = size;
  const outputCtx = output.getContext('2d');
  if (!outputCtx) {
    result.close();
    throw new Error('Canvas indisponible');
  }
  outputCtx.putImageData(photo, 0, 0);

  result.close();

  return {
    dataUrl: output.toDataURL('image/png'),
    coverage: kept / (size * size),
  };
}
