"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useScan } from "@/features/scan/hooks/useScan";
import type { ScanResult, ScanState } from "@/features/scan/types";
import { useDashboard } from "@/features/dashboard/hooks/useDashboard";

function DigitalClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) return <div className="h-[96px]" />;

  return (
    <>
      <div className="text-7xl font-extrabold tracking-tighter tabular-nums mb-3 drop-shadow-md">
        {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </div>
      <div className="text-neutral-400 font-medium tracking-wide text-lg">
        {time.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
      </div>
    </>
  );
}

export default function ScanPage() {
  const { data: dashboardData } = useDashboard();
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [manualId, setManualId] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scanMutation = useScan();

  const processing = scanMutation.isPending;

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          const stopPromise = scannerRef.current.stop();
          if (stopPromise) stopPromise.catch(() => { });
        } catch (error) {
          console.error("Error stopping scanner:", error);
        }
      }
    };
  }, []);

  async function startScanner() {
    setScanState("scanning");
    setResult(null);
    setErrorMsg("");

    try {
      const scanner = new Html5Qrcode("qr-scanner-container");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await scanner.stop();
          setScanState("idle");
          await processScan(decodedText);
        },
        () => { }
      );
    } catch (err: any) {
      setScanState("idle");
      setErrorMsg("Could not access camera. Please check permissions or use manual entry.");
      console.error("Camera error:", err);
    }
  }

  async function stopScanner() {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (error) {
        console.error("Error stopping scanner:", error);
      }
      scannerRef.current = null;
    }
    setScanState("idle");
  }

  async function processScan(employeeId: string) {
    setErrorMsg("");
    scanMutation.mutate(employeeId.trim(), {
      onSuccess: (data) => {
        setScanState("success");
        setResult(data);
        setTimeout(() => {
          setScanState("idle");
          setResult(null);
        }, 4000);
      },
      onError: (err) => {
        setScanState("error");
        setErrorMsg(err.message);
        setTimeout(() => {
          setScanState("idle");
          setErrorMsg("");
        }, 4000);
      },
    });
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualId.trim()) return;
    await processScan(manualId.trim().toUpperCase());
    setManualId("");
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">QR Scanner</h1>
        <p className="text-muted-foreground mt-1">Scan employee QR codes to record attendance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="w-full mx-auto lg:mx-0">
          {scanState === "success" && result && (
            <Card className={`mb-6 shadow-lg border-0 ${result.type === "IN" ? "bg-primary text-primary-foreground" : "bg-neutral-700 text-white"
              }`}>
              <CardContent className="text-center py-6">
                <div className="text-5xl mb-3">{result.type === "IN" ? "✓" : "←"}</div>
                <p className="text-2xl font-bold">{result.type === "IN" ? "Checked IN" : "Checked OUT"}</p>
                <p className="text-xl mt-1">{result.employeeName}</p>
                <p className="opacity-80 text-sm mt-1 font-mono">{result.employeeId}</p>
                <p className="opacity-80 text-sm mt-2">{formatTime(result.timestamp)}</p>
              </CardContent>
            </Card>
          )}

          {scanState === "error" && (
            <Card className="mb-6 shadow-lg border-0 bg-neutral-800 text-white">
              <CardContent className="text-center py-6">
                <div className="text-5xl mb-3">✗</div>
                <p className="text-lg font-semibold">Scan Failed</p>
                <p className="opacity-70 text-sm mt-1">{errorMsg}</p>
              </CardContent>
            </Card>
          )}

          {processing && (
            <Card className="mb-6 shadow-lg border-0 bg-muted">
              <CardContent className="text-center py-6">
                <div className="text-3xl mb-2 animate-spin">⟳</div>
                <p className="font-semibold">Processing scan...</p>
              </CardContent>
            </Card>
          )}

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Camera Scanner</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                id="qr-scanner-container"
                ref={containerRef}
                className={`w-full rounded-xl overflow-hidden bg-muted ${scanState === "scanning" ? "block" : "hidden"
                  }`}
                style={{ minHeight: 300 }}
              />

              {scanState !== "scanning" && (
                <div className="flex items-center justify-center h-48 bg-secondary rounded-xl border-2 border-dashed border-border mb-4">
                  <div className="text-center">
                    <p className="text-4xl mb-2">◎</p>
                    <p className="text-muted-foreground text-sm">Camera preview will appear here</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                {scanState !== "scanning" ? (
                  <Button
                    onClick={startScanner}
                    disabled={processing}
                    className="flex-1 h-12 gap-2"
                    size="lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Start Scanner
                  </Button>
                ) : (
                  <Button
                    onClick={stopScanner}
                    variant="secondary"
                    className="flex-1 h-12 mt-4"
                    size="lg"
                  >
                    Stop Scanner
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manual Entry</CardTitle>
              <CardDescription>Enter the employee ID directly if the camera isn&apos;t available</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualSubmit} className="flex gap-3 items-center">
                <Input
                  type="text"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value.toUpperCase())}
                  placeholder="e.g. EMP1234"
                  className="flex-1 h-10 font-mono"
                />
                <Button className="h-10" type="submit" disabled={processing || !manualId.trim()}>
                  Submit
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="flex-col hidden lg:flex gap-6 h-[calc(100vh-14rem)]">
          <div className="text-center bg-neutral-950 border border-neutral-800 text-white rounded-3xl p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <DigitalClock />
            </div>
          </div>

          <Card className="flex-1 bg-gradient-to-br from-primary/5 via-background to-background border-primary/10 rounded-3xl mt-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Station Operations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 text-sm text-muted-foreground">
              <div className="flex gap-4 items-start">
                <span className="text-primary mt-0.5 text-lg">●</span>
                <p className="leading-relaxed">Ensure employee badges are held steady at a distance of 15-20cm from the camera lens for optimal scanning.</p>
              </div>
              <div className="flex gap-4 items-start">
                <span className="text-primary mt-0.5 text-lg">●</span>
                <p className="leading-relaxed">If physical QR codes are damaged or illegible, please utilize the Manual Entry fallback with their ID code.</p>
              </div>
              <div className="flex gap-4 items-start">
                <span className="text-primary mt-0.5 text-lg">●</span>
                <p className="leading-relaxed">Scans within a 30-second window are blocked automatically to prevent accidental duplicate entries.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
