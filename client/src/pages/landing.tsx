import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Scissors, Clock, Phone, MapPin, Star, ChevronDown,
  Menu, X, ChevronRight, ChevronLeft, Check
} from "lucide-react";
import type { Service } from "@shared/schema";

const DAYS_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const MONTHS_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

function getWeekDays(baseDate: Date) {
  const days = [];
  const start = new Date(baseDate);
  start.setDate(start.getDate() - start.getDay());
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

function Navbar({ settings }: { settings: Record<string, string> }) {
  const [open, setOpen] = useState(false);
  const logoUrl = settings?.logo_url;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-b border-primary/10">
      <div className="max-w-6xl mx-auto px-5 flex items-center justify-between h-16">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="شعار الصالون" className="h-10 w-10 object-contain rounded-md" />
          ) : (
            <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
              <Scissors className="w-5 h-5 text-primary-foreground" />
            </div>
          )}
          <span className="font-black text-xl tracking-wide">عدنان باشا</span>
        </div>
        <div className="hidden md:flex items-center gap-7">
          {[["#services", "الخدمات"], ["#booking", "احجز موعد"], ["#gallery", "معرض الأعمال"], ["#contact", "تواصل معنا"]].map(([href, label]) => (
            <a key={href} href={href} className="text-sm font-medium text-muted-foreground">{label}</a>
          ))}
        </div>
        <Button size="icon" variant="ghost" className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>
      {open && (
        <div className="md:hidden border-t bg-background px-5 py-4 flex flex-col gap-3">
          {[["#services", "الخدمات"], ["#booking", "احجز موعد"], ["#gallery", "معرض الأعمال"], ["#contact", "تواصل معنا"]].map(([href, label]) => (
            <a key={href} href={href} className="text-sm py-2 font-medium" onClick={() => setOpen(false)}>{label}</a>
          ))}
        </div>
      )}
    </nav>
  );
}

