import { useState, useEffect, useCallback } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useState, useEffect, useCallback } from 'react';

// Hook: merges role-based permissions with external HR adapter permissions.
// Usage: const [permissions, controls] = usePermissions(employee, roles)
export default function usePermissions(employee, roles = []) {
  const [externalPermissions, setExternalPermissions] = useState({});
  const [loading, setLoading] = useState(false);

  const loadExternal = useCallback(async () => {
    if (!employee?.id) return;
    setLoading(true);
    try {
      // Importing the optional HR adapter dynamically so the frontend build
      // won't fail if the adapter isn't present in some deployments.
      const { getPermissionsForStaff } = await import('../../../lib/hrAdapter');
      const p = await getPermissionsForStaff(employee.id);
      setExternalPermissions(p || {});
    } catch (e) {
      // Adapter may not be available in all environments; ignore errors.
      // Keep externalPermissions as an empty object in that case.
      // eslint-disable-next-line no-console
      console.warn('usePermissions: hrAdapter fetch failed or not available', e?.message || e);
    } finally {
      setLoading(false);
    }
  }, [employee]);

  useEffect(() => {
    loadExternal();
  }, [loadExternal]);

  const refresh = async () => {
    await loadExternal();
  };

  const base = (!employee?.rol) ? {} : (roles.find(r => r.id === employee?.rol)?.permissions || {});
  const merged = { ...(base || {}), ...(externalPermissions || {}) };

  return [merged, { refresh, loading }];
}
