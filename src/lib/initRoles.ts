import { connectDB } from '@/lib/db';
import { Role } from '@/models/Role';
import { PREDEFINED_ROLES, generateDefaultPermissions } from '@/lib/rbac';

export async function ensurePredefinedRoles() {
  await connectDB();

  for (const roleDef of PREDEFINED_ROLES) {
    const existing = await Role.findOne({ code: roleDef.code });
    if (!existing) {
      const permissions = generateDefaultPermissions(roleDef.code);
      await Role.create({
        name: roleDef.name,
        code: roleDef.code,
        hierarchyLevel: roleDef.hierarchyLevel,
        reportingTo: roleDef.reportingTo,
        description: roleDef.description,
        isSystem: roleDef.isSystem,
        status: 'ACTIVE',
        permissions,
      });
      console.log(`[RBAC] Seeded role: ${roleDef.name} (${roleDef.code})`);
    }
  }
}
