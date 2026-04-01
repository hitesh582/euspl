import { Card, CardContent } from "@/components/ui/card";

export default function ProtectedLoading() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <Card className="border-0 shadow-none bg-transparent">
        <CardContent className="text-center py-12">
          <div className="mx-auto mb-4 w-8 h-8 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    </div>
  );
}
