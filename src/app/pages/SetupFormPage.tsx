/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
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
import { Role } from '@/services/api/types';
import { Eye, EyeOff, Settings, ShieldCheck, Users } from 'lucide-react';
import { Checkbox } from '@/app/components/ui/checkbox';
import { FRAMEWORK_SUITE_OPTIONS } from '@/app/features/tests/frameworkSuites';

function createSetupSchema(t: TFunction<'common'>) {
  return z
    .object({
      organizationName: z
        .string()
        .min(2, t('setup.validation.organizationNameMin')),
      adminName: z.string().min(2, t('setup.validation.adminNameMin')),
      adminEmail: z.string().email(t('setup.validation.invalidEmail')),
      adminPassword: z
        .string()
        .min(8, t('setup.validation.passwordMin'))
        .regex(/[A-Z]/, t('setup.validation.passwordUppercase'))
        .regex(/[a-z]/, t('setup.validation.passwordLowercase'))
        .regex(/[0-9]/, t('setup.validation.passwordNumber'))
        .regex(/[^A-Za-z0-9]/, t('setup.validation.passwordSpecial')),
      orgAdminName: z.string().min(2, t('setup.validation.orgAdminNameMin')),
      orgAdminEmail: z.string().email(t('setup.validation.invalidEmail')),
      orgAdminPassword: z
        .string()
        .min(8, t('setup.validation.passwordMin'))
        .regex(/[A-Z]/, t('setup.validation.passwordUppercase'))
        .regex(/[a-z]/, t('setup.validation.passwordLowercase'))
        .regex(/[0-9]/, t('setup.validation.passwordNumber'))
        .regex(/[^A-Za-z0-9]/, t('setup.validation.passwordSpecial')),
      selectedFrameworks: z.array(z.string()).default([]),
    })
    .refine((data) => data.adminEmail !== data.orgAdminEmail, {
      message: t('setup.validation.emailsMustDiffer'),
      path: ['orgAdminEmail'],
    });
}

const PASSWORD_REQUIREMENT_KEYS = [
  'minLength',
  'uppercase',
  'lowercase',
  'number',
  'specialCharacter',
] as const;

const STRENGTH_LEVELS = ['weak', 'medium', 'strong'] as const;

type SetupFormData = z.output<ReturnType<typeof createSetupSchema>>;

