'use client';

import { useZTF } from '@/lib/ztf';

export function AuthButton() {
  const { isConnected, address, email, disconnect, isLoading } = useZTF();

  if (isLoading) {
    return (
      <div className="px-6 py-3 bg-gray-200 text-gray-500 rounded-lg">
        Connecting...
      </div>
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          {email || `${address.slice(0, 6)}...${address.slice(-4)}`}
        </span>
        <button
          onClick={disconnect}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="px-6 py-3 bg-gray-200 text-gray-500 rounded-lg">
      Authenticating via ZTF...
    </div>
  );
}
