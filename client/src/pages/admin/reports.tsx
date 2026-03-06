import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, TrendingDown, Scissors, Package, BarChart3 } from "lucide-react";

interface ReportData {
  totalSales: number;
  servicesRevenue: number;
  productsRevenue: number;
  totalExpenses: number;
  netProfit: number;
  barberBreakdown: { name: string; total: number; commission: number; commissionAmount: number }[];
  productsSold: { name: string; quantity: number; total: number }[];
  transactionCount: number;
}

export default function ReportsPage() {
  const today = new Date().toISOString().split("T")[0];
  const monthStart = today.substring(0, 7) + "-01";
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);
  const [query, setQuery] = useState({ from: monthStart, to: today });

  const { data: report, isLoading } = useQuery<ReportData>({
    queryKey: ["/api/reports", query.from, query.to],
    queryFn: () => fetch(`/api/reports?from=${query.from}&to=${query.to}`).then(r => r.json()),
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black" data-testid="text-reports-title">التقارير المالية</h1>
        <p className="text-sm text-muted-foreground">تحليل أداء الصالون</p>
      </div>

      <Card className="p-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <Label className="text-xs mb-1 block">من تاريخ</Label>
            <Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-40" data-testid="input-from-date" />
          </div>
          <div>
            <Label className="text-xs mb-1 block">إلى تاريخ</Label>
            <Input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-40" data-testid="input-to-date" />
          </div>
          <Button onClick={() => setQuery({ from, to })} data-testid="button-generate-report">
            {isLoading ? "جاري التحليل..." : "إنشاء التقرير"}
          </Button>
        </div>
      </Card>

      {report && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: "إجمالي المبيعات", value: report.totalSales, icon: TrendingUp, color: "text-chart-2", positive: true },
              { label: "الخدمات", value: report.servicesRevenue, icon: Scissors, color: "text-primary", positive: true },
              { label: "المنتجات", value: report.productsRevenue, icon: Package, color: "text-chart-3", positive: true },
              { label: "المصاريف", value: report.totalExpenses, icon: TrendingDown, color: "text-destructive", positive: false },
              { label: "صافي الربح", value: report.netProfit, icon: BarChart3, color: report.netProfit >= 0 ? "text-chart-2" : "text-destructive", positive: report.netProfit >= 0 },
            ].map((stat, i) => (
              <Card key={i} className="p-4" data-testid={`stat-${i}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <p className={`text-xl font-black ${stat.color}`}>{stat.value.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">دينار</p>
              </Card>
            ))}
          </div>

          {report.barberBreakdown.length > 0 && (
            <Card className="p-5">
              <h3 className="font-bold text-lg mb-4">أداء الحلاقين</h3>
              <div className="space-y-3">
                {report.barberBreakdown.map((b, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg" data-testid={`barber-report-${i}`}>
                    <div>
                      <p className="font-bold">{b.name}</p>
                      <p className="text-xs text-muted-foreground">عمولة {b.commission}%</p>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-primary">{b.total.toFixed(2)} دينار</p>
                      <p className="text-xs text-muted-foreground">عمولة: {b.commissionAmount.toFixed(2)} دينار</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {report.productsSold.length > 0 && (
            <Card className="p-5">
              <h3 className="font-bold text-lg mb-4">المنتجات المباعة</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {["المنتج", "الكمية المباعة", "الإيراد"].map(h => (
                        <th key={h} className="text-right pb-2 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.productsSold.map((p, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2.5 font-medium">{p.name}</td>
                        <td className="py-2.5">{p.quantity}</td>
                        <td className="py-2.5 font-bold text-primary">{p.total.toFixed(2)} دينار</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
      {!report && !isLoading && (
        <div className="text-center py-20 text-muted-foreground">اضغط "إنشاء التقرير" لعرض البيانات</div>
      )}
    </div>
  );
}
