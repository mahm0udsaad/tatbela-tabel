export type OfferImage = {
  id: string
  image_url: string
  is_primary: boolean
  sort_order?: number | null
}

export type OfferVariant = {
  id: string
  sku: string | null
  weight: number | null
  size: string | null
  variant_type: string | null
  price: number | null
  stock: number
}

export type Offer = {
  id: string
  name_ar: string
  description_ar: string | null
  brand: string
  type: string | null
  price: number
  price_per_kilo?: number | null
  pricing_mode?: "unit" | "per_kilo" | null
  original_price: number | null
  stock: number
  is_featured: boolean
  sort_order: number | null
  offer_images: OfferImage[] | null
  offer_variants: OfferVariant[] | null
}

export type OfferFormState = {
  id?: string
  name_ar: string
  description_ar: string
  brand: string
  type: string
  price: string
  price_per_kilo: string
  pricing_mode: "unit" | "per_kilo"
  original_price: string
  stock: string
  is_featured: boolean
}

export type WeightUnit = "g" | "kg"

export type VariantFormState = {
  id?: string
  sku: string
  weight: string
  weight_unit: WeightUnit
  size: string
  variant_type: string
  price: string
  stock: string
}

export type CropFileState = { file: File; src: string } | null

export const emptyOfferForm: OfferFormState = {
  name_ar: "",
  description_ar: "",
  brand: "",
  type: "",
  price: "",
  price_per_kilo: "",
  pricing_mode: "unit",
  original_price: "",
  stock: "",
  is_featured: false,
}

export const emptyVariantForm: VariantFormState = {
  sku: "",
  weight: "",
  weight_unit: "g",
  size: "",
  variant_type: "",
  price: "",
  stock: "",
}

export function mapOfferToForm(offer: Offer): OfferFormState {
  return {
    id: offer.id,
    name_ar: offer.name_ar ?? "",
    description_ar: offer.description_ar ?? "",
    brand: offer.brand ?? "",
    type: offer.type ?? "",
    price: offer.price?.toString() ?? "",
    price_per_kilo: offer.price_per_kilo?.toString() ?? "",
    pricing_mode: (offer.pricing_mode as "unit" | "per_kilo") ?? "unit",
    original_price: offer.original_price?.toString() ?? "",
    stock: offer.stock?.toString() ?? "",
    is_featured: Boolean(offer.is_featured),
  }
}

export function formatCurrency(value: number | null) {
  if (value === null || Number.isNaN(value)) return "-"
  return `${value.toFixed(2)} ج.م`
}

