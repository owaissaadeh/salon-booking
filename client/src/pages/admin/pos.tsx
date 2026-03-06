import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Service, Barber, Product } from "@shared/schema";
import { Scissors, User, Package, CreditCard, Banknote, Trash2, Plus, Minus, ShoppingCart, Check } from "lucide-react";

interface CartItem {
  type: "service" | "product";
  id: number;
  name: string;
  price: number;
  quantity: number;
}

const steps = ["services", "barber", "products", "payment"] as const;
type Step = typeof steps[number];
const stepLabels: Record<Step, string> = {
  services: "الخدمات",
  barber: "الحلاق",
  products: "المنتجات",
  payment: "الدفع",
};

export default function POSPage() {
  const { toast } = useToast();
  const { data: services = [] } = useQuery<Service[]>({ queryKey: ["/api/services"] });
  const { data: barbers = [] } = useQuery<Barber[]>({ queryKey: ["/api/barbers"] });
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["/api/products"] });

  const activeServices = services.filter(s => s.active);
  const activeBarbers = barbers.filter(b => b.active);
  const activeProducts = products.filter(p => p.active && p.stock > 0);

  const [step, setStep] = useState<Step>("services");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState<number>(0);

  const addToCart = (type: "service" | "product", id: number, name: string, price: number) => {
    setCart(prev => {
      const existing = prev.find(i => i.type === type && i.id === id);
      if (existing) return prev.map(i => i.type === type && i.id === id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { type, id, name, price, quantity: 1 }];
    });
  };

  const removeFromCart = (type: string, id: number) => setCart(prev => prev.filter(i => !(i.type === type && i.id === id)));
  const updateQty = (type: string, id: number, delta: number) => setCart(prev =>
    prev.map(i => i.type === type && i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i)
  );

  const servicesTotal = cart.filter(i => i.type === "service").reduce((s, i) => s + i.price * i.quantity, 0);
  const productsTotal = cart.filter(i => i.type === "product").reduce((s, i) => s + i.price * i.quantity, 0);
  const subtotal = servicesTotal + productsTotal;
  const discountAmount = discountType === "percent"
    ? Math.min((subtotal * discountValue) / 100, subtotal)
    : Math.min(discountValue, subtotal);
  const total = subtotal - discountAmount;

  const currentIdx = steps.indexOf(step);

  const completeSale = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/transactions", {
        barberId: selectedBarber,
        customerName: customerName || null,
        totalAmount: total,
        servicesTotal,
        productsTotal,
        paymentMethod,
        items: cart.filter(i => i.type === "service").map(i => ({ serviceId: i.id, price: i.price * i.quantity })),
        products: cart.filter(i => i.type === "product").map(i => ({ productId: i.id, quantity: i.quantity, price: i.price * i.quantity })),
      });
    },
    onSuccess: () => {
      toast({ title: "تمت العملية!", description: `المبلغ: ${total.toFixed(2)} دينار` });
      setCart([]);
      setSelectedBarber(null);
      setCustomerName("");
      setDiscountValue(0);
      setStep("services");
      queryClient.invalidateQueries({ queryKey: ["/api/stats/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const canProceed = step === "services" ? cart.some(i => i.type === "service") :
    step === "barber" ? selectedBarber !== null : true;

  return (
    <div className="-m-4 md:-m-6 flex gap-3 overflow-hidden" style={{ height: "calc(100vh - 3.5rem)" }}>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex items-center gap-1.5 p-3 border-b bg-muted/20 flex-shrink-0 overflow-x-auto">
          {steps.map((s, i) => (
            <button key={s}
              onClick={() => { if (i <= currentIdx) setStep(s); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                i === currentIdx ? "bg-primary text-primary-foreground shadow" :
                i < currentIdx ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
              }`}
              data-testid={`button-step-${s}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                i < currentIdx ? "bg-primary/30" : "bg-background/20"
              }`}>
                {i < currentIdx ? <Check className="w-3 h-3" /> : i + 1}
              </span>
              {stepLabels[s]}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {step === "services" && (
            <div>
              <p className="text-xs text-muted-foreground mb-3 font-medium">اضغط على الخدمة لإضافتها</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
                {activeServices.map(svc => {
                  const inCart = cart.find(i => i.type === "service" && i.id === svc.id);
                  return (
                    <button key={svc.id} onClick={() => addToCart("service", svc.id, svc.nameAr, svc.price)}
                      className={`p-3 rounded-xl border-2 text-right transition-all ${
                        inCart ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
                      }`}
                      data-testid={`button-pos-service-${svc.id}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Scissors className="w-4 h-4 text-primary" />
                        </div>
                        {inCart && <Badge className="text-xs h-5 px-1.5">×{inCart.quantity}</Badge>}
                      </div>
                      <p className="font-bold text-sm leading-tight">{svc.nameAr}</p>
                      <p className="text-xs text-muted-foreground">{svc.duration} دقيقة</p>
                      <p className="text-base font-black text-primary mt-1">{svc.price} د</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === "barber" && (
            <div>
              <p className="text-xs text-muted-foreground mb-3 font-medium">اختر الحلاق الذي قدّم الخدمة</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
                {activeBarbers.map(barber => (
                  <button key={barber.id} onClick={() => setSelectedBarber(barber.id)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      selectedBarber === barber.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
                    }`}
                    data-testid={`button-pos-barber-${barber.id}`}>
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <p className="font-bold text-sm">{barber.name}</p>
                    <p className="text-xs text-muted-foreground">عمولة {barber.commission}%</p>
                    {selectedBarber === barber.id && (
                      <div className="mt-2 flex justify-center">
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === "products" && (
            <div>
              <p className="text-xs text-muted-foreground mb-3 font-medium">أضف منتجات تم بيعها (اختياري)</p>
              {activeProducts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">لا توجد منتجات متاحة</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
                  {activeProducts.map(product => {
                    const inCart = cart.find(i => i.type === "product" && i.id === product.id);
                    return (
                      <button key={product.id} onClick={() => addToCart("product", product.id, product.name, product.price)}
                        className={`p-3 rounded-xl border-2 text-right transition-all ${
                          inCart ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
                        }`}
                        data-testid={`button-pos-product-${product.id}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="w-8 h-8 rounded-lg bg-chart-3/10 flex items-center justify-center flex-shrink-0">
                            <Package className="w-4 h-4 text-chart-3" />
                          </div>
                          {inCart && <Badge className="text-xs h-5 px-1.5">×{inCart.quantity}</Badge>}
                        </div>
                        <p className="font-bold text-sm leading-tight">{product.name}</p>
                        <p className="text-xs text-muted-foreground">مخزون: {product.stock}</p>
                        <p className="text-base font-black text-primary mt-1">{product.price} د</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {step === "payment" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
              <div>
                <label className="text-sm font-semibold mb-2 block">اسم الزبون (اختياري)</label>
                <Input value={customerName} onChange={e => setCustomerName(e.target.value)}
                  placeholder="اسم الزبون" className="h-10" data-testid="input-pos-customer" />
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block">خصم</label>
                <div className="flex gap-2">
                  <Select value={discountType} onValueChange={(v: "percent" | "fixed") => setDiscountType(v)}>
                    <SelectTrigger className="w-24 h-10 flex-shrink-0" data-testid="select-discount-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">%</SelectItem>
                      <SelectItem value="fixed">دينار</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number" min={0}
                    max={discountType === "percent" ? 100 : subtotal}
                    value={discountValue || ""}
                    onChange={e => setDiscountValue(Math.max(0, Number(e.target.value)))}
                    placeholder="0" className="h-10 flex-1"
                    data-testid="input-pos-discount" />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-semibold mb-2 block">طريقة الدفع</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setPaymentMethod("cash")}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      paymentMethod === "cash" ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
                    }`}
                    data-testid="button-payment-cash">
                    <Banknote className="w-7 h-7 mx-auto mb-1.5 text-chart-2" />
                    <p className="font-bold text-sm">نقداً</p>
                  </button>
                  <button onClick={() => setPaymentMethod("card")}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      paymentMethod === "card" ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
                    }`}
                    data-testid="button-payment-card">
                    <CreditCard className="w-7 h-7 mx-auto mb-1.5 text-chart-3" />
                    <p className="font-bold text-sm">بطاقة</p>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-3 py-2.5 border-t flex-shrink-0">
          <Button variant="outline" size="sm" onClick={() => { if (currentIdx > 0) setStep(steps[currentIdx - 1]); }}
            disabled={step === "services"} data-testid="button-pos-back">رجوع</Button>
          {step === "payment" ? (
            <Button onClick={() => completeSale.mutate()}
              disabled={completeSale.isPending || !selectedBarber || cart.filter(i => i.type === "service").length === 0}
              className="font-bold px-6" data-testid="button-pos-complete">
              {completeSale.isPending ? "جاري..." : `إتمام البيع — ${total.toFixed(2)} دينار`}
            </Button>
          ) : (
            <Button size="sm" onClick={() => setStep(steps[currentIdx + 1])} disabled={!canProceed} data-testid="button-pos-next">
              التالي
            </Button>
          )}
        </div>
      </div>

      <Card className="w-60 flex-shrink-0 flex flex-col overflow-hidden p-0">
        <div className="flex items-center gap-2 p-3 border-b">
          <ShoppingCart className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-sm">ملخص الطلب</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {cart.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">لم يتم إضافة أي عنصر</p>
          ) : cart.map(item => (
            <div key={`${item.type}-${item.id}`} className="flex items-center gap-1.5 p-2 bg-muted/40 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">{(item.price * item.quantity).toFixed(2)} د</p>
              </div>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateQty(item.type, item.id, -1)}>
                  <Minus className="w-2.5 h-2.5" />
                </Button>
                <span className="text-xs w-4 text-center font-bold">{item.quantity}</span>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateQty(item.type, item.id, 1)}>
                  <Plus className="w-2.5 h-2.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeFromCart(item.type, item.id)}>
                  <Trash2 className="w-2.5 h-2.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        {selectedBarber && (
          <div className="flex items-center gap-1.5 px-3 py-2 border-t">
            <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-xs font-medium truncate">{activeBarbers.find(b => b.id === selectedBarber)?.name}</span>
          </div>
        )}
        <div className="border-t px-3 py-2 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">الخدمات</span>
            <span>{servicesTotal.toFixed(2)} د</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">المنتجات</span>
            <span>{productsTotal.toFixed(2)} د</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-xs text-destructive">
              <span>خصم {discountType === "percent" ? `${discountValue}%` : ""}</span>
              <span>- {discountAmount.toFixed(2)} د</span>
            </div>
          )}
          <div className="flex justify-between font-black text-base pt-1.5 border-t">
            <span>الإجمالي</span>
            <span className="text-primary" data-testid="text-pos-total">{total.toFixed(2)} د</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
