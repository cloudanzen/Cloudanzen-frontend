/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useSearchParams } from 'react-router';
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
import { toast } from 'sonner';
import { ApiError } from '@/services/api/client';
import { authService } from '@/services/api/auth';
import { setupService } from '@/services/api/setup';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { API_BASE_URL } from '@/services/api/client';

const BACKEND_URL = API_BASE_URL;

// Google icon SVG as a small component
function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

type LoginFormData = { email: string; password: string };

export function LoginPage() {
  const { t } = useTranslation('auth');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [canSetup, setCanSetup] = useState(false);
  const [searchParams] = useSearchParams();

  const loginSchema = useMemo(() => z.object({
    email: z.string().email(t('login.errors.emailInvalid')),
    password: z.string().min(1, t('login.errors.passwordRequired')),
  }), [t]);

  // Check if first-time setup is available (no users yet)
  useEffect(() => {
    setupService.getSetupStatus().then((res) => {
      setCanSetup((res as any)?.canSetup === true);
    }).catch(() => setCanSetup(false));
  }, []);

  // Show error toasts for OAuth failures redirected back from backend
  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'oauth_failed')
      toast.error(t('login.errors.oauthFailed'));
    if (error === 'google_profile_failed')
      toast.error(t('login.errors.googleProfileFailed'));
    if (error === 'no_email')
      toast.error(t('login.errors.noEmail'));
    if (error === 'no_org')
      toast.error(t('login.errors.noOrg'));
  }, [searchParams, t]);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      // Backend returns { user, token } directly (no success/data wrapper)
      const response = (await authService.login(data)) as any;
      const token = response.token ?? response.data?.token;
      const user = response.user ?? response.data?.user;

      if (token && user) {
        authService.setToken(token);
        authService.cacheUser(user);
        toast.success(`Welcome back, ${user.name || user.email}!`);
        // Use window.location so the router re-evaluates the auth loader
        // only after localStorage is fully committed in this tick.
        window.location.href = '/';
      } else {
        toast.error(
          response.error ||
            response.message ||
            'Login failed. Please check your credentials.',
        );
      }
    } catch (error: unknown) {
      const msg = error instanceof ApiError ? error.message : 'An error occurred. Please try again.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <img
                src="/logo.svg"
                className="w-9 h-9"
                style={{ filter: 'brightness(0) invert(1)' }}
                alt="CloudAnzen"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            CloudAnzen
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {t('login.tagline')}
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-8 shadow-xl border border-gray-100 rounded-2xl">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {t('login.signInTitle')}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {t('login.signInSubtitle')}
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      {t('login.emailLabel')}
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type="email"
                          placeholder={t('login.emailPlaceholder')}
                          autoComplete="email"
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      {t('login.passwordLabel')}
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder={t('login.passwordPlaceholder')}
                          autoComplete="current-password"
                          className="pl-10 pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={
                            showPassword ? 'Hide password' : 'Show password'
                          }
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

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors mt-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('login.submitting')}
                  </span>
                ) : (
                  t('login.submitButton')
                )}
              </Button>
            </form>
          </Form>

          {/* OR divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-gray-400">
                {t('login.orContinueWith')}
              </span>
            </div>
          </div>

          {/* Google SSO */}
          <a href={`${BACKEND_URL}/auth/google`}>
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-lg transition-colors flex items-center justify-center gap-3"
            >
              <GoogleIcon />
              {t('login.googleButton')}
            </Button>
          </a>

          {/* Divider + Register Link — only shown before first-time setup */}
          {canSetup && (
            <>
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-gray-500">
                  {t('login.newToManzen')}
                </span>
              </div>
            </div>
            </>
          )}

          {canSetup && (
            <Link to="/register">
              <Button
                variant="outline"
                className="w-full h-11 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 font-medium rounded-lg transition-colors"
              >
                {t('login.registerOrg')}
              </Button>
            </Link>
          )}
        </Card>

        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} Manzen Security Platform. All rights
          reserved.
        </p>
      </div>
    </div>
  );
}
