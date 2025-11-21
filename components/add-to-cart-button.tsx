'use client'

import { useState } from 'react'
import { useCart } from '@/components/cart-provider'
import { ShoppingCart, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AddToCartButtonProps {
  productId: string
  className?: string
  children?: React.ReactNode
  showIcon?: boolean
  disabled?: boolean
}

export function AddToCartButton({ 
  productId, 
  className, 
  children, 
  showIcon = false,
  disabled = false
}: AddToCartButtonProps) {
  const { addItem, isLoading } = useCart()
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsAdding(true)
    try {
      await addItem(productId)
    } finally {
      setIsAdding(false)
    }
  }

  const isButtonDisabled = disabled || isLoading || isAdding

  return (
    <button
      onClick={handleAddToCart}
      disabled={isButtonDisabled}
      className={cn(
        "w-full py-2 bg-[#E8A835] text-white rounded-lg font-semibold hover:bg-[#D9941E] transition-colors flex items-center justify-center gap-2",
        isButtonDisabled && "opacity-70 cursor-not-allowed",
        className
      )}
    >
      {isAdding ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <>
          {showIcon && <ShoppingCart size={18} />}
          {children || "أضف إلى السلة"}
        </>
      )}
    </button>
  )
}
