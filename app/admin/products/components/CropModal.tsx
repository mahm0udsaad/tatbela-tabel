"use client"

import { useState, useEffect, useCallback } from "react"
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import { Loader2 } from "lucide-react"

type CropFileState = {
  file: File
  src: string
}

type CropModalProps = {
  cropFile: CropFileState
  crop: Crop
  onCropChange: (crop: Crop) => void
  onClose: () => void
  onConfirm: () => void
  isPending: boolean
  imageRef: React.MutableRefObject<HTMLImageElement | null>
}

// Helper to create centered crop with proper dimensions
function getCenterCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90, // Default to 90% of image width
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  )
}

export function CropModal({ 
  cropFile, 
  crop, 
  onCropChange, 
  onClose, 
  onConfirm, 
  isPending, 
  imageRef 
}: CropModalProps) {
  const [imgLoaded, setImgLoaded] = useState(false)

  // Reset loaded state when cropFile changes
  useEffect(() => {
    setImgLoaded(false)
  }, [cropFile?.src])

  // Handle image load - initialize default crop
  const handleImageReady = useCallback((img: HTMLImageElement) => {
    const { naturalWidth: width, naturalHeight: height } = img
    const defaultCrop = getCenterCrop(width, height, 1)
    onCropChange(defaultCrop)
    setImgLoaded(true)
  }, [onCropChange])

  // Callback ref to handle both initial load and cached images
  const setImageRef = useCallback((img: HTMLImageElement | null) => {
    imageRef.current = img
    if (img && img.complete && img.naturalWidth > 0 && !imgLoaded) {
      handleImageReady(img)
    }
  }, [imageRef, imgLoaded, handleImageReady])

  // Handle onLoad event for non-cached images
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (!imgLoaded) {
      handleImageReady(e.currentTarget)
    }
  }

  if (!cropFile) return null

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-[#2B2520]">قص الصورة</h3>
          <p className="text-sm text-[#8B6F47]">
            اسحب حواف المربع لتعديل منطقة القص. سيتم حفظ الصورة بنسبة 1:1 (مربع)
          </p>
        </div>
        
        <div className="rounded-2xl border border-dashed border-[#E8A835] bg-[#F5F1E8] p-4 max-h-[65vh] overflow-auto">
          <ReactCrop 
            crop={crop} 
            onChange={onCropChange}
            aspect={1} // 1:1 aspect ratio for consistent square images
            minWidth={100} // Minimum crop size
            minHeight={100}
            className="flex items-center justify-center"
          >
            <img 
              src={cropFile.src} 
              alt="قص الصورة" 
              ref={setImageRef}
              onLoad={onImageLoad}
              className="max-h-[60vh] w-full object-contain" 
            />
          </ReactCrop>
        </div>

        <div className="flex justify-end gap-3">
          <button 
            className="px-4 py-2 rounded-lg border border-[#D9D4C8] text-[#8B6F47] hover:bg-gray-50 transition-colors"
            onClick={onClose}
            disabled={isPending}
          >
            إلغاء
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-[#E8A835] text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:bg-[#d99a2e] transition-colors"
            onClick={onConfirm}
            disabled={isPending || !imgLoaded}
          >
            {isPending ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                جاري الحفظ...
              </>
            ) : (
              "حفظ الصورة"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}