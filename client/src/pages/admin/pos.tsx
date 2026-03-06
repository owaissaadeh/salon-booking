import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

export default function POSPage() {
  const { toast } = useToast();
  const { data: services = [] } = useQuery<Service[]>({ queryKey: ["/api/services"] });
  const { data: barbers = [] } = useQuery<Barber[]>({ queryKey: ["/api/barbers"] });
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["/api/products"] });

  const activeServices = services.filter(s => s.active);
  const activeBarbers = barbers.filter(b => b.active);
  const activeProducts = products.filter(p => p.active && p.stock > 0);

  const [step, setStep] = useState<"services" | "barber" | "products" | "payment">("services");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");

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
  const total = servicesTotal + productsTotal;

  const steps = ["services", "barber", "products", "payment"] as const;
  const stepLabels = ["الخدمات", "الحلاق", "المنتجات", "الدفع"];
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
      setCart([]); setSelectedBarber(null); setCustomerName(""); setStep("services");
      queryClient.invalidateQueries({ queryKey: ["/api/stats/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (err: Error) => toast({ title: "خطأ", description: err.message, variant: "destructive" }),
  });

  const canProceed = step === "services" ? cart.some(i => i.type === "service") :
    step === "barber" ? selectedBarber !== null : true;

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4">
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
          {stepLabels.map((label, i) => (
            <button key={label} onClick={() => { if (i <= currentIdx) setStep(steps[i]); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                i === currentIdx ? "bg-primary text-primary-foreground shadow-md" :
                i < currentIdx ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
              }`}
              data-testid={`button-step-${label}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                i < currentIdx ? "bg-primary/30" : "bg-background/20"
              }`}>
                {i < currentIdx ? <Check className="w-3 h-3" /> : i + 1}
              </span>
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto">
          {step === "services" && (
            <div>
              <p className="text-sm text-muted-foreground mb-4 font-medium">اضغط على الخدمة لإضافتها</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {activeServices.map(svc => {
                  const inCart = cart.find(i => i.type === "service" && i.id === svc.id);
                  return (
                    <button key={svc.id} onClick={() => addToCart("service", svc.id, svc.nameAr, svc.price)}
                      className={`p-5 rounded-xl border-2 text-right transition-all ${
                        inCart ? "border-primary bg-primary/5" : "border-border bg-card"
                      }`}
                      data-testid={`button-pos-service-${svc.id}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Scissors className="w-5 h-5 text-primary" />
                        </div>
                        {inCart && <Badge className="text-xs">×{inCart.quantity}</Badge>}
                      </div>
                      <p className="font-bold text-base">{svc.nameAr}</p>
                      <p className="text-xs text-muted-foreground mb-2">{svc.duration} دقيقة</p>
                      <p className="text-lg font-black text-primary">{svc.price} دينار</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === "barber" && (
            <div>
              <p className="text-sm text-muted-foreground mb-4 font-medium">اختر الحلاق الذي قدّم الخدمة</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {activeBarbers.map(barber => (
                  <button key={barber.id} onClick={() => setSelectedBarber(barber.id)}
                    className={`p-6 rounded-xl border-2 text-center transition-all ${
                      selectedBarber === barber.id ? "border-primary bg-primary/5" : "border-border bg-card"
                    }`}
                    data-testid={`button-pos-barber-${barber.id}`}>
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <User className="w-8 h-8 text-primary" />
                    </div>
                    <p className="font-bold text-lg">{barber.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">عمولة {barber.commission}%</p>
                    {selectedBarber === barber.id && (
                      <div className="mt-3 flex justify-center">
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-primary-foreground" />
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
              <p className="text-sm text-muted-foreground mb-4 font-medium">أضف منتجات تم بيعها (اختياري)</p>
              {activeProducts.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>لا توجد منتجات متاحة</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {activeProducts.map(product => {
                    const inCart = cart.find(i => i.type === "product" && i.id === product.id);
                    return (
                      <button key={product.id} onClick={() => addToCart("product", product.id, product.name, product.price)}
                        className={`p-5 rounded-xl border-2 text-right transition-all ${
                          inCart ? "border-primary bg-primary/5" : "border-border bg-card"
                        }`}
                        data-testid={`button-pos-product-${product.id}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-10 h-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
                            <Package className="w-5 h-5 text-chart-3" />
                          </div>
                          {inCart && <Badge className="text-xs">×{inCart.quantity}</Badge>}
                        </div>
                        <p className="font-bold">{product.name}</p>
                        <p className="text-xs text-muted-foreground mb-1">المخزون: {product.stock}</p>
                        <p className="text-lg font-black text-primary">{product.price} دينار</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {step === "payment" && (
            <div className="max-w-sm space-y-5">
              <div>
                <label className="text-sm font-semibold mb-2 block">اسم الزبون (اختياري)</label>
                <Input value={customerName} onChange={e => setCustomerName(e.target.value)}
                  placeholder="اسم الزبون" className="h-12" data-testid="input-pos-customer" />
              </div>
              <div>
                <label className="text-sm font-semibold mb-3 block">طريقة الدفع</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setPaymentMethod("cash")}
                    className={`p-6 rounded-xl border-2 text-center transition-all ${
                      paymentMethod === "cash" ? "border-primary bg-primary/5" : "border-border bg-card"
                    }`}
                    data-testid="button-payment-cash">
                    <Banknote className="w-9 h-9 mx-auto mb-2 text-chart-2" />
                    <p className="font-bold">نقداً</p>
                  </button>
                  <button onClick={() => setPaymentMethod("card")}
                    className={`p-6 rounded-xl border-2 text-center transition-all ${
                      paymentMethod === "card" ? "border-primary bg-primary/5" : "border-border bg-card"
                    }`}
                    data-testid="button-payment-card">
                    <CreditCard className="w-9 h-9 mx-auto mb-2 text-chart-3" />
                    <p className="font-bold">بطاقة</p>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => { const i = currentIdx; if (i > 0) setStep(steps[i - 1]); }}
            disabled={step === "services"} data-testid="button-pos-back">رجوع</Button>
          {step === "payment" ? (
            <Button size="lg" onClick={() => completeSale.mutate()}
              disabled={completeSale.isPending || !selectedBarber || cart.filter(i => i.type === "service").length === 0}
              className="px-8 font-bold" data-testid="button-pos-complete">
              {completeSale.isPending ? "جاري المعالجة..." : `إتمام البيع — ${total.toFixed(2)} دينار`}
            </Button>
          ) : (
            <Button onClick={() => setStep(steps[currentIdx + 1])} disabled={!canProceed} data-testid="button-pos-next">
              التالي
            </Button>
          )}
        </div>
      </div>

      <Card className="lg:w-80 p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart className="w-5 h-5 text-primary" />
          <h3 className="font-bold">ملخص الطلب</h3>
        </div>
        <div className="flex-1 overflow-auto space-y-2">
          {cart.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">لم يتم إضافة أي عنصر</p>
          ) : cart.map(item => (
            <div key={`${item.type}-${item.id}`} className="flex items-center gap-2 p-2.5 bg-muted/40 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">{(item.price * item.quantity).toFixed(2)} دينار</p>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQty(item.type, item.id, -1)}>
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="text-sm w-4 text-center font-bold">{item.quantity}</span>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQty(item.type, item.id, 1)}>
                  <Plus className="w-3 h-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeFromCart(item.type, item.id)}>
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        {selectedBarber && (
          <div className="flex items-center gap-2 py-2 border-t mt-2 pt-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{activeBarbers.find(b => b.id === selectedBarber)?.name}</span>
          </div>
        )}
        <div className="border-t mt-2 pt-3 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">الخدمات</span>
            <span>{servicesTotal.toFixed(2)} دينار</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">المنتجات</span>
            <span>{productsTotal.toFixed(2)} دينار</span>
          </div>
          <div className="flex justify-between font-black text-xl pt-2 border-t">
            <span>الإجمالي</span>
            <span className="text-primary" data-testid="text-pos-total">{total.toFixed(2)} دينار</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