function HeroSection({ settings }: { settings: Record<string, string> }) {
  const logoUrl = settings?.logo_url;
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-foreground">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-foreground via-foreground/95 to-foreground/85" />
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(255,255,255,0.01) 40px, rgba(255,255,255,0.01) 80px)`,
        }} />
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at center, rgba(195,131,10,0.08) 0%, transparent 70%)"
        }} />
      </div>

      <div className="relative z-10 text-center px-5 max-w-4xl mx-auto">
        {logoUrl && (
          <img src={logoUrl} alt="شعار الصالون" className="h-24 w-24 object-contain mx-auto mb-6 rounded-2xl" />
        )}

        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-px w-16 bg-primary/50" />
          <div className="flex gap-1">
            {[0,1,2,3,4].map(i => <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary" />)}
          </div>
          <div className="h-px w-16 bg-primary/50" />
        </div>

        <h1 className="text-5xl md:text-8xl font-black text-background leading-tight mb-3 tracking-wide">
          عدنان باشا
        </h1>
        <p className="text-primary text-xl md:text-2xl font-bold tracking-widest mb-4 uppercase">Adnan Basha</p>
        <p className="text-background/60 text-base md:text-lg mb-10 max-w-lg mx-auto font-light leading-relaxed">
          تجربة حلاقة راقية تستحقها — أفضل الحلاقين، أجود المعدات، وبيئة استثنائية
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="#booking">
            <Button size="lg" className="text-base px-10 py-6 font-bold text-foreground bg-primary" data-testid="button-book-hero">
              احجز موعدك الآن
            </Button>
          </a>
          <a href="#services">
            <Button size="lg" variant="outline" className="text-base px-10 py-6 border-background/20 text-background bg-transparent" data-testid="button-services-hero">
              استعرض خدماتنا
            </Button>
          </a>
        </div>
        <div className="mt-20 flex justify-center">
          <a href="#services" className="flex flex-col items-center gap-2 text-background/30">
            <span className="text-xs font-medium tracking-widest uppercase">اكتشف</span>
            <ChevronDown className="w-5 h-5 animate-bounce" />
          </a>
        </div>
      </div>
    </section>
  );
}

const serviceIcons = [
  <Scissors className="w-7 h-7 text-primary" />,
  <Star className="w-7 h-7 text-primary" />,
  <Star className="w-7 h-7 text-primary" />,
  <Star className="w-7 h-7 text-primary" />,
];

function ServicesSection() {
  const { data: services = [] } = useQuery<Service[]>({ queryKey: ["/api/services"] });
  const active = services.filter(s => s.active);

  return (
    <section id="services" className="py-24 px-5 bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-12 bg-primary/50" />
            <span className="text-primary text-sm font-bold tracking-widest uppercase">خدماتنا</span>
            <div className="h-px w-12 bg-primary/50" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black mb-4">تجربة لا مثيل لها</h2>
          <p className="text-muted-foreground max-w-md mx-auto">كل خدمة تُقدَّم بدقة متناهية وعناية استثنائية</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {active.map((service, idx) => (
            <div key={service.id} className="group" data-testid={`card-service-${service.id}`}>
              <Card className="p-6 text-center hover-elevate transition-all duration-300 group-hover:border-primary/30 border-2">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5 group-hover:bg-primary/20 transition-colors">
                  {serviceIcons[idx % serviceIcons.length]}
                </div>
                <h3 className="font-bold text-xl mb-2">{service.nameAr}</h3>
                <p className="text-xs text-muted-foreground mb-3 font-medium tracking-wider uppercase">{service.name}</p>
                <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>{service.duration} دقيقة</span>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

type SlotInfo = { time: string; available: boolean };

function BookingSection() {
  const { toast } = useToast();
  const { data: services = [] } = useQuery<Service[]>({ queryKey: ["/api/services"] });
  const active = services.filter(s => s.active);

  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [weekBase, setWeekBase] = useState(new Date());
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [form, setForm] = useState({ visitorName: "", phone: "" });

  const weekDays = getWeekDays(weekBase);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const fetchSlots = async (svc: Service, date: Date) => {
    setLoadingSlots(true);
    setSlots([]);
    setSelectedTime(null);
    const dateStr = date.toISOString().split("T")[0];
    try {
      const res = await fetch(`/api/bookings/available-slots?serviceId=${svc.id}&date=${dateStr}`);
      const data = await res.json();
      setSlots(data);
    } catch {
      setSlots([]);
    }
    setLoadingSlots(false);
  };

  const handleSelectDate = (date: Date) => {
    if (date < today) return;
    setSelectedDate(date);
    setSelectedTime(null);
    if (selectedService) fetchSlots(selectedService, date);
  };

  const handleSelectService = (svc: Service) => {
    setSelectedService(svc);
    setSelectedDate(null);
    setSelectedTime(null);
    setSlots([]);
    setStep(2);
  };

  const bookMutation = useMutation({
    mutationFn: async () => {
      const dateStr = selectedDate!.toISOString().split("T")[0];
      await apiRequest("POST", "/api/bookings", {
        visitorName: form.visitorName,
        phone: form.phone,
        serviceId: selectedService!.id,
        date: dateStr,
        time: selectedTime!,
        status: "pending",
      });
    },
    onSuccess: () => {
      toast({ title: "تم الحجز بنجاح!", description: "سيتواصل معك فريقنا لتأكيد الموعد" });
      setStep(1);
      setSelectedService(null);
      setSelectedDate(null);
      setSelectedTime(null);
      setSlots([]);
      setForm({ visitorName: "", phone: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    },
    onError: (err: Error) => {
      toast({ title: "فشل الحجز", description: err.message, variant: "destructive" });
    },
  });

  const canSubmit = form.visitorName.trim() && form.phone.trim() && selectedService && selectedDate && selectedTime;

  return (
    <section id="booking" className="py-24 px-5 bg-foreground relative overflow-hidden">
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: "radial-gradient(circle at 20% 50%, hsl(35,90%,50%) 0%, transparent 50%), radial-gradient(circle at 80% 20%, hsl(35,90%,50%) 0%, transparent 50%)"
      }} />
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-12 bg-primary/50" />
            <span className="text-primary text-sm font-bold tracking-widest uppercase">الحجز الإلكتروني</span>
            <div className="h-px w-12 bg-primary/50" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-background mb-3">احجز موعدك</h2>
          <p className="text-background/50">خطوات سهلة وسريعة لحجز موعدك المثالي</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-10">
          {[["١", "اختر الخدمة"], ["٢", "اختر الموعد"], ["٣", "بياناتك"]].map(([num, label], i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                step === i + 1 ? "bg-primary text-primary-foreground" :
                step > i + 1 ? "bg-primary/20 text-primary" : "bg-background/10 text-background/40"
              }`}>
                {step > i + 1 ? <Check className="w-3.5 h-3.5" /> : <span>{num}</span>}
                <span className="hidden sm:block">{label}</span>
              </div>
              {i < 2 && <div className="w-8 h-px bg-background/20" />}
            </div>
          ))}
        </div>

        <Card className="bg-background/5 border-background/10 backdrop-blur-sm p-6 md:p-8">
          {step === 1 && (
            <div>
              <p className="text-background/60 text-center mb-6 font-medium">اضغط على الخدمة التي تريدها</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {active.map((svc, idx) => (
                  <button key={svc.id} onClick={() => handleSelectService(svc)}
                    className="group p-5 rounded-xl border-2 border-background/10 text-center bg-background/5 transition-all duration-200 hover:border-primary hover:bg-primary/10"
                    data-testid={`button-book-service-${svc.id}`}>
                    <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/25">
                      {serviceIcons[idx % serviceIcons.length]}
                    </div>
                    <p className="font-bold text-background text-base mb-1">{svc.nameAr}</p>
                    <p className="text-background/40 text-xs">{svc.duration} دقيقة</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => { setStep(1); setSelectedDate(null); setSlots([]); }}
                  className="flex items-center gap-1.5 text-sm text-background/50 font-medium">
                  <ChevronRight className="w-4 h-4" />
                  تغيير الخدمة
                </button>
                <div className="flex-1 h-px bg-background/10" />
                <span className="text-sm text-primary font-bold">{selectedService?.nameAr}</span>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => { const d = new Date(weekBase); d.setDate(d.getDate() - 7); setWeekBase(d); }}>
                    <ChevronRight className="w-5 h-5 text-background/50" />
                  </button>
                  <span className="text-background font-bold">
                    {MONTHS_AR[weekDays[0].getMonth()]} {weekDays[0].getFullYear()}
                  </span>
                  <button onClick={() => { const d = new Date(weekBase); d.setDate(d.getDate() + 7); setWeekBase(d); }}>
                    <ChevronLeft className="w-5 h-5 text-background/50" />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((day, i) => {
                    const isPast = day < today;
                    const isSelected = selectedDate?.toDateString() === day.toDateString();
                    return (
                      <button key={i} onClick={() => handleSelectDate(day)} disabled={isPast}
                        className={`p-2 rounded-xl text-center transition-all ${
                          isSelected ? "bg-primary text-primary-foreground font-bold" :
                          isPast ? "opacity-25 cursor-not-allowed text-background/40" :
                          "bg-background/10 text-background hover:bg-primary/20"
                        }`}
                        data-testid={`button-day-${i}`}>
                        <div className="text-xs mb-1 font-medium">{DAYS_AR[day.getDay()].slice(0, 3)}</div>
                        <div className="text-lg font-bold">{day.getDate()}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedDate && (
                <div>
                  <p className="text-background/60 text-sm mb-3 font-medium">
                    المواعيد ليوم {DAYS_AR[selectedDate.getDay()]} {selectedDate.getDate()} {MONTHS_AR[selectedDate.getMonth()]}
                  </p>
                  {loadingSlots ? (
                    <div className="text-center py-8 text-background/40">جاري تحميل المواعيد...</div>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                      {slots.map(slot => (
                        <button key={slot.time} disabled={!slot.available}
                          onClick={() => { if (slot.available) { setSelectedTime(slot.time); setStep(3); } }}
                          className={`py-2.5 px-2 rounded-lg text-sm font-bold text-center transition-all ${
                            !slot.available ? "bg-background/5 text-background/20 cursor-not-allowed line-through" :
                            selectedTime === slot.time ? "bg-primary text-primary-foreground" :
                            "bg-background/10 text-background hover:bg-primary/20 hover:text-primary"
                          }`}
                          data-testid={`button-slot-${slot.time}`}>
                          {slot.time}
                        </button>
                      ))}
                      {slots.length === 0 && !loadingSlots && (
                        <div className="col-span-full text-center py-8 text-background/40">لا توجد مواعيد متاحة لهذا اليوم</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => setStep(2)} className="flex items-center gap-1.5 text-sm text-background/50 font-medium">
                  <ChevronRight className="w-4 h-4" />
                  تعديل الموعد
                </button>
                <div className="flex-1 h-px bg-background/10" />
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-primary font-bold">{selectedService?.nameAr}</span>
                  <span className="text-background/40">•</span>
                  <span className="text-background/70">{selectedDate && `${selectedDate.getDate()} ${MONTHS_AR[selectedDate.getMonth()]}`}</span>
                  <span className="text-background/40">•</span>
                  <span className="text-background/70">{selectedTime}</span>
                </div>
              </div>

              <div className="max-w-md mx-auto space-y-5">
                <div>
                  <Label className="text-background/70 mb-2 block font-medium">الاسم الكريم</Label>
                  <Input value={form.visitorName} onChange={e => setForm(p => ({ ...p, visitorName: e.target.value }))}
                    placeholder="اسمك الكريم" className="bg-background/10 border-background/20 text-background placeholder:text-background/30 h-12"
                    data-testid="input-booking-name" />
                </div>
                <div>
                  <Label className="text-background/70 mb-2 block font-medium">رقم الجوال</Label>
                  <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="07XXXXXXXX" className="bg-background/10 border-background/20 text-background placeholder:text-background/30 h-12"
                    data-testid="input-booking-phone" />
                </div>
                <Button className="w-full h-14 text-base font-bold" size="lg"
                  disabled={!canSubmit || bookMutation.isPending}
                  onClick={() => bookMutation.mutate()}
                  data-testid="button-submit-booking">
                  {bookMutation.isPending ? "جاري الحجز..." : "تأكيد الحجز"}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}

function GallerySection() {
  const { data: images = [] } = useQuery<Array<{ id: number; url: string; caption: string | null }>>({ queryKey: ["/api/gallery"] });

  const placeholders = [
    "from-primary/20 to-primary/5",
    "from-foreground/20 to-foreground/5",
    "from-primary/15 to-muted",
    "from-muted to-card",
    "from-primary/10 to-secondary",
    "from-secondary to-primary/5",
  ];

  return (
    <section id="gallery" className="py-24 px-5 bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-12 bg-primary/50" />
            <span className="text-primary text-sm font-bold tracking-widest uppercase">معرض الأعمال</span>
            <div className="h-px w-12 bg-primary/50" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black mb-3">إبداعاتنا</h2>
          <p className="text-muted-foreground">كل قصة شعر حكاية تميّز</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.length > 0 ? images.map(img => (
            <div key={img.id} className="aspect-square rounded-2xl overflow-hidden group" data-testid={`gallery-img-${img.id}`}>
              <img src={img.url} alt={img.caption || "معرض الأعمال"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
          )) : placeholders.map((grad, i) => (
            <div key={i} className={`aspect-square rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center border border-primary/5`}>
              <div className="text-center">
                <Scissors className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground/20 font-medium">صورة العمل</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section id="contact" className="py-24 px-5 bg-foreground">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-12 bg-primary/50" />
            <span className="text-primary text-sm font-bold tracking-widest uppercase">تواصل معنا</span>
            <div className="h-px w-12 bg-primary/50" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-background mb-3">نحن في انتظارك</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { icon: <Phone className="w-6 h-6" />, title: "اتصل بنا", value: "+964 77 000 0000" },
            { icon: <MapPin className="w-6 h-6" />, title: "العنوان", value: "بغداد، العراق" },
            { icon: <Clock className="w-6 h-6" />, title: "أوقات العمل", value: "٩ ص - ١١ م" },
          ].map(({ icon, title, value }, i) => (
            <div key={i} className="p-7 rounded-2xl bg-background/5 border border-background/10 text-center group hover-elevate">
              <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4 text-primary">
                {icon}
              </div>
              <h3 className="font-bold text-background mb-2">{title}</h3>
              <p className="text-background/50 text-sm">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-8 px-5 bg-foreground border-t border-background/5">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Scissors className="w-5 h-5 text-primary" />
          <span className="font-black text-background text-lg">عدنان باشا</span>
        </div>
        <p className="text-sm text-background/30">© 2024 جميع الحقوق محفوظة - صالون عدنان باشا</p>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  const { data: settings = {} } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });

  return (
    <div className="min-h-screen bg-background" style={{ direction: "rtl" }}>
      <Navbar settings={settings} />
      <HeroSection settings={settings} />
      <ServicesSection />
      <BookingSection />
      <GallerySection />
      <ContactSection />
      <Footer />
    </div>
  );
}
