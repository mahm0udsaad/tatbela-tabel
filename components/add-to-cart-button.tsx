'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CheckCircle2, Loader2, ShoppingCart, Sparkles } from 'lucide-react'

import { useCart } from '@/components/cart-provider'
import { cn } from '@/lib/utils'
import { getSupabaseClient } from '@/lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

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
  const supabase = getSupabaseClient()
  const [isAdding, setIsAdding] = useState(false)
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false)

  const canShowRegisterPrompt = () => {
    if (typeof window === 'undefined') return false
    const lastPrompt = window.localStorage.getItem('registerPromptDismissedAt')
    if (!lastPrompt) return true
    const elapsed = Date.now() - Number(lastPrompt)
    const twelveHours = 12 * 60 * 60 * 1000
    return Number.isFinite(elapsed) ? elapsed > twelveHours : true
  }

  const rememberPromptDismissal = () => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('registerPromptDismissedAt', Date.now().toString())
  }

  const saveGuestCartEntry = () => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem('guestCartItems')
      const parsed: Array<{ productId: string; quantity: number; updatedAt: string }> = raw ? JSON.parse(raw) : []
      const existing = parsed.find((item) => item.productId === productId)

      if (existing) {
        existing.quantity += 1
        existing.updatedAt = new Date().toISOString()
      } else {
        parsed.push({ productId, quantity: 1, updatedAt: new Date().toISOString() })
      }

      window.localStorage.setItem('guestCartItems', JSON.stringify(parsed))
    } catch (error) {
      console.error('Failed to persist guest cart locally', error)
    }
  }

  const handlePromptChange = (open: boolean) => {
    setShowRegisterPrompt(open)
    if (!open) {
      rememberPromptDismissal()
    }
  }

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsAdding(true)
    try {
      const { data } = await supabase.auth.getSession()
      const user = data?.session?.user

      if (!user) {
        saveGuestCartEntry()
        if (canShowRegisterPrompt()) {
          setShowRegisterPrompt(true)
        }
        return
      }

      await addItem(productId, 1, productVariantId)
    } catch (error: any) {
      const code = error?.code
      const isPermissionError = code === '42501'

      if (isPermissionError) {
        saveGuestCartEntry()
        if (canShowRegisterPrompt()) {
          setShowRegisterPrompt(true)
        }
        return
      }
      throw error
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
          'w-full py-2 bg-[#E8A835] text-white rounded-lg font-semibold hover:bg-[#D9941E] transition-colors flex items-center justify-center gap-2',
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

      <Dialog open={showRegisterPrompt} onOpenChange={handlePromptChange}>
        <DialogContent className="max-w-md rounded-2xl border-0 bg-white p-6 shadow-2xl">
          <DialogHeader className="gap-3 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#E8A835]/10 text-[#E8A835]">
              <CheckCircle2 className="size-6" />
            </div>
            <DialogTitle className="text-xl font-bold text-[#2B2520]">أضفنا المنتج لسلتك</DialogTitle>
            <DialogDescription className="text-[#6B5B53]">
              لإنهاء الطلب بسهولة وحفظ السلة على كل أجهزتك، أنشئ حساباً مجانياً في أقل من دقيقة.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 rounded-xl bg-[#F5F1E8] px-4 py-3 text-sm text-[#4A403B]">
            <div className="flex items-center gap-2 font-semibold text-[#2B2520]">
              <Sparkles className="size-4 text-[#E8A835]" />
              لماذا التسجيل؟
            </div>
            <ul className="list-disc space-y-1 pr-5">
              <li>حفظ السلة والمتابعة من أي جهاز</li>
              <li>تتبع حالة الطلب والتنبيهات الفورية</li>
              <li>عروض ومكافآت حصرية للأعضاء</li>
            </ul>
          </div>

          <DialogFooter className="gap-3 sm:flex-row sm:gap-2">
            <Link
              href="/auth/sign-up"
              className="flex-1 rounded-lg bg-[#E8A835] px-4 py-3 text-center text-sm font-bold text-white shadow-lg shadow-[#E8A835]/30 transition hover:-translate-y-0.5 hover:bg-[#D9941E]"
            >
              إنشاء حساب الآن
            </Link>
            <button
              type="button"
              onClick={() => setShowRegisterPrompt(false)}
              className="flex-1 rounded-lg border border-[#E8A835]/40 px-4 py-3 text-sm font-semibold text-[#2B2520] transition hover:bg-[#F5F1E8]"
            >
              متابعة التسوق كضيف
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
