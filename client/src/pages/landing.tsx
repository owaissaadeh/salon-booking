import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Scissors, Clock, Phone, MapPin, Star, ChevronDown, Menu, X, ChevronRight, ChevronLeft, Check, Instagram, Twitter, Facebook, MessageCircle } from "lucide-react";
import type { Service } from "@shared/schema";

const GOLD = "#c09748";
const GOLD_LIGHT = "#d4af6a";
const BLACK = "#000000";
const DARK = "#0a0a0a";
const DARKER = "#050505";

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

type SlotInfo = { time: string; available: boolean };

function Navbar({ settings }: { settings: Record<string, string> }) {
  const [open, setOpen] = useState(false);
  const logoUrl = settings?.logo_url;
  const showText = settings?.logo_show_text !== "false";
  const phone = settings?.salon_phone;
  const insta = settings?.instagram;
  const tiktok = settings?.tiktok;

  const navLinks = [["#services", "الخدمات"], ["#booking", "احجز موعد"], ["#gallery", "معرض الأعمال"], ["#contact", "تواصل معنا"]];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(20px)", borderBottom: `1px solid rgba(192,151,72,0.12)` }}>
      <div className="max-w-6xl mx-auto px-5 flex items-center justify-between h-16">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="شعار الصالون" className="h-10 w-10 object-contain rounded-lg" />
          ) : (
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})` }}>
              <Scissors className="w-5 h-5 text-black" />
            </div>
          )}
          {showText && <span className="font-black text-xl text-white tracking-wide">عدنان باشا</span>}
        </div>

        <div className="hidden md:flex items-center gap-7">
          {navLinks.map(([href, label]) => (
            <a key={href} href={href} className="text-sm font-medium text-white/50 hover:text-white transition-colors">{label}</a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {insta && <a href={insta} target="_blank" rel="noopener" className="text-white/30 hover:text-white/70 transition-colors"><Instagram className="w-4 h-4" /></a>}
          {tiktok && <a href={tiktok} target="_blank" rel="noopener" className="text-white/30 hover:text-white/70 transition-colors"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/></svg></a>}
          <a href="#booking">
            <Button size="sm" className="text-xs font-bold text-black" style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})` }} data-testid="button-nav-book">
              احجز الآن
            </Button>
          </a>
        </div>

        <button className="md:hidden text-white" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t px-5 py-4 flex flex-col gap-3" style={{ background: "rgba(0,0,0,0.98)", borderColor: `rgba(192,151,72,0.1)` }}>
          {navLinks.map(([href, label]) => (
            <a key={href} href={href} className="text-sm py-2 font-medium text-white/70" onClick={() => setOpen(false)}>{label}</a>
          ))}
          <a href="#booking" className="mt-1">
            <Button className="w-full text-black font-bold" style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})` }} onClick={() => setOpen(false)}>
              احجز موعدك الآن
            </Button>
          </a>
        </div>
      )}
    </nav>
  );
}

function HeroSection({ settings }: { settings: Record<string, string> }) {
  const logoUrl = settings?.logo_url;
  const showText = settings?.logo_show_text !== "false";

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ background: BLACK }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 80% 60% at 50% 0%, rgba(192,151,72,0.06) 0%, transparent 70%)` }} />
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}40, transparent)` }} />
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}20, transparent)` }} />
        <svg className="absolute inset-0 w-full h-full opacity-[0.02]" xmlns="http://www.w3.org/2000/svg">
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke={GOLD} strokeWidth="0.5"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative z-10 text-center px-5 max-w-4xl mx-auto pt-16">
        {logoUrl && !showText && (
          <img src={logoUrl} alt="شعار الصالون" className="h-28 w-28 object-contain mx-auto mb-8 rounded-2xl" />
        )}
        {logoUrl && showText && (
          <img src={logoUrl} alt="شعار الصالون" className="h-20 w-20 object-contain mx-auto mb-6 rounded-xl" />
        )}

        <div className="flex items-center justify-center gap-4 mb-7">
          <div className="h-px flex-1 max-w-20" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}60)` }} />
          <div className="flex gap-1">
            {[0,1,2,3,4].map(i => <Star key={i} className="w-3 h-3" style={{ fill: GOLD, color: GOLD }} />)}
          </div>
          <div className="h-px flex-1 max-w-20" style={{ background: `linear-gradient(90deg, ${GOLD}60, transparent)` }} />
        </div>

        <h1 className="font-black text-white leading-none mb-3" style={{ fontSize: "clamp(3rem, 12vw, 8rem)", letterSpacing: "-0.02em" }}>
          عدنان باشا
        </h1>
        <p className="text-sm md:text-base font-bold tracking-[0.4em] mb-3 uppercase" style={{ color: GOLD }}>Adnan Basha Salon</p>

        <div className="w-16 h-px mx-auto mb-8" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />

        <p className="text-white/40 text-base md:text-lg mb-10 max-w-md mx-auto font-light leading-relaxed">
          تجربة حلاقة راقية على أعلى المستويات
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="#booking">
            <button className="px-10 py-4 text-sm font-black text-black rounded-xl transition-all hover:opacity-90 hover:scale-105"
              style={{ background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_LIGHT} 100%)`, letterSpacing: "0.05em" }}
              data-testid="button-book-hero">
              احجز موعدك الآن
            </button>
          </a>
          <a href="#services">
            <button className="px-10 py-4 text-sm font-bold text-white rounded-xl border transition-all hover:border-opacity-60"
              style={{ borderColor: `${GOLD}40`, background: "rgba(192,151,72,0.05)" }}
              data-testid="button-services-hero">
              استعرض خدماتنا
            </button>
          </a>
        </div>

        <div className="mt-20 flex justify-center">
          <a href="#services" className="flex flex-col items-center gap-2" style={{ color: `${GOLD}40` }}>
            <ChevronDown className="w-5 h-5 animate-bounce" />
          </a>
        </div>
      </div>
    </section>
  );
}

