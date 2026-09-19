import type { ReactNode } from "react";

type CardHeaderProps = {
  className: string;
  icon?: ReactNode;
  title: string;
  action?: ReactNode;
};

export default function CardHeader({ className, icon, title, action }: CardHeaderProps) {
  return (
    <header className={className}>
      {icon ? icon : null}
      <h3>{title}</h3>
      {action ? <div className="ml-auto shrink-0">{action}</div> : null}
    </header>
  );
}
