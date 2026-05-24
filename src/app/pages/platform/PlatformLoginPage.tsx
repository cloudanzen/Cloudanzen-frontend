import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/app/components/ui/form';
import { Eye, EyeOff, Lock, Mail, Shield, KeyRound } from 'lucide-react';
import { ApiError } from '@/services/api/client';
import { platformAuthService } from '@/services/api/platformAuth';
import { authService } from '@/services/api/auth';
import { Role } from '@/services/api/types';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
  mfaToken: z.string().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function PlatformLoginPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [needsMfa, setNeedsMfa] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', mfaToken: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const res = await platformAuthService.login({
        email: data.email,
        password: data.password,
        mfaToken: data.mfaToken || undefined,
      });
      if (res.mfaRequired) {
        setNeedsMfa(true);
        toast.info('Enter your authenticator code');
        return;
      }
      // Cache the platform admin in authStorage so useCurrentUser() /
      // useHasRole('SUPER_ADMIN') return truthy on platform-tree pages
      // (the 6 re-mounted admin pages still call useHasRole internally).
      // organizationId is set to '' rather than null because the cached
      // User shape requires a string; platform-side pages never read it.
      authService.cacheUser({
        id: res.user.id,
        email: res.user.email,
        name: res.user.name ?? undefined,
        role: Role.SUPER_ADMIN,
        organizationId: '',
        createdAt: new Date().toISOString(),
      });
      toast.success('Signed in');
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 403) {
          toast.error('Email not on the platform admin allowlist');
        } else if (err.statusCode === 401) {
          toast.error('Invalid email or password');
        } else {
          toast.error(err.message || 'Login failed');
        }
      } else {
        toast.error('Unexpected error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8 bg-white">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center mb-3">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">
            CloudAnzen Platform Console
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Restricted access. Allowlisted operators only.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        {...field}
                        type="email"
                        autoComplete="username"
                        placeholder="ops@cloudanzen.com"
                        className="pl-10"
                        disabled={isLoading || needsMfa}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        {...field}
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        className="pl-10 pr-10"
                        disabled={isLoading || needsMfa}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {needsMfa && (
              <FormField
                control={form.control}
                name="mfaToken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Authenticator Code</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          {...field}
                          type="text"
                          autoComplete="one-time-code"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="123456"
                          className="pl-10"
                          disabled={isLoading}
                          autoFocus
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  );
}
