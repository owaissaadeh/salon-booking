import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Booking } from "@shared/schema";
import { Check, X, CalendarCheck, Search, User, Scissors } from "lucide-react";

type BookingFull = Booking & { serviceName: string; serviceNameAr: string; barberName: string | null };

const STATUS_LABEL: Record<string, string> = { confirmed: "مؤكد", cancelled: "ملغي", pending: "معلق" };
const STATUS_VARIANT: Record<string, "default" | "destructive" | "secondary"> = {
  confirmed: "default", cancelled: "destructive", pending: "secondary",
};

export default function BookingsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const { data: bookings = [], isLoading } = useQuery<BookingFull[]>({ queryKey: ["/api/bookings"] });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PATCH", `/api/bookings/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({ title: "تم تحديث الحجز" });
    },
  });

  const filtered = bookings.filter(b =>
    !search ||
    b.visitorName.toLowerCase().includes(search.toLowerCase()) ||
    b.phone.includes(search) ||
    (b.barberName || "").toLowerCase().includes(search.toLowerCase()) ||
    b.serviceNameAr.includes(search)
  );

  const pendingCount = bookings.filter(b => b.status === "pending").length;
  const confirmedCount = bookings.filter(b => b.status === "confirmed").length;

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black" data-testid="text-bookings-title">الحجوزات</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-muted-foreground">{bookings.length} حجز إجمالي</span>
            {pendingCount > 0 && (
              <Badge variant="secondary" className="text-xs">{pendingCount} معلق</Badge>
            )}
            {confirmedCount > 0 && (
              <Badge variant="default" className="text-xs">{confirmedCount} مؤكد</Badge>
            )}
          </div>
        </div>
        <CalendarCheck className="w-6 h-6 text-muted-foreground" />
      </div>

      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="ابحث بالاسم أو الجوال أو الحلاق..."
          className="pr-9"
          data-testid="input-search-bookings"
        />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                {["الزبون", "الجوال", "الخدمة", "الحلاق", "التاريخ", "الوقت", "الحالة", "الإجراءات"].map(h => (
                  <th key={h} className="text-right p-3 font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="p-10 text-center text-muted-foreground">جاري التحميل...</td></tr>
              ) : filtered.length ? filtered.map(b => (
                <tr key={b.id} className="border-b last:border-0 hover:bg-muted/10 transition-colors" data-testid={`row-booking-${b.id}`}>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="font-semibold">{b.visitorName}</span>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground" dir="ltr">{b.phone}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <Scissors className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span>{b.serviceNameAr}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    {b.barberName ? (
                      <Badge variant="outline" className="text-xs font-normal">{b.barberName}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground whitespace-nowrap">{b.date}</td>
                  <td className="p-3 font-mono text-sm" dir="ltr">{b.time}</td>
                  <td className="p-3">
                    <Badge variant={STATUS_VARIANT[b.status] ?? "secondary"}>
                      {STATUS_LABEL[b.status] ?? b.status}
                    </Badge>
                  </td>
                  <td className="p-3">
                    {b.status === "pending" && (
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon" variant="ghost"
                          onClick={() => updateStatus.mutate({ id: b.id, status: "confirmed" })}
                          data-testid={`button-confirm-${b.id}`}
                          title="تأكيد"
                        >
                          <Check className="w-4 h-4 text-chart-2" />
                        </Button>
                        <Button
                          size="icon" variant="ghost"
                          onClick={() => updateStatus.mutate({ id: b.id, status: "cancelled" })}
                          data-testid={`button-cancel-${b.id}`}
                          title="إلغاء"
                        >
                          <X className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-muted-foreground">
                    {search ? "لا توجد نتائج" : "لا توجد حجوزات"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
