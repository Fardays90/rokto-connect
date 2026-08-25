import { useAuthStore } from '../stores/auth'
import { useQuery } from '@tanstack/react-query'
import { fetchRequests } from '../api/requests'

export default function DonorRequests() {
  const user = useAuthStore((s: any) => s.user)
  const params = { zip_code: user?.zip_code, division: user?.division }
  const { data, isLoading } = useQuery({ queryKey: ['requests', params], queryFn: () => fetchRequests(params) })

  if (!user?.is_donor) return <div>You are not registered as a donor.</div>

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Nearby Requests</h2>
      {isLoading && <div className="text-sm text-[color:var(--rc-bone)]/50">Loading...</div>}
      <div className="grid gap-3">
        {(data as any[])?.map((r: any) => (
          <div key={r.request_id} className="rounded-lg border border-[color:var(--rc-line)] p-4 bg-white/[0.02]">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{r.blood_type} • {r.urgency}</div>
                <div className="text-xs text-[color:var(--rc-bone)]/50">{new Date(r.created_at).toLocaleString()}</div>
              </div>
              <div className="text-sm">{r.district || r.division || r.zip_code}</div>
            </div>
            {r.message && <p className="mt-2 text-sm text-[color:var(--rc-bone)]/70">{r.message}</p>}
          </div>
        ))}
        {!isLoading && !(data as any[])?.length && <div className="text-sm text-[color:var(--rc-bone)]/50">No nearby requests</div>}
      </div>
    </div>
  )
}
