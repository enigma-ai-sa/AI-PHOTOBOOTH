import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "tertiary";
  size?: "small" | "medium" | "large";
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "medium",
      className = "",
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "font-bold rounded-3xl transition-all duration-200 flex items-center justify-center font-normal overflow-hidden";

    const variantStyles = {
      primary:
        "bg-gradient-green text-white disabled:cursor-not-allowed disabled:hover:scale-100",
      secondary:
        "bg-white text-gradient-green-end hover:bg-opacity-90 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
      tertiary:
        "bg-white bg-opacity-20 text-gradient-green-end border-2 border-gradient-green-end disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
    };

    const sizeStyles = {
      small: "px-6 py-2 text-sm",
      medium: "px-8 py-3 text-base",
      large: "px-10 py-14 text-5xl",
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
