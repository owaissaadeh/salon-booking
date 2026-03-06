import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Booking } from "@shared/schema";
import { Check, X, CalendarCheck } from "lucide-react";

export default function BookingsPage() {
  const { toast } = useToast();
  const { data: bookings = [] } = useQuery<(Booking & { serviceName: string })[]>({ queryKey: ["/api/bookings"] });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PATCH", `/api/bookings/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({ title: "تم تحديث الحجز" });
    },
  });

  const statusLabel = (s: string) => s === "confirmed" ? "مؤكد" : s === "cancelled" ? "ملغي" : "معلق";
  const statusColor = (s: string): "default" | "destructive" | "secondary" => {
    if (s === "confirmed") return "default";
    if (s === "cancelled") return "destructive";
    return "secondary";
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black" data-testid="text-bookings-title">الحجوزات</h1>
          <p className="text-sm text-muted-foreground">{bookings.length} حجز إجمالي</p>
        </div>
        <CalendarCheck className="w-6 h-6 text-muted-foreground" />
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                {["الزبون", "الجوال", "الخدمة", "التاريخ", "الوقت", "الحالة", "الإجراءات"].map(h => (
                  <th key={h} className="text-right p-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.length ? bookings.map(b => (
                <tr key={b.id} className="border-b last:border-0" data-testid={`row-booking-${b.id}`}>
                  <td className="p-3 font-semibold">{b.visitorName}</td>
                  <td className="p-3 text-muted-foreground">{b.phone}</td>
                  <td className="p-3">{b.serviceName}</td>
                  <td className="p-3">{b.date}</td>
                  <td className="p-3">{b.time}</td>
                  <td className="p-3"><Badge variant={statusColor(b.status)}>{statusLabel(b.status)}</Badge></td>
                  <td className="p-3">
                    {b.status === "pending" && (
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" onClick={() => updateStatus.mutate({ id: b.id, status: "confirmed" })}
                          data-testid={`button-confirm-${b.id}`}>
                          <Check className="w-4 h-4 text-chart-2" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => updateStatus.mutate({ id: b.id, status: "cancelled" })}
                          data-testid={`button-cancel-${b.id}`}>
                          <X className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={7} className="p-10 text-center text-muted-foreground">لا توجد حجوزات</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
