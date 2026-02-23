import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import type { Product } from "@/lib/types";
import { categoryLabels } from "@/lib/types";

interface ProductCardProps {
  product: Product;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
};

const getCategoryEmoji = (category: string) => {
  const emojis: Record<string, string> = {
    sayur: "🥬",
    buah: "🍊",
    protein: "🍗",
    karbohidrat: "🍚",
    bumbu: "🌶️",
    tambahan: "📦",
  };
  return emojis[category] || "📦";
};

const ProductCard = ({ product }: ProductCardProps) => {
  const { toast } = useToast();
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart(product, 1);
    toast({
      title: "Ditambahkan ke keranjang",
      description: `${product.name} berhasil ditambahkan`,
    });
  };

  // Get first category for display, or show multiple if product has multiple categories
  const displayCategories = product.category.slice(0, 2).map(cat => 
    `${getCategoryEmoji(cat)} ${categoryLabels[cat] || cat}`
  ).join(", ");

  return (
    <div className="glass-card group overflow-hidden">
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-3 left-3">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-card/90 backdrop-blur-sm">
            {displayCategories}
          </span>
        </div>
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center">
            <span className="bg-background px-4 py-2 rounded-full text-sm font-medium">
              Stok Habis
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 truncate">{product.name}</h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {product.description}
        </p>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold gradient-text">
              {formatPrice(product.price)}
            </p>
            <p className="text-xs text-muted-foreground">per {product.unit}</p>
          </div>

          <Button
            variant="gradient"
            size="sm"
            onClick={handleAddToCart}
            disabled={!product.isAvailable}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Tambah
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
