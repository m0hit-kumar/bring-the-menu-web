"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, Pencil, Trash, Loader2, Eye, Upload, Link as LinkIcon, ChevronDown, ChevronRight } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/hooks/useAuth"
import {
  getMenuItemsByCategory,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  MenuItem as DBMenuItem,
} from "@/lib/firebase/firestore"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { MenuPreview } from "@/components/menu/MenuPreview"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchImageFromSearch } from "@/lib/utils/imageSearch"

interface MenuEditorProps {
  showHeader?: boolean
}

export function MenuEditor({ showHeader = false }: MenuEditorProps) {
  const { restaurant } = useAuth()
  const [categories, setCategories] = useState<Record<string, DBMenuItem[]>>({})
  const [categoryNames, setCategoryNames] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [newCategory, setNewCategory] = useState("")
  const [newItem, setNewItem] = useState<Omit<DBMenuItem, "id" | "restaurantId" | "createdAt" | "updatedAt" | "available">>({
    name: "",
    price: 0,
    category: "",
    description: "",
    imageUrl: "",
  })
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})

  // Load menu items from database
  useEffect(() => {
    if (!restaurant?.id) return

    const loadMenuItems = async () => {
      try {
        setLoading(true)
        const itemsByCategory = await getMenuItemsByCategory(restaurant.id)
        setCategories(itemsByCategory)
        setCategoryNames(Object.keys(itemsByCategory))
      } catch (error) {
        console.error("Error loading menu items:", error)
        toast.error("Failed to load menu items")
      } finally {
        setLoading(false)
      }
    }

    loadMenuItems()
  }, [restaurant?.id])

  const addCategory = () => {
    if (newCategory.trim() && !categoryNames.includes(newCategory.trim())) {
      const category = newCategory.trim()
      setCategoryNames([...categoryNames, category])
      setExpandedCategories((prev) => ({ ...prev, [category]: true }))
      setNewCategory("")
      toast.success(`Category "${newCategory.trim()}" added`)
    }
  }

  useEffect(() => {
    setExpandedCategories((prev) => {
      const next: Record<string, boolean> = {}
      categoryNames.forEach((name) => {
        next[name] = prev[name] ?? false
      })
      return next
    })
  }, [categoryNames])

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }))
  }

  const addOrUpdateItem = async (categoryName: string) => {
    if (!restaurant?.id) {
      toast.error("Restaurant not found")
      return
    }

    if (!newItem.name.trim()) {
      toast.error("Please enter an item name")
      return
    }
    if (!newItem.price || newItem.price <= 0) {
      toast.error("Please enter a valid price")
      return
    }

    try {
      setSaving(true)
      
      // If no image provided, fetch one automatically based on item name
      let imageUrl = newItem.imageUrl
      if (!imageUrl || imageUrl.trim() === "") {
        toast.loading("Fetching image...", { id: "fetch-image" })
        try {
          // Create search query: item name + category for better results
          const searchQuery = `${newItem.name} ${categoryName} food`.trim()
          imageUrl = await fetchImageFromSearch(searchQuery)
          toast.success("Image fetched automatically", { id: "fetch-image" })
        } catch (error) {
          console.error("Error fetching image:", error)
          toast.error("Failed to fetch image, using placeholder", { id: "fetch-image" })
          // Use placeholder as fallback
          imageUrl = `https://via.placeholder.com/800x600/cccccc/666666?text=${encodeURIComponent(newItem.name)}`
        }
      }
      
      const itemData = {
        ...newItem,
        imageUrl,
        category: categoryName,
        available: true,
      }

      if (editingItemId) {
        // Update existing item
        await updateMenuItem(editingItemId, itemData)
        toast.success("Menu item updated successfully")
      } else {
        // Create new item
        await createMenuItem(restaurant.id, itemData)
        toast.success("Menu item added successfully")
      }

      // Reload menu items
      const itemsByCategory = await getMenuItemsByCategory(restaurant.id)
      setCategories(itemsByCategory)
      setCategoryNames(Object.keys(itemsByCategory))

      // Reset form
      setNewItem({
        name: "",
        price: 0,
        category: "",
        description: "",
        imageUrl: "",
      })
      setEditingItemId(null)
    } catch (error) {
      console.error("Error saving menu item:", error)
      toast.error(editingItemId ? "Failed to update menu item" : "Failed to add menu item")
    } finally {
      setSaving(false)
    }
  }

  const startEditingItem = (item: DBMenuItem) => {
    setNewItem({
      name: item.name,
      price: item.price,
      category: item.category,
      description: item.description || "",
      imageUrl: item.imageUrl || "",
    })
    setEditingItemId(item.id)
  }

  const handleDeleteItem = async (itemId: string, itemName: string) => {
    if (!confirm(`Are you sure you want to delete "${itemName}"?`)) {
      return
    }

    try {
      await deleteMenuItem(itemId)
      toast.success("Menu item deleted successfully")

      // Reload menu items
      if (restaurant?.id) {
        const itemsByCategory = await getMenuItemsByCategory(restaurant.id)
        setCategories(itemsByCategory)
        setCategoryNames(Object.keys(itemsByCategory))
      }
    } catch (error) {
      console.error("Error deleting menu item:", error)
      toast.error("Failed to delete menu item")
    }
  }

  const toggleItemAvailability = async (item: DBMenuItem) => {
    try {
      await updateMenuItem(item.id, { available: !item.available })
      toast.success(`Item ${item.available ? "unavailable" : "available"}`)

      // Reload menu items
      if (restaurant?.id) {
        const itemsByCategory = await getMenuItemsByCategory(restaurant.id)
        setCategories(itemsByCategory)
      }
    } catch (error) {
      console.error("Error updating item availability:", error)
      toast.error("Failed to update item availability")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  // Get all menu items for preview (flatten categories)
  const allMenuItems = Object.values(categories).flat()

  return (
    <div className="space-y-4">
      {showHeader ? (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold">Manage Menu</h1>
            <p className="text-muted-foreground mt-2">Create and manage your menu sections and items</p>
          </div>
          <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview Menu
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto p-0">
              <DialogHeader className="px-6 pt-6 pb-4">
                <DialogTitle>Menu Preview</DialogTitle>
                <DialogDescription>
                  See how your menu appears to customers. Unavailable items are shown with reduced opacity.
                </DialogDescription>
              </DialogHeader>
              <div className="px-6 pb-6">
                <MenuPreview items={allMenuItems} restaurantName={restaurant?.name} />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <div className="flex justify-end mb-4">
          <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview Menu
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto p-0">
              <DialogHeader className="px-6 pt-6 pb-4">
                <DialogTitle>Menu Preview</DialogTitle>
                <DialogDescription>
                  See how your menu appears to customers. Unavailable items are shown with reduced opacity.
                </DialogDescription>
              </DialogHeader>
              <div className="px-6 pb-6">
                <MenuPreview items={allMenuItems} restaurantName={restaurant?.name} />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <Input
          placeholder="New section/category name"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              addCategory()
            }
          }}
          className="flex-1"
        />
        <Button onClick={addCategory} variant="outline" className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Section
        </Button>
      </div>

      {categoryNames.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No menu categories yet. Add a category to get started.</p>
          </CardContent>
        </Card>
      ) : (
        categoryNames.map((categoryName) => (
          <Card key={categoryName}>
            <CardHeader>
              <CardTitle className="flex justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleCategory(categoryName)}
                    className="h-8 px-2"
                  >
                    {expandedCategories[categoryName] ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                  <span>{categoryName}</span>
                </div>
                <span className="text-sm font-normal text-muted-foreground">
                  {categories[categoryName]?.length || 0} items
                </span>
              </CardTitle>
            </CardHeader>
            {expandedCategories[categoryName] && (
              <>
                <CardContent>
                  {!categories[categoryName] || categories[categoryName].length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No items in this section yet.</p>
                      <p className="text-xs mt-1">Add items using the form below.</p>
                    </div>
                  ) : (
                    <ul className="space-y-4">
                      {categories[categoryName].map((item) => (
                        <li
                          key={item.id}
                          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">
                                {item.name} - ${item.price.toFixed(2)}
                              </h3>
                              <Switch
                                checked={item.available}
                                onCheckedChange={() => toggleItemAvailability(item)}
                              />
                              <span className={`text-xs ${item.available ? "text-green-600" : "text-gray-400"}`}>
                                {item.available ? "Available" : "Unavailable"}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                            )}
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEditingItem(item)}
                              className="flex-1 sm:flex-none"
                            >
                              <Pencil className="h-4 w-4 sm:mr-2" />
                              <span className="hidden sm:inline">Edit</span>
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteItem(item.id, item.name)}
                              className="flex-1 sm:flex-none"
                            >
                              <Trash className="h-4 w-4 sm:mr-2" />
                              <span className="hidden sm:inline">Delete</span>
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col items-start gap-4">
                  <div>
                    <Label htmlFor={`item-name-${categoryName}`}>Item Name *</Label>
                    <Input
                      id={`item-name-${categoryName}`}
                      placeholder="Item name"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      className="w-full mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor={`item-price-${categoryName}`}>Price *</Label>
                    <Input
                      id={`item-price-${categoryName}`}
                      placeholder="0.00"
                      type="number"
                      step="0.01"
                      min="0"
                      value={newItem.price || ""}
                      onChange={(e) => setNewItem({ ...newItem, price: Number.parseFloat(e.target.value) || 0 })}
                      className="w-full mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor={`item-description-${categoryName}`}>Description</Label>
                    <Textarea
                      id={`item-description-${categoryName}`}
                      placeholder="Item description (optional)"
                      value={newItem.description}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                      className="w-full mt-1"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Item Image</Label>
                    <Tabs defaultValue="upload" className="mt-2">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="upload" className="flex items-center gap-2">
                          <Upload className="h-4 w-4" />
                          Upload
                        </TabsTrigger>
                        <TabsTrigger value="url" className="flex items-center gap-2">
                          <LinkIcon className="h-4 w-4" />
                          Paste URL
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="upload" className="mt-3">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              // Validate file size (max 5MB)
                              if (file.size > 5 * 1024 * 1024) {
                                toast.error("Image size should be less than 5MB")
                                return
                              }
                              // Validate file type
                              if (!file.type.startsWith("image/")) {
                                toast.error("Please select a valid image file")
                                return
                              }
                              const reader = new FileReader()
                              reader.onloadend = () => {
                                setNewItem({ ...newItem, imageUrl: reader.result as string })
                                toast.success("Image loaded successfully")
                              }
                              reader.onerror = () => {
                                toast.error("Failed to load image")
                              }
                              reader.readAsDataURL(file)
                            }
                          }}
                          className="w-full"
                        />
                      </TabsContent>
                      <TabsContent value="url" className="mt-3">
                        <div className="space-y-2">
                          <Input
                            type="url"
                            placeholder="https://example.com/image.jpg"
                            value={newItem.imageUrl && (newItem.imageUrl.startsWith("http") || newItem.imageUrl.startsWith("https")) ? newItem.imageUrl : ""}
                            onChange={(e) => {
                              const url = e.target.value.trim()
                              if (url) {
                                setNewItem({ ...newItem, imageUrl: url })
                              } else {
                                setNewItem({ ...newItem, imageUrl: "" })
                              }
                            }}
                            onBlur={(e) => {
                              const url = e.target.value.trim()
                              if (url) {
                                try {
                                  new URL(url)
                                  // Validate it's an image URL (optional check)
                                  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"]
                                  const hasImageExtension = imageExtensions.some((ext) =>
                                    url.toLowerCase().includes(ext)
                                  ) || url.match(/\.(jpg|jpeg|png|gif|webp|svg)/i)

                                  // Also allow URLs without extension (e.g., CDN URLs, API endpoints)
                                  if (!hasImageExtension && !url.includes("data:image")) {
                                    // Just warn, don't block - some URLs don't have extensions
                                    console.log("URL might not be an image, but allowing it")
                                  }
                                } catch {
                                  toast.error("Please enter a valid URL")
                                  setNewItem({ ...newItem, imageUrl: "" })
                                }
                              }
                            }}
                            className="w-full"
                          />
                          <p className="text-xs text-muted-foreground">
                            Paste an image URL (e.g., from Imgur, Cloudinary, or any image hosting service)
                          </p>
                        </div>
                      </TabsContent>
                    </Tabs>
                    {newItem.imageUrl && (
                      <div className="mt-3 flex items-center gap-3">
                        <div className="relative">
                          <Image
                            src={newItem.imageUrl}
                            alt="Preview"
                            width={80}
                            height={80}
                            className="object-cover rounded border"
                            onError={() => {
                              toast.error("Failed to load image. Please check the URL.")
                              setNewItem({ ...newItem, imageUrl: "" })
                            }}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setNewItem({ ...newItem, imageUrl: "" })}
                          className="text-destructive"
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => addOrUpdateItem(categoryName)}
                    className="w-full"
                    disabled={!newItem.name.trim() || !newItem.price || newItem.price <= 0 || saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : editingItemId ? (
                      "Update Item"
                    ) : (
                      "Add Item"
                    )}
                  </Button>
                  {editingItemId && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setNewItem({
                          name: "",
                          price: 0,
                          category: "",
                          description: "",
                          imageUrl: "",
                        })
                        setEditingItemId(null)
                      }}
                      className="w-full"
                      disabled={saving}
                    >
                      Cancel Edit
                    </Button>
                  )}
                </CardFooter>
              </>
            )}
          </Card>
        ))
      )}
    </div>
  )
}
