import * as React from "react";
import { TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { LinkIcon, UnlinkIcon } from "lucide-react";
import {
  PartGroupLinkedStoreContext,
  SetPartGroupLinkedStoreContext,
  SetSelectionStateStoreContext,
} from "@/components/contexts/OptimizationContext";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function InternalPartGroupLinkCell({
  pgKey,
  rowSpan = undefined,
}: {
  pgKey: string;
  rowSpan?: number;
}) {
  const linkStore = React.useContext(PartGroupLinkedStoreContext);
  const setLinkStore = React.useContext(SetPartGroupLinkedStoreContext);
  const setSelectionStateStore = React.useContext(
    SetSelectionStateStoreContext,
  );

  const linked = linkStore[pgKey] === true;

  const handleClick = () => {
    setLinkStore({ ...linkStore, [pgKey]: !linked });
    setSelectionStateStore({});
  };

  return (
    <TableCell rowSpan={rowSpan}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button onClick={handleClick} size="icon-xs" variant="ghost">
            {linked ? <LinkIcon /> : <UnlinkIcon />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-[33vw]">
            {linked ? (
              <>
                Releases/Levels are linked together, so all of them are
                optimized to the same stock length sizes. Click to un-link and
                allow Releases/Levels to be optimized separately and have
                different stock length sizes.
              </>
            ) : (
              <>
                Releases/Levels are not linked together, so each can be
                optimized separately with different stock length sizes. Click to
                link them together and keep stock length sizes the same for all
                Releases/Levels.
              </>
            )}
          </p>
        </TooltipContent>
      </Tooltip>
    </TableCell>
  );
}
export const PartGroupLinkCell = React.memo(InternalPartGroupLinkCell);