export function SetupFormPage() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showOrgAdminPassword, setShowOrgAdminPassword] = useState(false);
  const setupSchema = createSetupSchema(t);

  const form = useForm<z.input<typeof setupSchema>, any, SetupFormData>({
    resolver: zodResolver(setupSchema),
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

  const onSubmit = async (data: SetupFormData) => {
    setIsLoading(true);
    try {
      const response = await setupService.setup(data as SetupRequest);

      if (response.success) {
        toast.success(t('setup.toasts.setupCompleted'));

        // Store the token for future use
        if (response.data?.token) {
          authService.setToken(response.data.token);
        }
        authService.cacheUser({
          id: response.data?.superAdmin.id ?? '',
          email: response.data?.superAdmin.email ?? data.adminEmail,
          name: response.data?.superAdmin.name ?? data.adminName,
          role: Role.SUPER_ADMIN,
          organizationId: response.data?.organization.id ?? '',
          createdAt:
            response.data?.organization.createdAt ?? new Date().toISOString(),
        });
        const activatedFrameworks =
          response.data?.activatedFrameworks?.filter(
            (item) => item.status === 200,
          ).length ?? 0;
        const createdSuites =
          response.data?.createdSuites?.reduce(
            (sum, item) => sum + item.created,
            0,
          ) ?? 0;
        if (activatedFrameworks > 0) {
          toast.success(
            t('setup.toasts.frameworksActivated', {
              count: activatedFrameworks,
            }),
          );
        }
        if (createdSuites > 0) {
          toast.success(
            t('setup.toasts.starterTestsCreated', { count: createdSuites }),
          );
        }

        // Navigate to home page after successful setup
        navigate('/');
      } else {
        toast.error(response.error || t('setup.toasts.setupFailed'));
      }
    } catch (error: unknown) {
      const msg =
        error instanceof ApiError
          ? error.message
          : t('setup.toasts.setupError');
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const PasswordStrengthIndicator = ({ password }: { password: string }) => {
    if (!password) return null;

    const requirements = [
      { key: PASSWORD_REQUIREMENT_KEYS[0], met: password.length >= 8 },
      { key: PASSWORD_REQUIREMENT_KEYS[1], met: /[A-Z]/.test(password) },
      { key: PASSWORD_REQUIREMENT_KEYS[2], met: /[a-z]/.test(password) },
      { key: PASSWORD_REQUIREMENT_KEYS[3], met: /[0-9]/.test(password) },
      { key: PASSWORD_REQUIREMENT_KEYS[4], met: /[^A-Za-z0-9]/.test(password) },
    ];

    const metCount = requirements.filter((req) => req.met).length;
    const strengthColor =
      metCount <= 2
        ? 'text-red-600'
        : metCount <= 4
          ? 'text-yellow-600'
          : 'text-green-600';

    return (
      <div className="mt-2 space-y-1">
        <div className={`text-xs font-medium ${strengthColor}`}>
          {t('setup.passwordStrength.label')}{' '}
          {t(
            `setup.passwordStrength.levels.${STRENGTH_LEVELS[metCount <= 2 ? 0 : metCount <= 4 ? 1 : 2]}`,
          )}
        </div>
        <div className="grid grid-cols-1 gap-1">
          {requirements.map((req, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${req.met ? 'bg-green-500' : 'bg-gray-300'}`}
              />
              <span
                className={`text-xs ${req.met ? 'text-green-700' : 'text-gray-500'}`}
              >
                {t(`setup.passwordStrength.requirements.${req.key}`)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
              <Settings className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('setup.title')}
          </h1>
          <p className="text-gray-600 mt-2">{t('setup.description')}</p>
        </div>

        <Card className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Organization Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  {t('setup.sections.organization.title')}
                </h3>

                <FormField
                  control={form.control}
                  name="organizationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('setup.fields.organizationName.label')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t(
                            'setup.fields.organizationName.placeholder',
                          )}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Super Admin Information */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {t('setup.sections.superAdmin.title')}
                </h3>
                <p className="text-sm text-gray-600">
                  {t('setup.sections.superAdmin.description')}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="adminName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('setup.fields.adminName.label')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t(
                              'setup.fields.adminName.placeholder',
                            )}
                            {...field}
                          />
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
                        <FormLabel>
                          {t('setup.fields.adminEmail.label')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder={t(
                              'setup.fields.adminEmail.placeholder',
                            )}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="adminPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('setup.fields.adminPassword.label')}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showAdminPassword ? 'text' : 'password'}
                            placeholder={t(
                              'setup.fields.adminPassword.placeholder',
                            )}
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            onClick={() =>
                              setShowAdminPassword(!showAdminPassword)
                            }
                          >
                            {showAdminPassword ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <PasswordStrengthIndicator password={field.value} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Organization Admin Information */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {t('setup.sections.organizationAdmin.title')}
                </h3>
                <p className="text-sm text-gray-600">
                  {t('setup.sections.organizationAdmin.description')}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="orgAdminName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('setup.fields.orgAdminName.label')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t(
                              'setup.fields.orgAdminName.placeholder',
                            )}
                            {...field}
                          />
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
                        <FormLabel>
                          {t('setup.fields.orgAdminEmail.label')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder={t(
                              'setup.fields.orgAdminEmail.placeholder',
                            )}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="orgAdminPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('setup.fields.orgAdminPassword.label')}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showOrgAdminPassword ? 'text' : 'password'}
                            placeholder={t(
                              'setup.fields.orgAdminPassword.placeholder',
                            )}
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            onClick={() =>
                              setShowOrgAdminPassword(!showOrgAdminPassword)
                            }
                          >
                            {showOrgAdminPassword ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <PasswordStrengthIndicator password={field.value} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  {t('setup.sections.frameworks.title')}
                </h3>
                <p className="text-sm text-gray-600">
                  {t('setup.sections.frameworks.description')}
                </p>

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
                                    {t(
                                      `setup.frameworkOptions.${option.key}.name`,
                                      { defaultValue: option.name },
                                    )}
                                  </p>
                                  <p className="mt-1 text-xs leading-5 text-gray-600">
                                    {t(
                                      `setup.frameworkOptions.${option.key}.description`,
                                      { defaultValue: option.description },
                                    )}
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
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading
                  ? t('setup.submit.settingUp')
                  : t('setup.submit.setupSystem')}
              </Button>

              <div className="text-center text-sm text-gray-500">
                <p>{t('setup.note')}</p>
              </div>
            </form>
          </Form>
        </Card>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>{t('setup.footer')}</p>
        </div>
      </div>
    </div>
  );
}
