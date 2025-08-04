import React, { useState } from "react";
import {
  AlertTriangle,
  RefreshCw,
  Settings,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import {
  getUserFriendlyError,
  getErrorSuggestions,
} from "../utils/errorMessages";
import { cn } from "@/src/utils/tailwind";

interface ErrorDisplayProps {
  error: any;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  variant?: "inline" | "card" | "banner";
  showSuggestions?: boolean;
}

/**
 * ErrorDisplay Component
 *
 * Displays user-friendly error messages with actionable suggestions
 * and retry functionality.
 */
export function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  className,
  variant = "card",
  showSuggestions = true,
}: ErrorDisplayProps) {
  const [showDetails, setShowDetails] = useState(false);
  const errorMessage = getUserFriendlyError(error);
  const suggestions = getErrorSuggestions(error);

  const needsAPIKeySetup =
    errorMessage.includes("API key") ||
    errorMessage.includes("provider") ||
    error?.message?.includes("API key") ||
    error?.message?.includes("No openai API key") ||
    error?.message?.includes("No Anthropic API key") ||
    error?.message?.includes("No Google API key");

  const content = (
    <div className={cn("space-y-3", className)}>
      {/* Main error message */}
      <div className="flex items-start space-x-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium text-destructive">{errorMessage}</p>

          {/* Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Here's how to fix this:
              </p>
              <ul className="space-y-1">
                {suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    className="flex items-start space-x-2 text-xs"
                  >
                    <span className="mt-1 text-muted-foreground">•</span>
                    <span className="text-muted-foreground">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="text-xs"
            >
              <RefreshCw className="mr-1 h-3 w-3" />
              Try Again
            </Button>
          )}

          {needsAPIKeySetup && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Navigate to project settings - this would need proper routing
                window.open("/project/settings", "_blank");
              }}
              className="text-xs"
            >
              <Settings className="mr-1 h-3 w-3" />
              Project Settings
            </Button>
          )}
        </div>

        {/* Show technical details toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-muted-foreground"
        >
          {showDetails ? (
            <>
              <ChevronUp className="mr-1 h-3 w-3" />
              Hide Details
            </>
          ) : (
            <>
              <ChevronDown className="mr-1 h-3 w-3" />
              Show Details
            </>
          )}
        </Button>
      </div>

      {/* Technical details (collapsible) */}
      {showDetails && (
        <div className="border-t border-border pt-3">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Technical Details:
            </p>
            <div className="rounded-md bg-muted p-2">
              <pre className="whitespace-pre-wrap text-xs text-muted-foreground">
                {error?.message || error?.toString() || "Unknown error"}
              </pre>
              {error?.code && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Error Code: {error.code}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render based on variant
  switch (variant) {
    case "banner":
      return (
        <div
          className={cn(
            "border-l-4 border-destructive bg-destructive/10 p-4",
            className,
          )}
        >
          {content}
        </div>
      );

    case "inline":
      return (
        <div className={cn("rounded-md bg-destructive/10 p-3", className)}>
          {content}
        </div>
      );

    case "card":
    default:
      return (
        <Card
          className={cn(
            "border-destructive/20 bg-destructive/5 p-4",
            className,
          )}
        >
          {content}
        </Card>
      );
  }
}

/**
 * Lightweight error toast for quick feedback
 */
export function ErrorToast({
  error,
  onDismiss,
}: {
  error: any;
  onDismiss?: () => void;
}) {
  const errorMessage = getUserFriendlyError(error);

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in fade-in-0 slide-in-from-bottom-2">
      <Card className="max-w-sm border-destructive/20 bg-destructive/5 p-3 shadow-lg">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{errorMessage}</p>
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="ml-auto h-6 w-6 p-0"
            >
              ×
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
