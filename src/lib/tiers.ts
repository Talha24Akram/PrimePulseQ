// ============================================================
// Tier definitions & feature gating
// is_owner bypasses ALL checks — owner always has full access
// ============================================================

export type Tier = 'free' | 'starter' | 'growth' | 'enterprise';

export const TIER_LIMITS = {
  free:       { employees: 25,        surveyTemplates: 1,  historyDays: 7   },
  starter:    { employees: 100,       surveyTemplates: 2,  historyDays: 30  },
  growth:     { employees: 500,       surveyTemplates: 999, historyDays: 365 },
  enterprise: { employees: Infinity,  surveyTemplates: 999, historyDays: 999 },
} as const;

export const TIER_FEATURES = {
  // Available on ALL paid tiers
  weekly_surveys:          ['starter', 'growth', 'enterprise'],
  anonymous_responses:     ['starter', 'growth', 'enterprise'],
  email_distribution:      ['starter', 'growth', 'enterprise'],
  basic_analytics:         ['starter', 'growth', 'enterprise'],

  // Growth+
  slack_integration:       ['growth', 'enterprise'],
  teams_integration:       ['growth', 'enterprise'],
  advanced_analytics:      ['growth', 'enterprise'],
  burnout_detection:       ['growth', 'enterprise'],
  sentiment_analysis:      ['growth', 'enterprise'],
  csv_export:              ['growth', 'enterprise'],
  pdf_export:              ['growth', 'enterprise'],
  unlimited_templates:     ['growth', 'enterprise'],

  // Enterprise only
  audit_logs:              ['enterprise'],
} as const;

export type Feature = keyof typeof TIER_FEATURES;

export function canAccess(
  feature: Feature,
  tier: Tier,
  isOwner: boolean
): boolean {
  if (isOwner) return true; // owner bypasses everything
  return (TIER_FEATURES[feature] as readonly string[]).includes(tier);
}

export function getEmployeeLimit(tier: Tier, isOwner: boolean): number {
  if (isOwner) return Infinity;
  return TIER_LIMITS[tier].employees;
}

export function getTemplateLimit(tier: Tier, isOwner: boolean): number {
  if (isOwner) return Infinity;
  return TIER_LIMITS[tier].surveyTemplates;
}

export function getHistoryDays(tier: Tier, isOwner: boolean): number {
  if (isOwner) return Infinity;
  return TIER_LIMITS[tier].historyDays;
}

export const TIER_LABELS: Record<Tier, string> = {
  free:       'Free',
  starter:    'Starter',
  growth:     'Growth',
  enterprise: 'Enterprise',
};

export const UPGRADE_MESSAGE: Record<Feature, string> = {
  weekly_surveys:      'Upgrade to Starter to run weekly surveys.',
  anonymous_responses: 'Upgrade to Starter for anonymous responses.',
  email_distribution:  'Upgrade to Starter for email distribution.',
  basic_analytics:     'Upgrade to Starter for analytics.',
  slack_integration:   'Upgrade to Growth to connect Slack.',
  teams_integration:   'Upgrade to Growth to connect Microsoft Teams.',
  advanced_analytics:  'Upgrade to Growth for advanced analytics.',
  burnout_detection:   'Upgrade to Growth for burnout risk detection.',
  sentiment_analysis:  'Upgrade to Growth for sentiment analysis.',
  csv_export:          'Upgrade to Growth to export CSV.',
  pdf_export:          'Upgrade to Growth to export PDF.',
  unlimited_templates: 'Upgrade to Growth for unlimited templates.',
  audit_logs:          'Upgrade to Enterprise for audit logs.',
};
