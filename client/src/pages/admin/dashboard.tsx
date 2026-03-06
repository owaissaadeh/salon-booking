import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { DollarSign, Scissors, Package, Users } from "lucide-react";
import type { Transaction, Booking } from "@shared/schema";

export default function DashboardPage() {
  const { data: stats } = useQuery<{
    todaySales: number;
    todayServices: number;
    todayProducts: number;
    totalBookings: number;
    recentTransactions: (Transaction & { barberName: string })[];
  }>({ queryKey: ["/api/stats/today"] });

  const cards = [
    { label: "Today's Sales", value: `${stats?.todaySales?.toFixed(2) || "0.00"} SAR`, icon: DollarSign, color: "text-primary" },
    { label: "Services Revenue", value: `${stats?.todayServices?.toFixed(2) || "0.00"} SAR`, icon: Scissors, color: "text-chart-2" },
    { label: "Products Revenue", value: `${stats?.todayProducts?.toFixed(2) || "0.00"} SAR`, icon: Package, color: "text-chart-3" },
    { label: "Pending Bookings", value: stats?.totalBookings || 0, icon: Users, color: "text-chart-4" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" data-testid="text-dashboard-title">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card, i) => (
          <Card key={i} className="p-4" data-testid={`card-stat-${i}`}>
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-xs text-muted-foreground">{card.label}</span>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <p className="text-xl font-bold">{card.value}</p>
          </Card>
        ))}
      </div>

      <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">ID</th>
                <th className="text-left p-3 font-medium">Barber</th>
                <th className="text-left p-3 font-medium">Customer</th>
                <th className="text-right p-3 font-medium">Total</th>
                <th className="text-left p-3 font-medium">Payment</th>
                <th className="text-left p-3 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentTransactions?.length ? stats.recentTransactions.map(t => (
                <tr key={t.id} className="border-b last:border-0" data-testid={`row-transaction-${t.id}`}>
                  <td className="p-3">#{t.id}</td>
                  <td className="p-3">{t.barberName}</td>
                  <td className="p-3">{t.customerName || "-"}</td>
                  <td className="p-3 text-right font-medium">{t.totalAmount.toFixed(2)} SAR</td>
                  <td className="p-3 capitalize">{t.paymentMethod}</td>
                  <td className="p-3 text-muted-foreground">{new Date(t.createdAt).toLocaleTimeString()}</td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No transactions today</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
