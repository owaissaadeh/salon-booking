import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Scissors, Clock, Phone, MapPin, Calendar, Star, ChevronDown, Menu, X } from "lucide-react";
import type { Service, Barber } from "@shared/schema";

function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        <a href="/" className="flex items-center gap-2">
          <Scissors className="w-6 h-6 text-primary" />
          <span className="font-bold text-lg tracking-tight">Salon Pro</span>
        </a>
        <div className="hidden md:flex items-center gap-6">
          <a href="#services" className="text-sm text-muted-foreground" data-testid="link-services">Services</a>
          <a href="#booking" className="text-sm text-muted-foreground" data-testid="link-booking">Book Now</a>
          <a href="#gallery" className="text-sm text-muted-foreground" data-testid="link-gallery">Gallery</a>
          <a href="#contact" className="text-sm text-muted-foreground" data-testid="link-contact">Contact</a>
          <a href="/admin"><Button size="sm" variant="outline" data-testid="link-admin">Dashboard</Button></a>
        </div>
        <Button size="icon" variant="ghost" className="md:hidden" onClick={() => setOpen(!open)} data-testid="button-mobile-menu">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>
      {open && (
        <div className="md:hidden border-t bg-background px-4 py-4 flex flex-col gap-3">
          <a href="#services" className="text-sm py-2" onClick={() => setOpen(false)}>Services</a>
          <a href="#booking" className="text-sm py-2" onClick={() => setOpen(false)}>Book Now</a>
          <a href="#gallery" className="text-sm py-2" onClick={() => setOpen(false)}>Gallery</a>
          <a href="#contact" className="text-sm py-2" onClick={() => setOpen(false)}>Contact</a>
          <a href="/admin"><Button size="sm" variant="outline" className="w-full">Dashboard</Button></a>
        </div>
      )}
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-foreground/95 via-foreground/90 to-foreground/80">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CjxyZWN0IHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0ibm9uZSIvPgo8Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+Cjwvc3ZnPg==')] opacity-50" />
      <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-4 py-1.5 mb-6">
          <Star className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-primary">Premium Barbershop</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-background mb-4 leading-tight">
          Where Style Meets <span className="text-primary">Precision</span>
        </h1>
        <p className="text-background/70 text-lg md:text-xl mb-8 max-w-xl mx-auto">
          Experience the finest grooming services. Book your appointment today and leave looking your best.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="#booking">
            <Button size="lg" className="text-base px-8" data-testid="button-book-hero">
              <Calendar className="w-4 h-4 mr-2" />
              Book Appointment
            </Button>
          </a>
          <a href="#services">
            <Button size="lg" variant="outline" className="text-base px-8 border-background/30 text-background bg-transparent backdrop-blur-sm" data-testid="button-services-hero">
              Our Services
            </Button>
          </a>
        </div>
        <a href="#services" className="inline-block mt-16 animate-bounce">
          <ChevronDown className="w-6 h-6 text-background/50" />
        </a>
      </div>
    </section>
  );
}

