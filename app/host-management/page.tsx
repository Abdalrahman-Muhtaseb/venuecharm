import Link from "next/link";

const requests = [
  {
    venue: "The Grand Hall",
    location: "Downtown District",
    requester: "Sarah Jenkins",
    date: "Oct 12, 2023",
    guests: "150 Guests",
    status: "Pending",
    action: "Approve",
    badge: "SJ",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB0Suu5xU_AsFH5XOkj4AVZmBA8o3uLaLZ7z7wwNsmeWJVtS7ZL2wUmhZtyZz9bc7f3IE0x0jpO0NruQC7HBZeSD9glno0AyACSTw5GmztMA61Z4rpadBHca6wu_zfN3Wh-w1OtY0bmSV_yuXTOgbxu8op4TiWAq5jN_tZ8Arkb19raxM0HXQmmDoBLtme1gfggG31KxHYg5EOlzccQ1TNjlx9ee36JvmvfBiZ2-jVnhOd5RbyVSyLsrhevKsUYxaM2wJWdCFzkEg0",
  },
  {
    venue: "Rooftop Garden",
    location: "Financial District",
    requester: "TechStart Inc.",
    date: "Nov 05, 2023",
    guests: "45 Guests",
    status: "Inquiry",
    action: "Reply",
    badge: "TS",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAXn7Ft0IlY5wRQS4s-0zmZ-mPEuoYHxAyS9c0KTnSw9MJa0E3NzmJfaLCNSH7gXdVhfoxwwA1xiwOE2pu8XQcvwnDKxbHKDD0LhdkOyT6ZbyoEXlce2WqCVvkXD_lZVuNOc4AuSjoRhRJOhdFeJRPtsJXy3ZAQT8qfZEW1NvHmAB40H6tv-5tF7Tzr81Zu8BKtu9bpJ_jw9VZy01bBLsHTgPxF7wK8aWeI54a4RJHjkKnPwGAVE5RrTYQMbvhpjVMvORmAQoHppbM",
  },
  {
    venue: "Downtown Loft",
    location: "Arts District",
    requester: "Wedding Planner Co.",
    date: "Dec 10, 2023",
    guests: "80 Guests",
    status: "Pending",
    action: "Approve",
    badge: "WP",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBY5QoCryquP5uiRLeVzCPHW782AlNraVvj2wX8GdFsryCqQg96hhlBz_7xZaMPnYIZM172bYM5sgyE_PDYdfSDFn4vIe-1ntNdLa5NFDDtavTwK8kla6eoe4Di0lLwIdTWl9e2UqQmczbDgA1CIjU7IszzFLE23m6L-Cp48BUP2z42cYT4glzjKynhMPpJCO-hwBVT9qBnDV0MgHTupqNGDA8FkN8BTyioFMHtrfyXMhwiUzywwjogKDpKNxTixmMWnLJxx9zDA3c",
  },
  {
    venue: "The Glass Room",
    location: "Business Center",
    requester: "FinTech Event",
    date: "Jan 15, 2024",
    guests: "25 Guests",
    status: "Confirmed",
    action: "Details",
    badge: "FE",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuClgYTrsxYbTOtu0g-zfSIQwClM1yf8aQHQsVqdkwJ1vlXvSuOD2srRYhquwzEGpirQGHDcSMkUo381p_aswL0suPyFuvBz-8pYlP6SxtNoD5OfuiwKRUTekER3dtNzjLlvV_YaoG-i4xPa4hAc6MxvTEMsGeYe6qhtA2n6SwMRTjrNQ6Ubu88fzctKcGlcQUySJ31gxtwdbGoW_JLKESarnydnBtYuFHqp37ADcMgAzSrTdlVbNSKqtG27v35QZFOwhQGZgJCbz8I",
  },
];

