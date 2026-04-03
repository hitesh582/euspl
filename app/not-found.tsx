import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="max-w-lg w-full text-center">
        <CardContent className="py-12 px-8">
          <div className="text-7xl font-bold tracking-tighter mb-2">404</div>
          <Separator className="my-4 mx-auto w-16" />
          <h1 className="text-xl font-semibold mb-2">Page not found</h1>
          <p className="text-muted-foreground text-sm mb-8 whitespace-nowrap">
            The page you are looking for does not exist or has been moved.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
            <Link href="/">
              <Button variant="outline">Home</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
