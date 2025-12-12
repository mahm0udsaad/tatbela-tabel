"use client"

import type { ChangeEvent, RefObject } from "react"
import { UploadCloud, Crop as CropIcon } from "lucide-react"
import type { Offer } from "../types"

type OfferImagesCardProps = {
  selectedOffer: Offer | null
  fileInputRef: RefObject<HTMLInputElement | null>
  onUploadClick: () => void
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  onSetPrimary: (imageId: string) => void
  onDeleteImage: (imageId: string) => void
  pendingImages: { id: string; src: string }[]
  onDeletePending: (id: string) => void
  onCropImage: (imageId: string, imageUrl: string) => void
}

export function OfferImagesCard({
  selectedOffer,
  fileInputRef,
  onUploadClick,
  onFileChange,
  onSetPrimary,
  onDeleteImage,
  pendingImages,
  onDeletePending,
  onCropImage,
}: OfferImagesCardProps) {
  const hasImages = (selectedOffer?.offer_images?.length ?? 0) > 0 || pendingImages.length > 0

  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-4">
      <h2 className="text-xl font-bold text-[#2B2520] flex items-center gap-2">
        <UploadCloud size={18} /> صور العرض
      </h2>
      
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
      <button className="w-full border-2 border-dashed border-[#E8A835] rounded-xl py-6 text-[#8B6F47] hover:bg-[#F9F7F3]" onClick={onUploadClick}>
        اضغط لرفع صورة جديدة
      </button>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Existing Images */}
        {selectedOffer?.offer_images?.map((image) => (
          <div
            key={image.id}
            className="relative rounded-xl overflow-hidden border border-[#D9D4C8] bg-[#F5F1E8] flex items-center justify-center h-48 p-2 group"
          >
            <img src={image.image_url} alt={selectedOffer.name_ar} className="max-h-full max-w-full object-contain" loading="lazy" />
            <div className="absolute top-2 left-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <button className="px-2 py-1 text-xs bg-white/90 rounded-lg hover:bg-gray-100 flex items-center gap-1" onClick={() => onCropImage(image.id, image.image_url)}>
                <CropIcon size={12} /> قص
              </button>
              {!image.is_primary && (
                <button className="px-2 py-1 text-xs bg-white/90 rounded-lg hover:bg-gray-100" onClick={() => onSetPrimary(image.id)}>
                  تعيين كرئيسية
                </button>
              )}
              <button className="px-2 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600" onClick={() => onDeleteImage(image.id)}>
                حذف
              </button>
            </div>
            {image.is_primary && (
              <span className="absolute bottom-2 right-2 text-xs bg-[#E8A835] text-white px-2 py-1 rounded-lg">الصورة الرئيسية</span>
            )}
          </div>
        ))}

        {/* Pending Images */}
        {pendingImages.map((image) => (
          <div
            key={image.id}
            className="relative rounded-xl overflow-hidden border border-[#D9D4C8] bg-[#F5F1E8] flex items-center justify-center h-48 p-2 opacity-70"
          >
            <img src={image.src} alt="Pending upload" className="max-h-full max-w-full object-contain" />
            <div className="absolute inset-0 bg-black/10 flex items-center justify-center pointer-events-none">
                <span className="bg-white/80 px-2 py-1 rounded text-xs font-bold text-gray-700">قيد الانتظار...</span>
            </div>
            <div className="absolute top-2 left-2">
              <button className="px-2 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 pointer-events-auto" onClick={() => onDeletePending(image.id)}>
                حذف
              </button>
            </div>
          </div>
        ))}

        {!hasImages && (
           <div className="col-span-3 text-center text-[#8B6F47] py-6 border border-dashed rounded-xl">لا توجد صور مرفوعة بعد</div>
        )}
      </div>
    </div>
  )
}

