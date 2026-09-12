import type { SVGProps } from "react";

type BahtCoinIconProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  size?: number;
};

export default function BahtCoinIcon({ size = 20, ...props }: BahtCoinIconProps) {
  return (
    <svg
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
      <text
        fill="currentColor"
        fontFamily="var(--font-kanit), Kanit, sans-serif"
        fontSize="16"
        fontWeight="700"
        textAnchor="middle"
        x="12"
        y="17"
      >
        ฿
      </text>
    </svg>
  );
}
