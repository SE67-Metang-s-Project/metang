import type { ReactNode } from "react";

type CardHeaderProps = {
  className: string;
  icon?: ReactNode;
  title: string;
};

export default function CardHeader({ className, icon, title }: CardHeaderProps) {
  return (
    <header className={className}>
      {icon ? icon : null}
      <h3>{title}</h3>
    </header>
  );
}
