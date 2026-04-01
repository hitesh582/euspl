"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ProtectedError({
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
    <div className="flex-1 flex items-center justify-center p-8">
      <Card className="max-w-md w-full text-center">
        <CardContent className="py-10 px-8">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
            <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          <Separator className="my-3 mx-auto w-16" />
          <p className="text-muted-foreground text-sm mb-1">
            An error occurred while loading this page.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground font-mono mb-6">
              Error ID: {error.digest}
            </p>
          )}
          {!error.digest && <div className="mb-6" />}
          <Button onClick={reset}>Try Again</Button>
        </CardContent>
      </Card>
    </div>
  );
}
