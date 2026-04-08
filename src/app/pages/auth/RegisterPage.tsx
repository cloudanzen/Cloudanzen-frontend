/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router';
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
import { setupService, SetupRequest } from '@/services/api/setup';
import { authService } from '@/services/api/auth';
import {
  Eye,
  EyeOff,
  Building2,
  Users,
  ChevronLeft,
  ShieldCheck,
} from 'lucide-react';
import { Checkbox } from '@/app/components/ui/checkbox';
import { FRAMEWORK_SUITE_OPTIONS } from '@/app/features/tests/frameworkSuites';

const registerSchema = z
  .object({
    organizationName: z
      .string()
      .min(2, 'Organization name must be at least 2 characters'),
    adminName: z.string().min(2, 'Admin name must be at least 2 characters'),
    adminEmail: z.string().email('Please enter a valid email address'),
    adminPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
    orgAdminName: z
      .string()
      .min(2, 'Organization admin name must be at least 2 characters'),
    orgAdminEmail: z.string().email('Please enter a valid email address'),
    orgAdminPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
    selectedFrameworks: z.array(z.string()).default([]),
  })
  .refine((data) => data.adminEmail !== data.orgAdminEmail, {
    message: 'Admin emails must be different',
    path: ['orgAdminEmail'],
  });

type RegisterFormData = z.output<typeof registerSchema>;

function PasswordStrengthIndicator({ password }: { password: string }) {
  if (!password) return null;
  const requirements = [
    { label: '8+ characters', met: password.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Number', met: /[0-9]/.test(password) },
    { label: 'Special character', met: /[^A-Za-z0-9]/.test(password) },
  ];
  const metCount = requirements.filter((r) => r.met).length;
  const strengthColor =
    metCount <= 2
      ? 'text-red-500'
      : metCount <= 4
        ? 'text-amber-500'
        : 'text-green-600';
  const strengthLabel =
    metCount <= 2 ? 'Weak' : metCount <= 4 ? 'Fair' : 'Strong';
  const barColors = requirements.map((r) =>
    r.met
      ? metCount <= 2
        ? 'bg-red-400'
        : metCount <= 4
          ? 'bg-amber-400'
          : 'bg-green-500'
      : 'bg-gray-200',
  );

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {barColors.map((color, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${color} transition-colors`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${strengthColor}`}>
        Password strength: {strengthLabel}
      </p>
    </div>
  );
}

function PasswordField({
  label,
  name,
  control,
  placeholder,
}: {
  label: string;
  name: 'adminPassword' | 'orgAdminPassword';
  control: any;
  placeholder: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-medium text-gray-700">
            {label}
          </FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                type={show ? 'text' : 'password'}
                placeholder={placeholder}
                className="pr-10"
                {...field}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setShow(!show)}
                aria-label={show ? 'Hide password' : 'Show password'}
              >
                {show ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </FormControl>
          <PasswordStrengthIndicator password={field.value} />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  // Block registration if system is already set up
  useEffect(() => {
    setupService.getSetupStatus().then((res: any) => {
      if (res?.canSetup !== true) {
        toast.error('System already set up. Contact your admin to create new organizations.');
        navigate('/login');
      }
    }).catch(() => {});
  }, [navigate]);

  const form = useForm<z.input<typeof registerSchema>, any, RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      organizationName: '',
      adminName: '',
      adminEmail: '',
      adminPassword: '',
      orgAdminName: '',
      orgAdminEmail: '',
      orgAdminPassword: '',
      selectedFrameworks: ['iso-cloud-hardening'],
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const response = await setupService.setup(data as SetupRequest);

      if (response.success && response.data) {
        // Store JWT token if returned
        if (response.data.token) {
          authService.setToken(response.data.token);
        }
        const activatedFrameworks =
          response.data.activatedFrameworks?.filter(
            (item) => item.status === 200,
          ).length ?? 0;
        const createdSuites =
          response.data.createdSuites?.reduce(
            (sum, item) => sum + item.created,
            0,
          ) ?? 0;
        if (activatedFrameworks > 0) {
          toast.success(
            `Activated ${activatedFrameworks} framework${activatedFrameworks === 1 ? '' : 's'} during setup.`,
          );
        }
        if (createdSuites > 0) {
          toast.success(
            `Created ${createdSuites} starter test${createdSuites === 1 ? '' : 's'} during setup.`,
          );
        }
        toast.success(
          'Organization registered successfully! Please sign in to continue.',
        );
        navigate('/login');
      } else {
        toast.error(
          (response as any).error || 'Registration failed. Please try again.',
        );
      }
    } catch (error: unknown) {
      const msg = error instanceof ApiError ? error.message : 'An error occurred during registration.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Back to login */}
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to sign in
        </Link>

        {/* Logo */}
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
            Register Organization
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            AI-driven governance, compliance, risk, and audit readiness in one platform.
          </p>
        </div>

        <Card className="p-8 shadow-xl border border-gray-100 rounded-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Organization */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-semibold text-gray-900">
                    Organization
                  </h3>
                </div>
                <FormField
                  control={form.control}
                  name="organizationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Organization Name
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Corp" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </section>

              {/* Super Admin */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Users className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      System Administrator
                    </h3>
                    <p className="text-xs text-gray-500">
                      Has system-wide access
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="adminName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Full Name
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Jane Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="adminEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Email Address
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="admin@company.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <PasswordField
                  label="Password"
                  name="adminPassword"
                  control={form.control}
                  placeholder="Create a strong password"
                />
              </section>

              {/* Org Admin */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      Organization Administrator
                    </h3>
                    <p className="text-xs text-gray-500">
                      Has organization-level access
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="orgAdminName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Full Name
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="orgAdminEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Email Address
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="orgadmin@company.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <PasswordField
                  label="Password"
                  name="orgAdminPassword"
                  control={form.control}
                  placeholder="Create a strong password"
                />
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      Framework Setup
                    </h3>
                    <p className="text-xs text-gray-500">
                      Choose which pre-built framework suites to create right
                      after registration
                    </p>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="selectedFrameworks"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          {FRAMEWORK_SUITE_OPTIONS.map((option) => {
                            const selectedValues = field.value ?? [];
                            const checked = selectedValues.includes(option.id);
                            return (
                              <label
                                key={option.id}
                                className={`flex gap-3 rounded-xl border p-4 transition-colors cursor-pointer ${checked ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                              >
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(value) => {
                                    const next = value
                                      ? [...selectedValues, option.id]
                                      : selectedValues.filter(
                                          (item) => item !== option.id,
                                        );
                                    field.onChange(next);
                                  }}
                                  className="mt-0.5"
                                />
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                                    {option.framework}
                                  </p>
                                  <p className="mt-1 text-sm font-semibold text-gray-900">
                                    {option.name}
                                  </p>
                                  <p className="mt-1 text-xs leading-5 text-gray-600">
                                    {option.description}
                                  </p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </section>

              <Button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Registering...
                  </span>
                ) : (
                  'Register Organization'
                )}
              </Button>

              <p className="text-center text-xs text-gray-400">
                Controls and policies seeded will reflect the frameworks
                selected above.
              </p>
            </form>
          </Form>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} Manzen Security Platform. All rights
          reserved.
        </p>
      </div>
    </div>
  );
}
