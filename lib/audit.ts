import { prisma } from "@/lib/db";

type AuditAction = "CREATE" | "UPDATE" | "DELETE";

export async function writeAudit(params: {
  entity: string;
  entityId: string;
  action: AuditAction;
  payload?: unknown;
}) {
  const payload =
    params.payload === undefined ? "" : JSON.stringify(params.payload);
  await prisma.auditLog.create({
    data: {
      entity: params.entity,
      entityId: params.entityId,
      action: params.action,
      payload
    }
  });
}

