import { Category } from "../types"

interface CategoryGridProps {
  categories: Category[]
  onSelectCategory: (categoryId: string) => void
}

export function CategoryGrid({ categories, onSelectCategory }: CategoryGridProps) {
  // Only show parent categories or flatten the list? 
  // The user said "select the category he need to manage".
  // Assuming we show all categories that have products or just all categories.
  // The current category structure has parent_id. 
  // Let's show all categories for now, or maybe grouped. 
  // But strictly following the request: "grid to make it select the category".
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelectCategory(category.id)}
          className="flex flex-col items-center justify-center p-6 bg-white rounded-xl border border-[#E8A835]/20 hover:border-[#E8A835] hover:shadow-lg transition-all aspect-square text-center gap-2"
        >
          <span className="text-xl font-bold text-[#2B2520]">{category.name_ar}</span>
          {category.parent_id && (
             <span className="text-xs text-[#8B6F47]">(فئة فرعية)</span>
          )}
        </button>
      ))}
    </div>
  )
}

