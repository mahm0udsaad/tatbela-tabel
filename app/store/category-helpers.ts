export type CategoryRecord = {
  id: string
  name_ar: string
  parent_id: string | null
  slug: string
  sort_order: number | null
}

type CategoryBranchResult = {
  categories: CategoryRecord[]
  categoryIds: string[]
  rootCategory?: CategoryRecord
}

export function getCategoryBranch(categories: CategoryRecord[], rootSlug?: string): CategoryBranchResult {
  const sortedCategories = sortCategories(categories)

  if (!rootSlug) {
    return { categories: sortedCategories, categoryIds: sortedCategories.map((cat) => cat.id) }
  }

  const root = sortedCategories.find((category) => category.slug === rootSlug)
  if (!root) {
    return { categories: sortedCategories, categoryIds: sortedCategories.map((cat) => cat.id) }
  }

  const childrenMap = sortedCategories.reduce<Map<string, CategoryRecord[]>>((map, category) => {
    if (!category.parent_id) return map
    const siblings = map.get(category.parent_id) ?? []
    siblings.push(category)
    map.set(category.parent_id, siblings)
    return map
  }, new Map())

  const categoryIds: string[] = []
  const queue: CategoryRecord[] = [root]
  const branchSet = new Set<string>()

  while (queue.length > 0) {
    const current = queue.shift()!
    if (branchSet.has(current.id)) continue
    branchSet.add(current.id)
    categoryIds.push(current.id)
    const children = childrenMap.get(current.id) ?? []
    queue.push(...children)
  }

  const branchCategories = sortedCategories.filter((category) => branchSet.has(category.id))

  return {
    categories: branchCategories,
    categoryIds,
    rootCategory: root,
  }
}

function sortCategories(categories: CategoryRecord[]) {
  return [...categories].sort((a, b) => {
    const orderA = a.sort_order ?? 0
    const orderB = b.sort_order ?? 0
    if (orderA === orderB) {
      return a.name_ar.localeCompare(b.name_ar, "ar")
    }
    return orderA - orderB
  })
}

