import { useEffect } from "react";
import { LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import { openAuthModal } from "@/lib/auth-modal";

function AuthRequiredPanel({
  title = "Login required",
  description = "Please login to continue.",
  redirectTo = "/shop/home",
}) {
  useEffect(() => {
    openAuthModal(redirectTo);
  }, [redirectTo]);

  return (
    <div className="flex min-h-[520px] items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-lg border bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-white">
          <LockKeyhole className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-black text-slate-950">{title}</h1>
        <p className="mt-3 text-sm text-slate-500">{description}</p>
        <Button
          type="button"
          onClick={() => openAuthModal(redirectTo)}
          className="mt-6 w-full"
        >
          Login / Register
        </Button>
      </div>
    </div>
  );
}

export default AuthRequiredPanel;
