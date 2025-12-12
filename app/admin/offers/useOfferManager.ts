"use client"

import type { ChangeEvent } from "react"
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react"
import type { Crop } from "react-image-crop"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  deleteOfferAction,
  deleteOfferImageAction,
  deleteOfferVariantAction,
  setPrimaryOfferImageAction,
  uploadOfferImageAction,
  upsertOfferAction,
  upsertOfferVariantAction,
} from "./actions"
import { useToast } from "@/hooks/use-toast"
import {
  type Offer,
  type OfferVariant,
  type OfferFormState,
  type VariantFormState,
  type WeightUnit,
  emptyOfferForm,
  emptyVariantForm,
  mapOfferToForm,
  type CropFileState,
} from "./types"

export type UseOfferManagerArgs = {
  initialOffers: Offer[]
}

export function useOfferManager({ initialOffers }: UseOfferManagerArgs) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [offers, setOffers] = useState<Offer[]>(initialOffers ?? [])

  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null)
  const [offerForm, setOfferForm] = useState<OfferFormState>(emptyOfferForm)
  const [variantForm, setVariantForm] = useState<VariantFormState>(emptyVariantForm)
  const [variantOfferId, setVariantOfferId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [cropFile, setCropFile] = useState<CropFileState>(null)
  const [cropImageId, setCropImageId] = useState<string | null>(null)
  const [pendingImages, setPendingImages] = useState<{ id: string; file: File; src: string }[]>([])
  const [crop, setCrop] = useState<Crop>({ unit: "%", width: 60, height: 60, x: 20, y: 20 })
  const imageRef = useRef<HTMLImageElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isCreatingNewOffer, setIsCreatingNewOffer] = useState(false)
  const resetHandledKey = useRef<string | null>(null)

  const toGrams = (weight: string, unit: WeightUnit) => {
    const numericWeight = Number(weight)
    if (!Number.isFinite(numericWeight) || numericWeight <= 0) return null
    return unit === "kg" ? numericWeight * 1000 : numericWeight
  }

  const cleanDecimal = (value: number) => {
    return Number.parseFloat(value.toFixed(3)).toString()
  }

  const gramsToDisplayWeight = (grams: number | null): { weight: string; unit: WeightUnit } => {
    if (!grams || grams <= 0) return { weight: "", unit: "g" }
    if (grams >= 1000) {
      const kiloValue = grams / 1000
      return { weight: cleanDecimal(kiloValue), unit: "kg" }
    }
    return { weight: cleanDecimal(grams), unit: "g" }
  }

  const selectedOffer = useMemo(() => offers.find((offer) => offer.id === selectedOfferId) ?? null, [offers, selectedOfferId])

  useEffect(() => {
    setOffers(initialOffers ?? [])
  }, [initialOffers])

  const resetKey = searchParams.get("reset")

  useEffect(() => {
    if (resetKey && resetKey !== resetHandledKey.current) {
      setSelectedOfferId(null)
      setIsCreatingNewOffer(false)
      resetHandledKey.current = resetKey
      router.replace(pathname, { scroll: false })
    }
  }, [resetKey, router, pathname])

  useEffect(() => {
    if (selectedOffer) {
      setIsCreatingNewOffer(false)
      if (selectedOffer.id !== offerForm.id) {
        setOfferForm(mapOfferToForm(selectedOffer))
        setVariantOfferId(selectedOffer.id)
        setVariantForm(emptyVariantForm)
      }
    } else if (isCreatingNewOffer) {
      setOfferForm(emptyOfferForm)
      setVariantOfferId(null)
      setVariantForm(emptyVariantForm)
    }
  }, [selectedOffer, isCreatingNewOffer, offerForm.id])

  const startNewOffer = () => {
    setIsCreatingNewOffer(true)
    setSelectedOfferId(null)
    setOfferForm(emptyOfferForm)
    setVariantForm(emptyVariantForm)
    setVariantOfferId(null)
    setPendingImages([])
  }

  const selectOffer = (offer: Offer) => {
    setSelectedOfferId(offer.id)
    setOfferForm(mapOfferToForm(offer))
    setVariantOfferId(offer.id)
    setVariantForm(emptyVariantForm)
    setIsCreatingNewOffer(false)
    setPendingImages([])
  }

  const updateOfferFormField = (field: keyof OfferFormState, value: string | boolean) => {
    setOfferForm((prev) => ({ ...prev, [field]: value }))
  }

  const updateVariantField = (field: keyof VariantFormState, value: string) => {
    setVariantForm((prev) => {
      let nextState: VariantFormState = { ...prev, [field]: value } as VariantFormState

      if (field === "weight_unit") {
        const grams = toGrams(prev.weight, prev.weight_unit)
        if (grams) {
          nextState.weight = value === "kg" ? cleanDecimal(grams / 1000) : cleanDecimal(grams)
        }
      }

      if ((field === "weight" || field === "weight_unit") && offerForm.pricing_mode === "per_kilo") {
        const grams = toGrams(nextState.weight, nextState.weight_unit)
        const kiloPrice = Number(offerForm.price_per_kilo || offerForm.price)
        if (grams && Number.isFinite(kiloPrice) && kiloPrice > 0) {
          const computedPrice = ((grams / 1000) * kiloPrice).toFixed(2)
          nextState = { ...nextState, price: computedPrice }
        }
      }

      return nextState
    })
  }

  const submitOffer = () => {
    if (!offerForm.name_ar.trim()) {
      setErrorMessage("اسم العرض مطلوب")
      return
    }

    const pricingMode = (offerForm.pricing_mode as "unit" | "per_kilo") || "unit"
    const pricePerKilo = offerForm.price_per_kilo ? Number(offerForm.price_per_kilo) : null

    if (pricingMode === "per_kilo") {
      if (!pricePerKilo || Number.isNaN(pricePerKilo) || pricePerKilo <= 0) {
        setErrorMessage("يرجى إدخال سعر الكيلو")
        return
      }
      const variantsCount = selectedOffer?.offer_variants?.length ?? 0
      if (!isCreatingNewOffer && variantsCount === 0) {
        setErrorMessage("أضف متغيرات الأوزان المتاحة قبل الحفظ")
        return
      }
    }
    const fallbackPrice = Number(offerForm.price) || 0
    const priceValue =
      pricingMode === "per_kilo"
        ? (pricePerKilo ?? fallbackPrice)
        : fallbackPrice

    const payload = {
      id: offerForm.id,
      name_ar: offerForm.name_ar.trim(),
      description_ar: offerForm.description_ar.trim() || null,
      brand: offerForm.brand.trim(),
      type: offerForm.type.trim() || null,
      price: priceValue,
      price_per_kilo: pricePerKilo,
      pricing_mode: pricingMode,
      original_price: offerForm.original_price ? Number(offerForm.original_price) : null,
      stock: Number(offerForm.stock) || 0,
      is_featured: offerForm.is_featured,
    }

    startTransition(async () => {
      setStatusMessage(null)
      setErrorMessage(null)
      const result = await upsertOfferAction(payload)
      if (!result.success) {
        const message = result.error ?? "تعذر حفظ العرض"
        setErrorMessage(message)
        toast({ title: "خطأ في الحفظ", description: message, variant: "destructive" })
        return
      }
      setIsCreatingNewOffer(false)
      if (result.offerId) {
        // Upload pending images
        if (pendingImages.length > 0) {
          await Promise.all(pendingImages.map(async (img, index) => {
            const formData = new FormData()
            formData.append("offerId", result.offerId!)
            formData.append("isPrimary", index === 0 ? "true" : "false")
            formData.append("file", img.file)
            await uploadOfferImageAction(formData)
          }))
          setPendingImages([])
        }

        setSelectedOfferId(result.offerId)
        setVariantOfferId(result.offerId)
      }
      setStatusMessage("تم حفظ العرض بنجاح")
      toast({ title: "تم حفظ العرض", description: "تم تحديث بيانات العرض بنجاح" })
      router.refresh()
    })
  }

  const deleteOffer = (offerId: string) => {
    if (!confirm("هل ترغب في حذف هذا العرض؟")) return
    startTransition(async () => {
      const result = await deleteOfferAction(offerId)
      if (!result.success) {
        setErrorMessage(result.error ?? "تعذر حذف العرض")
        toast({ title: "خطأ", description: result.error ?? "تعذر حذف العرض", variant: "destructive" })
        return
      }
      
      if ('archived' in result && result.archived) {
        setStatusMessage(result.message ?? "تم أرشفة العرض")
        toast({ 
          title: "تم أرشفة العرض", 
          description: "تم أرشفة العرض بنجاح" 
        })
      } else {
        setStatusMessage("تم حذف العرض")
        toast({ title: "تم حذف العرض", description: "تم حذف العرض بنجاح" })
      }
      
      if (selectedOfferId === offerId) {
        setSelectedOfferId(null)
        setOfferForm(emptyOfferForm)
        setVariantOfferId(null)
        setVariantForm(emptyVariantForm)
      }
      router.refresh()
    })
  }

  const submitVariant = () => {
    if (!variantOfferId) {
      setErrorMessage("يرجى حفظ العرض أولاً")
      return
    }

    const grams = toGrams(variantForm.weight, variantForm.weight_unit)
    if (!grams) {
      setErrorMessage("يرجى إدخال الوزن")
      return
    }

    const pricingMode = offerForm.pricing_mode === "per_kilo"
    const kiloPrice = Number(offerForm.price_per_kilo || offerForm.price)
    const computedPrice = pricingMode && Number.isFinite(kiloPrice) && kiloPrice > 0
      ? (grams / 1000) * kiloPrice
      : variantForm.price ? Number(variantForm.price) : null

    const payload = {
      id: variantForm.id,
      offer_id: variantOfferId,
      sku: variantForm.sku.trim() || null,
      weight: grams,
      size: variantForm.size.trim() || null,
      variant_type: variantForm.variant_type.trim() || null,
      price: computedPrice,
      stock: Number(variantForm.stock) || 0,
    }

    startTransition(async () => {
      setErrorMessage(null)
      const result = await upsertOfferVariantAction(payload)
      if (!result.success) {
        setErrorMessage(result.error ?? "تعذر حفظ المتغير")
        toast({ title: "خطأ", description: result.error ?? "تعذر حفظ المتغير", variant: "destructive" })
        return
      }
      setVariantForm(emptyVariantForm)
      toast({ title: "تم الحفظ", description: "تم حفظ المتغير بنجاح" })
      router.refresh()
    })
  }

  const editVariant = (variant: OfferVariant) => {
    const { weight, unit } = gramsToDisplayWeight(variant.weight)
    setVariantForm({
      id: variant.id,
      sku: variant.sku ?? "",
      weight,
      weight_unit: unit,
      size: variant.size ?? "",
      variant_type: variant.variant_type ?? "",
      price: variant.price?.toString() ?? "",
      stock: variant.stock.toString(),
    })
  }

  const deleteVariant = (variantId: string) => {
    if (!confirm("هل ترغب في حذف هذا المتغير؟")) return
    startTransition(async () => {
      const result = await deleteOfferVariantAction(variantId)
      if (!result.success) {
        setErrorMessage(result.error ?? "تعذر حذف المتغير")
        toast({ title: "خطأ", description: result.error ?? "تعذر حذف المتغير", variant: "destructive" })
        return
      }
      toast({ title: "تم الحذف", description: "تم حذف المتغير بنجاح" })
      router.refresh()
    })
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const src = e.target?.result as string
      const id = crypto.randomUUID()
      setPendingImages((prev) => [...prev, { id, file, src }])
    }
    reader.readAsDataURL(file)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDeletePendingImage = (id: string) => {
    setPendingImages((prev) => prev.filter((img) => img.id !== id))
  }

  const triggerUpload = () => {
    fileInputRef.current?.click()
  }

  const handleSetPrimaryImage = (imageId: string) => {
    if (!selectedOfferId) return
    startTransition(async () => {
      const result = await setPrimaryOfferImageAction(imageId, selectedOfferId)
      if (!result.success) {
        toast({ title: "خطأ", description: result.error ?? "تعذر تعيين الصورة الرئيسية", variant: "destructive" })
        return
      }
      toast({ title: "تم التحديث", description: "تم تعيين الصورة الرئيسية" })
      router.refresh()
    })
  }

  const handleDeleteImage = (imageId: string) => {
    if (!confirm("هل ترغب في حذف هذه الصورة؟")) return
    startTransition(async () => {
      const result = await deleteOfferImageAction(imageId)
      if (!result.success) {
        toast({ title: "خطأ", description: result.error ?? "تعذر حذف الصورة", variant: "destructive" })
        return
      }
      toast({ title: "تم الحذف", description: "تم حذف الصورة بنجاح" })
      router.refresh()
    })
  }

  const openCropModal = (imageId: string, imageUrl: string) => {
    setCropImageId(imageId)
    setCropFile({ file: new File([], ""), src: imageUrl })
  }

  const closeCropModal = () => {
    setCropFile(null)
    setCropImageId(null)
  }

  const updateCrop = useCallback((newCrop: Crop) => {
    setCrop(newCrop)
  }, [])

  const confirmCrop = () => {
    // Crop functionality can be added later if needed
    closeCropModal()
  }

  return {
    offers,
    selectedOffer,
    selectedOfferId,
    offerForm,
    variantForm,
    statusMessage,
    errorMessage,
    cropFile,
    crop,
    pendingImages,
    imageRef,
    fileInputRef,
    isPending,
    isCreatingNewOffer,
    startNewOffer,
    selectOffer,
    updateOfferFormField,
    updateVariantField,
    submitOffer,
    deleteOffer,
    submitVariant,
    editVariant,
    deleteVariant,
    handleFileChange,
    handleDeletePendingImage,
    triggerUpload,
    handleSetPrimaryImage,
    handleDeleteImage,
    openCropModal,
    closeCropModal,
    updateCrop,
    confirmCrop,
  }
}

