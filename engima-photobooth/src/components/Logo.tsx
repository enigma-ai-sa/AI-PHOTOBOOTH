import Image from "next/image";

interface LogoProps {
  width?: number;
  height?: number;
  text?: string;
  className?: string;
  textClassName?: string;
}

export default function Logo({
  width = 500,
  height = 200,
  text,
  className = "mx-auto",
  textClassName = "text-5xl text-center text-white mt-13  mx-auto",
}: LogoProps) {
  return (
    <div className={className}>
      <Image
        src="./assets/logo2.svg"
        alt="AI Photo Booth Logo"
        width={width}
        height={height}
        className="mx-auto"
      />
      {text && <h3 className={textClassName}>{text}</h3>}
    </div>
  );
}