export default function HostManagementPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-background-light font-display text-[#111718] dark:bg-background-dark dark:text-white">
      <aside className="z-20 flex w-64 flex-shrink-0 flex-col border-r border-[#e5e7eb] bg-surface-light dark:border-[#2d3b3d] dark:bg-surface-dark">
        <div className="flex h-16 items-center border-b border-[#f0f4f4] px-6 dark:border-[#2d3b3d]">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <span className="material-symbols-outlined text-2xl text-primary">storefront</span>
            </div>
            <div>
              <h1 className="text-base font-bold leading-none tracking-tight">VenueCharm</h1>
              <p className="mt-0.5 text-xs font-medium text-[#618689] dark:text-gray-400">Host Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-6">
          <Link href="/host-management" className="mb-1 flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-2.5 text-primary transition-colors">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="text-sm font-semibold">Dashboard</span>
          </Link>
          <Link href="/search" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[#618689] transition-colors hover:bg-[#f0f4f4] hover:text-[#111718] dark:text-gray-400 dark:hover:bg-[#2d3b3d] dark:hover:text-white">
            <span className="material-symbols-outlined">domain</span>
            <span className="text-sm font-medium">Venues</span>
          </Link>
          <Link href="/confirmation" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[#618689] transition-colors hover:bg-[#f0f4f4] hover:text-[#111718] dark:text-gray-400 dark:hover:bg-[#2d3b3d] dark:hover:text-white">
            <span className="material-symbols-outlined">calendar_month</span>
            <span className="text-sm font-medium">Bookings</span>
          </Link>
          <Link href="/search" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[#618689] transition-colors hover:bg-[#f0f4f4] hover:text-[#111718] dark:text-gray-400 dark:hover:bg-[#2d3b3d] dark:hover:text-white">
            <span className="material-symbols-outlined">bar_chart</span>
            <span className="text-sm font-medium">Analytics</span>
          </Link>

          <div className="mt-4 border-t border-[#f0f4f4] pt-4 dark:border-[#2d3b3d]">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">Settings</p>
            <Link href="/search" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[#618689] transition-colors hover:bg-[#f0f4f4] hover:text-[#111718] dark:text-gray-400 dark:hover:bg-[#2d3b3d] dark:hover:text-white">
              <span className="material-symbols-outlined">settings</span>
              <span className="text-sm font-medium">General</span>
            </Link>
            <Link href="/confirmation" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[#618689] transition-colors hover:bg-[#f0f4f4] hover:text-[#111718] dark:text-gray-400 dark:hover:bg-[#2d3b3d] dark:hover:text-white">
              <span className="material-symbols-outlined">support_agent</span>
              <span className="text-sm font-medium">Support</span>
            </Link>
          </div>
        </nav>

        <div className="border-t border-[#f0f4f4] p-4 dark:border-[#2d3b3d]">
          <div className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-[#f0f4f4] dark:hover:bg-[#2d3b3d]">
            <div
              className="h-10 w-10 rounded-full border-2 border-white bg-cover bg-center shadow-sm dark:border-[#2d3b3d]"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA6zhvrMPpHy6-Yn6Bjkls3dL8S2uYcNds8HFhbqryQZRegsOLSrocJBMB_jRbs7Y6jYD-woM2cFgptNP7i5Dzw9XbXyBo5wEizeb1l7MEujR0Ts43YF3Mhmhfvc6WbwGuu5OHlTGfOE-GXABaXG6FkTEbGXL4_zFtxW990LczCE0CMqRGfHdFQRXhJb7qN2Y3ScsTCwfg0o2X5DkzwjeIEpXG-9y-KQQ9CHkV2yoKVxMIHnEsZDGWt81etYb9tRhNsHQfS0MkqFGU')",
              }}
            />
            <div className="min-w-0 flex flex-col">
              <p className="truncate text-sm font-semibold text-[#111718] dark:text-white">Marcus Chen</p>
              <p className="truncate text-xs text-[#618689] dark:text-gray-400">Host Account</p>
            </div>
            <span className="material-symbols-outlined ml-auto text-[#9ca3af]">expand_more</span>
          </div>
        </div>
      </aside>

      <main className="relative flex h-full flex-1 flex-col overflow-hidden">
        <header className="z-10 flex h-16 flex-shrink-0 items-center justify-between border-b border-[#e5e7eb] bg-surface-light px-8 dark:border-[#2d3b3d] dark:bg-surface-dark">
          <div className="flex flex-1 items-center max-w-lg">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]">search</span>
              <input
                className="w-full rounded-lg border-none bg-[#f6f8f8] py-2 pl-10 pr-4 text-sm text-[#111718] placeholder-[#9ca3af] focus:ring-2 focus:ring-primary/50 dark:bg-[#102022] dark:text-white"
                placeholder="Search venues, bookings..."
                type="text"
              />
            </div>
          </div>
          <div className="ml-6 flex items-center gap-4">
            <button className="relative rounded-full p-2 text-[#618689] transition-colors hover:bg-[#f6f8f8] dark:text-gray-400 dark:hover:bg-[#102022]">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute right-2.5 top-2 h-2 w-2 rounded-full border border-white bg-red-500 dark:border-[#1e2d2f]" />
            </button>
            <div className="h-6 w-px bg-[#e5e7eb] dark:bg-[#2d3b3d]" />
            <Link href="/venue" className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm shadow-primary/20 transition-colors hover:bg-primary-dark">
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span>Add New Venue</span>
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-7xl space-y-8">
            <div className="flex flex-col gap-1">
              <h2 className="text-3xl font-bold tracking-tight text-[#111718] dark:text-white">Dashboard</h2>
              <p className="text-[#618689] dark:text-gray-400">Welcome back, Marcus. Here&apos;s what&apos;s happening with your venues today.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                ["visibility", "Total Views", "1,240", "vs. last 7 days", "5.2%", "blue"],
                ["pending_actions", "Pending Requests", "8", "Require response within 24h", "Action Needed", "orange"],
                ["attach_money", "Total Revenue", "$12,450", "Current month to date", "12%", "green"],
              ].map(([icon, label, value, subtitle, badge, color]) => (
                <div key={label} className="flex flex-col gap-4 rounded-xl border border-[#e5e7eb] bg-surface-light p-6 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] dark:border-[#2d3b3d] dark:bg-surface-dark">
                  <div className="flex items-start justify-between">
                    <div className={`rounded-lg p-2 ${color === "blue" ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" : color === "orange" ? "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400" : "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"}`}>
                      <span className="material-symbols-outlined">{icon}</span>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${color === "blue" || color === "green" ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"}`}>
                      {badge}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#618689] dark:text-gray-400">{label}</p>
                    <h3 className="mt-1 text-2xl font-bold text-[#111718] dark:text-white">{value}</h3>
                    <p className="mt-1 text-xs text-[#9ca3af]">{subtitle}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col rounded-xl border border-[#e5e7eb] bg-surface-light shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] dark:border-[#2d3b3d] dark:bg-surface-dark">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e5e7eb] p-6 dark:border-[#2d3b3d]">
                <h3 className="text-lg font-bold text-[#111718] dark:text-white">Latest Booking Requests</h3>
                <div className="flex gap-2">
                  <button className="flex items-center gap-1 rounded-lg bg-transparent px-3 py-1.5 text-sm font-medium text-[#618689] transition-colors hover:bg-[#f6f8f8] dark:text-gray-400 dark:hover:bg-[#102022]">
                    <span className="material-symbols-outlined text-[18px]">filter_list</span> Filter
                  </button>
                  <button className="flex items-center gap-1 rounded-lg bg-transparent px-3 py-1.5 text-sm font-medium text-[#618689] transition-colors hover:bg-[#f6f8f8] dark:text-gray-400 dark:hover:bg-[#102022]">
                    <span className="material-symbols-outlined text-[18px]">download</span> Export
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#e5e7eb] bg-[#f9fafb] dark:border-[#2d3b3d] dark:bg-[#1a2628]">
                      {[
                        "Venue",
                        "Requester",
                        "Date & Guests",
                        "Status",
                        "Actions",
                      ].map((heading, index) => (
                        <th key={heading} className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#618689] dark:text-gray-400 ${index === 4 ? "text-right" : ""}`}>
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#2d3b3d]">
                    {requests.map((request, index) => (
                      <tr key={request.venue} className="group transition-colors hover:bg-[#f6f8f8] dark:hover:bg-[#102022]">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="h-10 w-10 flex-shrink-0 rounded-lg bg-cover bg-center"
                              style={{
                                backgroundImage: `url('${request.image}')`,
                              }}
                            />
                            <div>
                              <p className="text-sm font-semibold text-[#111718] dark:text-white">{request.venue}</p>
                              <p className="text-xs text-[#618689] dark:text-gray-400">{request.location}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${request.badge === "TS" ? "bg-indigo-100 text-indigo-600" : request.badge === "FE" ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-600"}`}>
                              {request.badge}
                            </div>
                            <span className="text-sm font-medium text-[#111718] dark:text-white">{request.requester}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-[#111718] dark:text-white">{request.date}</span>
                            <span className="text-xs text-[#618689] dark:text-gray-400">{request.guests}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${request.status === "Pending" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" : request.status === "Inquiry" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"}`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {request.action === "Approve" ? (
                              <>
                                <button className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20">
                                  Decline
                                </button>
                                <Link href="/confirmation" className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-dark">
                                  Approve
                                </Link>
                              </>
                            ) : request.action === "Reply" ? (
                              <>
                                <button className="rounded-lg px-3 py-1.5 text-sm font-medium text-[#618689] transition-colors hover:bg-gray-100 hover:text-[#111718] dark:hover:bg-gray-800">
                                  View
                                </button>
                                <Link href="/venue" className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-dark">
                                  Reply
                                </Link>
                              </>
                            ) : (
                              <button className="rounded-lg px-3 py-1.5 text-sm font-medium text-[#618689] transition-colors hover:bg-gray-100 hover:text-[#111718] dark:hover:bg-gray-800">
                                Details
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-[#e5e7eb] px-6 py-4 dark:border-[#2d3b3d]">
                <p className="text-sm text-[#618689] dark:text-gray-400">
                  Showing <span className="font-medium text-[#111718] dark:text-white">1</span> to <span className="font-medium text-[#111718] dark:text-white">4</span> of <span className="font-medium text-[#111718] dark:text-white">12</span> results
                </p>
                <div className="flex gap-2">
                  <button className="rounded-md border border-[#e5e7eb] bg-white px-3 py-1 text-sm font-medium text-[#618689] hover:bg-[#f6f8f8] dark:border-[#2d3b3d] dark:bg-[#1e2d2f] dark:text-gray-400 dark:hover:bg-[#102022]">
                    Previous
                  </button>
                  <button className="rounded-md border border-[#e5e7eb] bg-white px-3 py-1 text-sm font-medium text-[#618689] hover:bg-[#f6f8f8] dark:border-[#2d3b3d] dark:bg-[#1e2d2f] dark:text-gray-400 dark:hover:bg-[#102022]">
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}