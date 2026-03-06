import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";
import { Plus, Pencil, Trash2, Package } from "lucide-react";

export default function ProductsPage() {
  const { toast } = useToast();
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: "", price: "0", stock: "0", active: true });

  const openAdd = () => { setEditing(null); setForm({ name: "", price: "0", stock: "0", active: true }); setDialogOpen(true); };
  const openEdit = (p: Product) => { setEditing(p); setForm({ name: p.name, price: p.price.toString(), stock: p.stock.toString(), active: p.active }); setDialogOpen(true); };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = { name: form.name, price: parseFloat(form.price), stock: parseInt(form.stock), active: form.active };
      if (editing) await apiRequest("PATCH", `/api/products/${editing.id}`, body);
      else await apiRequest("POST", "/api/products", body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setDialogOpen(false);
      toast({ title: editing ? "Product updated" : "Product added" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/products/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/products"] }); toast({ title: "Product deleted" }); },
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold" data-testid="text-products-title">Products & Inventory</h1>
        <Button onClick={openAdd} data-testid="button-add-product"><Plus className="w-4 h-4 mr-2" />Add Product</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(p => (
          <Card key={p.id} className={`p-4 ${!p.active ? "opacity-60" : ""}`} data-testid={`card-product-${p.id}`}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-chart-3/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-chart-3" />
                </div>
                <div>
                  <h3 className="font-semibold">{p.name}</h3>
                  <p className="text-lg font-bold text-primary">{p.price} SAR</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => openEdit(p)} data-testid={`button-edit-product-${p.id}`}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(p.id)} data-testid={`button-delete-product-${p.id}`}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
            <div className={`text-sm font-medium ${p.stock < 5 ? "text-destructive" : "text-muted-foreground"}`}>
              Stock: {p.stock} {p.stock < 5 && "(Low)"}
            </div>
          </Card>
        ))}
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Product" : "Add Product"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} data-testid="input-product-name" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Price (SAR)</Label><Input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} data-testid="input-product-price" /></div>
              <div><Label>Stock</Label><Input type="number" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} data-testid="input-product-stock" /></div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={v => setForm(p => ({ ...p, active: v }))} data-testid="switch-product-active" />
              <Label>Active</Label>
            </div>
            <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.name} data-testid="button-save-product">
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
