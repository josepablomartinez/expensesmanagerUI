import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Props {
  message: string;
  onClose: () => void;
}

export function InfoModal({ message, onClose }: Props) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 1800);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
      <Card className="w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
        <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
          <CheckCircle2 className="h-10 w-10 text-primary" />
          <p className="text-sm font-medium">{message}</p>
          <Button size="sm" variant="outline" onClick={onClose}>
            OK
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
