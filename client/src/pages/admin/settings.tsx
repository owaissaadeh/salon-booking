import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Settings2, Save } from "lucide-react";

interface SettingField {
  key: string;
  label: string;
  placeholder: string;
  hint: string;
  preview?: "image";
}

const SETTINGS: SettingField[] = [
  { key: "logo_url", label: "رابط شعار الصالون", placeholder: "https://example.com/logo.png", hint: "رابط مباشر لصورة الشعار (PNG أو SVG)", preview: "image" },
  { key: "favicon_url", label: "رابط أيقونة الموقع (Favicon)", placeholder: "https://example.com/favicon.ico", hint: "رابط مباشر لأيقونة الموقع", preview: "image" },
  { key: "salon_phone", label: "رقم هاتف الصالون", placeholder: "+964 77 000 0000", hint: "سيظهر في قسم التواصل بالموقع" },
  { key: "salon_address", label: "عنوان الصالون", placeholder: "بغداد، العراق", hint: "سيظهر في قسم التواصل بالموقع" },
  { key: "working_hours", label: "ساعات العمل", placeholder: "٩ ص - ١١ م", hint: "سيظهر في قسم التواصل بالموقع" },
];

export default function SettingsPage() {
  const { toast } = useToast();
  const { data: settings = {} } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settings) setValues(settings);
  }, [settings]);

  const saveSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      await apiRequest("POST", "/api/settings", { key, value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "تم الحفظ" });
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Settings2 className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-black" data-testid="text-settings-title">إعدادات الصالون</h1>
          <p className="text-sm text-muted-foreground">تخصيص معلومات وإعدادات الصالون</p>
        </div>
      </div>

      <div className="grid gap-5 max-w-2xl">
        {SETTINGS.map(field => (
          <Card key={field.key} className="p-5">
            <div className="mb-4">
              <Label className="text-base font-bold">{field.label}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{field.hint}</p>
            </div>
            <div className="flex gap-3">
              <Input
                value={values[field.key] || ""}
                onChange={e => setValues(p => ({ ...p, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                className="flex-1"
                data-testid={`input-setting-${field.key}`}
              />
              <Button
                size="icon"
                onClick={() => saveSetting.mutate({ key: field.key, value: values[field.key] || "" })}
                disabled={saveSetting.isPending}
                data-testid={`button-save-setting-${field.key}`}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
            {field.preview === "image" && values[field.key] && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-2">معاينة:</p>
                <img
                  src={values[field.key]}
                  alt="معاينة"
                  className="h-16 w-16 object-contain rounded-lg border"
                  onError={e => (e.currentTarget.style.display = "none")}
                />
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
