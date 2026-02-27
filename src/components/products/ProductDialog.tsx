import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { productSchema, type ProductFormData } from "@/lib/validations";
import { slugify } from "@/lib/utils/slugify";
import { useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import { useProductOffers, useCreateProductOffer, useUpdateProductOffer, useDeleteProductOffer } from "@/hooks/useProductOffers";
import { useProductAliases, useCreateProductAlias, useDeleteProductAlias } from "@/hooks/useProductAliases";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X, Pencil, Trash2, Plus, Tag } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Product = Database["public"]["Tables"]["products"]["Row"];

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
}

const productTypes = [
  { value: "curso", label: "Curso Online" },
  { value: "mentoria", label: "Mentoria" },
  { value: "ebook", label: "E-book" },
  { value: "evento", label: "Evento" },
  { value: "outro", label: "Outro" },
];

const colorPresets = [
  "#3B82F6", // blue
  "#8B5CF6", // purple
  "#10B981", // green
  "#F59E0B", // yellow
  "#EF4444", // red
  "#EC4899", // pink
];

export function ProductDialog({ open, onOpenChange, product }: ProductDialogProps) {
  const [autoSlug, setAutoSlug] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [showNewOffer, setShowNewOffer] = useState(false);
  const [newOfferCode, setNewOfferCode] = useState("");
  const [newOfferName, setNewOfferName] = useState("");
  const [newOfferPrice, setNewOfferPrice] = useState("");
  const [newOfferType, setNewOfferType] = useState("venda");
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [newAliasName, setNewAliasName] = useState("");
  const [selectedColor, setSelectedColor] = useState(colorPresets[2]); // Default green for products

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const { data: offers = [], isLoading: loadingOffers } = useProductOffers(product?.id);
  const createOffer = useCreateProductOffer();
  const updateOffer = useUpdateProductOffer();
  const deleteOffer = useDeleteProductOffer();

  // Aliases hooks
  const { data: aliases = [], isLoading: loadingAliases } = useProductAliases(product?.id);
  const createAlias = useCreateProductAlias();
  const deleteAlias = useDeleteProductAlias();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      slug: "",
      type: "curso",
      description: "",
      price: 0,
      image_url: "",
      is_active: true,
    },
  });

  const nameValue = watch("name");
  const typeValue = watch("type");
  const isActiveValue = watch("is_active");

  // Auto-generate slug from name
  useEffect(() => {
    if (autoSlug && nameValue && !product) {
      setValue("slug", slugify(nameValue));
    }
  }, [nameValue, autoSlug, setValue, product]);

  // Load product data when editing
  useEffect(() => {
    if (product && open) {
      reset({
        name: product.name,
        slug: product.slug,
        type: product.type as any,
        description: product.description || "",
        price: Number(product.price),
        image_url: product.image_url || "",
        is_active: product.is_active ?? true,
      });
      setAutoSlug(false);
      setImagePreview(product.image_url || null);
      setSelectedColor((product as any).color || colorPresets[2]);
    } else if (!open) {
      reset();
      setAutoSlug(true);
      setImageFile(null);
      setImagePreview(null);
      setSelectedColor(colorPresets[2]);
      setShowNewOffer(false);
      setNewOfferCode("");
      setNewOfferName("");
      setNewOfferPrice("");
      setNewOfferType("venda");
      setEditingOfferId(null);
      setNewAliasName("");
    }
  }, [product, open, reset]);

  const handleImageUpload = async (file: File): Promise<string | null> => {
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione um arquivo de imagem válido");
      return null;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error("Erro ao fazer upload da imagem");
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setValue("image_url", "");
  };

  const handleAddOffer = async () => {
    if (!product?.id || !newOfferCode || !newOfferName) {
      toast.error("Preencha o código e nome da oferta");
      return;
    }

    try {
      if (editingOfferId) {
        await updateOffer.mutateAsync({
          id: editingOfferId,
          productId: product.id,
          updates: {
            hotmart_code: newOfferCode,
            offer_name: newOfferName,
            offer_price: parseFloat(newOfferPrice) || 0,
            offer_type: newOfferType,
          },
        });
        setEditingOfferId(null);
      } else {
        await createOffer.mutateAsync({
          product_id: product.id,
          hotmart_code: newOfferCode,
          offer_name: newOfferName,
          offer_price: parseFloat(newOfferPrice) || 0,
          offer_type: newOfferType,
          is_active: true,
        });
      }

      setShowNewOffer(false);
      setNewOfferCode("");
      setNewOfferName("");
      setNewOfferPrice("");
      setNewOfferType("venda");
    } catch (error) {
      console.error("Error managing offer:", error);
    }
  };

  const handleEditOffer = (offer: any) => {
    setEditingOfferId(offer.id);
    setNewOfferCode(offer.hotmart_code);
    setNewOfferName(offer.offer_name);
    setNewOfferPrice(String(offer.offer_price));
    setNewOfferType(offer.offer_type);
    setShowNewOffer(true);
  };

  const handleDeleteOffer = async (offerId: string) => {
    if (!product?.id) return;
    await deleteOffer.mutateAsync({ id: offerId, productId: product.id });
  };

  const handleAddAlias = async () => {
    if (!product?.id || !newAliasName.trim()) {
      toast.error("Digite um nome de alias");
      return;
    }
    await createAlias.mutateAsync({ productId: product.id, aliasName: newAliasName });
    setNewAliasName("");
  };

  const handleDeleteAlias = async (aliasName: string) => {
    if (!product?.id) return;
    await deleteAlias.mutateAsync({ productId: product.id, aliasName });
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      let imageUrl = data.image_url;

      // Upload new image if selected
      if (imageFile) {
        const uploadedUrl = await handleImageUpload(imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      if (product) {
        await updateProduct.mutateAsync({
          id: product.id,
          updates: {
            name: data.name,
            slug: data.slug,
            type: data.type,
            description: data.description,
            price: data.price,
            image_url: imageUrl,
            is_active: data.is_active,
            color: selectedColor,
          },
        });
      } else {
        await createProduct.mutateAsync({
          name: data.name,
          slug: data.slug,
          type: data.type,
          description: data.description,
          price: data.price,
          image_url: imageUrl,
          is_active: data.is_active,
          color: selectedColor,
        } as any);
      }
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving product:", error);
      if (error?.message?.includes("row-level security") || error?.code === "42501") {
        toast.error("Você não tem permissão para salvar este produto. Contate um administrador.");
      } else {
        toast.error("Erro ao salvar produto. Tente novamente.");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Editar Produto" : "Novo Produto"}</DialogTitle>
          <DialogDescription>
            {product
              ? "Atualize as informações do produto"
              : "Preencha as informações para criar um novo produto"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Produto *</Label>
              <Input id="name" {...register("name")} placeholder="Ex: Curso Completo de Marketing Digital" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL) *</Label>
              <Input
                id="slug"
                {...register("slug")}
                placeholder="curso-completo-marketing-digital"
                onChange={(e) => {
                  setAutoSlug(false);
                  register("slug").onChange(e);
                }}
              />
              {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
              <p className="text-xs text-muted-foreground">
                Usado para identificar o produto na URL e integrações
              </p>
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select value={typeValue} onValueChange={(value) => setValue("type", value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {productTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...register("price", { valueAsNumber: true })}
                placeholder="497.00"
              />
              {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Descreva o produto..."
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>Cor de Identificação</Label>
              <div className="flex gap-2">
                {colorPresets.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-10 h-10 rounded-full transition-smooth hover:scale-110 border-2"
                    style={{
                      backgroundColor: color,
                      borderColor: selectedColor === color ? color : "transparent",
                      opacity: selectedColor === color ? 1 : 0.6,
                    }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Esta cor será usada para destacar o produto na lista de Leads
              </p>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Imagem do Produto</Label>

              {imagePreview ? (
                <div className="relative w-full h-48 border-2 border-border rounded-lg overflow-hidden">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Arraste uma imagem aqui ou clique para selecionar
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, WEBP até 5MB
                  </p>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>
              )}
            </div>

            {/* Hotmart Offers Section */}
            {product && (
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Ofertas da Hotmart</Label>
                    <p className="text-sm text-muted-foreground">
                      Vincule códigos de produtos Hotmart a este produto
                    </p>
                  </div>
                </div>

                {/* List existing offers */}
                {loadingOffers ? (
                  <div className="text-sm text-muted-foreground">Carregando ofertas...</div>
                ) : offers.length > 0 ? (
                  <div className="space-y-2">
                    {offers.map((offer) => (
                      <div key={offer.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-medium">📦 {offer.hotmart_code}</span>
                            <span className="text-sm">- {offer.offer_name}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>R$ {Number(offer.offer_price).toFixed(2)}</span>
                            <span>•</span>
                            <span className="capitalize">{offer.offer_type}</span>
                            {offer.is_active && <span className="text-[hsl(160,55%,40%)] dark:text-[#CCFF00]">✅ Ativa</span>}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditOffer(offer)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteOffer(offer.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Nenhuma oferta cadastrada</div>
                )}

                {/* Add new offer form */}
                {showNewOffer ? (
                  <div className="space-y-3 p-4 border border-border rounded-lg bg-muted/30">
                    <div className="space-y-2">
                      <Label htmlFor="offer-code">Código Hotmart *</Label>
                      <Input
                        id="offer-code"
                        value={newOfferCode}
                        onChange={(e) => setNewOfferCode(e.target.value)}
                        placeholder="Ex: 6561299"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="offer-name">Nome da Oferta *</Label>
                      <Input
                        id="offer-name"
                        value={newOfferName}
                        onChange={(e) => setNewOfferName(e.target.value)}
                        placeholder="Ex: Renovação Anual"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="offer-price">Preço (R$)</Label>
                        <Input
                          id="offer-price"
                          type="number"
                          step="0.01"
                          value={newOfferPrice}
                          onChange={(e) => setNewOfferPrice(e.target.value)}
                          placeholder="997.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="offer-type">Tipo</Label>
                        <Select value={newOfferType} onValueChange={setNewOfferType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="venda">Venda</SelectItem>
                            <SelectItem value="assinatura">Assinatura</SelectItem>
                            <SelectItem value="renovacao">Renovação</SelectItem>
                            <SelectItem value="upsell">Upsell</SelectItem>
                            <SelectItem value="downsell">Downsell</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={handleAddOffer}
                        disabled={createOffer.isPending || updateOffer.isPending}
                        className="flex-1"
                      >
                        {editingOfferId ? "Atualizar Oferta" : "Adicionar Oferta"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowNewOffer(false);
                          setEditingOfferId(null);
                          setNewOfferCode("");
                          setNewOfferName("");
                          setNewOfferPrice("");
                          setNewOfferType("venda");
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewOffer(true)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Nova Oferta
                  </Button>
                )}
              </div>
            )}

            {/* Product Aliases Section */}
            {product && (
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <Label className="text-base">Aliases / Variações de Nome</Label>
                    <p className="text-sm text-muted-foreground">
                      Nomes alternativos que serão reconhecidos automaticamente como este produto
                    </p>
                  </div>
                </div>

                {/* List existing aliases */}
                {loadingAliases ? (
                  <div className="text-sm text-muted-foreground">Carregando aliases...</div>
                ) : aliases.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {aliases.map((alias) => (
                      <div
                        key={alias.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-muted rounded-full text-sm"
                      >
                        <span>{alias.alias_name}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteAlias(alias.alias_name)}
                          className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Nenhum alias cadastrado. Adicione variações do nome do produto para melhor reconhecimento.
                  </div>
                )}

                {/* Add new alias */}
                <div className="flex gap-2">
                  <Input
                    value={newAliasName}
                    onChange={(e) => setNewAliasName(e.target.value)}
                    placeholder="Ex: Comunidade - O Segredo do Viajante"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAlias();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddAlias}
                    disabled={createAlias.isPending || !newAliasName.trim()}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
              </div>
            )}

            {/* Is Active */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div>
                <Label htmlFor="is_active" className="text-base">
                  Produto Ativo
                </Label>
                <p className="text-sm text-muted-foreground">
                  Produtos inativos não aparecem nas listagens
                </p>
              </div>
              <Switch
                id="is_active"
                checked={isActiveValue}
                onCheckedChange={(checked) => setValue("is_active", checked)}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>
              {createProduct.isPending || updateProduct.isPending ? "Salvando..." : "Salvar Produto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
