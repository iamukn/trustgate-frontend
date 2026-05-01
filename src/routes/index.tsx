import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Smartphone, CreditCard, Loader2, CheckCircle2, AlertTriangle, XCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "TrustGate — SIM Swap & Device Verification Gateway" },
      { name: "description", content: "Prevent telecom fraud with TrustGate. Verify SIM swap status and device identity before payment using CAMARA APIs." },
    ],
  }),
});

const PAYMENT_URL = "https://payment.example.com";

type Step = "sim" | "device" | "payment";
type StepState = "pending" | "active" | "success" | "warning" | "error";
type FlowState =
  | { kind: "idle" }
  | { kind: "checking-sim" }
  | { kind: "sim-safe" }
  | { kind: "sim-swapped" }
  | { kind: "verifying-device" }
  | { kind: "verified" }
  | { kind: "mismatch" };

function Index() {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [flow, setFlow] = useState<FlowState>({ kind: "idle" });

  const validatePhone = (v: string) => /^\+?[1-9]\d{7,14}$/.test(v.replace(/[\s-]/g, ""));

  const reset = () => {
    setFlow({ kind: "idle" });
  };

  const redirectToPayment = () => {
    setTimeout(() => {
      window.location.href = PAYMENT_URL;
    }, 1500);
  };

  const handleVerify = async () => {
    setPhoneError("");
    if (!validatePhone(phone)) {
      setPhoneError("Please enter a valid phone number (e.g. +14155552671)");
      return;
    }

    setFlow({ kind: "checking-sim" });
    // Mock SIM swap check — phone ending in even digit = safe, odd = swapped
    await new Promise((r) => setTimeout(r, 1400));
    const lastDigit = parseInt(phone.replace(/\D/g, "").slice(-1), 10);
    const swapped = lastDigit % 2 === 1;

    if (!swapped) {
      setFlow({ kind: "sim-safe" });
      redirectToPayment();
      return;
    }

    setFlow({ kind: "sim-swapped" });
    await new Promise((r) => setTimeout(r, 1200));
    setFlow({ kind: "verifying-device" });

    // Mock device + numbers verify — phone ending in 9 fails, others succeed
    await new Promise((r) => setTimeout(r, 1600));
    const matches = lastDigit !== 9;

    if (matches) {
      setFlow({ kind: "verified" });
      redirectToPayment();
    } else {
      setFlow({ kind: "mismatch" });
    }
  };

  const isLoading = flow.kind === "checking-sim" || flow.kind === "verifying-device";

  const stepStates: Record<Step, StepState> = (() => {
    switch (flow.kind) {
      case "idle":
        return { sim: "pending", device: "pending", payment: "pending" };
      case "checking-sim":
        return { sim: "active", device: "pending", payment: "pending" };
      case "sim-safe":
        return { sim: "success", device: "pending", payment: "active" };
      case "sim-swapped":
        return { sim: "warning", device: "pending", payment: "pending" };
      case "verifying-device":
        return { sim: "warning", device: "active", payment: "pending" };
      case "verified":
        return { sim: "warning", device: "success", payment: "active" };
      case "mismatch":
        return { sim: "warning", device: "error", payment: "error" };
    }
  })();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60 backdrop-blur bg-background/80 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-[image:var(--gradient-hero)] flex items-center justify-center shadow-[var(--shadow-glow)]">
              <ShieldCheck className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight">TrustGate</h1>
              <p className="text-xs text-muted-foreground -mt-0.5">SIM Swap & Device Verification</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            <span>Powered by CAMARA APIs</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 md:py-16">
        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            Secure payment gateway
          </div>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
            Verify your identity before payment
          </h2>
          <p className="text-muted-foreground">
            We check your SIM status and device to prevent fraud — in seconds.
          </p>
        </div>

        <div className="grid md:grid-cols-[1fr_320px] gap-6">
          {/* Form Card */}
          <div className="rounded-2xl border border-border bg-[image:var(--gradient-card)] shadow-[var(--shadow-soft)] p-6 md:p-8">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 415 555 2671"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isLoading}
                  className={cn(phoneError && "border-destructive focus-visible:ring-destructive")}
                />
                {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-muted-foreground">Name <span className="text-xs">(optional)</span></Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} placeholder="Jane Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-muted-foreground">Email <span className="text-xs">(optional)</span></Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} placeholder="jane@example.com" />
                </div>
              </div>

              <Button
                onClick={handleVerify}
                disabled={isLoading || flow.kind === "sim-safe" || flow.kind === "verified"}
                size="lg"
                className="w-full bg-[image:var(--gradient-hero)] hover:opacity-95 transition-opacity shadow-[var(--shadow-elegant)]"
              >
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> {flow.kind === "checking-sim" ? "Checking SIM..." : "Verifying device..."}</>
                ) : (
                  <><ShieldCheck className="h-4 w-4" /> Verify SIM Status</>
                )}
              </Button>

              {/* Status banner */}
              <StatusBanner flow={flow} onReset={reset} />
            </div>
          </div>

          {/* Timeline */}
          <aside className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-sm font-semibold mb-4">Security Status</h3>
            <ol className="space-y-4">
              <TimelineItem icon={<ShieldCheck className="h-4 w-4" />} label="SIM check" hint="CAMARA SIM Swap API" state={stepStates.sim} />
              <TimelineItem icon={<Smartphone className="h-4 w-4" />} label="Device verification" hint="Numbers + Device APIs" state={stepStates.device} />
              <TimelineItem icon={<CreditCard className="h-4 w-4" />} label="Payment redirect" hint="Secure checkout" state={stepStates.payment} />
            </ol>
          </aside>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-10">
          Demo mode · Phone numbers ending in odd digits simulate a swap; ending in 9 simulates mismatch.
        </p>
      </main>
    </div>
  );
}

