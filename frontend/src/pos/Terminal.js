import React from 'react';
import POS from '../POS';

export default function Terminal({ permissions, companyId }) {
  // Terminal uses the main POS component for now
  if (!permissions.POS_SELL && !permissions.POS_SELL === 0) {
    return <div className="p-4">Yetkiniz yok</div>;
  }
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-3">POS Terminal</h2>
      <POS companyId={companyId} />
    </div>
  );
}
