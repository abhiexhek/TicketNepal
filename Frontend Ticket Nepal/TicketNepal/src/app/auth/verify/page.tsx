"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function VerifyPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("Verifying...");

  useEffect(() => {
    if (token) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/auth/verify?token=${token}`)
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

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <VerifyPageContent />
    </Suspense>
  );
} 