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

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/gallery", form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
      setDialogOpen(false);
      setForm({ url: "", caption: "" });
      toast({ title: "Image added" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/gallery/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/gallery"] }); toast({ title: "Image deleted" }); },
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold" data-testid="text-gallery-title">Gallery</h1>
        <Button onClick={() => { setForm({ url: "", caption: "" }); setDialogOpen(true); }} data-testid="button-add-image">
          <Plus className="w-4 h-4 mr-2" />Add Image
        </Button>
      </div>

      {images.length === 0 ? (
        <Card className="p-12 text-center">
          <Image className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No gallery images yet. Add images to showcase your work.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map(img => (
            <div key={img.id} className="relative group rounded-md overflow-hidden aspect-square" data-testid={`gallery-item-${img.id}`}>
              <img src={img.url} alt={img.caption || ""} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button size="icon" variant="destructive" onClick={() => deleteMutation.mutate(img.id)} data-testid={`button-delete-image-${img.id}`}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              {img.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-foreground/60 text-background text-xs p-2 truncate">
                  {img.caption}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Gallery Image</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Image URL</Label><Input value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} placeholder="https://..." data-testid="input-image-url" /></div>
            <div><Label>Caption (optional)</Label><Input value={form.caption} onChange={e => setForm(p => ({ ...p, caption: e.target.value }))} data-testid="input-image-caption" /></div>
            <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.url} data-testid="button-save-image">
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
