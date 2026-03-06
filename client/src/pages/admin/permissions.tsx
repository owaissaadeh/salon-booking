import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Lock } from "lucide-react";

const ALL_PAGES = [
  { key: "dashboard", label: "لوحة التحكم" },
  { key: "bookings", label: "الحجوزات" },
  { key: "pos", label: "نقطة البيع" },
  { key: "services", label: "الخدمات" },
  { key: "barbers", label: "الحلاقون" },
  { key: "products", label: "المنتجات" },
  { key: "expenses", label: "المصاريف" },
  { key: "reports", label: "التقارير" },
  { key: "gallery", label: "الصور" },
  { key: "staff", label: "الموظفون" },
];

const ROLES = [
  { key: "manager", label: "مشرف", color: "bg-blue-500/10 text-blue-600 border-blue-200" },
  { key: "receptionist", label: "موظف استقبال", color: "bg-green-500/10 text-green-600 border-green-200" },
  { key: "sales", label: "مبيعات", color: "bg-purple-500/10 text-purple-600 border-purple-200" },
];

type RolePerms = Record<string, string[]>;

const DEFAULT_PERMS: RolePerms = {
  manager: ALL_PAGES.map(p => p.key),
  receptionist: ["dashboard", "bookings", "pos"],
  sales: ["pos", "products"],
};

export default function PermissionsPage() {
  const { toast } = useToast();
  const { data: settings = {} } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });
  const [perms, setPerms] = useState<RolePerms>(DEFAULT_PERMS);

  useEffect(() => {
    if (settings?.role_permissions) {
      try {
        setPerms(JSON.parse(settings.role_permissions));
      } catch {}
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/settings", { key: "role_permissions", value: JSON.stringify(perms) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "تم الحفظ", description: "تم حفظ الصلاحيات بنجاح" });
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const toggle = (role: string, page: string) => {
    setPerms(prev => {
      const current = prev[role] || [];
      const has = current.includes(page);
      return { ...prev, [role]: has ? current.filter(p => p !== page) : [...current, page] };
    });
  };

  const toggleAll = (role: string, value: boolean) => {
    setPerms(prev => ({ ...prev, [role]: value ? ALL_PAGES.map(p => p.key) : [] }));
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-black">إدارة الصلاحيات</h1>
          <p className="text-sm text-muted-foreground">حدد ما يمكن لكل دور الوصول إليه</p>
        </div>
      </div>

      <div className="grid gap-5">
        <Card className="overflow-hidden p-0">
          <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              <h2 className="font-bold">المدير (Admin)</h2>
            </div>
            <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">صلاحيات كاملة دائماً</Badge>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {ALL_PAGES.map(p => (
                <span key={p.key} className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">{p.label}</span>
              ))}
            </div>
          </div>
        </Card>

        {ROLES.map(role => {
          const rolePerms = perms[role.key] || [];
          const allChecked = ALL_PAGES.every(p => rolePerms.includes(p.key));
          const countChecked = ALL_PAGES.filter(p => rolePerms.includes(p.key)).length;

          return (
            <Card key={role.key} className="overflow-hidden p-0">
              <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="font-bold">{role.label}</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${role.color}`}>
                    {countChecked} / {ALL_PAGES.length} صلاحية
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">تحديد الكل</span>
                  <Switch
                    checked={allChecked}
                    onCheckedChange={v => toggleAll(role.key, v)}
                    data-testid={`switch-all-${role.key}`}
                  />
                </div>
              </div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {ALL_PAGES.map(page => {
                  const enabled = rolePerms.includes(page.key);
                  return (
                    <div
                      key={page.key}
                      role="button"
                      tabIndex={0}
                      onClick={() => toggle(role.key, page.key)}
                      onKeyDown={e => e.key === "Enter" && toggle(role.key, page.key)}
                      className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all text-right cursor-pointer select-none ${
                        enabled ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"
                      }`}
                      data-testid={`toggle-${role.key}-${page.key}`}
                    >
                      <span className="text-sm font-medium">{page.label}</span>
                      <div style={{ direction: "ltr" }} className={`w-9 h-5 rounded-full transition-colors flex-shrink-0 flex items-center px-0.5 ${enabled ? "bg-primary" : "bg-muted"}`}>
                        <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-4" : "translate-x-0"}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="px-8 font-bold" data-testid="button-save-permissions">
          {saveMutation.isPending ? "جاري الحفظ..." : "حفظ الصلاحيات"}
        </Button>
      </div>
    </div>
  );
}
