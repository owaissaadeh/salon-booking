import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { DollarSign, Scissors, Package, CalendarCheck } from "lucide-react";
import type { Transaction } from "@shared/schema";

export default function DashboardPage() {
  const { data: stats } = useQuery<{
    todaySales: number;
    todayServices: number;
    todayProducts: number;
    totalBookings: number;
    recentTransactions: (Transaction & { barberName: string })[];
  }>({ queryKey: ["/api/stats/today"] });

  const cards = [
    { label: "مبيعات اليوم", value: `${stats?.todaySales?.toFixed(2) || "0.00"} دينار`, icon: DollarSign, color: "text-primary", bg: "bg-primary/10" },
    { label: "إيرادات الخدمات", value: `${stats?.todayServices?.toFixed(2) || "0.00"} دينار`, icon: Scissors, color: "text-chart-2", bg: "bg-chart-2/10" },
    { label: "إيرادات المنتجات", value: `${stats?.todayProducts?.toFixed(2) || "0.00"} دينار`, icon: Package, color: "text-chart-3", bg: "bg-chart-3/10" },
    { label: "حجوزات معلقة", value: stats?.totalBookings || 0, icon: CalendarCheck, color: "text-chart-4", bg: "bg-chart-4/10" },
  ];

  const payMethod = (m: string) => m === "cash" ? "نقداً" : "بطاقة";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black" data-testid="text-dashboard-title">لوحة التحكم</h1>
        <p className="text-sm text-muted-foreground mt-1">ملخص أداء اليوم</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card, i) => (
          <Card key={i} className="p-5" data-testid={`card-stat-${i}`}>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs text-muted-foreground font-medium">{card.label}</span>
              <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>
            <p className="text-xl font-black">{card.value}</p>
          </Card>
        ))}
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-bold">آخر المعاملات</h2>
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-right p-3 font-semibold">رقم</th>
                <th className="text-right p-3 font-semibold">الحلاق</th>
                <th className="text-right p-3 font-semibold">الزبون</th>
                <th className="text-right p-3 font-semibold">المبلغ</th>
                <th className="text-right p-3 font-semibold">الدفع</th>
                <th className="text-right p-3 font-semibold">الوقت</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentTransactions?.length ? stats.recentTransactions.map(t => (
                <tr key={t.id} className="border-b last:border-0" data-testid={`row-transaction-${t.id}`}>
                  <td className="p-3 font-bold text-primary">#{t.id}</td>
                  <td className="p-3">{t.barberName}</td>
                  <td className="p-3">{t.customerName || "—"}</td>
                  <td className="p-3 font-bold">{t.totalAmount.toFixed(2)} دينار</td>
                  <td className="p-3">{payMethod(t.paymentMethod)}</td>
                  <td className="p-3 text-muted-foreground">{new Date(t.createdAt).toLocaleTimeString("ar-IQ")}</td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="p-10 text-center text-muted-foreground">لا توجد معاملات اليوم</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
