// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { categoryById } from "@/tools/categories";
import { ToolIcon } from "@/tools/icons";
import type { AnyToolDefinition } from "@/tools/types";
import { cn } from "@/lib/cn";

export function ToolCard({
  tool,
  favorite,
  onOpen,
  onToggleFavorite,
}: {
  tool: AnyToolDefinition;
  favorite: boolean;
  onOpen: () => void;
  onToggleFavorite: () => void;
}) {
  const category = categoryById(tool.meta.category);
  const unavailable = tool.meta.availability !== "available";
  return (
    <article className={cn("flex flex-col rounded-lg border border-line bg-elevated p-4", unavailable && "opacity-80")}>
      <div className="flex items-start gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-md border border-line bg-canvas text-ink">
          <ToolIcon name={tool.meta.icon} className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold">{tool.meta.name}</h3>
            <Button
              variant="ghost"
              size="icon"
              aria-pressed={favorite}
              aria-label={favorite ? `Remove ${tool.meta.name} from favorites` : `Add ${tool.meta.name} to favorites`}
              onClick={onToggleFavorite}
            >
              <Star className={cn("size-4", favorite && "fill-current")} />
            </Button>
          </div>
          <p className="mt-1 text-sm text-subtle">{tool.meta.description}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <Badge>{category.name}</Badge>
        <Badge>{unavailable ? "Unavailable" : "Local"}</Badge>
      </div>
      <div className="mt-4">
        <Button variant={unavailable ? "secondary" : "primary"} onClick={onOpen}>
          {unavailable ? "View status" : "Open"}
        </Button>
      </div>
    </article>
  );
}
