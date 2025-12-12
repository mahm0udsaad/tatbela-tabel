'use server'

import { createClient } from '@/lib/supabase/server'

export type Address = {
  id: string
  user_id: string
  label: string | null
  recipient_name: string | null
  phone: string | null
  governorate: string
  city: string
  street: string
  building: string | null
  apartment: string | null
  postal_code: string | null
  notes: string | null
  is_default: boolean
  created_at: string
  updated_at: string
}

export type AddressFormData = {
  label?: string | null
  recipient_name?: string | null
  phone?: string | null
  governorate: string
  city: string
  street: string
  building?: string | null
  apartment?: string | null
  postal_code?: string | null
  notes?: string | null
  is_default?: boolean
}

export async function getUserAddresses(): Promise<Address[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching addresses:', error)
    return []
  }

  return data ?? []
}

export async function getDefaultAddress(): Promise<Address | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_default', true)
    .maybeSingle()

  if (error) {
    console.error('Error fetching default address:', error)
    return null
  }

  return data
}

export async function saveAddress(addressData: AddressFormData): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'يجب تسجيل الدخول أولاً' }
  }

  // If this is set as default, unset other defaults
  if (addressData.is_default) {
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', user.id)
      .eq('is_default', true)
  }

  const { data, error } = await supabase
    .from('addresses')
    .insert({
      user_id: user.id,
      label: addressData.label ?? null,
      recipient_name: addressData.recipient_name ?? null,
      phone: addressData.phone ?? null,
      governorate: addressData.governorate,
      city: addressData.city,
      street: addressData.street,
      building: addressData.building ?? null,
      apartment: addressData.apartment ?? null,
      postal_code: addressData.postal_code ?? null,
      notes: addressData.notes ?? null,
      is_default: addressData.is_default ?? false,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error saving address:', error)
    return { success: false, error: 'فشل حفظ العنوان' }
  }

  return { success: true, id: data.id }
}

export async function updateAddress(addressId: string, addressData: Partial<AddressFormData>): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'يجب تسجيل الدخول أولاً' }
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from('addresses')
    .select('user_id')
    .eq('id', addressId)
    .single()

  if (!existing || existing.user_id !== user.id) {
    return { success: false, error: 'غير مصرح به' }
  }

  // If this is set as default, unset other defaults
  if (addressData.is_default) {
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', user.id)
      .eq('is_default', true)
      .neq('id', addressId)
  }

  const { error } = await supabase
    .from('addresses')
    .update({
      ...addressData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', addressId)

  if (error) {
    console.error('Error updating address:', error)
    return { success: false, error: 'فشل تحديث العنوان' }
  }

  return { success: true }
}

export async function deleteAddress(addressId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'يجب تسجيل الدخول أولاً' }
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from('addresses')
    .select('user_id')
    .eq('id', addressId)
    .single()

  if (!existing || existing.user_id !== user.id) {
    return { success: false, error: 'غير مصرح به' }
  }

  const { error } = await supabase
    .from('addresses')
    .delete()
    .eq('id', addressId)

  if (error) {
    console.error('Error deleting address:', error)
    return { success: false, error: 'فشل حذف العنوان' }
  }

  return { success: true }
}

export async function calculateShipping(governorate: string | null): Promise<number> {
  if (!governorate) {
    return 0
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('shipping_zones')
    .select('base_rate')
    .eq('governorate', governorate)
    .maybeSingle()

  if (error || !data) {
    return 50 // Default shipping cost
  }

  return Number(data.base_rate ?? 50)
}

