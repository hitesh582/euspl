import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="max-w-xs w-full text-center border-0 shadow-none bg-transparent">
        <CardContent className="py-12">
          <div className="mx-auto mb-6 w-10 h-10 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Loading...</p>
        </CardContent>
      </Card>
    </div>
  );
}
