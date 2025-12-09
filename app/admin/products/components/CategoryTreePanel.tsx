"use client"

import { useMemo } from "react"
import { useDroppable } from "@dnd-kit/core"
import { FolderTree, PlusCircle } from "lucide-react"
import type { Category } from "../types"

type CategoryTreePanelProps = {
  categories: Category[]
  selectedCategoryId: string | null
  onSelectCategory: (categoryId: string | null) => void
  draggingProductId?: string | null
  onAddRootCategory?: () => void
  onAddSubCategory?: (parentId: string) => void
}

type CategoryNode = Category & { children: CategoryNode[] }

function buildTree(categories: Category[]): CategoryNode[] {
  const map = new Map<string, CategoryNode>()
  categories.forEach((category) => map.set(category.id, { ...category, children: [] }))

  const roots: CategoryNode[] = []
  ;[...map.values()].forEach((node) => {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(node)
    } else {
      roots.push(node)
    }
  })

  return roots
}

function CategoryRow({
  node,
  depth,
  selectedCategoryId,
  onSelectCategory,
  draggingProductId,
  onAddSubCategory,
}: {
  node: CategoryNode
  depth: number
  selectedCategoryId: string | null
  onSelectCategory: (categoryId: string | null) => void
  draggingProductId?: string | null
  onAddSubCategory?: (parentId: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `category-${node.id}`,
    data: { type: "category", categoryId: node.id },
  })

  return (
    <div className="space-y-1">
      <div
        ref={setNodeRef}
        className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 bg-white transition-colors ${
          selectedCategoryId === node.id ? "border-[#E8A835] bg-[#FFF8EA]" : "border-[#E8E2D1]"
        } ${isOver ? "ring-2 ring-[#E8A835]/60" : ""}`}
        style={{ marginInlineStart: depth * 20 }}
      >
        <button
          onClick={() => onSelectCategory(node.id)}
          className="flex items-center gap-2 text-left flex-1"
        >
          <FolderTree size={16} className="text-[#8B6F47]" />
          <div>
            <p className="text-sm font-semibold text-[#2B2520] leading-tight">{node.name_ar}</p>
            {node.children.length > 0 && (
              <p className="text-[11px] text-[#8B6F47]">{node.children.length} فئة فرعية</p>
            )}
          </div>
        </button>
        {draggingProductId && (
          <span className="text-[11px] text-[#8B6F47]">إفلات للنقل</span>
        )}
        {onAddSubCategory && (
          <button
            onClick={() => onAddSubCategory(node.id)}
            className="p-2 rounded-lg border border-[#E8A835]/60 text-[#E8A835] hover:bg-[#FFF8EA]"
            aria-label="إضافة فئة فرعية"
          >
            <PlusCircle size={14} />
          </button>
        )}
      </div>
      {node.children.map((child) => (
        <CategoryRow
          key={child.id}
          node={child}
          depth={depth + 1}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={onSelectCategory}
          draggingProductId={draggingProductId}
          onAddSubCategory={onAddSubCategory}
        />
      ))}
    </div>
  )
}

export function CategoryTreePanel({
  categories,
  selectedCategoryId,
  onSelectCategory,
  draggingProductId,
  onAddRootCategory,
  onAddSubCategory,
}: CategoryTreePanelProps) {
  const tree = useMemo(() => buildTree(categories), [categories])

  const { setNodeRef: setAllRef, isOver: isOverRoot } = useDroppable({
    id: "category-all",
    data: { type: "category", categoryId: null },
  })

  return (
    <div className="bg-white rounded-2xl shadow p-4 space-y-3 border border-[#E8E2D1]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#8B6F47]">إدارة الفئات والفروع</p>
          <h3 className="text-lg font-bold text-[#2B2520]">شجرة الفئات</h3>
        </div>
        {onAddRootCategory && (
          <button
            onClick={onAddRootCategory}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E8A835] text-[#E8A835] text-sm font-semibold"
          >
            <PlusCircle size={14} />
            فئة رئيسية
          </button>
        )}
      </div>

      <div
        ref={setAllRef}
        className={`flex items-center justify-between px-3 py-2 rounded-xl border cursor-pointer ${
          selectedCategoryId === null ? "border-[#E8A835] bg-[#FFF8EA]" : "border-[#E8E2D1] bg-[#F9F5EC]"
        } ${isOverRoot ? "ring-2 ring-[#E8A835]/60" : ""}`}
        onClick={() => onSelectCategory(null)}
      >
        <div className="flex items-center gap-2">
          <FolderTree size={16} className="text-[#8B6F47]" />
          <span className="text-sm font-semibold text-[#2B2520]">كل الفئات</span>
        </div>
        {draggingProductId && <span className="text-[11px] text-[#8B6F47]">إفلات للنقل</span>}
      </div>

      <div className="space-y-2">
        {tree.length === 0 ? (
          <p className="text-sm text-[#8B6F47]">لا توجد فئات بعد.</p>
        ) : (
          tree.map((node) => (
            <CategoryRow
              key={node.id}
              node={node}
              depth={0}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={onSelectCategory}
              draggingProductId={draggingProductId}
              onAddSubCategory={onAddSubCategory}
            />
          ))
        )}
      </div>
    </div>
  )
}

