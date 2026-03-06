import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, TrendingUp, Users, Package } from "lucide-react";

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
  const [dateRange, setDateRange] = useState({
    from: new Date().toISOString().split("T")[0],
    to: new Date().toISOString().split("T")[0],
  });

  const { data: report } = useQuery<ReportData>({
    queryKey: ["/api/reports", `?from=${dateRange.from}&to=${dateRange.to}`],
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" data-testid="text-reports-title">Reports</h1>

      <div className="flex flex-wrap items-end gap-4 mb-6">
        <div>
          <Label className="text-xs">From</Label>
          <Input type="date" value={dateRange.from} onChange={e => setDateRange(p => ({ ...p, from: e.target.value }))} data-testid="input-report-from" />
        </div>
        <div>
          <Label className="text-xs">To</Label>
          <Input type="date" value={dateRange.to} onChange={e => setDateRange(p => ({ ...p, to: e.target.value }))} data-testid="input-report-to" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: "Total Sales", value: report?.totalSales, icon: DollarSign, color: "text-primary" },
          { label: "Services", value: report?.servicesRevenue, icon: TrendingUp, color: "text-chart-2" },
          { label: "Products", value: report?.productsRevenue, icon: Package, color: "text-chart-3" },
          { label: "Expenses", value: report?.totalExpenses, icon: DollarSign, color: "text-destructive" },
          { label: "Net Profit", value: report?.netProfit, icon: TrendingUp, color: "text-chart-2" },
        ].map((card, i) => (
          <Card key={i} className="p-4" data-testid={`card-report-${i}`}>
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-xs text-muted-foreground">{card.label}</span>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <p className="text-lg font-bold">{(card.value ?? 0).toFixed(2)} SAR</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Barber Performance
          </h2>
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Barber</th>
                  <th className="text-right p-3 font-medium">Revenue</th>
                  <th className="text-right p-3 font-medium">Rate</th>
                  <th className="text-right p-3 font-medium">Commission</th>
                </tr>
              </thead>
              <tbody>
                {report?.barberBreakdown?.length ? report.barberBreakdown.map((b, i) => (
                  <tr key={i} className="border-b last:border-0" data-testid={`row-barber-report-${i}`}>
                    <td className="p-3 font-medium">{b.name}</td>
                    <td className="p-3 text-right">{b.total.toFixed(2)} SAR</td>
                    <td className="p-3 text-right text-muted-foreground">{b.commission}%</td>
                    <td className="p-3 text-right font-medium text-primary">{b.commissionAmount.toFixed(2)} SAR</td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No data</td></tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-chart-3" /> Products Sold
          </h2>
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Product</th>
                  <th className="text-right p-3 font-medium">Quantity</th>
                  <th className="text-right p-3 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {report?.productsSold?.length ? report.productsSold.map((p, i) => (
                  <tr key={i} className="border-b last:border-0" data-testid={`row-product-report-${i}`}>
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3 text-right">{p.quantity}</td>
                    <td className="p-3 text-right font-medium">{p.total.toFixed(2)} SAR</td>
                  </tr>
                )) : (
                  <tr><td colSpan={3} className="p-6 text-center text-muted-foreground">No products sold</td></tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
}
