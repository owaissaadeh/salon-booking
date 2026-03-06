import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Save, Globe, Image as ImageIcon, Phone, MapPin, Clock,
  Instagram, Twitter, Facebook, MessageCircle,
  Bell, Key, Send, CheckCircle,
} from "lucide-react";

interface SettingSection { title: string; fields: SettingField[] }
interface SettingField {
  key: string; label: string; placeholder: string;
  icon?: React.ReactNode; preview?: "image"; type?: string;
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
      { key: "salon_phone", label: "رقم الهاتف", placeholder: "+962 79 000 0000", icon: <Phone className="w-4 h-4" /> },
      { key: "salon_address", label: "العنوان", placeholder: "عمان، الأردن", icon: <MapPin className="w-4 h-4" /> },
      { key: "working_hours", label: "ساعات العمل", placeholder: "٩ صباحاً — ١١ مساءً", icon: <Clock className="w-4 h-4" /> },
      { key: "whatsapp", label: "واتساب", placeholder: "+962 79 000 0000", icon: <MessageCircle className="w-4 h-4" /> },
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

  const [waEnabled, setWaEnabled] = useState(false);
  const [waPhone, setWaPhone] = useState("");
  const [waKey, setWaKey] = useState("");
  const [waTestOk, setWaTestOk] = useState(false);

  const [tgEnabled, setTgEnabled] = useState(false);
  const [tgToken, setTgToken] = useState("");
  const [tgChatId, setTgChatId] = useState("");
  const [tgTestOk, setTgTestOk] = useState(false);

  useEffect(() => {
    if (settings.logo_show_text !== undefined) setShowLogoText(settings.logo_show_text !== "false");
    if (settings.notify_whatsapp_enabled !== undefined) setWaEnabled(settings.notify_whatsapp_enabled === "true");
    if (settings.notify_whatsapp_phone) setWaPhone(settings.notify_whatsapp_phone);
    if (settings.notify_whatsapp_apikey) setWaKey(settings.notify_whatsapp_apikey);
    if (settings.notify_telegram_enabled !== undefined) setTgEnabled(settings.notify_telegram_enabled === "true");
    if (settings.notify_telegram_token) setTgToken(settings.notify_telegram_token);
    if (settings.notify_telegram_chatid) setTgChatId(settings.notify_telegram_chatid);
  }, [settings]);

  const getValue = (key: string) => (key in changes ? changes[key] : settings[key] || "");
  const handleChange = (key: string, value: string) => setChanges(prev => ({ ...prev, [key]: value }));

  const saveSetting = async (key: string, value: string) => {
    await apiRequest("POST", "/api/settings", { key, value });
    queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
  };

  const saveMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => saveSetting(key, value),
    onSuccess: (_data, variables) => {
      setChanges(prev => { const n = { ...prev }; delete n[variables.key]; return n; });
      toast({ title: "تم الحفظ" });
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const saveLogoText = useMutation({
    mutationFn: async (show: boolean) => saveSetting("logo_show_text", show ? "true" : "false"),
    onSuccess: () => toast({ title: "تم الحفظ" }),
  });

  const handleSave = (key: string) => saveMutation.mutate({ key, value: getValue(key) });

  const saveWaMutation = useMutation({
    mutationFn: async () => {
      await saveSetting("notify_whatsapp_phone", waPhone);
      await saveSetting("notify_whatsapp_apikey", waKey);
    },
    onSuccess: () => toast({ title: "تم حفظ إعدادات الواتساب" }),
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const toggleWaMutation = useMutation({
    mutationFn: async (v: boolean) => saveSetting("notify_whatsapp_enabled", v ? "true" : "false"),
    onSuccess: (_d, v) => {
      setWaEnabled(v);
      toast({ title: v ? "تم تفعيل واتساب" : "تم إيقاف واتساب" });
    },
  });

  const testWaMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/notify/test", { phone: waPhone, apikey: waKey });
      return res.json();
    },
    onSuccess: () => {
      setWaTestOk(true); setTimeout(() => setWaTestOk(false), 4000);
      toast({ title: "تم الإرسال!", description: "تحقق من واتساب الخاص بك" });
    },
    onError: (err: Error) => toast({ title: "فشل الاختبار", description: err.message, variant: "destructive" }),
  });