function ServicesSection() {
  const { data: services = [] } = useQuery<Service[]>({ queryKey: ["/api/services"] });
  const activeServices = services.filter(s => s.active);

  const icons: Record<string, string> = {
    "Haircut": "scissors",
    "Private Room": "door-open",
    "Cupping": "heart-pulse",
    "Facial": "sparkles",
  };

  return (
    <section id="services" className="py-20 px-4 bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Our Services</p>
          <h2 className="text-3xl font-bold mb-3">What We Offer</h2>
          <p className="text-muted-foreground max-w-md mx-auto">Professional grooming services tailored to your needs</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {activeServices.map(service => (
            <Card key={service.id} className="p-6 text-center hover-elevate" data-testid={`card-service-${service.id}`}>
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Scissors className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-1">{service.name}</h3>
              <p className="text-sm text-muted-foreground mb-1">{service.nameAr}</p>
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-3">
                <Clock className="w-3.5 h-3.5" />
                <span>{service.duration} min</span>
              </div>
              <p className="text-2xl font-bold text-primary">{service.price} SAR</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function BookingSection() {
  const { toast } = useToast();
  const { data: services = [] } = useQuery<Service[]>({ queryKey: ["/api/services"] });
  const { data: barbers = [] } = useQuery<Barber[]>({ queryKey: ["/api/barbers"] });
  const activeServices = services.filter(s => s.active);
  const activeBarbers = barbers.filter(b => b.active);

  const [formData, setFormData] = useState({
    visitorName: "",
    phone: "",
    serviceId: "",
    barberId: "",
    date: "",
    time: "",
  });

  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  const fetchSlots = async (serviceId: string, date: string) => {
    if (!serviceId || !date) return;
    try {
      const res = await fetch(`/api/bookings/available-slots?serviceId=${serviceId}&date=${date}`);
      const data = await res.json();
      setAvailableSlots(data);
    } catch {
      setAvailableSlots([]);
    }
  };

  const bookingMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/bookings", {
        ...formData,
        serviceId: parseInt(formData.serviceId),
        barberId: formData.barberId ? parseInt(formData.barberId) : null,
      });
    },
    onSuccess: () => {
      toast({ title: "Booking Confirmed!", description: "Your appointment has been booked successfully." });
      setFormData({ visitorName: "", phone: "", serviceId: "", barberId: "", date: "", time: "" });
      setAvailableSlots([]);
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    },
    onError: (err: Error) => {
      toast({ title: "Booking Failed", description: err.message, variant: "destructive" });
    },
  });

  const today = new Date().toISOString().split("T")[0];

  return (
    <section id="booking" className="py-20 px-4 bg-card">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Book Now</p>
          <h2 className="text-3xl font-bold mb-3">Reserve Your Spot</h2>
          <p className="text-muted-foreground">Pick a service, choose your time, and you're all set</p>
        </div>
        <Card className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Your name" value={formData.visitorName}
                onChange={e => setFormData(p => ({ ...p, visitorName: e.target.value }))}
                data-testid="input-booking-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="05XXXXXXXX" value={formData.phone}
                onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                data-testid="input-booking-phone" />
            </div>
            <div className="space-y-2">
              <Label>Service</Label>
              <Select value={formData.serviceId} onValueChange={v => {
                setFormData(p => ({ ...p, serviceId: v, time: "" }));
                fetchSlots(v, formData.date);
              }}>
                <SelectTrigger data-testid="select-booking-service"><SelectValue placeholder="Choose service" /></SelectTrigger>
                <SelectContent>
                  {activeServices.map(s => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name} - {s.price} SAR</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Barber (optional)</Label>
              <Select value={formData.barberId} onValueChange={v => setFormData(p => ({ ...p, barberId: v }))}>
                <SelectTrigger data-testid="select-booking-barber"><SelectValue placeholder="Any barber" /></SelectTrigger>
                <SelectContent>
                  {activeBarbers.map(b => (
                    <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" min={today} value={formData.date}
                onChange={e => {
                  setFormData(p => ({ ...p, date: e.target.value, time: "" }));
                  fetchSlots(formData.serviceId, e.target.value);
                }}
                data-testid="input-booking-date" />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Select value={formData.time} onValueChange={v => setFormData(p => ({ ...p, time: v }))}>
                <SelectTrigger data-testid="select-booking-time"><SelectValue placeholder="Select time" /></SelectTrigger>
                <SelectContent>
                  {availableSlots.length === 0 ? (
                    <SelectItem value="none" disabled>Select service & date first</SelectItem>
                  ) : (
                    availableSlots.map(slot => (
                      <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button className="w-full mt-6" size="lg"
            disabled={!formData.visitorName || !formData.phone || !formData.serviceId || !formData.date || !formData.time || bookingMutation.isPending}
            onClick={() => bookingMutation.mutate()}
            data-testid="button-submit-booking">
            {bookingMutation.isPending ? "Booking..." : "Confirm Booking"}
          </Button>
        </Card>
      </div>
    </section>
  );
}

function GallerySection() {
  const { data: images = [] } = useQuery<Array<{ id: number; url: string; caption: string | null }>>({
    queryKey: ["/api/gallery"],
  });

  const placeholders = [
    { id: -1, gradient: "from-primary/30 to-primary/10" },
    { id: -2, gradient: "from-accent to-muted" },
    { id: -3, gradient: "from-secondary to-card" },
    { id: -4, gradient: "from-muted to-accent" },
    { id: -5, gradient: "from-primary/20 to-secondary" },
    { id: -6, gradient: "from-card to-primary/10" },
  ];

  return (
    <section id="gallery" className="py-20 px-4 bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Gallery</p>
          <h2 className="text-3xl font-bold mb-3">Our Work</h2>
          <p className="text-muted-foreground">See the quality of our craftsmanship</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.length > 0 ? images.map(img => (
            <div key={img.id} className="aspect-square rounded-md overflow-hidden" data-testid={`gallery-img-${img.id}`}>
              <img src={img.url} alt={img.caption || "Gallery"} className="w-full h-full object-cover" />
            </div>
          )) : placeholders.map(p => (
            <div key={p.id} className={`aspect-square rounded-md bg-gradient-to-br ${p.gradient} flex items-center justify-center`}>
              <Scissors className="w-8 h-8 text-muted-foreground/30" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section id="contact" className="py-20 px-4 bg-card">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Contact Us</p>
        <h2 className="text-3xl font-bold mb-8">Get In Touch</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="p-6">
            <Phone className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Phone</h3>
            <p className="text-sm text-muted-foreground" data-testid="text-phone">+966 50 000 0000</p>
          </Card>
          <Card className="p-6">
            <MapPin className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Location</h3>
            <p className="text-sm text-muted-foreground" data-testid="text-location">Riyadh, Saudi Arabia</p>
          </Card>
          <Card className="p-6">
            <Clock className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Hours</h3>
            <p className="text-sm text-muted-foreground" data-testid="text-hours">9:00 AM - 11:00 PM</p>
          </Card>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-8 px-4 border-t bg-background">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Scissors className="w-5 h-5 text-primary" />
          <span className="font-semibold">Salon Pro</span>
        </div>
        <p className="text-sm text-muted-foreground">All rights reserved 2024</p>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <ServicesSection />
      <BookingSection />
      <GallerySection />
      <ContactSection />
      <Footer />
    </div>
  );
}
