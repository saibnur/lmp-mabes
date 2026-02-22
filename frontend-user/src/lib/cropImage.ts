export const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image()
        image.addEventListener('load', () => resolve(image))
        image.addEventListener('error', (error) => reject(error))
        image.setAttribute('crossOrigin', 'anonymous')
        image.src = url
    })

function getRadianAngle(degreeValue: number) {
    return (degreeValue * Math.PI) / 180
}

export default async function getCroppedImg(
    imageSrc: string,
    pixelCrop: { x: number; y: number; width: number; height: number },
    rotation = 0,
): Promise<File | null> {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
        return null
    }

    // calculate bounding box of the rotated image
    const boundingBox = {
        width: Math.abs(Math.cos(getRadianAngle(rotation)) * image.width) + Math.abs(Math.sin(getRadianAngle(rotation)) * image.height),
        height: Math.abs(Math.sin(getRadianAngle(rotation)) * image.width) + Math.abs(Math.cos(getRadianAngle(rotation)) * image.height),
    }

    canvas.width = boundingBox.width
    canvas.height = boundingBox.height

    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate(getRadianAngle(rotation))
    ctx.translate(-image.width / 2, -image.height / 2)

    ctx.drawImage(image, 0, 0)

    const croppedCanvas = document.createElement('canvas')
    const croppedCtx = croppedCanvas.getContext('2d')

    if (!croppedCtx) {
        return null
    }

    croppedCanvas.width = pixelCrop.width
    croppedCanvas.height = pixelCrop.height

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
    )

    return new Promise((resolve) => {
        croppedCanvas.toBlob((blob) => {
            if (!blob) {
                resolve(null);
                return;
            }
            resolve(new File([blob], 'cropped.jpg', { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.9);
    })
}
