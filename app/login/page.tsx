"use client";

import React, { useState } from "react";
import Image from "next/image";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    // พื้นหลังหลักของหน้าเว็บ
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-8 font-sans">
      
      {/* ========================================== */}
      {/* คอนเทนเนอร์หลัก (การ์ดสีน้ำเงิน) */}
      {/* ========================================== */}
      <div className="relative w-full max-w-[1000px] min-h-[550px] flex flex-col md:flex-row rounded-[2rem] overflow-hidden shadow-2xl bg-gradient-to-br from-[#1c69b8] to-[#0a4282]">
        
        {/* กราฟิกวงกลมตกแต่งพื้นหลัง (ซ้ายล่าง และ ขวาบน) */}
        <div className="absolute -bottom-32 -left-20 w-96 h-96 bg-[#2579cf] rounded-full opacity-80 pointer-events-none"></div>
        <div className="absolute -top-32 -right-10 w-[28rem] h-[28rem] bg-[#1a5ca6] rounded-full opacity-60 pointer-events-none"></div>

        {/* ========================================== */}
        {/* ฝั่งซ้าย: ข้อความ Welcome และ Logo */}
        {/* ========================================== */}
        <div className="relative z-10 flex-1 flex flex-col justify-center p-10 lg:p-16 text-white">
          {/* โลโก้ตามที่คุณกำหนด */}
          <div className="mb-6">
            <Image
              alt="METANG"
              className="h-12 w-12 object-contain sm:h-14 sm:w-14 drop-shadow-md"
              height={56}
              priority
              src="/metang-logo.png"
              width={56}
            />
          </div>
        </div>

        {/* ========================================== */}
        {/* ฝั่งขวา: ฟอร์ม Login (การ์ดสีขาว) */}
        {/* ========================================== */}
        <div className="relative z-10 w-full md:w-[45%] flex items-stretch p-4 sm:p-6 lg:p-8">
          <div className="w-full bg-white rounded-3xl p-8 sm:p-10 shadow-lg flex flex-col justify-center">
            
            <h3 className="text-3xl font-extrabold text-[#1c69b8] mb-2 tracking-wide">
              Sign in
            </h3>
            <p className="text-[10px] text-gray-500 mb-8">
              Lorem ipsum dolor sit amet, consectetuer adipiscing elit
            </p>

            <form className="space-y-4">
              {/* Input: User Name */}
              <div>
                <input
                  type="text"
                  placeholder="User Name"
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#1c69b8] focus:ring-1 focus:ring-[#1c69b8] transition-colors"
                />
              </div>

              {/* Input: Password */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#1c69b8] focus:ring-1 focus:ring-[#1c69b8] transition-colors pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#1c69b8] hover:text-[#0a4282] transition-colors"
                >
                  SHOW
                </button>
              </div>

              {/* Options: Remember me & Forgot Password */}
              <div className="flex items-center justify-between text-[11px] text-gray-600 mt-2 mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 rounded border-gray-300 text-[#1c69b8] focus:ring-[#1c69b8] cursor-pointer"
                  />
                  <span className="font-medium">Remember me</span>
                </label>
                <a href="#" className="font-medium hover:text-[#1c69b8] transition-colors">
                  Forgot Password?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                className="w-full bg-[#1c69b8] hover:bg-[#155393] text-white font-semibold text-sm py-3.5 rounded-xl transition-colors shadow-md shadow-blue-600/20"
              >
                Sign In
              </button>
            </form>

            {/* Footer Link */}
            <div className="text-center mt-6 text-[11px] text-gray-500">
              Don&apos;t have an account?{" "}
              <a href="#" className="font-bold text-[#1c69b8] hover:underline">
                Sign Up
              </a>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}