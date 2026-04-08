import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  User,
  Lock,
  Shield,
  Eye,
  EyeOff,
  Save,
  Building2,
  Languages,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/components/ui/form";
import { authService } from "@/services/api/auth";
import { ApiError } from "@/services/api/client";

// ─── Schemas ────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  name: z.string().min(1, "Display name is required").max(100),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

// ─── Helpers ────────────────────────────────────────────────────────────────

function getInitials(name?: string | null, email?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0]!.charAt(0) + parts[1]!.charAt(0)).toUpperCase();
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "??";
}

function formatRole(role?: string): string {
  if (!role) return "—";
  return role
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

// ─── Page ───────────────────────────────────────────────────────────────────

export function AccountSettingsPage() {
  const { i18n } = useTranslation();
  const user = authService.getCachedUser();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? "" },
  });

  // Password form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const switchLocale = useCallback(async (locale: 'en' | 'ja') => {
    await i18n.changeLanguage(locale);
    await authService.updateLocale(locale);
  }, [i18n]);

  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      const response = await authService.updateProfile(data.name);
      const updated = response.user ?? response;
      authService.cacheUser({ ...user!, ...updated });
      toast.success("Display name updated successfully.");
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : "Failed to update profile.";
      toast.error(msg);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      await authService.changePassword(data.currentPassword, data.newPassword);
      toast.success("Password changed successfully.");
      passwordForm.reset();
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : "Failed to change password.";
      toast.error(msg);
    }
  };

  const initials = getInitials(user?.name, user?.email);

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      {/* ── Profile overview card ── */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            Profile
          </CardTitle>
          <CardDescription>Your account identity and organisation details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Avatar row */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-semibold select-none">
              {initials}
            </div>
            <div>
              <p className="font-medium text-gray-900">{user?.name || "—"}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <Badge variant="secondary" className="mt-1 text-xs">
                {formatRole(user?.role)}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Organisation row */}
          {user?.organization && (
            <div className="flex items-center gap-3 text-sm">
              <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <span className="text-gray-500">Organisation: </span>
                <span className="font-medium text-gray-900">{user.organization.name}</span>
              </div>
            </div>
          )}

          <Separator />

          {/* Edit display name */}
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              <FormField
                control={profileForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                size="sm"
                disabled={profileForm.formState.isSubmitting}
                className="flex items-center gap-2"
              >
                <Save className="w-3.5 h-3.5" />
                {profileForm.formState.isSubmitting ? "Saving…" : "Save name"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* ── Change password card ── */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600" />
            Change Password
          </CardTitle>
          <CardDescription>
            Use a strong password with uppercase letters, numbers, and symbols.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              {/* Hidden username field for password manager / browser accessibility */}
              <input
                type="text"
                autoComplete="username"
                readOnly
                value={user?.email ?? ''}
                aria-hidden="true"
                className="sr-only"
              />
              {/* Current password */}
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showCurrent ? "text" : "password"}
                          placeholder="Enter current password"
                          autoComplete="current-password"
                          className="pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => setShowCurrent((v) => !v)}
                          aria-label={showCurrent ? "Hide" : "Show"}
                        >
                          {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* New password */}
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showNew ? "text" : "password"}
                          placeholder="At least 8 characters"
                          autoComplete="new-password"
                          className="pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => setShowNew((v) => !v)}
                          aria-label={showNew ? "Hide" : "Show"}
                        >
                          {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Confirm password */}
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm new password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirm ? "text" : "password"}
                          placeholder="Repeat new password"
                          autoComplete="new-password"
                          className="pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => setShowConfirm((v) => !v)}
                          aria-label={showConfirm ? "Hide" : "Show"}
                        >
                          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                size="sm"
                disabled={passwordForm.formState.isSubmitting}
                className="flex items-center gap-2"
              >
                <Lock className="w-3.5 h-3.5" />
                {passwordForm.formState.isSubmitting ? "Updating…" : "Update password"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* ── Language card ── */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Languages className="w-4 h-4 text-blue-600" />
            Language
          </CardTitle>
          <CardDescription>Choose your preferred display language.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <button
              onClick={() => switchLocale('en')}
              className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                i18n.language === 'en'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-background text-muted-foreground border-border hover:border-blue-400 hover:text-foreground'
              }`}
            >
              English
            </button>
            <button
              onClick={() => switchLocale('ja')}
              className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                i18n.language === 'ja'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-background text-muted-foreground border-border hover:border-blue-400 hover:text-foreground'
              }`}
            >
              日本語
            </button>
          </div>
        </CardContent>
      </Card>

      {/* ── Security info card ── */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Email address</dt>
              <dd className="font-medium text-gray-900">{user?.email ?? "—"}</dd>
            </div>
            <Separator />
            <div className="flex justify-between">
              <dt className="text-gray-500">Role</dt>
              <dd>
                <Badge variant="outline" className="text-xs">
                  {formatRole(user?.role)}
                </Badge>
              </dd>
            </div>
            <Separator />
            <div className="flex justify-between">
              <dt className="text-gray-500">Account created</dt>
              <dd className="font-medium text-gray-900">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "—"}
              </dd>
            </div>
            <Separator />
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-gray-500 flex-shrink-0">User ID</dt>
              <dd className="font-mono text-xs text-gray-500 break-all sm:text-right">{user?.id ?? "—"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
