import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Scissors, Eye, EyeOff, Lock } from "lucide-react";
import { useLocation } from "wouter";

export default function LoginPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [form, setForm] = useState({ username: "", pin: "" });
  const [showPin, setShowPin] = useState(false);

  const loginMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/login", form),
    onSuccess: async (data) => {
      queryClient.setQueryData(["/api/auth/me"], data);
      setLocation("/admin");
    },
    onError: (err: Error) => {
      toast({ title: "فشل تسجيل الدخول", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.pin) return;
    loginMutation.mutate();
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #000 0%, #111 50%, #1a1208 100%)" }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #c09748, #d4af6a)" }}>
            <Scissors className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-3xl font-black text-white mb-1">عدنان باشا</h1>
          <p className="text-sm font-medium" style={{ color: "#c09748" }}>لوحة إدارة الصالون</p>
        </div>

        <div className="rounded-2xl p-8 border" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(192,151,72,0.2)" }}>
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-4 h-4" style={{ color: "#c09748" }} />
            <h2 className="text-white font-bold">تسجيل الدخول</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-white/60 text-xs mb-1.5 block font-medium">اسم المستخدم</Label>
              <Input
                value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                placeholder="أدخل اسم المستخدم"
                className="h-12 border text-white bg-white/5 placeholder:text-white/20"
                style={{ borderColor: "rgba(192,151,72,0.3)" }}
                autoComplete="username"
                data-testid="input-login-username"
              />
            </div>
            <div>
              <Label className="text-white/60 text-xs mb-1.5 block font-medium">الرمز السري (PIN)</Label>
              <div className="relative">
                <Input
                  type={showPin ? "text" : "password"}
                  value={form.pin}
                  onChange={e => setForm(p => ({ ...p, pin: e.target.value }))}
                  placeholder="أدخل الرمز السري"
                  className="h-12 border text-white bg-white/5 placeholder:text-white/20 pl-10"
                  style={{ borderColor: "rgba(192,151,72,0.3)" }}
                  autoComplete="current-password"
                  data-testid="input-login-pin"
                />
                <button type="button" onClick={() => setShowPin(!showPin)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-12 font-bold mt-2 text-black"
              style={{ background: "linear-gradient(135deg, #c09748, #d4af6a)" }}
              disabled={loginMutation.isPending || !form.username || !form.pin}
              data-testid="button-login-submit"
            >
              {loginMutation.isPending ? "جاري التحقق..." : "دخول"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
