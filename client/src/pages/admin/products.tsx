import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/products"] }); setDialogOpen(false); toast({ title: editing ? "تم التحديث" : "تمت الإضافة" }); },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/products/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/products"] }); toast({ title: "تم الحذف" }); },
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-black" data-testid="text-products-title">المنتجات</h1>
        <Button onClick={openAdd} data-testid="button-add-product"><Plus className="w-4 h-4 ml-2" />إضافة منتج</Button>
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                {["المنتج", "السعر", "المخزون", "الحالة", "إجراءات"].map(h => (
                  <th key={h} className="text-right p-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="border-b last:border-0" data-testid={`row-product-${p.id}`}>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-chart-3/10 flex items-center justify-center">
                        <Package className="w-4 h-4 text-chart-3" />
                      </div>
                      <span className="font-semibold">{p.name}</span>
                    </div>
                  </td>
                  <td className="p-3 font-bold text-primary">{p.price} دينار</td>
                  <td className="p-3">
                    <span className={`font-bold ${p.stock < 5 ? "text-destructive" : ""}`}>{p.stock}</span>
                    {p.stock < 5 && <span className="text-xs text-destructive mr-1">(منخفض)</span>}
                  </td>
                  <td className="p-3"><Badge variant={p.active ? "default" : "secondary"}>{p.active ? "نشط" : "غير نشط"}</Badge></td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(p)} data-testid={`button-edit-product-${p.id}`}><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(p.id)} data-testid={`button-delete-product-${p.id}`}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">لا توجد منتجات</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "تعديل المنتج" : "إضافة منتج"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>اسم المنتج</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} data-testid="input-product-name" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>السعر (دينار)</Label><Input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} data-testid="input-product-price" /></div>
              <div><Label>المخزون</Label><Input type="number" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} data-testid="input-product-stock" /></div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={v => setForm(p => ({ ...p, active: v }))} data-testid="switch-product-active" />
              <Label>نشط</Label>
            </div>
            <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.name} data-testid="button-save-product">
              {saveMutation.isPending ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
