import React, { useState, useEffect } from 'react';
import { Thesis } from '../types';

interface SubmissionStatusProps {
  userId: number;
}

export const SubmissionStatus: React.FC<SubmissionStatusProps> = ({ userId }) => {
  const [counts, setCounts] = useState<{ approved: number; pending: number; rejected: number }>({
    approved: 0,
    pending: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await fetch(`/api/my-submissions/${userId}`);
        const data: Thesis[] = await res.json().then(d => Array.isArray(d) ? d : []);
        const approved = data.filter(t => t.status === 'approved').length;
        const pending = data.filter(t => t.status === 'pending').length;
        const rejected = data.filter(t => t.status === 'rejected').length;
        setCounts({ approved, pending, rejected });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [userId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl animate-pulse">
          <span className="text-sm text-transparent">Approved</span>
          <span className="w-6 h-5 rounded-full bg-white/10" />
        </div>
        <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl animate-pulse">
          <span className="text-sm text-transparent">Pending</span>
          <span className="w-6 h-5 rounded-full bg-white/10" />
        </div>
        <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl animate-pulse">
          <span className="text-sm text-transparent">Rejected</span>
          <span className="w-6 h-5 rounded-full bg-white/10" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl">
        <span className="text-sm font-medium text-theme-text">Approved</span>
        <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">{counts.approved}</span>
      </div>
      <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl">
        <span className="text-sm font-medium text-theme-text">Pending</span>
        <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">{counts.pending}</span>
      </div>
      <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl">
        <span className="text-sm font-medium text-theme-text">Rejected</span>
        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">{counts.rejected}</span>
      </div>
    </div>
  );
};
