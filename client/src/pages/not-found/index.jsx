import React from "react";
import myLogo from "../../assets/pscwhitelogo.png";

function NotFound() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white flex items-center justify-center px-6">
      {/* Background Glow */}
      <div className="absolute top-[-120px] left-[-120px] h-[300px] w-[300px] rounded-full bg-purple-600/30 blur-3xl" />
      <div className="absolute bottom-[-120px] right-[-120px] h-[300px] w-[300px] rounded-full bg-cyan-500/20 blur-3xl" />

      <div className="relative z-10 max-w-3xl text-center">
        {/* Brand Logo */}
        <div className="flex justify-center mb-8">
          <img
            src={myLogo}
            alt="Brand Logo"
            width={140}
            height={140}
            className="object-contain"
            priority
          />
        </div>

        {/* 404 */}
        <h1 className="text-8xl md:text-9xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 bg-clip-text text-transparent">
          404
        </h1>

        {/* Heading */}
        <h2 className="mt-6 text-3xl md:text-5xl font-bold">
          Oops! Page Not Found
        </h2>

        {/* Description */}
        <p className="mt-5 text-gray-400 text-lg leading-relaxed max-w-2xl mx-auto">
          The page you’re trying to access may have been removed, renamed,
          or is temporarily unavailable. Let’s get you back on track.
        </p>

        {/* Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/"
            className="px-7 py-3 rounded-2xl bg-white text-black font-semibold hover:scale-105 transition duration-300 shadow-lg"
          >
            Back to Home
          </a>

          <a
            href="/contact"
            className="px-7 py-3 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md hover:bg-white/10 transition duration-300"
          >
            Contact Support
          </a>
        </div>

        {/* Decorative Card */}
        <div className="mt-16 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 blur-2xl rounded-3xl"></div>

          <div className="relative border border-white/10 bg-white/5 backdrop-blur-xl rounded-3xl p-10 shadow-2xl">
            <p className="text-xl font-medium text-gray-200">
              “Not all those who wander are lost.”
            </p>

            <p className="mt-3 text-sm text-gray-500">
              — But this page definitely is.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotFound;