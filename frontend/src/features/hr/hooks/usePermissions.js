import { useState, useEffect, useCallback } from 'react';

export default function usePermissions(employee, roles = []) {
  const [externalPermissions, setExternalPermissions] = useState({});
  const [loading, setLoading] = useState(false);

  const loadExternal = useCallback(async () => {
    if (!employee?.id) {
      setExternalPermissions({});
      return;
    }
    setLoading(true);
    try {
      const { getPermissionsForStaff } = await import('../../../lib/hrAdapter');
      const p = await getPermissionsForStaff(employee.id);
      setExternalPermissions(p || {});
    } catch (e) {
      console.error('usePermissions error:', e);
      setExternalPermissions({});
    } finally {
      setLoading(false);
    }
  }, [employee?.id]); // Use employee.id directly instead of whole employee object

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
