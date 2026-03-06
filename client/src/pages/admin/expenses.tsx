import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Expense } from "@shared/schema";
import { Plus, Trash2 } from "lucide-react";

const CATEGORIES = ["أدوات", "تنظيف", "إيجار", "رواتب", "مستلزمات", "فواتير", "صيانة", "أخرى"];

export default function ExpensesPage() {
  const { toast } = useToast();
  const { data: expenses = [] } = useQuery<Expense[]>({ queryKey: ["/api/expenses"] });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ category: "", description: "", amount: "", date: new Date().toISOString().split("T")[0] });

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/expenses", { category: form.category, description: form.description || null, amount: parseFloat(form.amount), date: form.date });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      setDialogOpen(false);
      setForm({ category: "", description: "", amount: "", date: new Date().toISOString().split("T")[0] });
      toast({ title: "تمت إضافة المصروف" });
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/expenses/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/expenses"] }); toast({ title: "تم الحذف" }); },
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black" data-testid="text-expenses-title">المصاريف</h1>
          <p className="text-sm text-muted-foreground">الإجمالي: <span className="font-bold text-destructive">{total.toFixed(2)} دينار</span></p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-add-expense"><Plus className="w-4 h-4 ml-2" />إضافة مصروف</Button>
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                {["الفئة", "الوصف", "المبلغ", "التاريخ", "حذف"].map(h => (
                  <th key={h} className="text-right p-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {expenses.map(e => (
                <tr key={e.id} className="border-b last:border-0" data-testid={`row-expense-${e.id}`}>
                  <td className="p-3">
                    <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">{e.category}</span>
                  </td>
                  <td className="p-3 text-muted-foreground">{e.description || "—"}</td>
                  <td className="p-3 font-bold text-destructive">{e.amount.toFixed(2)} دينار</td>
                  <td className="p-3 text-muted-foreground">{e.date}</td>
                  <td className="p-3">
                    <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(e.id)} data-testid={`button-delete-expense-${e.id}`}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">لا توجد مصاريف مسجّلة</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>إضافة مصروف</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>الفئة</Label>
              <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                <SelectTrigger data-testid="select-expense-category"><SelectValue placeholder="اختر الفئة" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>الوصف (اختياري)</Label><Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="تفاصيل المصروف" data-testid="input-expense-description" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>المبلغ (دينار)</Label><Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} data-testid="input-expense-amount" /></div>
              <div><Label>التاريخ</Label><Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></div>
            </div>
            <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.category || !form.amount} data-testid="button-save-expense">
              {saveMutation.isPending ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
