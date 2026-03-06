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
import type { Service } from "@shared/schema";
import { Plus, Pencil, Trash2, Scissors, Clock, Users, Hash } from "lucide-react";

export default function ServicesPage() {
  const { toast } = useToast();
  const { data: services = [] } = useQuery<Service[]>({ queryKey: ["/api/services"] });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState({
    name: "", nameAr: "", duration: "30", price: "0",
    active: true, requiresBarber: false, maxConcurrent: "1"
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", nameAr: "", duration: "30", price: "0", active: true, requiresBarber: false, maxConcurrent: "1" });
    setDialogOpen(true);
  };
  const openEdit = (s: Service) => {
    setEditing(s);
    setForm({
      name: s.name, nameAr: s.nameAr, duration: s.duration.toString(),
      price: s.price.toString(), active: s.active,
      requiresBarber: s.requiresBarber, maxConcurrent: s.maxConcurrent.toString()
    });
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = {
        name: form.name, nameAr: form.nameAr,
        duration: parseInt(form.duration), price: parseFloat(form.price),
        active: form.active, requiresBarber: form.requiresBarber,
        maxConcurrent: parseInt(form.maxConcurrent) || 1,
      };
      if (editing) await apiRequest("PATCH", `/api/services/${editing.id}`, body);
      else await apiRequest("POST", "/api/services", body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      setDialogOpen(false);
      toast({ title: editing ? "تم تحديث الخدمة" : "تمت إضافة الخدمة" });
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/services/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/services"] }); toast({ title: "تم حذف الخدمة" }); },
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-black" data-testid="text-services-title">الخدمات</h1>
        <Button onClick={openAdd} data-testid="button-add-service"><Plus className="w-4 h-4 ml-2" />إضافة خدمة</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map(s => (
          <Card key={s.id} className={`p-5 ${!s.active ? "opacity-50" : ""}`} data-testid={`card-service-${s.id}`}>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Scissors className="w-5 h-5 text-primary" />
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => openEdit(s)} data-testid={`button-edit-service-${s.id}`}><Pencil className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(s.id)} data-testid={`button-delete-service-${s.id}`}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </div>
            <h3 className="font-bold text-lg">{s.nameAr}</h3>
            <p className="text-xs text-muted-foreground mb-2">{s.name}</p>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2 flex-wrap">
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{s.duration} دقيقة</span>
              {s.requiresBarber
                ? <span className="flex items-center gap-1 text-primary text-xs font-medium"><Users className="w-3.5 h-3.5" />يتطلب حلاق</span>
                : <span className="flex items-center gap-1 text-xs"><Hash className="w-3.5 h-3.5" />حد {s.maxConcurrent} متزامن</span>
              }
            </div>
            <p className="text-xl font-black text-primary">{s.price} دينار</p>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "تعديل الخدمة" : "إضافة خدمة جديدة"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>الاسم بالعربية</Label><Input value={form.nameAr} onChange={e => setForm(p => ({ ...p, nameAr: e.target.value }))} data-testid="input-service-name-ar" /></div>
            <div><Label>الاسم بالإنجليزية</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} data-testid="input-service-name" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>المدة (دقيقة)</Label><Input type="number" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} data-testid="input-service-duration" /></div>
              <div><Label>السعر (دينار)</Label><Input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} data-testid="input-service-price" /></div>
            </div>

            <div className="border rounded-lg p-4 space-y-3">
              <p className="text-sm font-semibold text-muted-foreground">إعدادات الحجز</p>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">يتطلب اختيار حلاق</Label>
                  <p className="text-xs text-muted-foreground">كحلاقة الشعر</p>
                </div>
                <Switch checked={form.requiresBarber} onCheckedChange={v => setForm(p => ({ ...p, requiresBarber: v }))} data-testid="switch-requires-barber" />
              </div>
              {!form.requiresBarber && (
                <div>
                  <Label>الحد الأقصى للحجوزات المتزامنة</Label>
                  <p className="text-xs text-muted-foreground mb-1">كغرفة برايفت: حجز واحد في نفس الوقت</p>
                  <Input type="number" min="1" value={form.maxConcurrent} onChange={e => setForm(p => ({ ...p, maxConcurrent: e.target.value }))} data-testid="input-max-concurrent" />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={v => setForm(p => ({ ...p, active: v }))} data-testid="switch-service-active" />
              <Label>نشط</Label>
            </div>
            <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.nameAr} data-testid="button-save-service">
              {saveMutation.isPending ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
