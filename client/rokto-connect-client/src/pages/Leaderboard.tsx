import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchLeaderboard } from '../api/donors'

function DonorRow({ d, rank }: any) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[color:var(--rc-line)] p-3 bg-white/[0.02]">
      <div>
        <div className="font-medium">{rank}. {d.first_name} {d.last_name}</div>
        <div className="text-xs text-[color:var(--rc-bone)]/50">Donations: {d.donation_count} • Rating: {d.rating}</div>
      </div>
    </div>
  )
}

export default function Leaderboard() {
  const [sort, setSort] = React.useState<'rating'|'donation_count'>('donation_count')
  const { data, isLoading } = useQuery({ queryKey: ['leaderboard', sort], queryFn: () => fetchLeaderboard(sort) })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Leaderboard</h2>
        <div className="space-x-2">
          <button onClick={() => setSort('donation_count')} className={`px-3 py-1 rounded ${sort==='donation_count' ? 'bg-[color:var(--rc-blood)] text-white' : 'bg-transparent'}`}>Donations</button>
          <button onClick={() => setSort('rating')} className={`px-3 py-1 rounded ${sort==='rating' ? 'bg-[color:var(--rc-blood)] text-white' : 'bg-transparent'}`}>Rating</button>
        </div>
      </div>

      <div className="grid gap-3">
        {isLoading && <div className="text-sm text-[color:var(--rc-bone)]/50">Loading...</div>}
        {data?.map((d: any, i: number) => <DonorRow key={d.user_id} d={d} rank={i+1} />)}
        {!isLoading && !data?.length && <div className="text-sm text-[color:var(--rc-bone)]/50">No donors yet</div>}
      </div>
    </div>
  )
}
