import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Save, Globe, Image as ImageIcon, Phone, MapPin, Clock, Instagram, Twitter, Facebook, MessageCircle, Bell, Key, Send, CheckCircle } from "lucide-react";

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
  const [notifyPhone, setNotifyPhone] = useState("");
  const [notifyKey, setNotifyKey] = useState("");
  const [testSuccess, setTestSuccess] = useState(false);

  useEffect(() => {
    if (settings.logo_show_text !== undefined) {
      setShowLogoText(settings.logo_show_text !== "false");
    }
    if (settings.notify_whatsapp_phone) setNotifyPhone(settings.notify_whatsapp_phone);
    if (settings.notify_whatsapp_apikey) setNotifyKey(settings.notify_whatsapp_apikey);
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

  const saveNotifyMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/settings", { key: "notify_whatsapp_phone", value: notifyPhone });
      await apiRequest("POST", "/api/settings", { key: "notify_whatsapp_apikey", value: notifyKey });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "تم حفظ إعدادات الإشعارات" });
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const testNotifyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/notify/test", { phone: notifyPhone, apikey: notifyKey });
      return res.json();
    },
    onSuccess: () => {
      setTestSuccess(true);
      setTimeout(() => setTestSuccess(false), 4000);
      toast({ title: "تم الإرسال!", description: "تحقق من واتساب الخاص بك" });
    },
    onError: (err: Error) => toast({ title: "فشل الاختبار", description: err.message, variant: "destructive" }),
  });

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

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-base">إشعارات الحجز عبر واتساب</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-5">
            لما يحجز زبون، يصلك رسالة واتساب تلقائياً على رقمك.
            يستخدم خدمة Callmebot المجانية.
          </p>

          <div className="bg-muted/30 rounded-lg p-4 mb-5 border">
            <p className="text-sm font-semibold mb-2">خطوة واحدة للتفعيل:</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              أرسل رسالة واتساب من رقمك للرقم{" "}
              <span className="font-bold text-foreground" dir="ltr">+34 644 54 96 60</span>{" "}
              بالنص:{" "}
              <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">I allow callmebot to send me messages</span>
              <br />
              سيرد عليك برسالة فيها API Key — انسخه وضعه أدناه.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
                <Phone className="w-4 h-4" />
                رقم الواتساب (بالصيغة الدولية)
              </Label>
              <Input
                value={notifyPhone}
                onChange={e => setNotifyPhone(e.target.value)}
                placeholder="+962789240521"
                dir="ltr"
                data-testid="input-notify-phone"
              />
              <p className="text-xs text-muted-foreground mt-1">مثال: +962789240521</p>
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
                <Key className="w-4 h-4" />
                API Key من Callmebot
              </Label>
              <Input
                value={notifyKey}
                onChange={e => setNotifyKey(e.target.value)}
                placeholder="123456"
                dir="ltr"
                data-testid="input-notify-apikey"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                onClick={() => saveNotifyMutation.mutate()}
                disabled={saveNotifyMutation.isPending || !notifyPhone || !notifyKey}
                className="flex-1"
                data-testid="button-save-notify"
              >
                <Save className="w-4 h-4 ml-2" />
                {saveNotifyMutation.isPending ? "جاري الحفظ..." : "حفظ الإعدادات"}
              </Button>
              <Button
                variant="outline"
                onClick={() => testNotifyMutation.mutate()}
                disabled={testNotifyMutation.isPending || !notifyPhone || !notifyKey}
                data-testid="button-test-notify"
              >
                {testNotifyMutation.isPending ? (
                  <Send className="w-4 h-4 ml-2 animate-pulse" />
                ) : testSuccess ? (
                  <CheckCircle className="w-4 h-4 ml-2 text-green-500" />
                ) : (
                  <Send className="w-4 h-4 ml-2" />
                )}
                {testNotifyMutation.isPending ? "جاري الإرسال..." : testSuccess ? "تم الإرسال!" : "اختبار"}
              </Button>
            </div>

            {notifyPhone && notifyKey && (
              <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                <CheckCircle className="w-3.5 h-3.5" />
                الإشعارات مفعّلة — سيصلك واتساب عند كل حجز جديد
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
