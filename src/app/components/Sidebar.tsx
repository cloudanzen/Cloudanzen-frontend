/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import { Link, useLocation } from 'react-router';
import {
  Home,
  Briefcase,
  FileCheck,
  BarChart3,
  Shield,
  Users,
  TrendingUp,
  Building2,
  Server,
  UserCheck,
  Settings,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  UserCog,
  X,
  ClipboardCheck,
  Bell,
  Sparkles,
  Crown,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/app/components/ui/utils';
import { authService } from '@/services/api/auth';
import { useSidebar } from '@/app/components/Layout';

type AppRole =
  | 'SUPER_ADMIN'
  | 'ORG_ADMIN'
  | 'SECURITY_OWNER'
  | 'AUDITOR'
  | 'CONTRIBUTOR'
  | 'VIEWER';

interface NavChild {
  id: string;
  title: string;
  href: string;
  roles?: AppRole[];
}

interface NavItem {
  id: string;
  title: string;
  href?: string;
  icon: any;
  roles?: AppRole[];
  children?: NavChild[];
}

const ADMIN_ROLES: AppRole[] = ['SUPER_ADMIN', 'ORG_ADMIN', 'SECURITY_OWNER'];

function getInitials(name?: string | null, email?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0]!.charAt(0) + parts[1]!.charAt(0)).toUpperCase();
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return '??';
}

