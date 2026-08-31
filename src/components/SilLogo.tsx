import horizontalLogo from "../assets/images/sil-logo-horizontal.png";
import stackedLogo from "../assets/images/sil-logo-stacked.png";

interface SilLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "color" | "white";
  showSlogan?: boolean;
  onClick?: () => void;
  className?: string;
  stacked?: boolean;
}

/** Official SIL Insurance logos supplied by the user.
 *  Horizontal mark is used in navigation and quotations; stacked mark is used in compact/footer contexts.
 *  No generated or alternative logos are used.
 */
export function SilLogo({
  size = "md",
  onClick,
  className = "",
  stacked = false,
}: SilLogoProps) {
  const heights = {
    sm: stacked ? "h-10" : "h-7",
    md: stacked ? "h-12" : "h-9",
    lg: stacked ? "h-16" : "h-11",
    xl: stacked ? "h-20" : "h-14",
  } as const;

  const src = stacked ? stackedLogo : horizontalLogo;

  return (
    <img
      src={src}
      alt="SIL Insurance"
      onClick={onClick}
      className={`${heights[size]} w-auto max-w-full object-contain ${onClick ? "cursor-pointer" : ""} ${className}`}
      draggable={false}
    />
  );
}
