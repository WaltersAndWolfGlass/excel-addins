import * as React from "react";
import { HelpCircleIcon } from "lucide-react";

export function HelpLink({ href, ...props }: React.ComponentProps<"a">) {
  return (
    <a {...props} href={href} target="_blank" rel="noopener noreferrer">
      <HelpCircleIcon className="size-4 stroke-blue-500" />
    </a>
  );
}
