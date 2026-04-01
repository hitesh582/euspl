"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface ScanResult {
  employeeName: string;
  employeeId: string;
  type: "IN" | "OUT";
  timestamp: string;
}

type ScanState = "idle" | "scanning" | "success" | "error";

export default function ScanPage() {
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [manualId, setManualId] = useState("");
  const [processing, setProcessing] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
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
        () => {}
      );
    } catch (err: any) {
      setScanState("idle");
      setErrorMsg("Could not access camera. Please check permissions or use manual entry.");
      console.error("Camera error:", err);
    }
  }

  async function stopScanner() {
    if (scannerRef.current) {
      await scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setScanState("idle");
  }

  async function processScan(employeeId: string) {
    setProcessing(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: employeeId.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setScanState("error");
        setErrorMsg(data.error || "Scan failed");
      } else {
        setScanState("success");
        setResult({
          employeeName: data.employeeName,
          employeeId: data.employeeId,
          type: data.type,
          timestamp: data.timestamp,
        });
      }
    } catch (err) {
      setScanState("error");
      setErrorMsg("Network error. Please try again.");
    } finally {
      setProcessing(false);
    }

    setTimeout(() => {
      setScanState("idle");
      setResult(null);
      setErrorMsg("");
    }, 4000);
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualId.trim()) return;
    await processScan(manualId.trim().toUpperCase());
    setManualId("");
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">QR Scanner</h1>
        <p className="text-muted-foreground mt-1">Scan employee QR codes to record attendance</p>
      </div>

      {scanState === "success" && result && (
        <Card className={`mb-6 shadow-lg border-0 ${
          result.type === "IN" ? "bg-primary text-primary-foreground" : "bg-neutral-700 text-white"
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
            className={`w-full rounded-xl overflow-hidden bg-muted ${
              scanState === "scanning" ? "block" : "hidden"
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
                className="flex-1 h-12"
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
          <form onSubmit={handleManualSubmit} className="flex gap-3">
            <Input
              type="text"
              value={manualId}
              onChange={(e) => setManualId(e.target.value.toUpperCase())}
              placeholder="e.g. EMP1234"
              className="flex-1 h-10 font-mono"
            />
            <Button type="submit" disabled={processing || !manualId.trim()}>
              Submit
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
