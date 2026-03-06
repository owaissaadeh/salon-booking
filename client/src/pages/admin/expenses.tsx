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

const categories = ["electricity", "maintenance", "equipment", "salary", "withdrawal", "rent", "supplies", "other"];

export default function ExpensesPage() {
  const { toast } = useToast();
  const { data: expenses = [] } = useQuery<Expense[]>({ queryKey: ["/api/expenses"] });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ category: "other", description: "", amount: "0", date: new Date().toISOString().split("T")[0] });

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/expenses", { ...form, amount: parseFloat(form.amount) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      setDialogOpen(false);
      toast({ title: "Expense added" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/expenses/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/expenses"] }); toast({ title: "Expense deleted" }); },
  });

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-expenses-title">Expenses</h1>
          <p className="text-sm text-muted-foreground">Total: {totalExpenses.toFixed(2)} SAR</p>
        </div>
        <Button onClick={() => { setForm({ category: "other", description: "", amount: "0", date: new Date().toISOString().split("T")[0] }); setDialogOpen(true); }}
          data-testid="button-add-expense"><Plus className="w-4 h-4 mr-2" />Add Expense</Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-left p-3 font-medium">Category</th>
                <th className="text-left p-3 font-medium">Description</th>
                <th className="text-right p-3 font-medium">Amount</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length ? expenses.map(e => (
                <tr key={e.id} className="border-b last:border-0" data-testid={`row-expense-${e.id}`}>
                  <td className="p-3">{e.date}</td>
                  <td className="p-3 capitalize">{e.category}</td>
                  <td className="p-3 text-muted-foreground">{e.description || "-"}</td>
                  <td className="p-3 text-right font-medium">{e.amount.toFixed(2)} SAR</td>
                  <td className="p-3 text-right">
                    <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(e.id)} data-testid={`button-delete-expense-${e.id}`}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No expenses recorded</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                <SelectTrigger data-testid="select-expense-category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Description</Label><Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} data-testid="input-expense-description" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Amount (SAR)</Label><Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} data-testid="input-expense-amount" /></div>
              <div><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} data-testid="input-expense-date" /></div>
            </div>
            <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} data-testid="button-save-expense">
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
