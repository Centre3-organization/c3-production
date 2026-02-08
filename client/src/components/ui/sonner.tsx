import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "#FFFFFF",
          "--normal-text": "#2C2C2C",
          "--normal-border": "#E0E0E0",
          "--success-bg": "#E8F9F8",
          "--success-text": "#2C2C2C",
          "--success-border": "#4ECDC4",
          "--error-bg": "#FFE5E5",
          "--error-text": "#2C2C2C",
          "--error-border": "#FF6B6B",
          "--warning-bg": "#FFF4E5",
          "--warning-text": "#2C2C2C",
          "--warning-border": "#FFB84D",
          "--info-bg": "#E8DCF5",
          "--info-text": "#2C2C2C",
          "--info-border": "#5B2C93",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "rounded-lg shadow-md border",
          success: "!bg-[#E8F9F8] !border-[#4ECDC4] !text-[#2C2C2C]",
          error: "!bg-[#FFE5E5] !border-[#FF6B6B] !text-[#2C2C2C]",
          warning: "!bg-[#FFF4E5] !border-[#FFB84D] !text-[#2C2C2C]",
          info: "!bg-[#E8DCF5] !border-[#5B2C93] !text-[#2C2C2C]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
