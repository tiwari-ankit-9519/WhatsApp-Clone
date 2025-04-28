import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const CustomDropdownMenu = ({
  items,
  buttonIcon,
  buttonClass = "",
  menuClass = "",
  itemClass = "",
  align = "end",
}) => {
  const handleItemClick = (action) => {
    action();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={buttonClass}>
          {buttonIcon || (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align === "right" ? "end" : "start"}
        className={`w-56 ${menuClass}`}
      >
        {items.map((item, index) => (
          <DropdownMenuItem
            key={index}
            className={itemClass}
            onClick={() => !item.disabled && handleItemClick(item.action)}
            disabled={item.disabled}
          >
            {item.icon && (
              <span className="mr-2 flex items-center">{item.icon}</span>
            )}
            <span>{item.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CustomDropdownMenu;
