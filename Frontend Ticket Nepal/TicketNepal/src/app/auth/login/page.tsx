'use client';
export const dynamic = 'force-dynamic';

import { Suspense, useState, useContext } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flame } from "lucide-react";
import Link from "next/link";
import { UserContext } from "@/context/UserContext";
import { useToast } from "@/hooks/use-toast";

function LoginPageContent() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(UserContext);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      if (response.ok) {
        const { user, token } = await response.json();
        localStorage.setItem('authToken', token);
        login(user, token);
        toast({ title: 'Login Successful', description: `Welcome back, ${user.name}!` });
        // Only allow redirect to /admin for Admin, Organizer, or Staff
        if (redirectUrl === '/admin' && !['Admin', 'Organizer', 'Staff'].includes(user.role)) {
          router.push('/');
        } else {
          router.push(redirectUrl || '/');
        }
      } else {
        // Show backend-provided error if available
        let errorMessage = 'Invalid credentials.';
        try {
          const errData = await response.json();
          errorMessage = errData.error || errData.message || errorMessage;
        } catch { /* fallback to default message */ }
        toast({ title: 'Login Failed', description: errorMessage, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'An error occurred.', variant: 'destructive' });
    }

    setLoading(false);
  };

  const signupHref = `/auth/signup${redirectUrl ? `?redirect=${redirectUrl}` : ''}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-2 sm:p-4">
      <Card className="w-full max-w-sm mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2 mb-2">
            <Flame className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold font-headline">TicketNepal</h1>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>Enter your credentials to access your account.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier">Username or Email</Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="your_username or m@example.com"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/auth/forgot-password" className="ml-auto inline-block text-sm underline">
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
            </div>
          </CardContent>
        </form>
        <CardFooter className="flex flex-col gap-2 text-center">
          <div>
            Don't have an account?{' '}
            <Link href={signupHref} className="underline text-primary">Sign up</Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
