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
import { Plus, Pencil, Trash2, User } from "lucide-react";

export default function BarbersPage() {
  const { toast } = useToast();
  const { data: barbers = [] } = useQuery<Barber[]>({ queryKey: ["/api/barbers"] });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Barber | null>(null);
  const [form, setForm] = useState({ name: "", commission: "50", active: true });

  const openAdd = () => { setEditing(null); setForm({ name: "", commission: "50", active: true }); setDialogOpen(true); };
  const openEdit = (b: Barber) => { setEditing(b); setForm({ name: b.name, commission: b.commission.toString(), active: b.active }); setDialogOpen(true); };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = { name: form.name, commission: parseFloat(form.commission), active: form.active };
      if (editing) await apiRequest("PATCH", `/api/barbers/${editing.id}`, body);
      else await apiRequest("POST", "/api/barbers", body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/barbers"] });
      setDialogOpen(false);
      toast({ title: editing ? "Barber updated" : "Barber added" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/barbers/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/barbers"] }); toast({ title: "Barber deleted" }); },
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold" data-testid="text-barbers-title">Barbers</h1>
        <Button onClick={openAdd} data-testid="button-add-barber"><Plus className="w-4 h-4 mr-2" />Add Barber</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {barbers.map(b => (
          <Card key={b.id} className={`p-5 text-center ${!b.active ? "opacity-60" : ""}`} data-testid={`card-barber-${b.id}`}>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <User className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">{b.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">Commission: {b.commission}%</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <Button size="icon" variant="ghost" onClick={() => openEdit(b)} data-testid={`button-edit-barber-${b.id}`}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(b.id)} data-testid={`button-delete-barber-${b.id}`}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Barber" : "Add Barber"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} data-testid="input-barber-name" /></div>
            <div><Label>Commission (%)</Label><Input type="number" value={form.commission} onChange={e => setForm(p => ({ ...p, commission: e.target.value }))} data-testid="input-barber-commission" /></div>
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={v => setForm(p => ({ ...p, active: v }))} data-testid="switch-barber-active" />
              <Label>Active</Label>
            </div>
            <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.name} data-testid="button-save-barber">
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
