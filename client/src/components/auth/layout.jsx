import { Link, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import myLogo from "../../assets/pscwhitelogo.png";

function AuthLayout() {
  return (
    <div className="min-h-screen w-full bg-slate-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
        
        {/* LEFT SIDE */}
        <div className="relative hidden overflow-hidden px-12 py-16 lg:flex lg:flex-col lg:justify-between">
          
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />

          {/* Glow Effects */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(6,182,212,0.35),transparent_40%),radial-gradient(circle_at_80%_60%,rgba(168,85,247,0.35),transparent_40%)]" />

          {/* Floating Glow 1 */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{
              repeat: Infinity,
              duration: 6,
              ease: "easeInOut",
            }}
            className="absolute -right-16 top-20 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl"
          />

          {/* Floating Glow 2 */}
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{
              repeat: Infinity,
              duration: 7,
              ease: "easeInOut",
            }}
            className="absolute bottom-16 left-8 h-72 w-72 rounded-full bg-fuchsia-400/20 blur-3xl"
          />

          {/* Logo + Heading */}
          <div className="relative">
            <Link to="/shop/home" className="inline-flex items-center gap-4">
              <img
                src={myLogo}
                alt="Panjab Sports Club Logo"
                className="h-16 w-16 rounded-2xl bg-white object-contain p-2"
              />

              <div>
                <p className="text-xs uppercase tracking-[0.34em] text-slate-400">
                  Panjab Sports Club
                </p>

                <h1 className="mt-2 text-3xl font-black tracking-tight">
                  Sports Community Platform
                </h1>
              </div>
            </Link>
          </div>

          {/* Main Content */}
          <div className="relative max-w-xl space-y-6">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-400">
              Welcome to Panjab Sports Club
            </p>

            <h2 className="text-5xl font-black leading-tight tracking-tight">
              Train Hard. Play Strong. Stay Connected.
            </h2>

            <p className="max-w-lg text-base leading-7 text-slate-300">
              Join the Panjab Sports Club community to explore tournaments,
              manage sports activities, connect with players, and enjoy a
              smooth and secure digital experience across all devices.
            </p>

            {/* Feature Cards */}
            {/* <div className="grid gap-4 sm:grid-cols-2"> */}
              
              {/* Card 1 */}
              {/* <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Secure Access
                </p>

                <p className="mt-3 text-lg font-bold">
                  JWT Authentication + OTP Verification
                </p>
              </div> */}

              {/* Card 2 */}
              {/* <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Smart Experience
                </p>

                <p className="mt-3 text-lg font-bold">
                  Fast Login with Modern Responsive UI
                </p>
              </div>
            </div> */}
          </div>

          {/* Bottom Text */}
          <p className="relative text-sm text-slate-400">
            Access your account to manage profile details, sports activities,
            registrations, and club updates securely.
          </p>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center justify-center bg-slate-100 px-4 py-10 dark:bg-slate-950 sm:px-6 lg:px-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;