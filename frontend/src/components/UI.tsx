import React, { type ReactNode } from "react";
import { Icon } from "./Icon";
import { type IconName } from "../types/icons";

export const Logo: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <div className="logo">
    <span className="logo-mark">
      <span />
    </span>
    {!compact && (
      <strong>
        Finance<span>Flow</span>
      </strong>
    )}
  </div>
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  icon?: IconName;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  icon,
  onClick,
  type = "button",
  disabled,
  ...rest // 
}) => (
  <button 
    className={`btn btn-${variant}`} 
    onClick={onClick} 
    type={type} 
    disabled={disabled}
    {...rest}
  >
    {icon && <Icon name={icon} size={17} />}
    {children}
  </button>
);