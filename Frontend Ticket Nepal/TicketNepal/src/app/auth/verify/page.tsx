"use client";
export const dynamic = "force-dynamic";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("Verifying...");

  useEffect(() => {
    if (token) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify?token=${token}`)
        .then(res => res.text())
        .then(msg => setStatus(msg))
        .catch(() => setStatus("Verification failed."));
    } else {
      setStatus("No token provided.");
    }
  }, [token]);

  return (
    <div className="p-8 text-center">
      <h1>Email Verification</h1>
      <p>{status}</p>
    </div>
  );
} 