function StatusBanner({ flow, onReset }: { flow: FlowState; onReset: () => void }) {
  if (flow.kind === "idle") return null;

  const config = {
    "checking-sim": { tone: "info", icon: <Loader2 className="h-5 w-5 animate-spin" />, title: "Checking SIM swap status...", body: "Querying the CAMARA SIM Swap API." },
    "sim-safe": { tone: "success", icon: <CheckCircle2 className="h-5 w-5" />, title: "SIM is safe. No swap detected.", body: "Redirecting you to secure payment..." },
    "sim-swapped": { tone: "warning", icon: <AlertTriangle className="h-5 w-5" />, title: "SIM swap detected.", body: "Additional device verification required." },
    "verifying-device": { tone: "info", icon: <Loader2 className="h-5 w-5 animate-spin" />, title: "Verifying device & number...", body: "Cross-checking with Numbers and Device APIs." },
    "verified": { tone: "success", icon: <CheckCircle2 className="h-5 w-5" />, title: "Identity verified. Proceeding to payment...", body: "Device and number match confirmed." },
    "mismatch": { tone: "error", icon: <XCircle className="h-5 w-5" />, title: "Verification failed.", body: "Device and number mismatch. Payment blocked for your safety." },
  }[flow.kind];

  const toneClasses = {
    info: "bg-accent border-primary/20 text-foreground",
    success: "bg-success/10 border-success/30 text-foreground",
    warning: "bg-warning/15 border-warning/40 text-foreground",
    error: "bg-destructive/10 border-destructive/30 text-foreground",
  }[config.tone];

  const iconColor = {
    info: "text-primary",
    success: "text-success",
    warning: "text-warning-foreground",
    error: "text-destructive",
  }[config.tone];

  return (
    <div className={cn("flex items-start gap-3 rounded-xl border p-4 animate-in fade-in slide-in-from-bottom-2 duration-300", toneClasses)}>
      <div className={cn("mt-0.5 shrink-0", iconColor)}>{config.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{config.title}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{config.body}</p>
      </div>
      {flow.kind === "mismatch" && (
        <Button size="sm" variant="outline" onClick={onReset}>Try again</Button>
      )}
    </div>
  );
}

function TimelineItem({ icon, label, hint, state }: { icon: React.ReactNode; label: string; hint: string; state: StepState }) {
  const styles = {
    pending: "bg-muted text-muted-foreground border-border",
    active: "bg-primary text-primary-foreground border-primary animate-pulse",
    success: "bg-success text-success-foreground border-success",
    warning: "bg-warning text-warning-foreground border-warning",
    error: "bg-destructive text-destructive-foreground border-destructive",
  }[state];

  const labelColor = state === "pending" ? "text-muted-foreground" : "text-foreground";

  return (
    <li className="flex items-start gap-3">
      <div className={cn("h-8 w-8 rounded-full border flex items-center justify-center shrink-0 transition-colors", styles)}>
        {state === "active" ? <Loader2 className="h-4 w-4 animate-spin" /> : state === "success" ? <CheckCircle2 className="h-4 w-4" /> : state === "error" ? <XCircle className="h-4 w-4" /> : icon}
      </div>
      <div className="pt-0.5">
        <p className={cn("text-sm font-medium", labelColor)}>{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
    </li>
  );
}
