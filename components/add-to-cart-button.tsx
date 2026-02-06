'use client'

import { useState } from 'react'
import { Loader2, ShoppingCart } from 'lucide-react'

import { useCart } from '@/components/cart-provider'
import { cn } from '@/lib/utils'

interface AddToCartButtonProps {
  productId: string
  className?: string
  children?: React.ReactNode
  showIcon?: boolean
  disabled?: boolean
  productVariantId?: string | null
}

export function AddToCartButton({ 
  productId, 
  className, 
  children, 
  showIcon = false,
  disabled = false,
  productVariantId = null,
}: AddToCartButtonProps) {
  const { addItem, isLoading } = useCart()
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setIsAdding(true)
    try {
      await addItem(productId, 1, productVariantId)
    } catch (error: any) {
      console.error('Failed to add to cart', error)
    } finally {
      setIsAdding(false)
    }
  }

  const isButtonDisabled = disabled || isLoading || isAdding

  return (
    <>
      <button
        onClick={handleAddToCart}
        disabled={isButtonDisabled}
        className={cn(
          'pt-2 w-full sm:font-large py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-brand-green-dark transition-colors flex items-center justify-center gap-2',
          isButtonDisabled && 'opacity-70 cursor-not-allowed',
          className,
        )}
      >
        {isAdding ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <>
            {showIcon && <ShoppingCart size={18} />}
            {children || 'أضف إلى السلة'}
          </>
        )}
      </button>
    </>
  )
}
