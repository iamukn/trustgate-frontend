import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Smartphone, CreditCard, Loader2, CheckCircle2, AlertTriangle, XCircle, Lock, Hash } from "lucide-react";
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

type Step = "sim" | "device" | "numbers" | "payment";
type StepState = "pending" | "active" | "success" | "warning" | "error" | "skipped";
type FlowState =
  | { kind: "idle" }
  | { kind: "checking" } // SIM + Device in parallel
  | { kind: "all-passed" } // both ok → straight to payment
  | { kind: "fallback-numbers"; simSwapped: boolean; deviceMismatch: boolean }
  | { kind: "numbers-verified"; simSwapped: boolean; deviceMismatch: boolean }
  | { kind: "blocked"; simSwapped: boolean; deviceMismatch: boolean };

function Index() {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [flow, setFlow] = useState<FlowState>({ kind: "idle" });
  // Per-step result tracking for the timeline
  const [simResult, setSimResult] = useState<StepState>("pending");
  const [deviceResult, setDeviceResult] = useState<StepState>("pending");
  const [numbersResult, setNumbersResult] = useState<StepState>("pending");

  const validatePhone = (v: string) => /^\+?[1-9]\d{7,14}$/.test(v.replace(/[\s-]/g, ""));

  const reset = () => {
    setFlow({ kind: "idle" });
    setSimResult("pending");
    setDeviceResult("pending");
    setNumbersResult("pending");
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

    setSimResult("active");
    setDeviceResult("active");
    setNumbersResult("pending");
    setFlow({ kind: "checking" });

    // Mock — run SIM swap + Device check in parallel
    const digits = phone.replace(/\D/g, "");
    const lastDigit = parseInt(digits.slice(-1), 10);
    const secondLast = parseInt(digits.slice(-2, -1) || "0", 10);

    // Rules: last digit odd → SIM swapped; second-to-last == 9 → device mismatch
    const simSwapped = lastDigit % 2 === 1;
    const deviceMismatch = secondLast === 9;

    await Promise.all([
      new Promise((r) => setTimeout(r, 1400)),
      new Promise((r) => setTimeout(r, 1600)),
    ]);

    setSimResult(simSwapped ? "warning" : "success");
    setDeviceResult(deviceMismatch ? "warning" : "success");

    // ✅ Happy path — both checks valid
    if (!simSwapped && !deviceMismatch) {
      setNumbersResult("skipped");
      setFlow({ kind: "all-passed" });
      redirectToPayment();
      return;
    }

    // ⚠️ Either failed → run Numbers Verify as fallback
    setFlow({ kind: "fallback-numbers", simSwapped, deviceMismatch });
    setNumbersResult("active");
    await new Promise((r) => setTimeout(r, 1500));

    // Mock — fallback succeeds unless BOTH primary checks failed
    const numbersOk = !(simSwapped && deviceMismatch);

    if (numbersOk) {
      setNumbersResult("success");
      setFlow({ kind: "numbers-verified", simSwapped, deviceMismatch });
      redirectToPayment();
    } else {
      setNumbersResult("error");
      setFlow({ kind: "blocked", simSwapped, deviceMismatch });
    }
  };

  const isLoading = flow.kind === "checking" || flow.kind === "fallback-numbers";

  const paymentState: StepState = (() => {
    if (flow.kind === "all-passed" || flow.kind === "numbers-verified") return "active";
    if (flow.kind === "blocked") return "error";
    return "pending";
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
                disabled={isLoading || flow.kind === "all-passed" || flow.kind === "numbers-verified"}
                size="lg"
                className="w-full bg-[image:var(--gradient-hero)] hover:opacity-95 transition-opacity shadow-[var(--shadow-elegant)]"
              >
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> {flow.kind === "checking" ? "Running SIM & device checks..." : "Verifying number..."}</>
                ) : (
                  <><ShieldCheck className="h-4 w-4" /> Verify & Continue</>
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
              <TimelineItem icon={<ShieldCheck className="h-4 w-4" />} label="SIM swap check" hint="CAMARA SIM Swap API" state={simResult} />
              <TimelineItem icon={<Smartphone className="h-4 w-4" />} label="Device verification" hint="CAMARA Device API" state={deviceResult} />
              <TimelineItem icon={<Hash className="h-4 w-4" />} label="Number verification" hint="Fallback · Numbers Verify API" state={numbersResult} />
              <TimelineItem icon={<CreditCard className="h-4 w-4" />} label="Payment redirect" hint="Secure checkout" state={paymentState} />
            </ol>
          </aside>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-10">
          Demo · Last digit odd → SIM swap. Second-to-last digit 9 → device mismatch. Both failing → blocked.
        </p>
      </main>
    </div>
  );
}

function StatusBanner({ flow, onReset }: { flow: FlowState; onReset: () => void }) {
  if (flow.kind === "idle") return null;

  const config = (() => {
    switch (flow.kind) {
      case "checking":
        return { tone: "info" as const, icon: <Loader2 className="h-5 w-5 animate-spin" />, title: "Running SIM swap & device checks...", body: "Querying CAMARA SIM Swap and Device APIs in parallel." };
      case "all-passed":
        return { tone: "success" as const, icon: <CheckCircle2 className="h-5 w-5" />, title: "All checks passed. SIM and device are valid.", body: "Redirecting you to secure payment..." };
      case "fallback-numbers": {
        const reason = flow.simSwapped && flow.deviceMismatch
          ? "SIM swap and device mismatch detected"
          : flow.simSwapped ? "SIM swap detected" : "Device mismatch detected";
        return { tone: "warning" as const, icon: <AlertTriangle className="h-5 w-5" />, title: `${reason}.`, body: "Running fallback Number Verification..." };
      }
      case "numbers-verified":
        return { tone: "success" as const, icon: <CheckCircle2 className="h-5 w-5" />, title: "Number verified via fallback. Identity confirmed.", body: "Redirecting you to secure payment..." };
      case "blocked":
        return { tone: "error" as const, icon: <XCircle className="h-5 w-5" />, title: "Verification failed.", body: "SIM, device and number checks could not confirm your identity. Payment blocked for your safety." };
    }
  })();

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
      {flow.kind === "blocked" && (
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
    skipped: "bg-muted/50 text-muted-foreground border-border border-dashed",
  }[state];

  const labelColor = state === "pending" || state === "skipped" ? "text-muted-foreground" : "text-foreground";

  return (
    <li className="flex items-start gap-3">
      <div className={cn("h-8 w-8 rounded-full border flex items-center justify-center shrink-0 transition-colors", styles)}>
        {state === "active" ? <Loader2 className="h-4 w-4 animate-spin" /> : state === "success" ? <CheckCircle2 className="h-4 w-4" /> : state === "error" ? <XCircle className="h-4 w-4" /> : state === "warning" ? <AlertTriangle className="h-4 w-4" /> : icon}
      </div>
      <div className="pt-0.5">
        <p className={cn("text-sm font-medium", labelColor)}>{label}</p>
        <p className="text-xs text-muted-foreground">{hint}{state === "skipped" ? " · skipped" : ""}</p>
      </div>
    </li>
  );
}
