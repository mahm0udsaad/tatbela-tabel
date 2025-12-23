"use client"

import { useEffect, useMemo, useState } from "react"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { useOfferManager } from "./useOfferManager"
import { OfferHeader } from "./components/OfferHeader"
import { StatusBanner } from "../products/components/StatusBanner"
import { OfferListPanel } from "./components/OfferListPanel"
import { OfferDetailsCard } from "./components/OfferDetailsCard"
import { OfferImagesCard } from "./components/OfferImagesCard"
import { OfferVariantsCard } from "./components/OfferVariantsCard"
import { CropModal } from "../products/components/CropModal"
import { updateOffersSortOrderAction } from "./actions"
import type { Offer } from "./types"

export function OfferManager({
  initialOffers,
}: {
  initialOffers: Offer[]
}) {
  const manager = useOfferManager({ initialOffers })
  const [sortableOffers, setSortableOffers] = useState(manager.offers)
  const [isSavingOrder, setIsSavingOrder] = useState(false)
  const [draggingOfferId, setDraggingOfferId] = useState<string | null>(null)

  useEffect(() => {
    setSortableOffers(manager.offers)
  }, [manager.offers])

  const visibleOffers = useMemo(() => {
    const term = manager.searchTerm.trim().toLowerCase()
    return sortableOffers.filter((offer) => {
      const matchesSearch =
        !term ||
        offer.name_ar.toLowerCase().includes(term) ||
        (offer.brand && offer.brand.toLowerCase().includes(term))
      const matchesFeatured = !manager.onlyFeatured || offer.is_featured
      const matchesStock =
        manager.stockFilter === "all"
          ? true
          : manager.stockFilter === "in_stock"
            ? offer.stock > 0
            : offer.stock <= 0
      const matchesBrand = !manager.brandFilter || offer.brand === manager.brandFilter
      return matchesSearch && matchesFeatured && matchesStock && matchesBrand
    })
  }, [sortableOffers, manager.searchTerm, manager.onlyFeatured, manager.stockFilter, manager.brandFilter])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active?.data?.current?.type === "offer") {
      setDraggingOfferId(String(event.active.id))
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setDraggingOfferId(null)

    const activeType = event.active?.data?.current?.type
    const over = event.over
    if (activeType !== "offer" || !over) return

    const overType = over.data?.current?.type
    const activeId = String(event.active.id)

    if (overType === "offer" && over.id !== event.active.id) {
      const oldIndex = sortableOffers.findIndex((item) => item.id === activeId)
      const newIndex = sortableOffers.findIndex((item) => item.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return

      const newItems = arrayMove(sortableOffers, oldIndex, newIndex)
      setSortableOffers(newItems)

      const updates = newItems.map((item, index) => ({
        id: item.id,
        sort_order: index,
      }))

      setIsSavingOrder(true)
      try {
        await updateOffersSortOrderAction(updates)
      } catch (error) {
        console.error("Failed to update sort order:", error)
        setSortableOffers(manager.offers)
      } finally {
        setIsSavingOrder(false)
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6 p-6">
        <OfferHeader
          onCreateNew={manager.startNewOffer}
          onSave={manager.submitOffer}
          isPending={manager.isPending}
        />

        <StatusBanner statusMessage={manager.statusMessage} errorMessage={manager.errorMessage} />

        <section className="flex gap-4 gap-6">
          <div className="">
            <OfferListPanel
              offers={visibleOffers}
              selectedOfferId={manager.selectedOfferId}
              onSelectOffer={manager.selectOffer}
              onDeleteOffer={manager.deleteOffer}
              isSavingOrder={isSavingOrder}
              searchTerm={manager.searchTerm}
              onSearchChange={manager.setSearchTerm}
              onlyFeatured={manager.onlyFeatured}
              onToggleOnlyFeatured={() => manager.setOnlyFeatured((prev) => !prev)}
              stockFilter={manager.stockFilter}
              onStockFilterChange={manager.setStockFilter}
              brandOptions={manager.brandOptions}
              brandFilter={manager.brandFilter}
              onBrandFilterChange={manager.setBrandFilter}
            />
          </div>

          <div className="lg:col-span-2 space-y-6">
            <OfferDetailsCard
              offerForm={manager.offerForm}
              onFieldChange={manager.updateOfferFormField}
            />

            <OfferImagesCard
              selectedOffer={manager.selectedOffer}
              fileInputRef={manager.fileInputRef}
              onUploadClick={manager.triggerUpload}
              onFileChange={manager.handleFileChange}
              onSetPrimary={manager.handleSetPrimaryImage}
              onDeleteImage={manager.handleDeleteImage}
              pendingImages={manager.pendingImages}
              onDeletePending={manager.handleDeletePendingImage}
              onCropImage={manager.openCropModal}
            />
            <OfferVariantsCard
              selectedOffer={manager.selectedOffer}
              variantForm={manager.variantForm}
              onFieldChange={manager.updateVariantField}
              onSubmit={manager.submitVariant}
              onEditVariant={manager.editVariant}
              onDeleteVariant={manager.deleteVariant}
            />
          </div>
        </section>
      </div>

      <CropModal
        cropFile={manager.cropFile}
        crop={manager.crop}
        onCropChange={manager.updateCrop}
        onClose={manager.closeCropModal}
        onConfirm={manager.confirmCrop}
        isPending={manager.isPending}
        imageRef={manager.imageRef}
      />
    </DndContext>
  )
}

