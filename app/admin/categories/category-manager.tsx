"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Edit2, Trash2, GripVertical, PlusCircle, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  reorderCategoriesAction,
} from "./actions"

type Category = {
  id: string
  name_ar: string
  slug: string
  parent_id: string | null
  sort_order: number | null
}

type CategoryNode = Category & { children: CategoryNode[] }

const emptyForm = {
  id: "",
  name_ar: "",
  slug: "",
  parent_id: "",
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    // السماح بحروف عربية/لاتينية وأرقام والشرطات
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function CategoryManager({ initialCategories }: { initialCategories: Category[] }) {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>(initialCategories ?? [])
  const [formState, setFormState] = useState(emptyForm)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setCategories(initialCategories ?? [])
  }, [initialCategories])

  const tree = useMemo(() => buildTree(categories), [categories])
  const descendantsMap = useMemo(() => buildDescendantMap(tree), [tree])

  const handleSubmit = () => {
    if (!formState.name_ar.trim()) {
      setError("اسم الفئة مطلوب")
      return
    }
    if (!formState.slug.trim()) {
      setError("المسار مطلوب")
      return
    }

    startTransition(async () => {
      setStatus(null)
      setError(null)
      const basePayload = {
        name_ar: formState.name_ar.trim(),
        slug: formState.slug.trim(),
        parent_id: formState.parent_id || null,
      }
      const result = formState.id
        ? await updateCategoryAction({ ...basePayload, id: formState.id })
        : await createCategoryAction(basePayload)
      if (!result.success) {
        setError(result.error ?? "تعذر حفظ الفئة")
        return
      }
      setFormState(emptyForm)
      setStatus(formState.id ? "تم تحديث الفئة" : "تم إضافة الفئة")
      router.refresh()
    })
  }

  const handleDelete = (categoryId: string) => {
    if (!confirm("سيتم حذف الفئة وقد تتحول فئاتها الفرعية إلى فئات رئيسية. متابعة؟")) return
    startTransition(async () => {
      setStatus(null)
      setError(null)
      const result = await deleteCategoryAction(categoryId)
      if (!result.success) {
        setError(result.error ?? "تعذر حذف الفئة")
        return
      }
      setStatus("تم حذف الفئة")
      router.refresh()
    })
  }

  const handleDrop = (parentId: string | null, position: number) => {
    if (!draggingId) return
    if (parentId && descendantsMap.get(draggingId)?.has(parentId)) {
      setError("لا يمكن نقل الفئة إلى داخل نفسها")
      return
    }
    startTransition(async () => {
      setStatus(null)
      setError(null)
      const result = await reorderCategoriesAction({ id: draggingId, parentId, position })
      if (!result.success) {
        setError(result.error ?? "تعذر تحديث الترتيب")
        return
      }
      setStatus("تم تحديث ترتيب الفئات")
      router.refresh()
    })
  }

  const handleNameChange = (value: string) => {
    setFormState((prev) => ({
      ...prev,
      name_ar: value,
      slug: prev.id || prev.slug ? prev.slug : slugify(value),
    }))
  }

  const blockedIds = new Set<string>()
  if (formState.id) {
    blockedIds.add(formState.id)
    descendantsMap.get(formState.id)?.forEach((id) => blockedIds.add(id))
  }

  const rootOptions = categories
    .filter((category) => !blockedIds.has(category.id))
    .map((category) => ({
      label: category.name_ar,
      value: category.id,
    }))

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2B2520]">إدارة الفئات</h1>
          <p className="text-[#8B6F47]">نظم الفئات الرئيسية والفرعية عن طريق السحب والإفلات</p>
        </div>
        <button
          onClick={() => setFormState(emptyForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#E8A835] text-[#E8A835] font-semibold"
        >
          <PlusCircle size={18} />
          فئة جديدة
        </button>
      </header>

      {(status || error) && (
        <div
          className={`px-4 py-3 rounded-xl border flex items-center gap-2 text-sm font-semibold ${
            error ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700"
          }`}
        >
          {error ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          {error ?? status}
        </div>
      )}

      <section className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#2B2520]">قائمة الفئات</h2>
            {draggingId && <span className="text-sm text-[#8B6F47]">قم بإفلات الفئة في المكان المطلوب</span>}
          </div>
          <div className="space-y-2">
            <DropZone active={!!draggingId} parentId={null} position={0} onDrop={handleDrop} depth={0} />
            {tree.length === 0 && <p className="text-sm text-[#8B6F47]">لا توجد فئات بعد.</p>}
            {tree.map((node, index) => (
              <div key={node.id} className="space-y-2">
                <CategoryItem
                  node={node}
                  depth={0}
                  onEdit={(category) =>
                    setFormState({
                      id: category.id,
                      name_ar: category.name_ar,
                      slug: category.slug,
                      parent_id: category.parent_id ?? "",
                    })
                  }
                  onDelete={handleDelete}
                  onDrop={handleDrop}
                  onDragStart={setDraggingId}
                  onDragEnd={() => setDraggingId(null)}
                  dragging={draggingId}
                  onAddChild={(category) =>
                    setFormState({
                      id: "",
                      name_ar: "",
                      slug: "",
                      parent_id: category.id,
                    })
                  }
                />
                <DropZone active={!!draggingId} parentId={null} position={index + 1} onDrop={handleDrop} depth={0} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-6 space-y-4">
          <h2 className="text-xl font-bold text-[#2B2520]">
            {formState.id ? "تعديل الفئة" : "إضافة فئة"}
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-[#2B2520] mb-2">اسم الفئة</label>
              <input
                type="text"
                value={formState.name_ar}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full rounded-lg border border-[#D9D4C8] px-4 py-2 focus:border-[#E8A835] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#2B2520] mb-2">المسار (Slug)</label>
              <input
                type="text"
                value={formState.slug}
                onChange={(e) => setFormState((prev) => ({ ...prev, slug: slugify(e.target.value) }))}
                className="w-full rounded-lg border border-[#D9D4C8] px-4 py-2 focus:border-[#E8A835] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#2B2520] mb-2">فئة رئيسية</label>
              <select
                value={formState.parent_id}
                onChange={(e) => setFormState((prev) => ({ ...prev, parent_id: e.target.value }))}
                className="w-full rounded-lg border border-[#D9D4C8] px-4 py-2 focus:border-[#E8A835]"
              >
                <option value="">فئة رئيسية</option>
                {rootOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFormState(emptyForm)}
              className="flex-1 px-4 py-2 rounded-lg border border-[#D9D4C8] text-[#8B6F47]"
            >
              إعادة تعيين
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 rounded-lg bg-[#E8A835] text-white font-bold flex items-center justify-center gap-2"
              disabled={isPending}
            >
              {isPending ? <Loader2 size={18} className="animate-spin" /> : formState.id ? "تحديث" : "إضافة"}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

function CategoryItem({
  node,
  depth,
  onEdit,
  onDelete,
  onDrop,
  onDragStart,
  onDragEnd,
  dragging,
  onAddChild,
}: {
  node: CategoryNode
  depth: number
  onEdit: (category: Category) => void
  onDelete: (id: string) => void
  onDrop: (parentId: string | null, position: number) => void
  onDragStart: (id: string) => void
  onDragEnd: () => void
  dragging: string | null
  onAddChild: (parent: Category) => void
}) {
  return (
    <div className="space-y-1">
      <div
        className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 bg-white ${
          dragging === node.id ? "border-[#E8A835]" : "border-[#E8E2D1]"
        }`}
        style={{ marginInlineStart: depth * 24 }}
        draggable
        onDragStart={() => onDragStart(node.id)}
        onDragEnd={onDragEnd}
      >
        <div className="flex items-center gap-3">
          <GripVertical className="text-[#8B6F47]" size={18} />
          <div>
            <p className="font-semibold text-[#2B2520]">{node.name_ar}</p>
            <p className="text-xs text-[#8B6F47]">{node.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {node.children.length > 0 && <span className="text-xs text-[#8B6F47]">({node.children.length}) فرعي</span>}
          <button
            className="p-2 rounded-lg border border-[#E8A835]/60 text-[#E8A835]"
            onClick={() =>
              onAddChild({
                id: node.id,
                name_ar: node.name_ar,
                slug: node.slug,
                parent_id: node.parent_id,
                sort_order: node.sort_order,
              })
            }
          >
            <PlusCircle size={16} />
          </button>
          <button
            className="p-2 rounded-lg border border-[#E8A835] text-[#E8A835]"
            onClick={() => onEdit(node)}
          >
            <Edit2 size={16} />
          </button>
          <button className="p-2 rounded-lg border border-red-200 text-red-600" onClick={() => onDelete(node.id)}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <DropZone active={!!dragging} parentId={node.id} position={0} onDrop={onDrop} depth={depth + 1} />
      {node.children.map((childNode, index) => (
        <div key={childNode.id} className="space-y-1">
          <CategoryItem
            node={childNode}
            depth={depth + 1}
            onEdit={onEdit}
            onDelete={onDelete}
            onDrop={onDrop}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            dragging={dragging}
            onAddChild={onAddChild}
          />
          <DropZone active={!!dragging} parentId={node.id} position={index + 1} onDrop={onDrop} depth={depth + 1} />
        </div>
      ))}
    </div>
  )
}

function DropZone({
  parentId,
  position,
  onDrop,
  active,
  depth = 0,
}: {
  parentId: string | null
  position: number
  onDrop: (parentId: string | null, position: number) => void
  active: boolean
  depth?: number
}) {
  return (
    <div
      onDragOver={(event) => {
        if (active) {
          event.preventDefault()
        }
      }}
      onDrop={(event) => {
        event.preventDefault()
        onDrop(parentId, position)
      }}
      className={`h-3 rounded border-2 border-dashed transition-colors ${
        active ? "border-[#E8A835]/50 bg-[#FDF6E7]" : "border-transparent"
      }`}
      style={{ marginInlineStart: depth * 24 }}
    />
  )
}

function buildTree(categories: Category[]): CategoryNode[] {
  const map = new Map<string, CategoryNode>()
  categories.forEach((category) => {
    map.set(category.id, { ...category, children: [] })
  })

  const roots: CategoryNode[] = []

  const sorted = [...map.values()].sort((a, b) => {
    const orderA = a.sort_order ?? 0
    const orderB = b.sort_order ?? 0
    if (orderA === orderB) {
      return a.name_ar.localeCompare(b.name_ar, "ar")
    }
    return orderA - orderB
  })

  sorted.forEach((node) => {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(node)
    } else {
      roots.push(node)
    }
  })

  return roots
}

function buildDescendantMap(tree: CategoryNode[]) {
  const map = new Map<string, Set<string>>()

  const traverse = (node: CategoryNode): Set<string> => {
    const descendants = new Set<string>()
    node.children.forEach((child) => {
      descendants.add(child.id)
      const childDesc = traverse(child)
      childDesc.forEach((id) => descendants.add(id))
    })
    map.set(node.id, descendants)
    return descendants
  }

  tree.forEach((root) => traverse(root))
  return map
}

