"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="max-w-md w-full text-center">
        <CardContent className="py-12 px-8">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
            <svg className="w-7 h-7 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
          <Separator className="my-4 mx-auto w-16" />
          <p className="text-muted-foreground text-sm mb-2">
            An unexpected error occurred. Please try again.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground font-mono mb-6">
              Error ID: {error.digest}
            </p>
          )}
          {!error.digest && <div className="mb-6" />}
          <div className="flex items-center justify-center gap-3">
            <Button onClick={reset}>Try Again</Button>
            <Button variant="outline" onClick={() => (window.location.href = "/dashboard")}>
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
