import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Save, Globe, Image as ImageIcon, Phone, MapPin, Clock, Instagram, Twitter, Facebook, MessageCircle } from "lucide-react";

interface SettingSection {
  title: string;
  fields: SettingField[];
}
interface SettingField {
  key: string;
  label: string;
  placeholder: string;
  icon?: React.ReactNode;
  preview?: "image";
  type?: string;
}

const SECTIONS: SettingSection[] = [
  {
    title: "شعار الصالون",
    fields: [
      { key: "logo_url", label: "رابط الشعار (صورة)", placeholder: "https://example.com/logo.png", icon: <ImageIcon className="w-4 h-4" />, preview: "image" },
      { key: "favicon_url", label: "رابط الأيقونة (Favicon)", placeholder: "https://example.com/favicon.ico", icon: <ImageIcon className="w-4 h-4" />, preview: "image" },
    ],
  },
  {
    title: "معلومات التواصل",
    fields: [
      { key: "salon_phone", label: "رقم الهاتف", placeholder: "+964 77 000 0000", icon: <Phone className="w-4 h-4" /> },
      { key: "salon_address", label: "العنوان", placeholder: "بغداد، العراق", icon: <MapPin className="w-4 h-4" /> },
      { key: "working_hours", label: "ساعات العمل", placeholder: "٩ صباحاً — ١١ مساءً", icon: <Clock className="w-4 h-4" /> },
      { key: "whatsapp", label: "واتساب", placeholder: "+964 77 000 0000", icon: <MessageCircle className="w-4 h-4" /> },
    ],
  },
  {
    title: "وسائل التواصل الاجتماعي",
    fields: [
      { key: "instagram", label: "انستقرام", placeholder: "https://instagram.com/username", icon: <Instagram className="w-4 h-4" /> },
      { key: "tiktok", label: "تيك توك", placeholder: "https://tiktok.com/@username", icon: <Globe className="w-4 h-4" /> },
      { key: "snapchat", label: "سناب شات", placeholder: "username", icon: <Globe className="w-4 h-4" /> },
      { key: "twitter", label: "تويتر / X", placeholder: "https://twitter.com/username", icon: <Twitter className="w-4 h-4" /> },
      { key: "facebook", label: "فيسبوك", placeholder: "https://facebook.com/page", icon: <Facebook className="w-4 h-4" /> },
    ],
  },
];

export default function SettingsPage() {
  const { toast } = useToast();
  const { data: settings = {} } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });
  const [changes, setChanges] = useState<Record<string, string>>({});
  const [showLogoText, setShowLogoText] = useState(true);

  useEffect(() => {
    if (settings.logo_show_text !== undefined) {
      setShowLogoText(settings.logo_show_text !== "false");
    }
  }, [settings]);

  const getValue = (key: string) => {
    if (key in changes) return changes[key];
    return settings[key] || "";
  };

  const handleChange = (key: string, value: string) => {
    setChanges(prev => ({ ...prev, [key]: value }));
  };

  const saveMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      await apiRequest("POST", "/api/settings", { key, value });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      setChanges(prev => {
        const next = { ...prev };
        delete next[variables.key];
        return next;
      });
      toast({ title: "تم الحفظ بنجاح" });
    },
    onError: (err: Error) => toast({ title: "خطأ في الحفظ", description: err.message, variant: "destructive" }),
  });

  const saveLogoText = useMutation({
    mutationFn: async (show: boolean) => {
      await apiRequest("POST", "/api/settings", { key: "logo_show_text", value: show ? "true" : "false" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "تم الحفظ" });
    },
  });

  const handleSave = (key: string) => {
    const value = getValue(key);
    saveMutation.mutate({ key, value });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black" data-testid="text-settings-title">إعدادات الصالون</h1>
        <p className="text-sm text-muted-foreground">تخصيص معلومات وهوية الصالون</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        <Card className="p-5">
          <h2 className="font-bold text-base mb-4">خيارات عرض الشعار</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
              <div>
                <p className="font-medium text-sm">عرض اسم الصالون مع الشعار</p>
                <p className="text-xs text-muted-foreground mt-0.5">عندما تكون مفعّلاً: يظهر الشعار + النص "عدنان باشا"</p>
              </div>
              <Switch checked={showLogoText}
                onCheckedChange={v => { setShowLogoText(v); saveLogoText.mutate(v); }}
                data-testid="switch-logo-text" />
            </div>
            <div className="grid grid-cols-2 gap-3 p-3 bg-muted/20 rounded-lg">
              <div className={`p-3 rounded-lg border-2 text-center ${showLogoText ? "border-primary bg-primary/5" : "border-border"}`}>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
                    <span className="text-xs text-primary-foreground font-bold">ع</span>
                  </div>
                  <span className="font-bold text-sm">عدنان باشا</span>
                </div>
                <p className="text-xs text-muted-foreground">مع النص</p>
              </div>
              <div className={`p-3 rounded-lg border-2 text-center ${!showLogoText ? "border-primary bg-primary/5" : "border-border"}`}>
                <div className="flex items-center justify-center mb-1">
                  <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
                    <span className="text-xs text-primary-foreground font-bold">ع</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">الصورة فقط</p>
              </div>
            </div>
          </div>
        </Card>

        {SECTIONS.map(section => (
          <Card key={section.title} className="p-5">
            <h2 className="font-bold text-base mb-4">{section.title}</h2>
            <div className="space-y-4">
              {section.fields.map(field => (
                <div key={field.key}>
                  <Label className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
                    {field.icon}
                    {field.label}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type={field.type || "text"}
                      value={getValue(field.key)}
                      onChange={e => handleChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="flex-1"
                      data-testid={`input-setting-${field.key}`}
                      onKeyDown={e => e.key === "Enter" && handleSave(field.key)}
                    />
                    <Button
                      size="icon"
                      variant={field.key in changes ? "default" : "outline"}
                      onClick={() => handleSave(field.key)}
                      disabled={saveMutation.isPending}
                      data-testid={`button-save-setting-${field.key}`}
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>
                  {field.preview === "image" && getValue(field.key) && (
                    <div className="mt-2">
                      <img
                        src={getValue(field.key)}
                        alt="معاينة"
                        className="h-14 w-14 object-contain rounded-lg border"
                        onError={e => (e.currentTarget.style.display = "none")}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
