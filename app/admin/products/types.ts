export type ProductImage = {
  id: string
  image_url: string
  is_primary: boolean
  sort_order?: number | null
}

export type ProductVariant = {
  id: string
  sku: string | null
  weight: number | null
  size: string | null
  variant_type: string | null
  price: number | null
  stock: number
}

export type Product = {
  id: string
  name_ar: string
  description_ar: string | null
  brand: string
  category: string
  type: string
  price: number
  price_per_kilo?: number | null
  pricing_mode?: "unit" | "per_kilo" | null
  original_price: number | null
  stock: number
  is_featured: boolean
  is_b2b: boolean
  b2b_price_hidden?: boolean | null
  category_id: string | null
  sort_order: number | null
  product_images: ProductImage[] | null
  product_variants: ProductVariant[] | null
}

export type Category = {
  id: string
  name_ar: string
  parent_id: string | null
}

export type ProductFormState = {
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
  category_id: string
  is_featured: boolean
  is_b2b: boolean
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

export type CategoryOption = {
  label: string
  value: string
}

export type CropFileState = { file: File; src: string } | null

export const emptyProductForm: ProductFormState = {
  name_ar: "",
  description_ar: "",
  brand: "",
  type: "",
  price: "",
  price_per_kilo: "",
  pricing_mode: "unit",
  original_price: "",
  stock: "",
  category_id: "",
  is_featured: false,
  is_b2b: false,
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

export function mapProductToForm(product: Product): ProductFormState {
  return {
    id: product.id,
    name_ar: product.name_ar ?? "",
    description_ar: product.description_ar ?? "",
    brand: product.brand ?? "",
    type: product.category ?? product.type ?? "",
    price: product.price?.toString() ?? "",
    price_per_kilo: product.price_per_kilo?.toString() ?? "",
    pricing_mode: (product.pricing_mode as "unit" | "per_kilo") ?? "unit",
    original_price: product.original_price?.toString() ?? "",
    stock: product.stock?.toString() ?? "",
    category_id: product.category_id ?? "",
    is_featured: Boolean(product.is_featured),
    is_b2b: Boolean(product.is_b2b),
  }
}

export function formatCurrency(value: number | null) {
  if (value === null || Number.isNaN(value)) return "-"
  return `${value.toFixed(2)} ج.م`
}
