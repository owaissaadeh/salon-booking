import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { StaffUser } from "@shared/schema";
import { Plus, Pencil, Trash2, UserCog, Eye, EyeOff } from "lucide-react";

const ROLES: Record<string, string> = {
  admin: "مدير",
  manager: "مشرف",
  receptionist: "موظف استقبال",
  sales: "مبيعات",
};

export default function StaffPage() {
  const { toast } = useToast();
  const { data: staffUsers = [] } = useQuery<StaffUser[]>({ queryKey: ["/api/staff"] });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StaffUser | null>(null);
  const [form, setForm] = useState({ name: "", username: "", pin: "", role: "receptionist", active: true });
  const [showPin, setShowPin] = useState(false);

  const openAdd = () => { setEditing(null); setForm({ name: "", username: "", pin: "", role: "receptionist", active: true }); setDialogOpen(true); };
  const openEdit = (u: StaffUser) => { setEditing(u); setForm({ name: u.name, username: u.username, pin: "", role: u.role, active: u.active }); setDialogOpen(true); };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = { name: form.name, username: form.username, role: form.role, active: form.active };
      if (form.pin) body.pin = form.pin;
      if (editing) await apiRequest("PATCH", `/api/staff/${editing.id}`, body);
      else {
        if (!form.pin) throw new Error("يجب إدخال الرمز السري");
        await apiRequest("POST", "/api/staff", { ...body, pin: form.pin });
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/staff"] }); setDialogOpen(false); toast({ title: editing ? "تم التحديث" : "تمت الإضافة" }); },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/staff/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/staff"] }); toast({ title: "تم الحذف" }); },
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black" data-testid="text-staff-title">إدارة الموظفين</h1>
          <p className="text-sm text-muted-foreground">{staffUsers.length} موظف</p>
        </div>
        <Button onClick={openAdd} data-testid="button-add-staff"><Plus className="w-4 h-4 ml-2" />إضافة موظف</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {staffUsers.map(u => (
          <Card key={u.id} className={`p-5 ${!u.active ? "opacity-50" : ""}`} data-testid={`card-staff-${u.id}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <UserCog className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold">{u.name}</h3>
                <p className="text-xs text-muted-foreground">@{u.username}</p>
              </div>
              <Badge className="mr-auto" variant={u.active ? "default" : "secondary"}>{ROLES[u.role] || u.role}</Badge>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(u)} data-testid={`button-edit-staff-${u.id}`}>
                <Pencil className="w-3.5 h-3.5 ml-1" /> تعديل
              </Button>
              <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(u.id)} data-testid={`button-delete-staff-${u.id}`}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </Card>
        ))}
        {staffUsers.length === 0 && (
          <Card className="col-span-full p-16 text-center">
            <UserCog className="w-14 h-14 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">لا يوجد موظفون مسجلون</p>
          </Card>
        )}
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "تعديل الموظف" : "إضافة موظف جديد"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>الاسم الكامل</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} data-testid="input-staff-name" /></div>
            <div><Label>اسم المستخدم</Label><Input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} placeholder="بالإنجليزية" data-testid="input-staff-username" /></div>
            <div>
              <Label>{editing ? "الرمز السري الجديد (اتركه فارغاً للإبقاء)" : "الرمز السري (PIN)"}</Label>
              <div className="relative">
                <Input type={showPin ? "text" : "password"} value={form.pin} onChange={e => setForm(p => ({ ...p, pin: e.target.value }))}
                  placeholder={editing ? "اتركه فارغاً للإبقاء" : "أرقام فقط"} data-testid="input-staff-pin" />
                <button type="button" onClick={() => setShowPin(!showPin)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label>الدور</Label>
              <Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v }))}>
                <SelectTrigger data-testid="select-staff-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLES).map(([val, label]) => <SelectItem key={val} value={val}>{label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={v => setForm(p => ({ ...p, active: v }))} data-testid="switch-staff-active" />
              <Label>حساب نشط</Label>
            </div>
            <Button className="w-full" onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !form.name || !form.username || (!editing && !form.pin)}
              data-testid="button-save-staff">
              {saveMutation.isPending ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
