import { createClient } from "@/lib/supabase/client";

type AuditAction =
  | "survey.created"
  | "survey.activated"
  | "survey.closed"
  | "survey.deleted"
  | "survey.emails_sent"
  | "employee.added"
  | "employee.deleted"
  | "employee.imported"
  | "employee.toggled"
  | "profile.updated"
  | "pdf.exported";

export async function logAudit(
  action: AuditAction,
  options?: {
    resourceType?: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
  }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("audit_logs").insert({
      workspace_id: user.id,
      actor_email: user.email,
      action,
      resource_type: options?.resourceType,
      resource_id: options?.resourceId,
      metadata: options?.metadata,
    });
  } catch {
    // Audit logging is non-critical — never throw
  }
}
