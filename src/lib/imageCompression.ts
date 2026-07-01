export type ImageCompressionResult = {
  file: File
  originalBytes: number
  savedBytes: number
}

type CompressImageOptions = {
  maxDimension?: number
  quality?: number
}

const DEFAULT_MAX_DIMENSION = 1800
const DEFAULT_QUALITY = 0.78

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    const url = URL.createObjectURL(file)

    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo leer la imagen.'))
    }
    image.src = url
  })
}

function getTargetSize(width: number, height: number, maxDimension: number) {
  const largestSide = Math.max(width, height)

  if (largestSide <= maxDimension) {
    return { height, width }
  }

  const scale = maxDimension / largestSide
  return {
    height: Math.round(height * scale),
    width: Math.round(width * scale),
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('No se pudo comprimir la imagen.'))
        }
      },
      type,
      quality,
    )
  })
}

export async function compressImageFile(
  file: File,
  options: CompressImageOptions = {},
): Promise<ImageCompressionResult> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return { file, originalBytes: file.size, savedBytes: 0 }
  }

  const quality = options.quality ?? DEFAULT_QUALITY
  const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION
  const image = await loadImage(file)
  const target = getTargetSize(image.width, image.height, maxDimension)
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d', { alpha: true })

  if (!context) {
    return { file, originalBytes: file.size, savedBytes: 0 }
  }

  canvas.width = target.width
  canvas.height = target.height
  context.drawImage(image, 0, 0, target.width, target.height)

  const outputType =
    file.type === 'image/png' || file.type === 'image/webp'
      ? 'image/webp'
      : 'image/jpeg'
  const blob = await canvasToBlob(canvas, outputType, quality)

  if (blob.size >= file.size) {
    return { file, originalBytes: file.size, savedBytes: 0 }
  }

  const extension = outputType === 'image/webp' ? 'webp' : 'jpg'
  const compressedName = file.name.replace(/\.[^.]+$/, `.${extension}`)
  const compressedFile = new File([blob], compressedName, {
    lastModified: Date.now(),
    type: outputType,
  })

  return {
    file: compressedFile,
    originalBytes: file.size,
    savedBytes: file.size - blob.size,
  }
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}
