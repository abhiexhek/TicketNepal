'use client';

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flame } from "lucide-react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { UserRole } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export default function SignupPage() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Customer');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, email, password, role }),
      });
      if (response.ok) {
        toast({ title: 'Signup Successful!', description: 'Your account has been created. Please log in.' });
        router.push(`/auth/login${redirectUrl ? `?redirect=${redirectUrl}`: ''}`);
      } else {
        const errorData = await response.json();
        toast({
          title: 'Signup Failed',
          description: errorData.error || errorData.message || 'Could not create account.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'An error occurred.', variant: 'destructive' });
    }
    setLoading(false);
  };

  const loginHref = `/auth/login${redirectUrl ? `?redirect=${redirectUrl}` : ''}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-2 sm:p-4">
      <Card className="w-full max-w-sm mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2 mb-2">
             <Flame className="h-7 w-7 text-primary" />
             <h1 className="text-2xl font-bold font-headline">TicketNepal</h1>
          </div>
          <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
          <CardDescription>Enter your details to get started.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" type="text" placeholder="Jane Doe" required value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" type="text" placeholder="janedoe" required value={username} onChange={e => setUsername(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Sign up as</Label>
                 <Select onValueChange={(value) => setRole(value as UserRole)} defaultValue={role}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Customer">Customer (Attend Events)</SelectItem>
                    <SelectItem value="Organizer">Organizer (Create Events)</SelectItem>
                    <SelectItem value="Staff">Staff (Validate Tickets)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing up..." : "Sign up"}
              </Button>
            </div>
          </CardContent>
        </form>
        <CardFooter className="flex flex-col gap-2 text-center">
          <div>
            Already have an account?{' '}
            <Link href={loginHref} className="underline text-primary">Login</Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
