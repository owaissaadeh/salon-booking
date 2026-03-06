import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { BarberWithdrawal } from "@shared/schema";
import { ArrowRight, DollarSign, Scissors, TrendingDown, Wallet, Plus, Trash2, User } from "lucide-react";

interface BarberProfile {
  barber: { id: number; name: string; commission: number; phone: string | null; notes: string | null };
  fromDate: string;
  toDate: string;
  servicesRevenue: number;
  commissionEarned: number;
  totalWithdrawn: number;
  balance: number;
  transactionCount: number;
  withdrawals: BarberWithdrawal[];
}

export default function BarberProfilePage() {
  const { id } = useParams();
  const { toast } = useToast();
  const today = new Date().toISOString().split("T")[0];
  const monthStart = today.substring(0, 7) + "-01";
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);
  const [queryParams, setQueryParams] = useState({ from: monthStart, to: today });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [wForm, setWForm] = useState({ amount: "", description: "", date: today });

  const { data: profile, isLoading } = useQuery<BarberProfile>({
    queryKey: [`/api/barbers/${id}/profile`, queryParams.from, queryParams.to],
    queryFn: () => fetch(`/api/barbers/${id}/profile?from=${queryParams.from}&to=${queryParams.to}`).then(r => r.json()),
    enabled: !!id,
  });

  const addWithdrawal = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/barber-withdrawals", {
        barberId: parseInt(id!),
        amount: parseFloat(wForm.amount),
        date: wForm.date,
        description: wForm.description || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/barbers/${id}/profile`] });
      setDialogOpen(false);
      setWForm({ amount: "", description: "", date: today });
      toast({ title: "تمت إضافة السحب" });
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const deleteWithdrawal = useMutation({
    mutationFn: async (wId: number) => { await apiRequest("DELETE", `/api/barber-withdrawals/${wId}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/barbers/${id}/profile`] }); toast({ title: "تم الحذف" }); },
  });

  if (isLoading) return <div className="flex items-center justify-center h-64 text-muted-foreground">جاري التحميل...</div>;
  if (!profile || !profile.barber) return <div className="text-center py-20">الحلاق غير موجود</div>;

  const { barber } = profile;

  const stats = [
    { label: "إيرادات الخدمات", value: profile.servicesRevenue, icon: Scissors, color: "text-chart-2", bg: "bg-chart-2/10" },
    { label: "العمولة المستحقة", value: profile.commissionEarned, icon: DollarSign, color: "text-primary", bg: "bg-primary/10" },
    { label: "إجمالي السحبات", value: profile.totalWithdrawn, icon: TrendingDown, color: "text-destructive", bg: "bg-destructive/10" },
    { label: "الرصيد المتبقي", value: profile.balance, icon: Wallet, color: profile.balance >= 0 ? "text-chart-2" : "text-destructive", bg: profile.balance >= 0 ? "bg-chart-2/10" : "bg-destructive/10" },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/barbers">
          <Button variant="ghost" size="icon" data-testid="button-back-barbers"><ArrowRight className="w-5 h-5" /></Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black" data-testid="text-barber-name">{barber.name}</h1>
            <p className="text-sm text-muted-foreground">عمولة {barber.commission}% — {profile.transactionCount} معاملة</p>
          </div>
        </div>
      </div>

      <Card className="p-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <Label className="text-xs mb-1 block">من</Label>
            <Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-36" />
          </div>
          <div>
            <Label className="text-xs mb-1 block">إلى</Label>
            <Input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-36" />
          </div>
          <Button onClick={() => setQueryParams({ from, to })}>تحديث</Button>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, i) => (
          <Card key={i} className="p-5" data-testid={`barber-stat-${i}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{stat.label}</span>
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <p className={`text-xl font-black ${stat.color}`}>{stat.value.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">دينار</p>
          </Card>
        ))}
      </div>

      {barber.phone && (
        <Card className="p-4 mb-6 flex items-center gap-3">
          <span className="text-sm text-muted-foreground">الجوال:</span>
          <span className="font-semibold">{barber.phone}</span>
        </Card>
      )}

      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-lg font-bold">سجل السحبات</h2>
        <Button size="sm" onClick={() => setDialogOpen(true)} data-testid="button-add-withdrawal">
          <Plus className="w-4 h-4 ml-1" /> سحب جديد
        </Button>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              {["المبلغ", "الوصف", "التاريخ", "حذف"].map(h => (
                <th key={h} className="text-right p-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {profile.withdrawals.map(w => (
              <tr key={w.id} className="border-b last:border-0" data-testid={`row-withdrawal-${w.id}`}>
                <td className="p-3 font-bold text-destructive">{w.amount.toFixed(2)} دينار</td>
                <td className="p-3 text-muted-foreground">{w.description || "—"}</td>
                <td className="p-3">{w.date}</td>
                <td className="p-3">
                  <Button size="icon" variant="ghost" onClick={() => deleteWithdrawal.mutate(w.id)} data-testid={`button-delete-withdrawal-${w.id}`}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
            {profile.withdrawals.length === 0 && (
              <tr><td colSpan={4} className="p-10 text-center text-muted-foreground">لا توجد سحبات</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>سحب عمولة — {barber.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-xs text-muted-foreground">الرصيد المتاح</p>
              <p className={`text-2xl font-black ${profile.balance >= 0 ? "text-chart-2" : "text-destructive"}`}>
                {profile.balance.toFixed(2)} دينار
              </p>
            </div>
            <div><Label>المبلغ (دينار)</Label><Input type="number" value={wForm.amount} onChange={e => setWForm(p => ({ ...p, amount: e.target.value }))} data-testid="input-withdrawal-amount" /></div>
            <div><Label>الوصف (اختياري)</Label><Input value={wForm.description} onChange={e => setWForm(p => ({ ...p, description: e.target.value }))} /></div>
            <div><Label>التاريخ</Label><Input type="date" value={wForm.date} onChange={e => setWForm(p => ({ ...p, date: e.target.value }))} /></div>
            <Button className="w-full" onClick={() => addWithdrawal.mutate()} disabled={addWithdrawal.isPending || !wForm.amount} data-testid="button-save-withdrawal">
              {addWithdrawal.isPending ? "جاري الحفظ..." : "تأكيد السحب"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
