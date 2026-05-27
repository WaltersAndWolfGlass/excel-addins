import * as React from "react";
import { MessageSquareIcon, AlertTriangleIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { cn } from "@/lib/utils";

export type DocumentCardProps = {
  type?: "note" | "warning";
  title?: string;
};

export function DocumentCard({
  type = "note",
  title,
  children,
  ...props
}: React.ComponentProps<"div"> & DocumentCardProps) {
  return (
    <Card
      className={cn(
        "mb-4 p-2 rounded-sm",
        type === "note"
          ? "bg-blue-200"
          : type === "warning"
            ? "bg-red-200"
            : "",
      )}
      {...props}
    >
      <CardHeader className="px-1">
        <CardTitle>
          {type === "warning" ? (
            <AlertTriangleIcon className="inline-block me-2 size-4" />
          ) : (
            <MessageSquareIcon className="inline-block me-2 size-4" />
          )}
          {title ?? (type === "warning" ? "WARNING" : "NOTE")}
        </CardTitle>
        <CardContent>{children}</CardContent>
      </CardHeader>
    </Card>
  );
}
