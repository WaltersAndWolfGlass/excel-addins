import * as React from "react";

import { Part } from "@/model/optimization";
import { isPartErrors } from "@/model/excel_extrusion_data";
import { alphaNumCompare } from "@/lib/sorters";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TriangleAlertIcon } from "lucide-react";

function InternalPartWarnings({
  parts,
  className = "",
}: {
  parts: Part[];
  className?: string;
}) {
  let missingUnits = parts
    .filter((p) => isPartErrors(p) && p.unit_not_found === true)
    .map((p) => p.unit_number);
  missingUnits = [...new Set(missingUnits)].sort((a, b) =>
    alphaNumCompare(a, b),
  );

  const partsNoLength = parts
    .filter((p) => isPartErrors(p) && p.no_length === true)
    .reduce((sum, p) => sum + p.quantity, 0);
  const partsNoQuantity = parts.filter(
    (p) => isPartErrors(p) && p.no_quantity === true,
  ).length;

  if (missingUnits.length == 0 && partsNoLength <= 0 && partsNoQuantity <= 0)
    return <></>;

  return (
    <Tooltip>
      <TooltipTrigger className={className}>
        <TriangleAlertIcon className="text-amber-400 size-4" />
      </TooltipTrigger>
      <TooltipContent>
        <div className="max-w-[33vw]">
          {partsNoLength > 0 && (
            <>
              <p className="text-pretty">
                {partsNoLength} parts have no length. These will still be
                optimized and take up a saw's width of material.
              </p>
              <br />
            </>
          )}
          {partsNoQuantity > 0 && (
            <>
              <p className="text-pretty">
                {partsNoQuantity} parts have no quantity. These probably
                shouldn't be in your data.
              </p>
              <br />
            </>
          )}
          {missingUnits.length > 0 && (
            <>
              <p className="text-pretty">
                Quantities were not found for the following units. Assumed a
                quantity of 1 for each of them.
              </p>
              <br />
              {missingUnits.length > 10 ? (
                <p>{missingUnits.join(", ")}</p>
              ) : (
                <ul>
                  {missingUnits.map((u) => (
                    <li key={u}>{u}</li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export const PartWarnings = React.memo(InternalPartWarnings);
