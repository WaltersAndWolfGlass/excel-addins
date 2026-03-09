import * as React from "react";

import { CutListItem, StockLengths } from "@/model/optimization";
import { cn } from "@/lib/utils";

export function StockLengthView({
  stocklength,
  cutlist,
}: {
  stocklength: StockLengths;
  cutlist: CutListItem[];
}) {
  return (
    <div
      className="inline-block me-1 h-4 my-0.5 rounded-sm overflow-clip"
      key={stocklength.length}
    >
      <div
        className={cn(
          stocklength.is_standard_length ? "bg-primary" : "bg-secondary",
          stocklength.is_standard_length
            ? "text-primary-foreground"
            : "text-secondary-foreground",
          "inline-block",
          "px-2",
          "text-sm/4",
          "align-top",
        )}
      >
        {stocklength.length}&quot;
      </div>
      <div className="inline-block px-2 text-sm/4 align-top bg-neutral-300">
        {stocklength.quantity}
      </div>
    </div>
  );
}