const SERVICE_ICONS = [Scissors, Star, Star, Star];

function ServicesSection() {
  const { data: services = [] } = useQuery<Service[]>({ queryKey: ["/api/services"] });
  const active = services.filter(s => s.active);

  return (
    <section id="services" className="py-28 px-5" style={{ background: DARK, scrollMarginTop: "4rem" }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-bold tracking-[0.4em] uppercase mb-5" style={{ color: GOLD }}>— خدماتنا المميزة —</p>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4">إتقان لا حدود له</h2>
          <p className="text-white/30 text-sm max-w-sm mx-auto">كل خدمة تُقدَّم بدقة متناهية وأدوات على أعلى مستوى</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {active.map((service, idx) => {
            const Icon = SERVICE_ICONS[idx % SERVICE_ICONS.length];
            return (
              <div key={service.id} className="group p-6 rounded-2xl border text-center transition-all duration-300 cursor-default"
                style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(192,151,72,0.1)" }}
                data-testid={`card-service-${service.id}`}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-all"
                  style={{ background: "rgba(192,151,72,0.08)", border: `1px solid rgba(192,151,72,0.15)` }}>
                  <Icon className="w-6 h-6" style={{ color: GOLD }} />
                </div>
                <h3 className="font-black text-white text-lg mb-1">{service.nameAr}</h3>
                <p className="text-xs mb-3 font-medium tracking-widest uppercase" style={{ color: `${GOLD}80` }}>{service.name}</p>
                <div className="flex items-center justify-center gap-1 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                  <Clock className="w-3 h-3" style={{ color: GOLD }} />
                  <span>{service.duration} دقيقة</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

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
  const today = new Date(); today.setHours(0,0,0,0);

  const fetchSlots = async (svc: Service, date: Date) => {
    setLoadingSlots(true); setSlots([]); setSelectedTime(null);
    const dateStr = date.toISOString().split("T")[0];
    try {
      const res = await fetch(`/api/bookings/available-slots?serviceId=${svc.id}&date=${dateStr}`);
      setSlots(await res.json());
    } catch { setSlots([]); }
    setLoadingSlots(false);
  };

  const handleSelectDate = (date: Date) => {
    if (date < today) return;
    setSelectedDate(date); setSelectedTime(null);
    if (selectedService) fetchSlots(selectedService, date);
  };

  const handleSelectService = (svc: Service) => {
    setSelectedService(svc); setSelectedDate(null); setSelectedTime(null); setSlots([]); setStep(2);
  };

  const bookMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/bookings", {
        visitorName: form.visitorName, phone: form.phone,
        serviceId: selectedService!.id, date: selectedDate!.toISOString().split("T")[0],
        time: selectedTime!, status: "pending",
      });
    },
    onSuccess: () => {
      toast({ title: "تم الحجز بنجاح!", description: "سيتواصل معك فريقنا لتأكيد الموعد" });
      setStep(1); setSelectedService(null); setSelectedDate(null); setSelectedTime(null); setSlots([]);
      setForm({ visitorName: "", phone: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    },
    onError: (err: Error) => toast({ title: "فشل الحجز", description: err.message, variant: "destructive" }),
  });

  const stepLabels = ["اختر الخدمة", "اختر الموعد", "بياناتك"];
  const goldBorderStyle = { borderColor: `rgba(192,151,72,0.15)`, background: "rgba(255,255,255,0.02)" };

  return (
    <section id="booking" className="py-28 px-5" style={{ background: BLACK, scrollMarginTop: "4rem" }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-bold tracking-[0.4em] uppercase mb-5" style={{ color: GOLD }}>— الحجز الإلكتروني —</p>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4">احجز موعدك</h2>
          <p className="text-white/30 text-sm">ثلاث خطوات بسيطة لحجز موعدك</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-10">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all`}
                style={{
                  background: step === i+1 ? `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})` :
                    step > i+1 ? "rgba(192,151,72,0.15)" : "rgba(255,255,255,0.05)",
                  color: step === i+1 ? "#000" : step > i+1 ? GOLD : "rgba(255,255,255,0.3)"
                }}>
                {step > i+1 ? <Check className="w-3 h-3" /> : <span>{i+1}</span>}
                <span className="hidden sm:block">{label}</span>
              </div>
              {i < 2 && <div className="w-6 h-px" style={{ background: "rgba(192,151,72,0.2)" }} />}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border p-6 md:p-8" style={goldBorderStyle}>
          {step === 1 && (
            <div>
              <p className="text-white/30 text-center mb-6 text-sm">اضغط على الخدمة التي تريدها</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {active.map((svc, idx) => {
                  const Icon = SERVICE_ICONS[idx % SERVICE_ICONS.length];
                  return (
                    <button key={svc.id} onClick={() => handleSelectService(svc)}
                      className="group p-5 rounded-xl text-center transition-all duration-200"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(192,151,72,0.1)" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `rgba(192,151,72,0.5)`; (e.currentTarget as HTMLElement).style.background = "rgba(192,151,72,0.06)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(192,151,72,0.1)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
                      data-testid={`button-book-service-${svc.id}`}>
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3"
                        style={{ background: "rgba(192,151,72,0.1)" }}>
                        <Icon className="w-5 h-5" style={{ color: GOLD }} />
                      </div>
                      <p className="font-bold text-white text-sm mb-1">{svc.nameAr}</p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>{svc.duration} دقيقة</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => { setStep(1); setSelectedDate(null); setSlots([]); }}
                  className="flex items-center gap-1 text-xs font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>
                  <ChevronRight className="w-3.5 h-3.5" /> تغيير
                </button>
                <div className="flex-1 h-px" style={{ background: "rgba(192,151,72,0.1)" }} />
                <span className="text-xs font-bold" style={{ color: GOLD }}>{selectedService?.nameAr}</span>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <button onClick={() => { const d = new Date(weekBase); d.setDate(d.getDate()-7); setWeekBase(d); }}>
                    <ChevronRight className="w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />
                  </button>
                  <span className="text-white text-sm font-bold">
                    {MONTHS_AR[weekDays[0].getMonth()]} {weekDays[0].getFullYear()}
                  </span>
                  <button onClick={() => { const d = new Date(weekBase); d.setDate(d.getDate()+7); setWeekBase(d); }}>
                    <ChevronLeft className="w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((day, i) => {
                    const isPast = day < today;
                    const isSelected = selectedDate?.toDateString() === day.toDateString();
                    return (
                      <button key={i} onClick={() => handleSelectDate(day)} disabled={isPast}
                        className="py-3 rounded-xl text-center transition-all text-xs"
                        style={{
                          background: isSelected ? `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})` : isPast ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)",
                          color: isSelected ? "#000" : isPast ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.7)",
                          cursor: isPast ? "not-allowed" : "pointer",
                          border: `1px solid ${isSelected ? "transparent" : "rgba(255,255,255,0.05)"}`,
                        }}
                        data-testid={`button-day-${i}`}>
                        <div className="font-medium mb-1">{DAYS_AR[day.getDay()].slice(0,3)}</div>
                        <div className="font-black text-base">{day.getDate()}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedDate && (
                <div>
                  <p className="text-xs mb-3 font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {DAYS_AR[selectedDate.getDay()]} {selectedDate.getDate()} {MONTHS_AR[selectedDate.getMonth()]}
                  </p>
                  {loadingSlots ? (
                    <div className="text-center py-8 text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>جاري تحميل المواعيد...</div>
                  ) : (
                    <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 gap-2">
                      {slots.map(slot => (
                        <button key={slot.time} disabled={!slot.available}
                          onClick={() => { if (slot.available) { setSelectedTime(slot.time); setStep(3); } }}
                          className="py-2.5 px-1 rounded-lg text-xs font-bold text-center transition-all"
                          style={{
                            background: !slot.available ? "rgba(255,255,255,0.02)" :
                              selectedTime === slot.time ? `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})` : "rgba(255,255,255,0.05)",
                            color: !slot.available ? "rgba(255,255,255,0.12)" :
                              selectedTime === slot.time ? "#000" : "rgba(255,255,255,0.7)",
                            cursor: !slot.available ? "not-allowed" : "pointer",
                            textDecoration: !slot.available ? "line-through" : "none",
                            border: `1px solid ${!slot.available ? "transparent" : selectedTime === slot.time ? "transparent" : "rgba(255,255,255,0.06)"}`,
                          }}
                          data-testid={`button-slot-${slot.time}`}>
                          {slot.time}
                        </button>
                      ))}
                      {slots.length === 0 && !loadingSlots && (
                        <div className="col-span-full text-center py-8 text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>لا توجد مواعيد متاحة</div>
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
                <button onClick={() => setStep(2)} className="flex items-center gap-1 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                  <ChevronRight className="w-3.5 h-3.5" /> تعديل
                </button>
                <div className="flex-1 h-px" style={{ background: "rgba(192,151,72,0.1)" }} />
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold" style={{ color: GOLD }}>{selectedService?.nameAr}</span>
                  <span style={{ color: "rgba(255,255,255,0.2)" }}>•</span>
                  <span style={{ color: "rgba(255,255,255,0.5)" }}>{selectedDate && `${selectedDate.getDate()} ${MONTHS_AR[selectedDate.getMonth()]}`}</span>
                  <span style={{ color: "rgba(255,255,255,0.2)" }}>•</span>
                  <span style={{ color: "rgba(255,255,255,0.5)" }}>{selectedTime}</span>
                </div>
              </div>
              <div className="max-w-md mx-auto space-y-4">
                <div>
                  <Label className="text-xs mb-1.5 block font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>الاسم الكريم</Label>
                  <Input value={form.visitorName} onChange={e => setForm(p => ({ ...p, visitorName: e.target.value }))}
                    placeholder="اسمك الكريم"
                    className="h-12 text-white placeholder:text-white/20"
                    style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(192,151,72,0.2)" }}
                    data-testid="input-booking-name" />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>رقم الجوال</Label>
                  <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="07XXXXXXXX"
                    className="h-12 text-white placeholder:text-white/20"
                    style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(192,151,72,0.2)" }}
                    data-testid="input-booking-phone" />
                </div>
                <button
                  className="w-full h-12 rounded-xl font-black text-sm transition-all hover:opacity-90 disabled:opacity-40"
                  style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`, color: "#000" }}
                  disabled={!form.visitorName.trim() || !form.phone.trim() || bookMutation.isPending}
                  onClick={() => bookMutation.mutate()}
                  data-testid="button-submit-booking">
                  {bookMutation.isPending ? "جاري الحجز..." : "تأكيد الحجز"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function GallerySection() {
  const { data: images = [] } = useQuery<Array<{ id: number; url: string; caption: string | null }>>({ queryKey: ["/api/gallery"] });

  return (
    <section id="gallery" className="py-28 px-5" style={{ background: DARK, scrollMarginTop: "4rem" }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-bold tracking-[0.4em] uppercase mb-5" style={{ color: GOLD }}>— معرض الأعمال —</p>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-3">إبداعاتنا</h2>
          <p className="text-white/30 text-sm">كل قصة شعر حكاية</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.length > 0 ? images.map(img => (
            <div key={img.id} className="aspect-square rounded-xl overflow-hidden group relative" data-testid={`gallery-img-${img.id}`}>
              <img src={img.url} alt={img.caption || "معرض الأعمال"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(transparent, rgba(0,0,0,0.6))` }} />
              {img.caption && <div className="absolute bottom-0 inset-x-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform"><p className="text-white text-xs font-bold">{img.caption}</p></div>}
            </div>
          )) : [0,1,2,3,4,5].map(i => (
            <div key={i} className="aspect-square rounded-xl border flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(192,151,72,0.08)" }}>
              <div className="text-center">
                <Scissors className="w-8 h-8 mx-auto mb-2" style={{ color: `${GOLD}20` }} />
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.1)" }}>صورة العمل</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactSection({ settings }: { settings: Record<string, string> }) {
  const phone = settings?.salon_phone || "+964 77 000 0000";
  const address = settings?.salon_address || "بغداد، العراق";
  const hours = settings?.working_hours || "٩ صباحاً — ١١ مساءً";

  return (
    <section id="contact" className="py-28 px-5" style={{ background: BLACK, scrollMarginTop: "4rem" }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-bold tracking-[0.4em] uppercase mb-5" style={{ color: GOLD }}>— تواصل معنا —</p>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-3">نحن في انتظارك</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: <Phone className="w-6 h-6" />, title: "اتصل بنا", value: phone, href: `tel:${phone}` },
            { icon: <MapPin className="w-6 h-6" />, title: "العنوان", value: address, href: null },
            { icon: <Clock className="w-6 h-6" />, title: "أوقات العمل", value: hours, href: null },
          ].map(({ icon, title, value, href }, i) => {
            const inner = (
              <div className="p-8 rounded-2xl text-center transition-all" key={i}
                style={{ background: "rgba(255,255,255,0.02)", border: `1px solid rgba(192,151,72,0.1)` }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{ background: "rgba(192,151,72,0.1)", color: GOLD }}>
                  {icon}
                </div>
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>{value}</p>
              </div>
            );
            return href ? <a href={href} key={i}>{inner}</a> : <div key={i}>{inner}</div>;
          })}
        </div>
      </div>
    </section>
  );
}

function Footer({ settings }: { settings: Record<string, string> }) {
  const logoUrl = settings?.logo_url;
  const showText = settings?.logo_show_text !== "false";
  const socials = [
    { key: "instagram", icon: <Instagram className="w-4 h-4" />, label: "Instagram" },
    { key: "twitter", icon: <Twitter className="w-4 h-4" />, label: "Twitter" },
    { key: "facebook", icon: <Facebook className="w-4 h-4" />, label: "Facebook" },
    { key: "whatsapp", icon: <MessageCircle className="w-4 h-4" />, label: "WhatsApp" },
    { key: "tiktok", icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/></svg>
    ), label: "TikTok" },
  ];

  return (
    <footer className="py-10 px-5" style={{ background: "#050505", borderTop: `1px solid rgba(192,151,72,0.08)` }}>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt="شعار" className="h-9 w-9 object-contain rounded-lg" />
            ) : (
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})` }}>
                <Scissors className="w-4 h-4 text-black" />
              </div>
            )}
            {showText && <span className="font-black text-white text-lg">عدنان باشا</span>}
          </div>

          <div className="flex items-center gap-3">
            {socials.map(({ key, icon, label }) => settings[key] ? (
              <a key={key} href={key === "whatsapp" ? `https://wa.me/${settings[key].replace(/\D/g,"")}` : settings[key]}
                target="_blank" rel="noopener" title={label}
                className="transition-colors" style={{ color: "rgba(255,255,255,0.2)" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = GOLD}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.2)"}>
                {icon}
              </a>
            ) : null)}
          </div>

          <p className="text-xs" style={{ color: "rgba(255,255,255,0.15)" }}>© 2024 جميع الحقوق محفوظة — صالون عدنان باشا</p>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  const { data: settings = {} } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });

  return (
    <div className="min-h-screen" style={{ direction: "rtl", background: BLACK, fontFamily: "'Cairo', sans-serif" }}>
      <Navbar settings={settings} />
      <div style={{ paddingTop: "4rem" }}>
        <HeroSection settings={settings} />
      </div>
      <ServicesSection />
      <BookingSection />
      <GallerySection />
      <ContactSection settings={settings} />
      <Footer settings={settings} />
    </div>
  );
}
