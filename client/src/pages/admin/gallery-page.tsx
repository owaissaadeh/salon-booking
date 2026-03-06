import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { GalleryImage } from "@shared/schema";
import { Plus, Trash2, Image } from "lucide-react";

export default function GalleryPage() {
  const { toast } = useToast();
  const { data: images = [] } = useQuery<GalleryImage[]>({ queryKey: ["/api/gallery"] });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ url: "", caption: "" });

  const addMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/gallery", { url: form.url, caption: form.caption || null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
      setDialogOpen(false);
      setForm({ url: "", caption: "" });
      toast({ title: "تمت إضافة الصورة" });
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/gallery/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/gallery"] }); toast({ title: "تم حذف الصورة" }); },
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-black" data-testid="text-gallery-title">معرض الأعمال</h1>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-add-image"><Plus className="w-4 h-4 ml-2" />إضافة صورة</Button>
      </div>
      {images.length === 0 ? (
        <Card className="p-16 text-center">
          <Image className="w-14 h-14 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground">لا توجد صور في المعرض</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map(img => (
            <div key={img.id} className="group relative aspect-square rounded-xl overflow-hidden border" data-testid={`gallery-img-${img.id}`}>
              <img src={img.url} alt={img.caption || "صورة"} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button size="icon" variant="destructive" onClick={() => deleteMutation.mutate(img.id)} data-testid={`button-delete-img-${img.id}`}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              {img.caption && (
                <div className="absolute bottom-0 inset-x-0 bg-foreground/60 text-background text-xs p-2 font-medium">{img.caption}</div>
              )}
            </div>
          ))}
        </div>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>إضافة صورة</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>رابط الصورة</Label><Input value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} placeholder="https://..." data-testid="input-image-url" /></div>
            <div><Label>التعليق (اختياري)</Label><Input value={form.caption} onChange={e => setForm(p => ({ ...p, caption: e.target.value }))} placeholder="وصف الصورة" /></div>
            {form.url && (
              <div className="aspect-video rounded-lg overflow-hidden border">
                <img src={form.url} alt="معاينة" className="w-full h-full object-cover" onError={() => {}} />
              </div>
            )}
            <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !form.url} data-testid="button-save-image">
              {addMutation.isPending ? "جاري الإضافة..." : "إضافة"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
