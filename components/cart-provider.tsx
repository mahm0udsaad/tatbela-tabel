'use client'

import React, { createContext, useContext, useEffect, useState, useTransition } from 'react'
import { useToast } from '@/hooks/use-toast'
import { addToCart, getCart, removeItemFromCart, updateCartItemQuantity, clearCart as clearCartAction, type Cart } from '@/lib/actions/cart'
import { useRouter } from 'next/navigation'

type CartContextType = {
  cart: Cart | null
  isLoading: boolean
  addItem: (productId: string, quantity?: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  refreshCart: () => Promise<void>
  clearCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  const refreshCart = async () => {
    try {
      const data = await getCart()
      setCart(data)
    } catch (error) {
      console.error('Failed to fetch cart', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshCart()
  }, [])

  const addItem = async (productId: string, quantity: number = 1) => {
    try {
      await addToCart(productId, quantity)
      await refreshCart()
      toast({
        title: "تمت الإضافة للسلة",
        description: "تم إضافة المنتج بنجاح إلى عربة التسوق",
        duration: 3000,
      })
      router.refresh() 
    } catch (error) {
      console.error(error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة المنتج للسلة",
        variant: "destructive",
      })
      throw error
    }
  }

  const removeItem = async (itemId: string) => {
    try {
      await removeItemFromCart(itemId)
      await refreshCart()
      toast({
        title: "تم الحذف",
        description: "تم حذف المنتج من السلة",
      })
      router.refresh()
    } catch (error) {
      console.error(error)
      toast({
        title: "خطأ",
        description: "فشل حذف المنتج",
        variant: "destructive",
      })
      throw error
    }
  }

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      await updateCartItemQuantity(itemId, quantity)
      await refreshCart()
      router.refresh()
    } catch (error) {
      console.error(error)
      toast({
        title: "خطأ",
        description: "فشل تحديث الكمية",
        variant: "destructive",
      })
      throw error
    }
  }

  const clearCart = async () => {
    try {
      await clearCartAction()
      await refreshCart()
    } catch (error) {
      console.error('Failed to clear cart', error)
      throw error
    }
  }

  return (
    <CartContext.Provider value={{ cart, isLoading, addItem, removeItem, updateQuantity, refreshCart, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
