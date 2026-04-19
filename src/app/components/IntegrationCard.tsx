/**
 * Generic IntegrationCard
 *
 * Provides the standard card shell used by all integration tiles:
 *   - Icon + name + category header
 *   - Connected / Available badge
 *   - Description
 *   - Configurable action footer (slot)
 *
 * Each integration-specific card wraps this component and supplies
 * the icon, labels, and action buttons.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';

export interface IntegrationCardProps {
  /** Visual icon — SVG element or img */
  icon: React.ReactNode;
  /** Icon wrapper background class (e.g. "bg-[#FF9900]" or "bg-white border border-gray-200") */
  iconBg?: string;
  /** Integration display name */
  name: string;
  /** Short category / subtitle string */
  category: string;
  /** One-line description shown in the card body */
  description: string;
  /** Whether this integration is currently connected */
  connected: boolean;
  /** Whether the parent page is still loading status */
  loading?: boolean;
  /** Text shown in the badge when connected (defaults to "Connected") */
  connectedLabel?: string;
  /** Text shown in the badge when not connected (defaults to "Available") */
  availableLabel?: string;
  /** Text shown when loading */
  loadingLabel?: string;
  /** Action buttons / footer content */
  children?: React.ReactNode;
  /** Extra CSS classes on the card root */
  className?: string;
}

/**
 * Standard integration tile card shell.
 *
 * Usage:
 *   <IntegrationCard
 *     icon={<SomeIcon />}
 *     iconBg="bg-orange-500"
 *     name="Acme Integration"
 *     category="Cloud Provider"
 *     description="Sync resources from Acme."
 *     connected={isConnected}
 *     loading={loading}
 *   >
 *     <Button onClick={handleConnect}>Connect</Button>
 *   </IntegrationCard>
 */
export function IntegrationCard({
  icon,
  iconBg = 'bg-white border border-gray-200',
  name,
  category,
  description,
  connected,
  loading = false,
  connectedLabel,
  availableLabel,
  loadingLabel,
  children,
  className = '',
}: IntegrationCardProps) {
  const { t } = useTranslation('integrations');
  const resolvedConnected = connectedLabel ?? t('cards.shared.connected');
  const resolvedAvailable = availableLabel ?? t('cards.shared.available');
  const resolvedLoading = loadingLabel ?? t('cards.shared.checking');
  const badgeLabel = loading ? resolvedLoading : connected ? resolvedConnected : resolvedAvailable;
  const badgeVariant = connected && !loading ? 'default' : 'outline';

  return (
    <Card className={`p-6 flex flex-col gap-4 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 p-1 overflow-hidden ${iconBg}`}
            aria-hidden="true"
          >
            {icon}
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 leading-tight">{name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{category}</p>
          </div>
        </div>
        <Badge variant={badgeVariant} className="shrink-0 ml-2">
          {badgeLabel}
        </Badge>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 flex-1">{description}</p>

      {/* Action footer (slot) */}
      {children && <div className="mt-auto">{children}</div>}
    </Card>
  );
}
