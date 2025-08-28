import React from "react";
import { BsFillFilePdfFill } from "react-icons/bs";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  withText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = "md", withText = true }) => {
  // Size configurations
  const config = {
    sm: {
      iconContainer: "p-1 rounded-lg",
      iconSize: "text-sm",
      circlePosition: "-bottom-1.5 -right-1.5",
      circleSize: "w-4 h-4",
      textContainer: "py-0.5 px-1.5 ml-1.5 rounded-lg",
      textSize: "text-xs",
    },
    md: {
      iconContainer: "p-1.5 rounded-lg",
      iconSize: "text-xl",
      circlePosition: "-bottom-2 -right-2",
      circleSize: "w-6 h-6",
      textContainer: "py-1 px-2 ml-2 rounded-lg",
      textSize: "text-sm",
    },
    lg: {
      iconContainer: "p-2 rounded-lg",
      iconSize: "text-2xl",
      circlePosition: "-bottom-3 -right-3",
      circleSize: "w-8 h-8",
      textContainer: "py-1.5 px-3 ml-3 rounded-lg",
      textSize: "text-base",
    },
  };

  const {
    iconContainer,
    iconSize,
    circlePosition,
    circleSize,
    textContainer,
    textSize,
  } = config[size];

  return (
    <div className="flex items-center">
      <div
        className={`bg-[#DD5953] ${iconContainer} shadow-lg relative overflow-hidden`}
      >
        <BsFillFilePdfFill className={`text-white ${iconSize} z-10 relative`} />
        <div
          className={`absolute ${circlePosition} ${circleSize} bg-black rounded-full`}
        ></div>
      </div>

      {/* {withText && (
        <div className={`bg-gray-900 ${textContainer} rounded-lg`}>
          <span className={`text-white font-bold tracking-tight ${textSize}`}>
            PDF
          </span>
          <span
            className={`text-[#DD5953] font-bold tracking-tight ${textSize}`}
          >
            Chat
          </span>
        </div>
      )} */}
    </div>
  );
};

export default Logo;
