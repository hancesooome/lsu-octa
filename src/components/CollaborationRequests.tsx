import React, { useState, useEffect } from 'react';
import { CollaborationRequest } from '../types';
import { UserPlus, Check, X } from 'lucide-react';

interface CollaborationRequestsProps {
  userId: number;
  onViewThesis?: (thesisId: number) => void;
  onAccept?: () => void;
}

export const CollaborationRequests: React.FC<CollaborationRequestsProps> = ({ userId, onViewThesis, onAccept }) => {
  const [requests, setRequests] = useState<CollaborationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      const res = await fetch(`/api/collaboration-requests?userId=${userId}`);
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [userId]);

  const handleRespond = async (requestId: number, status: 'accepted' | 'declined') => {
    setActing(requestId);
    setError(null);
    try {
      const res = await fetch(`/api/collaboration-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setRequests(prev => prev.filter(r => r.id !== requestId));
        if (status === 'accepted') onAccept?.();
      } else {
        setError((data as { error?: string })?.error || `Failed to ${status} (${res.status})`);
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Please try again.');
    } finally {
      setActing(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-display font-bold text-theme-title mb-4 flex items-center gap-2">
          <UserPlus size={20} className="text-lsu-green-primary" />
          Collaboration Requests
        </h3>
        {[1, 2].map(i => (
          <div key={i} className="h-20 bg-white/10 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-display font-bold text-theme-title mb-4 flex items-center gap-2">
          <UserPlus size={20} className="text-lsu-green-primary" />
          Collaboration Requests
        </h3>
        <p className="text-sm text-theme-muted">No pending collaboration requests.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-display font-bold text-theme-title mb-4 flex items-center gap-2">
        <UserPlus size={20} className="text-lsu-green-primary" />
        Collaboration Requests
        <span className="text-xs font-bold bg-lsu-gold/20 text-lsu-gold px-2 py-0.5 rounded-full">
          {requests.length}
        </span>
      </h3>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-600 text-sm">
          {error}
        </div>
      )}
      <div className="space-y-3">
        {requests.map(r => (
          <div
            key={r.id}
            className="p-4 bg-white/10 rounded-xl border border-white/20 space-y-3 relative"
          >
            <div>
              <p
                className={`font-bold text-theme-title inline-block max-w-full ${onViewThesis && r.thesis ? 'cursor-pointer hover:text-lsu-green-primary' : ''}`}
                onClick={(e) => { e.stopPropagation(); onViewThesis && r.thesis && onViewThesis(r.thesis.id); }}
              >
                {r.thesis?.title ?? 'Untitled thesis'}
              </p>
              <p className="text-xs text-theme-muted mt-0.5">
                {r.requester?.name ?? 'Author'} invited you as a collaborator / co-researcher
              </p>
            </div>
            <div className="flex gap-2 relative z-10">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleRespond(r.id, 'accepted'); }}
                disabled={acting === r.id}
                className="flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-lg bg-lsu-green-primary text-white text-sm font-bold disabled:opacity-50 cursor-pointer select-none touch-manipulation"
              >
                <Check size={16} />
                Accept
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleRespond(r.id, 'declined'); }}
                disabled={acting === r.id}
                className="flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-lg bg-white/20 text-theme-title text-sm font-medium hover:bg-white/30 disabled:opacity-50 cursor-pointer select-none touch-manipulation"
              >
                <X size={16} />
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