function formatRole(role?: string): string {
  if (!role) return '';
  return role
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

// ── Flyout panel for collapsed sidebar ────────────────────────────────────────

interface FlyoutProps {
  item: NavItem;
  visibleChildren: NavChild[];
  isActive: (href: string) => boolean;
  closeSidebar: () => void;
}

function CollapsedFlyoutItem({
  item,
  visibleChildren,
  isActive,
  closeSidebar,
}: FlyoutProps) {
  const [open, setOpen] = useState(false);
  const [top, setTop] = useState(0);
  const triggerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const Icon = item.icon;
  const parentActive = visibleChildren.some((c) => isActive(c.href));

  const showFlyout = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setTop(rect.top);
    }
    setOpen(true);
  };

  const hideFlyout = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 100);
  };

  const cancelHide = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  return (
    <div
      ref={triggerRef}
      className="relative"
      onMouseEnter={showFlyout}
      onMouseLeave={hideFlyout}
    >
      {/* Icon-only trigger */}
      <div
        className={cn(
          'w-full flex items-center justify-center px-3 py-2 rounded-md text-sm transition-colors cursor-default select-none',
          parentActive
            ? 'bg-blue-600 text-white'
            : 'hover:bg-slate-800 text-slate-200',
        )}
        title={item.title}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
      </div>

      {/* Flyout panel — rendered in a fixed portal so it escapes sidebar overflow */}
      {open && (
        <div
          className="fixed z-[200] ml-1 min-w-[200px] rounded-md border border-slate-700 bg-slate-900 shadow-xl py-1"
          style={{
            top,
            left: '5rem' /* sidebar collapsed width = 80px = 5rem */,
          }}
          onMouseEnter={cancelHide}
          onMouseLeave={hideFlyout}
        >
          {/* Section header */}
          <p className="px-3 py-1.5 text-xs font-semibold tracking-wide text-slate-400 uppercase border-b border-slate-700 mb-1">
            {item.title}
          </p>
          {visibleChildren.map((child) => (
            <Link
              key={child.href}
              to={child.href}
              onClick={() => {
                setOpen(false);
                closeSidebar();
              }}
              className={cn(
                'block px-3 py-2 text-sm transition-colors',
                isActive(child.href)
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-200 hover:bg-slate-800',
              )}
            >
              {child.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Sidebar ───────────────────────────────────────────────────────────────

export function Sidebar({ collapsed = false }: { collapsed?: boolean }) {
  const { t } = useTranslation('common');
  const location = useLocation();
  const { close: closeSidebar } = useSidebar();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isDesktop, setIsDesktop] = useState(
    () => window.matchMedia('(min-width: 1024px)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = (event: MediaQueryListEvent) =>
      setIsDesktop(event.matches);
    setIsDesktop(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const navigation = useMemo<NavItem[]>(() => [
    { id: 'home', title: t('nav.home'), href: '/', icon: Home },
    { id: 'myTasks', title: t('nav.myTasks'), href: '/my-tasks', icon: Briefcase },
    { id: 'tests', title: t('nav.tests'), href: '/tests', icon: FileCheck },
    { id: 'reports', title: t('nav.reports'), href: '/reports', icon: BarChart3 },
    {
      id: 'myAudit',
      title: t('nav.myAudit'),
      href: '/auditor/dashboard',
      icon: ClipboardCheck,
      roles: ['AUDITOR'],
    },
    {
      id: 'compliance',
      title: t('nav.compliance'),
      icon: Shield,
      children: [
        { id: 'frameworks', title: t('nav.frameworks'), href: '/compliance/frameworks' },
        { id: 'controls', title: t('nav.controls'), href: '/compliance/controls' },
        { id: 'policies', title: t('nav.policies'), href: '/compliance/policies' },
        { id: 'documents', title: t('nav.documents'), href: '/compliance/documents' },
        { id: 'audits', title: t('nav.audits'), href: '/compliance/audits' },
        { id: 'findings', title: t('nav.findings'), href: '/compliance/findings' },
        { id: 'compliance-settings', title: t('nav.settings'), href: '/settings/compliance', roles: [...ADMIN_ROLES] },
      ],
    },
    {
      id: 'customerTrust',
      title: t('nav.customerTrust'),
      icon: Users,
      children: [
        { id: 'trustCenter', title: t('nav.trustCenter'), href: '/customer-trust/trust-center' },
        { id: 'customerTrust-settings', title: t('nav.settings'), href: '/settings/customer-trust', roles: [...ADMIN_ROLES] },
      ],
    },
    {
      id: 'risk',
      title: t('nav.risk'),
      icon: TrendingUp,
      children: [
        { id: 'risk-overview', title: t('nav.overview'), href: '/risk/overview' },
        { id: 'risks', title: t('nav.risks'), href: '/risk/risks' },
        { id: 'riskLibrary', title: t('nav.riskLibrary'), href: '/risk/library' },
        { id: 'actionTracker', title: t('nav.actionTracker'), href: '/risk/action-tracker' },
        { id: 'snapshot', title: t('nav.snapshot'), href: '/risk/snapshot' },
        { id: 'riskEngine', title: t('nav.riskEngine'), href: '/risk/engine', roles: [...ADMIN_ROLES] },
        { id: 'risk-settings', title: t('nav.settings'), href: '/settings/risk', roles: [...ADMIN_ROLES] },
      ],
    },
    { id: 'vendors', title: t('nav.vendors'), href: '/vendors', icon: Building2 },
    {
      id: 'assets',
      title: t('nav.assets'),
      icon: Server,
      children: [
        { id: 'inventory', title: t('nav.inventory'), href: '/assets/inventory' },
        { id: 'mergeReview', title: t('nav.mergeReview'), href: '/assets/merge-review' },
        { id: 'codeChanges', title: t('nav.codeChanges'), href: '/assets/code-changes' },
        { id: 'vulnerabilities', title: t('nav.vulnerabilities'), href: '/assets/vulnerabilities' },
        { id: 'securityAlerts', title: t('nav.securityAlerts'), href: '/assets/security-alerts' },
        { id: 'assets-settings', title: t('nav.settings'), href: '/settings/assets', roles: [...ADMIN_ROLES] },
      ],
    },
    {
      id: 'personnel',
      title: t('nav.personnel'),
      icon: UserCheck,
      children: [
        { id: 'computers', title: t('nav.computers'), href: '/personnel/computers' },
        { id: 'accessManagement', title: t('nav.accessManagement'), href: '/personnel/access' },
        { id: 'personnel-settings', title: t('nav.settings'), href: '/settings/personnel', roles: [...ADMIN_ROLES] },
      ],
    },
    { id: 'notifications', title: t('nav.notifications'), href: '/notifications', icon: Bell },
    {
      id: 'integrations',
      title: t('nav.integrations'),
      icon: Settings,
      children: [
        { id: 'connectedApps', title: t('nav.connectedApps'), href: '/integrations' },
        { id: 'partnerApi', title: t('nav.partnerApi'), href: '/integrations/partner-api', roles: [...ADMIN_ROLES] },
      ],
    },
    { id: 'mySecurityTasks', title: t('nav.mySecurityTasks'), href: '/my-security-tasks', icon: CheckSquare },
    {
      id: 'aiAssistant',
      title: t('nav.aiAssistant'),
      icon: Sparkles,
      roles: [...ADMIN_ROLES],
      children: [
        { id: 'aiChat', title: t('nav.aiChat'), href: '/ai/chat' },
        { id: 'questionnaireAi', title: t('nav.questionnaireAi'), href: '/ai/questionnaire-assistant' },
        { id: 'knowledgeBase', title: t('nav.knowledgeBase'), href: '/ai/knowledge-base' },
        { id: 'aiSettings', title: t('nav.aiSettings'), href: '/settings/ai', roles: [...ADMIN_ROLES] },
      ],
    },
    {
      id: 'platformAdmin',
      title: t('nav.platformAdmin'),
      icon: Crown,
      roles: ['SUPER_ADMIN'],
      children: [
        { id: 'controlTemplates', title: t('nav.controlTemplates'), href: '/admin/templates', roles: ['SUPER_ADMIN'] },
        { id: 'testTemplates', title: t('nav.testTemplates'), href: '/admin/test-templates', roles: ['SUPER_ADMIN'] },
        { id: 'policyTemplates', title: t('nav.policyTemplates'), href: '/admin/policy-templates', roles: ['SUPER_ADMIN'] },
        { id: 'admin-frameworks', title: t('nav.frameworks'), href: '/admin/frameworks', roles: ['SUPER_ADMIN'] },
        { id: 'organizations', title: t('nav.organizations'), href: '/admin/organizations', roles: ['SUPER_ADMIN'] },
      ],
    },
  ], [t]);

  const isCompact = collapsed && isDesktop;

  const user = authService.getCachedUser();
  const userRole = (user?.role ?? '') as AppRole;
  const displayName = user?.name || user?.email || 'User';
  const initials = getInitials(user?.name, user?.email);
  const roleLabel = formatRole(user?.role);

  const canSee = (roles?: AppRole[]) => {
    if (!roles || roles.length === 0) return true;
    return roles.includes(userRole);
  };

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id],
    );
  };

  const isActive = (href: string) => location.pathname === href;
  const isParentActive = (children: NavChild[]) =>
    children.some((child) => location.pathname === child.href);

  return (
    <aside
      className={cn(
        'h-full bg-slate-900 text-white flex flex-col w-64 lg:transition-[width] lg:duration-200',
        collapsed ? 'lg:w-20' : 'lg:w-64',
      )}
    >
      {/* Brand */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <Link
          to="/"
          onClick={closeSidebar}
          className={cn(
            'flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
            collapsed && 'lg:justify-center lg:w-full',
          )}
          aria-label={t('sidebar.goToHome')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="170 110 515 420"
            className="w-8 h-8 text-blue-400"
          >
            <path
              d="M 416 266 L 415 268 L 410 268 L 405 272 L 396 274 L 380 290 L 380 293 L 376 296 L 374 305 L 372 306 L 372 315 L 370 316 L 370 333 L 372 334 L 372 341 L 374 342 L 376 351 L 396 373 L 399 373 L 404 377 L 409 377 L 410 379 L 415 379 L 416 381 L 439 381 L 440 379 L 445 379 L 450 375 L 455 375 L 466 365 L 469 365 L 469 362 L 475 357 L 475 354 L 481 347 L 483 334 L 485 333 L 485 314 L 483 313 L 483 306 L 481 305 L 481 300 L 479 299 L 477 292 L 471 287 L 471 284 L 466 282 L 461 276 L 458 276 L 455 272 L 450 272 L 445 268 L 440 268 L 439 266 Z M 420 285 L 435 285 L 436 287 L 441 287 L 442 289 L 449 291 L 460 302 L 460 305 L 464 310 L 464 315 L 466 316 L 466 331 L 464 332 L 464 337 L 462 338 L 460 345 L 449 356 L 446 356 L 441 360 L 436 360 L 435 362 L 420 362 L 419 360 L 414 360 L 413 358 L 406 356 L 395 345 L 395 342 L 391 337 L 391 330 L 389 329 L 389 318 L 391 317 L 391 310 L 393 309 L 395 302 L 406 291 L 409 291 L 414 287 L 419 287 Z M 458 118 L 452 122 L 452 133 L 454 135 L 463 137 L 464 139 L 481 141 L 482 143 L 493 145 L 498 149 L 503 149 L 504 151 L 523 159 L 526 163 L 529 163 L 532 167 L 535 167 L 540 173 L 543 173 L 550 181 L 553 181 L 658 286 L 658 289 L 515 432 L 512 432 L 501 442 L 498 442 L 497 444 L 494 444 L 481 452 L 476 452 L 475 454 L 466 456 L 465 458 L 456 458 L 455 460 L 444 460 L 443 462 L 412 462 L 411 460 L 400 460 L 399 458 L 384 456 L 379 452 L 374 452 L 373 450 L 354 442 L 343 432 L 340 432 L 269 361 L 269 356 L 370 255 L 373 255 L 382 247 L 385 247 L 398 239 L 417 237 L 418 235 L 451 237 L 452 239 L 457 239 L 458 241 L 473 247 L 484 257 L 487 257 L 492 263 L 501 263 L 507 255 L 505 248 L 497 240 L 494 240 L 489 234 L 486 234 L 483 230 L 480 230 L 471 224 L 466 224 L 461 220 L 454 220 L 453 218 L 442 218 L 441 216 L 414 216 L 413 218 L 394 220 L 389 224 L 384 224 L 383 226 L 372 230 L 361 240 L 358 240 L 246 352 L 246 355 L 244 356 L 244 365 L 324 445 L 327 445 L 340 457 L 347 459 L 350 463 L 353 463 L 362 469 L 367 469 L 372 473 L 377 473 L 378 475 L 383 475 L 384 477 L 403 479 L 404 481 L 419 481 L 420 483 L 435 483 L 436 481 L 463 479 L 464 477 L 471 477 L 472 475 L 483 473 L 488 469 L 493 469 L 494 467 L 509 461 L 512 457 L 515 457 L 518 453 L 521 453 L 528 445 L 531 445 L 636 339 L 639 339 L 658 358 L 658 363 L 625 396 L 622 396 L 619 402 L 616 402 L 555 464 L 552 464 L 543 474 L 540 474 L 535 480 L 528 482 L 525 486 L 522 486 L 519 490 L 514 490 L 507 496 L 502 496 L 501 498 L 492 500 L 487 504 L 480 504 L 479 506 L 456 510 L 452 514 L 450 521 L 454 527 L 457 527 L 458 529 L 465 529 L 466 527 L 485 525 L 486 523 L 491 523 L 496 519 L 507 517 L 520 509 L 525 509 L 528 505 L 535 503 L 538 499 L 541 499 L 544 495 L 547 495 L 550 491 L 553 491 L 560 483 L 563 483 L 681 365 L 681 362 L 683 361 L 681 354 L 651 324 L 655 321 L 656 317 L 659 317 L 663 313 L 664 309 L 667 309 L 671 305 L 672 301 L 675 301 L 679 297 L 679 294 L 683 288 L 681 287 L 681 282 L 563 164 L 560 164 L 553 156 L 550 156 L 547 152 L 544 152 L 535 144 L 528 142 L 525 138 L 520 138 L 507 130 L 496 128 L 491 124 L 476 122 L 475 120 Z M 390 118 L 389 120 L 380 120 L 379 122 L 364 124 L 359 128 L 348 130 L 347 132 L 344 132 L 343 134 L 320 144 L 317 148 L 314 148 L 311 152 L 308 152 L 305 156 L 302 156 L 297 162 L 294 162 L 174 282 L 172 291 L 178 296 L 180 301 L 183 301 L 188 306 L 188 309 L 191 309 L 196 314 L 196 317 L 199 317 L 204 322 L 204 325 L 174 354 L 172 361 L 174 362 L 174 365 L 260 450 L 260 453 L 263 453 L 268 458 L 268 461 L 271 461 L 276 466 L 276 469 L 279 469 L 296 487 L 299 487 L 304 493 L 307 493 L 316 501 L 323 503 L 326 507 L 329 507 L 330 509 L 333 509 L 346 517 L 357 519 L 358 521 L 367 523 L 368 525 L 377 525 L 378 527 L 385 527 L 386 529 L 399 529 L 405 523 L 405 518 L 401 512 L 398 512 L 393 508 L 376 506 L 375 504 L 358 500 L 353 496 L 348 496 L 345 492 L 342 492 L 341 490 L 330 486 L 327 482 L 320 480 L 303 464 L 300 464 L 197 361 L 197 358 L 342 213 L 345 213 L 348 209 L 351 209 L 354 205 L 361 203 L 368 197 L 373 197 L 378 193 L 383 193 L 384 191 L 389 191 L 390 189 L 399 189 L 400 187 L 409 187 L 410 185 L 445 185 L 446 187 L 465 189 L 466 191 L 477 193 L 482 197 L 487 197 L 494 203 L 501 205 L 512 215 L 515 215 L 586 286 L 586 291 L 489 388 L 486 388 L 473 400 L 470 400 L 457 408 L 442 410 L 441 412 L 414 412 L 413 410 L 402 410 L 401 408 L 396 408 L 395 406 L 380 400 L 375 394 L 372 394 L 365 386 L 362 386 L 361 384 L 354 384 L 353 386 L 350 386 L 350 389 L 348 390 L 348 397 L 364 413 L 371 415 L 374 419 L 383 421 L 384 423 L 387 423 L 392 427 L 397 427 L 398 429 L 409 429 L 410 431 L 443 431 L 444 429 L 455 429 L 456 427 L 461 427 L 466 423 L 471 423 L 472 421 L 483 417 L 494 407 L 497 407 L 609 295 L 611 286 L 609 285 L 609 282 L 549 223 L 549 220 L 543 217 L 543 214 L 539 210 L 536 210 L 525 198 L 522 198 L 519 194 L 516 194 L 507 186 L 504 186 L 491 178 L 486 178 L 485 176 L 480 176 L 475 172 L 470 172 L 469 170 L 446 168 L 445 166 L 412 166 L 411 168 L 398 168 L 397 170 L 380 172 L 375 176 L 364 178 L 363 180 L 348 186 L 339 194 L 336 194 L 331 200 L 328 200 L 219 310 L 216 310 L 197 291 L 197 286 L 300 183 L 303 183 L 312 173 L 315 173 L 320 167 L 327 165 L 330 161 L 345 155 L 348 151 L 359 149 L 364 145 L 369 145 L 370 143 L 375 143 L 376 141 L 399 137 L 403 133 L 403 122 L 397 118 Z"
              fill="currentColor"
              fillRule="evenodd"
            />
          </svg>
          <span
            className={cn('text-xl font-semibold', collapsed && 'lg:hidden')}
          >
            CloudAnzen
          </span>
        </Link>
        {/* Close button — mobile only */}
        <button
          onClick={closeSidebar}
          className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          aria-label={t('sidebar.closeMenu')}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-visible p-3 space-y-1">
        {navigation.map((item) => {
          if (!canSee(item.roles)) return null;

          const Icon = item.icon;
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedItems.includes(item.id);

          const visibleChildren = hasChildren
            ? item.children!.filter((c) => canSee(c.roles))
            : [];

          const parentActive =
            visibleChildren.length > 0 && isParentActive(visibleChildren);

          if (hasChildren && visibleChildren.length === 0) return null;

          // ── Collapsed + has children → hover flyout ──────────────────────
          if (hasChildren && isCompact) {
            return (
              <CollapsedFlyoutItem
                key={item.id}
                item={item}
                visibleChildren={visibleChildren}
                isActive={isActive}
                closeSidebar={closeSidebar}
              />
            );
          }

          // ── Expanded + has children → inline accordion ───────────────────
          if (hasChildren) {
            return (
              <div key={item.id}>
                <button
                  onClick={() => toggleExpanded(item.id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                    parentActive
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-slate-800 text-slate-200',
                    collapsed && 'lg:justify-center',
                  )}
                  title={item.title}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span
                    className={cn('flex-1 text-left', collapsed && 'lg:hidden')}
                  >
                    {item.title}
                  </span>
                  {isExpanded ? (
                    <ChevronDown
                      className={cn('w-4 h-4', collapsed && 'lg:hidden')}
                    />
                  ) : (
                    <ChevronRight
                      className={cn('w-4 h-4', collapsed && 'lg:hidden')}
                    />
                  )}
                </button>
                {isExpanded && (
                  <div className="ml-6 mt-1 space-y-1">
                    {visibleChildren.map((child) => (
                      <Link
                        key={child.href}
                        to={child.href}
                        onClick={closeSidebar}
                        className={cn(
                          'block px-3 py-1.5 rounded-md text-sm transition-colors',
                          isActive(child.href)
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-300 hover:bg-slate-800',
                        )}
                      >
                        {child.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          // ── Leaf item (no children) ───────────────────────────────────────
          return (
            <Link
              key={item.id}
              to={item.href!}
              onClick={closeSidebar}
              title={item.title}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                collapsed && 'lg:justify-center',
                isActive(item.href!)
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-slate-800 text-slate-200',
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className={cn(collapsed && 'lg:hidden')}>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-slate-800 space-y-1">
        <Link
          to="/settings/profile"
          onClick={closeSidebar}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-md transition-colors',
            collapsed && 'lg:justify-center',
            location.pathname.startsWith('/settings')
              ? 'bg-blue-600 text-white'
              : 'hover:bg-slate-800',
          )}
          title="Settings"
        >
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-semibold flex-shrink-0">
            {initials}
          </div>
          <div className={cn('flex-1 min-w-0', collapsed && 'lg:hidden')}>
            <p className="text-sm font-medium truncate">{displayName}</p>
            {roleLabel && (
              <p className="text-xs text-slate-400 truncate">{roleLabel}</p>
            )}
          </div>
          <UserCog
            className={cn(
              'w-4 h-4 text-slate-400 flex-shrink-0',
              collapsed && 'lg:hidden',
            )}
          />
        </Link>
      </div>
    </aside>
  );
}
