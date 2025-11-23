"use client"

import type { RefObject } from "react"
import ReactCrop, { type Crop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import { Loader2 } from "lucide-react"
import type { CropFileState } from "../types"

type CropModalProps = {
  cropFile: CropFileState
  crop: Crop
  onCropChange: (crop: Crop) => void
  onClose: () => void
  onConfirm: () => void
  isPending: boolean
  imageRef: RefObject<HTMLImageElement | null>
}

export function CropModal({ cropFile, crop, onCropChange, onClose, onConfirm, isPending, imageRef }: CropModalProps) {
  if (!cropFile) return null

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-[#2B2520]">قص الصورة</h3>
        <div className="rounded-2xl border border-dashed border-[#E8A835] bg-[#F5F1E8] p-4 max-h-[65vh] overflow-auto">
          <ReactCrop crop={crop} onChange={onCropChange} aspect={1} className="flex items-center justify-center">
            <img src={cropFile.src} alt="قص الصورة" ref={imageRef} className="max-h-[60vh] w-full object-contain" />
          </ReactCrop>
        </div>
        <div className="flex justify-end gap-3">
          <button className="px-4 py-2 rounded-lg border border-[#D9D4C8] text-[#8B6F47]" onClick={onClose}>
            إلغاء
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-[#E8A835] text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            onClick={onConfirm}
            disabled={isPending}
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
