import * as React from "react";
import "./globals.css";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return <textarea className={`textarea ${className}`} ref={ref} {...props} />;
});
Textarea.displayName = "Textarea";