  const saveTgMutation = useMutation({
    mutationFn: async () => {
      await saveSetting("notify_telegram_token", tgToken);
      await saveSetting("notify_telegram_chatid", tgChatId);
    },
    onSuccess: () => toast({ title: "تم حفظ إعدادات تيليجرام" }),
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const toggleTgMutation = useMutation({
    mutationFn: async (v: boolean) => saveSetting("notify_telegram_enabled", v ? "true" : "false"),
    onSuccess: (_d, v) => {
      setTgEnabled(v);
      toast({ title: v ? "تم تفعيل تيليجرام" : "تم إيقاف تيليجرام" });
    },
  });

  const testTgMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/notify/telegram-test", { token: tgToken, chatid: tgChatId });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل الإرسال");
      return data;
    },
    onSuccess: () => {
      setTgTestOk(true); setTimeout(() => setTgTestOk(false), 4000);
      toast({ title: "تم الإرسال!", description: "تحقق من تيليجرام الخاص بك" });
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
              <Switch checked={showLogoText} onCheckedChange={v => { setShowLogoText(v); saveLogoText.mutate(v); }} data-testid="switch-logo-text" />
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
                    {field.icon}{field.label}
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
                    <Button size="icon" variant={field.key in changes ? "default" : "outline"}
                      onClick={() => handleSave(field.key)} disabled={saveMutation.isPending}
                      data-testid={`button-save-setting-${field.key}`}>
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>
                  {field.preview === "image" && getValue(field.key) && (
                    <div className="mt-2">
                      <img src={getValue(field.key)} alt="معاينة"
                        className="h-14 w-14 object-contain rounded-lg border"
                        onError={e => (e.currentTarget.style.display = "none")} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}

        <div className="space-y-1">
          <div className="flex items-center gap-2 px-1">
            <Bell className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-base">إشعارات الحجز</h2>
            <p className="text-xs text-muted-foreground">— فعّل قناة أو كليهما</p>
          </div>
        </div>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-bold text-sm">واتساب</p>
                <p className="text-xs text-muted-foreground">عبر Callmebot المجاني</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={waEnabled ? "default" : "secondary"} className="text-xs">
                {waEnabled ? "مفعّل" : "متوقف"}
              </Badge>
              <Switch
                checked={waEnabled}
                onCheckedChange={v => toggleWaMutation.mutate(v)}
                disabled={toggleWaMutation.isPending}
                data-testid="switch-wa-enabled"
              />
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-3.5 mb-4 border text-xs text-muted-foreground leading-relaxed">
            <p className="font-semibold text-foreground mb-1.5">خطوة واحدة للتفعيل:</p>
            أرسل رسالة واتساب من رقمك للرقم{" "}
            <span className="font-bold text-foreground" dir="ltr">+34 644 54 96 60</span>
            {" "}بالنص:{" "}
            <code className="bg-muted px-1 py-0.5 rounded font-mono">I allow callmebot to send me messages</code>
            <br />
            سيرد عليك برسالة فيها API Key — انسخه وضعه أدناه.
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-xs font-medium mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> رقم الواتساب (الصيغة الدولية)
              </Label>
              <Input value={waPhone} onChange={e => setWaPhone(e.target.value)}
                placeholder="+962789240521" dir="ltr" data-testid="input-notify-phone" />
            </div>
            <div>
              <Label className="text-xs font-medium mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" /> API Key من Callmebot
              </Label>
              <Input value={waKey} onChange={e => setWaKey(e.target.value)}
                placeholder="123456" dir="ltr" data-testid="input-notify-apikey" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={() => saveWaMutation.mutate()}
                disabled={saveWaMutation.isPending || !waPhone || !waKey}
                className="flex-1" data-testid="button-save-wa">
                <Save className="w-4 h-4 ml-2" />
                {saveWaMutation.isPending ? "جاري الحفظ..." : "حفظ"}
              </Button>
              <Button variant="outline" onClick={() => testWaMutation.mutate()}
                disabled={testWaMutation.isPending || !waPhone || !waKey}
                data-testid="button-test-wa">
                {waTestOk ? <CheckCircle className="w-4 h-4 ml-2 text-green-500" /> : <Send className="w-4 h-4 ml-2" />}
                {testWaMutation.isPending ? "جاري..." : waTestOk ? "تم!" : "اختبار"}
              </Button>
            </div>
            {waEnabled && waPhone && waKey && (
              <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                <CheckCircle className="w-3.5 h-3.5" />
                مفعّل — سيصلك واتساب عند كل حجز
              </div>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.06 14.27l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.756.316z" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-sm">تيليجرام</p>
                <p className="text-xs text-muted-foreground">عبر Telegram Bot API المجاني</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={tgEnabled ? "default" : "secondary"} className="text-xs">
                {tgEnabled ? "مفعّل" : "متوقف"}
              </Badge>
              <Switch
                checked={tgEnabled}
                onCheckedChange={v => toggleTgMutation.mutate(v)}
                disabled={toggleTgMutation.isPending}
                data-testid="switch-tg-enabled"
              />
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-3.5 mb-4 border text-xs text-muted-foreground leading-relaxed">
            <p className="font-semibold text-foreground mb-2">٤ خطوات للتفعيل:</p>
            <ol className="space-y-1.5 list-none">
              <li className="flex gap-2"><span className="text-primary font-bold shrink-0">١.</span>افتح تيليجرام وابحث عن <code className="bg-muted px-1 rounded font-mono">@BotFather</code></li>
              <li className="flex gap-2"><span className="text-primary font-bold shrink-0">٢.</span>أرسله <code className="bg-muted px-1 rounded font-mono">/newbot</code> واتبع التعليمات — سيعطيك <strong className="text-foreground">Bot Token</strong></li>
              <li className="flex gap-2"><span className="text-primary font-bold shrink-0">٣.</span>افتح البوت الجديد وأرسله أي رسالة (مثل: مرحبا)</li>
              <li className="flex gap-2"><span className="text-primary font-bold shrink-0">٤.</span>افتح <code className="bg-muted px-1 rounded font-mono">@userinfobot</code> وأرسله <code className="bg-muted px-1 rounded font-mono">/start</code> — سيعطيك <strong className="text-foreground">Chat ID</strong></li>
            </ol>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-xs font-medium mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" /> Bot Token
              </Label>
              <Input value={tgToken} onChange={e => setTgToken(e.target.value)}
                placeholder="1234567890:ABCdef..." dir="ltr" data-testid="input-tg-token" />
            </div>
            <div>
              <Label className="text-xs font-medium mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" /> Chat ID
              </Label>
              <Input value={tgChatId} onChange={e => setTgChatId(e.target.value)}
                placeholder="123456789" dir="ltr" data-testid="input-tg-chatid" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={() => saveTgMutation.mutate()}
                disabled={saveTgMutation.isPending || !tgToken || !tgChatId}
                className="flex-1" data-testid="button-save-tg">
                <Save className="w-4 h-4 ml-2" />
                {saveTgMutation.isPending ? "جاري الحفظ..." : "حفظ"}
              </Button>
              <Button variant="outline" onClick={() => testTgMutation.mutate()}
                disabled={testTgMutation.isPending || !tgToken || !tgChatId}
                data-testid="button-test-tg">
                {tgTestOk ? <CheckCircle className="w-4 h-4 ml-2 text-green-500" /> : <Send className="w-4 h-4 ml-2" />}
                {testTgMutation.isPending ? "جاري..." : tgTestOk ? "تم!" : "اختبار"}
              </Button>
            </div>
            {tgEnabled && tgToken && tgChatId && (
              <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                <CheckCircle className="w-3.5 h-3.5" />
                مفعّل — سيصلك تيليجرام عند كل حجز
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
