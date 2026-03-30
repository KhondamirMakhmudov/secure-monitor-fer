"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";

export default function ExcelButton({ onClick, disabled = false }) {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <motion.button
      onMouseEnter={() => !disabled && setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={onClick}
      disabled={disabled}
      initial={{ width: 44 }}
      animate={{ width: isHovering ? 180 : 38 }}
      transition={{ duration: 0.3 }}
      className={`flex items-center py-[10px] px-[8px] rounded-[8px] overflow-hidden text-white gap-2 ${
        disabled
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-[#00733B] hover:bg-[#00733bf1] cursor-pointer"
      }`}
    >
      <Image
        src="/icons/excel.svg"
        alt="excel"
        width={20}
        height={20}
        className="min-w-[20px] min-h-[20px]"
      />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovering ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="text-xs lg:text-sm font-gilroy whitespace-nowrap"
      >
        {disabled ? "Загрузка..." : "Скачать Excel файл"}
      </motion.span>
    </motion.button>
  );
}
