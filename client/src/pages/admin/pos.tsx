import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Service, Barber, Product } from "@shared/schema";
import { Scissors, User, Package, CreditCard, Banknote, Trash2, Plus, Minus, ShoppingCart } from "lucide-react";

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
      const existing = prev.find(item => item.type === type && item.id === id);
      if (existing) {
        return prev.map(item =>
          item.type === type && item.id === id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { type, id, name, price, quantity: 1 }];
    });
  };

  const removeFromCart = (type: string, id: number) => {
    setCart(prev => prev.filter(item => !(item.type === type && item.id === id)));
  };

  const updateQuantity = (type: string, id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.type === type && item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const servicesTotal = cart.filter(i => i.type === "service").reduce((s, i) => s + i.price * i.quantity, 0);
  const productsTotal = cart.filter(i => i.type === "product").reduce((s, i) => s + i.price * i.quantity, 0);
  const total = servicesTotal + productsTotal;

  const hasServices = cart.some(i => i.type === "service");

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
      toast({ title: "Sale Complete!", description: `Total: ${total.toFixed(2)} SAR` });
      setCart([]);
      setSelectedBarber(null);
      setCustomerName("");
      setStep("services");
      queryClient.invalidateQueries({ queryKey: ["/api/stats/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const canProceed = () => {
    if (step === "services") return hasServices;
    if (step === "barber") return selectedBarber !== null;
    if (step === "products") return true;
    if (step === "payment") return true;
    return false;
  };

  const nextStep = () => {
    if (step === "services") setStep("barber");
    else if (step === "barber") setStep("products");
    else if (step === "products") setStep("payment");
  };

  const prevStep = () => {
    if (step === "barber") setStep("services");
    else if (step === "products") setStep("barber");
    else if (step === "payment") setStep("products");
  };

  const steps = ["services", "barber", "products", "payment"] as const;
  const stepLabels = ["Services", "Barber", "Products", "Payment"];
  const currentStepIndex = steps.indexOf(step);

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4">
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
          {stepLabels.map((label, i) => (
            <button key={label} onClick={() => {
              if (i <= currentStepIndex) setStep(steps[i]);
            }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                i === currentStepIndex ? "bg-primary text-primary-foreground" :
                i < currentStepIndex ? "bg-muted text-foreground" : "bg-muted/50 text-muted-foreground"
              }`}
              data-testid={`button-step-${label.toLowerCase()}`}>
              <span className="w-5 h-5 rounded-full bg-background/20 flex items-center justify-center text-xs">{i + 1}</span>
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto">
          {step === "services" && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {activeServices.map(service => {
                const inCart = cart.find(i => i.type === "service" && i.id === service.id);
                return (
                  <button key={service.id} onClick={() => addToCart("service", service.id, service.name, service.price)}
                    className={`p-4 rounded-md border-2 text-left transition-colors ${
                      inCart ? "border-primary bg-primary/5" : "border-border bg-card"
                    }`}
                    data-testid={`button-pos-service-${service.id}`}>
                    <Scissors className="w-6 h-6 text-primary mb-2" />
                    <p className="font-semibold">{service.name}</p>
                    <p className="text-xs text-muted-foreground">{service.duration} min</p>
                    <p className="text-lg font-bold text-primary mt-1">{service.price} SAR</p>
                    {inCart && <Badge className="mt-2">x{inCart.quantity}</Badge>}
                  </button>
                );
              })}
            </div>
          )}

          {step === "barber" && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {activeBarbers.map(barber => (
                <button key={barber.id} onClick={() => setSelectedBarber(barber.id)}
                  className={`p-6 rounded-md border-2 text-center transition-colors ${
                    selectedBarber === barber.id ? "border-primary bg-primary/5" : "border-border bg-card"
                  }`}
                  data-testid={`button-pos-barber-${barber.id}`}>
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <User className="w-7 h-7 text-primary" />
                  </div>
                  <p className="font-semibold text-lg">{barber.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{barber.commission}% commission</p>
                </button>
              ))}
            </div>
          )}

          {step === "products" && (
            <div>
              <p className="text-sm text-muted-foreground mb-3">Add any products sold (optional)</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {activeProducts.map(product => {
                  const inCart = cart.find(i => i.type === "product" && i.id === product.id);
                  return (
                    <button key={product.id} onClick={() => addToCart("product", product.id, product.name, product.price)}
                      className={`p-4 rounded-md border-2 text-left transition-colors ${
                        inCart ? "border-primary bg-primary/5" : "border-border bg-card"
                      }`}
                      data-testid={`button-pos-product-${product.id}`}>
                      <Package className="w-6 h-6 text-chart-3 mb-2" />
                      <p className="font-semibold">{product.name}</p>
                      <p className="text-xs text-muted-foreground">Stock: {product.stock}</p>
                      <p className="text-lg font-bold text-primary mt-1">{product.price} SAR</p>
                      {inCart && <Badge className="mt-2">x{inCart.quantity}</Badge>}
                    </button>
                  );
                })}
                {activeProducts.length === 0 && (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    No products available
                  </div>
                )}
              </div>
            </div>
          )}

          {step === "payment" && (
            <div className="max-w-md space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Customer Name (optional)</label>
                <Input value={customerName} onChange={e => setCustomerName(e.target.value)}
                  placeholder="Customer name" data-testid="input-pos-customer" />
              </div>
              <div>
                <label className="text-sm font-medium mb-3 block">Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setPaymentMethod("cash")}
                    className={`p-6 rounded-md border-2 text-center transition-colors ${
                      paymentMethod === "cash" ? "border-primary bg-primary/5" : "border-border bg-card"
                    }`}
                    data-testid="button-payment-cash">
                    <Banknote className="w-8 h-8 mx-auto mb-2 text-chart-2" />
                    <p className="font-semibold">Cash</p>
                  </button>
                  <button onClick={() => setPaymentMethod("card")}
                    className={`p-6 rounded-md border-2 text-center transition-colors ${
                      paymentMethod === "card" ? "border-primary bg-primary/5" : "border-border bg-card"
                    }`}
                    data-testid="button-payment-card">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 text-chart-3" />
                    <p className="font-semibold">Card</p>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-4 border-t mt-4">
          <Button variant="outline" onClick={prevStep} disabled={step === "services"} data-testid="button-pos-back">
            Back
          </Button>
          {step === "payment" ? (
            <Button size="lg" onClick={() => completeSale.mutate()} disabled={completeSale.isPending || !canProceed()}
              className="px-8" data-testid="button-pos-complete">
              {completeSale.isPending ? "Processing..." : `Complete Sale - ${total.toFixed(2)} SAR`}
            </Button>
          ) : (
            <Button onClick={nextStep} disabled={!canProceed()} data-testid="button-pos-next">
              Next
            </Button>
          )}
        </div>
      </div>

      <Card className="lg:w-80 p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Order Summary</h3>
        </div>
        <div className="flex-1 overflow-auto space-y-2">
          {cart.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No items added</p>
          ) : cart.map(item => (
            <div key={`${item.type}-${item.id}`} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">{(item.price * item.quantity).toFixed(2)} SAR</p>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQuantity(item.type, item.id, -1)}>
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="text-sm w-5 text-center">{item.quantity}</span>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQuantity(item.type, item.id, 1)}>
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
            <span className="text-sm">{activeBarbers.find(b => b.id === selectedBarber)?.name}</span>
          </div>
        )}
        <div className="border-t mt-2 pt-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Services</span>
            <span>{servicesTotal.toFixed(2)} SAR</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Products</span>
            <span>{productsTotal.toFixed(2)} SAR</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-1">
            <span>Total</span>
            <span className="text-primary" data-testid="text-pos-total">{total.toFixed(2)} SAR</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
