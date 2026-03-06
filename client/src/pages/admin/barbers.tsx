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
import type { Barber } from "@shared/schema";
import { Plus, Pencil, Trash2, User, ExternalLink } from "lucide-react";
import { Link } from "wouter";

export default function BarbersPage() {
  const { toast } = useToast();
  const { data: barbers = [] } = useQuery<Barber[]>({ queryKey: ["/api/barbers"] });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Barber | null>(null);
  const [form, setForm] = useState({ name: "", commission: "50", phone: "", notes: "", active: true });

  const openAdd = () => { setEditing(null); setForm({ name: "", commission: "50", phone: "", notes: "", active: true }); setDialogOpen(true); };
  const openEdit = (b: Barber) => { setEditing(b); setForm({ name: b.name, commission: b.commission.toString(), phone: b.phone || "", notes: b.notes || "", active: b.active }); setDialogOpen(true); };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = { name: form.name, commission: parseFloat(form.commission), phone: form.phone || null, notes: form.notes || null, active: form.active };
      if (editing) await apiRequest("PATCH", `/api/barbers/${editing.id}`, body);
      else await apiRequest("POST", "/api/barbers", body);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/barbers"] }); setDialogOpen(false); toast({ title: editing ? "تم التحديث" : "تمت الإضافة" }); },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/barbers/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/barbers"] }); toast({ title: "تم الحذف" }); },
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-black" data-testid="text-barbers-title">الحلاقون</h1>
        <Button onClick={openAdd} data-testid="button-add-barber"><Plus className="w-4 h-4 ml-2" />إضافة حلاق</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {barbers.map(b => (
          <Card key={b.id} className={`p-5 ${!b.active ? "opacity-50" : ""}`} data-testid={`card-barber-${b.id}`}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">{b.name}</h3>
                <p className="text-sm text-muted-foreground">عمولة: {b.commission}%</p>
                {b.phone && <p className="text-xs text-muted-foreground">{b.phone}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/admin/barbers/${b.id}`}>
                <Button size="sm" variant="outline" className="flex-1" data-testid={`button-view-barber-${b.id}`}>
                  <ExternalLink className="w-3.5 h-3.5 ml-1" /> الملف
                </Button>
              </Link>
              <Button size="icon" variant="ghost" onClick={() => openEdit(b)} data-testid={`button-edit-barber-${b.id}`}><Pencil className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(b.id)} data-testid={`button-delete-barber-${b.id}`}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          </Card>
        ))}
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "تعديل الحلاق" : "إضافة حلاق"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>الاسم</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} data-testid="input-barber-name" /></div>
            <div><Label>العمولة %</Label><Input type="number" value={form.commission} onChange={e => setForm(p => ({ ...p, commission: e.target.value }))} data-testid="input-barber-commission" /></div>
            <div><Label>رقم الجوال</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="اختياري" /></div>
            <div><Label>ملاحظات</Label><Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="اختياري" /></div>
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={v => setForm(p => ({ ...p, active: v }))} data-testid="switch-barber-active" />
              <Label>نشط</Label>
            </div>
            <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.name} data-testid="button-save-barber">
              {saveMutation.isPending ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
