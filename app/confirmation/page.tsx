import Link from "next/link";

export default function ConfirmationPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background-light font-display text-[#111718] dark:bg-background-dark dark:text-white">
      <header className="w-full border-b border-solid border-[#f0f4f4] bg-white dark:border-[#2a3b3d] dark:bg-[#1a2b2d]">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between whitespace-nowrap px-4 py-3 sm:px-10">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-4 text-[#111718] dark:text-white">
              <span className="size-8 text-primary">
                <svg className="h-full w-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path d="M39.5563 34.1455V13.8546C39.5563 15.708 36.8773 17.3437 32.7927 18.3189C30.2914 18.916 27.263 19.2655 24 19.2655C20.737 19.2655 17.7086 18.916 15.2073 18.3189C11.1227 17.3437 8.44365 15.708 8.44365 13.8546V34.1455C8.44365 35.9988 11.1227 37.6346 15.2073 38.6098C17.7086 39.2069 20.737 39.5564 24 39.5564C27.263 39.5564 30.2914 39.2069 32.7927 38.6098C36.8773 37.6346 39.5563 35.9988 39.5563 34.1455Z" fill="currentColor" />
                </svg>
              </span>
              <span className="text-lg font-bold leading-tight tracking-[-0.015em]">VenueCharm</span>
            </Link>
            <div className="hidden items-center gap-9 md:flex">
              <Link href="/search" className="text-sm font-medium leading-normal hover:text-primary">
                Venues
              </Link>
              <Link href="/host-management" className="text-sm font-medium leading-normal hover:text-primary">
                About Us
              </Link>
              <Link href="/confirmation" className="text-sm font-medium leading-normal hover:text-primary">
                Help Center
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden flex-col items-end text-right sm:flex">
              <span className="text-sm font-bold text-[#111718] dark:text-white">Alex Morgan</span>
              <span className="text-xs text-[#618689] dark:text-gray-400">Renter</span>
            </div>
            <div
              className="size-10 rounded-full border border-gray-100 bg-cover bg-center dark:border-gray-700"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC7tGV7AWeU_sb3rv4kWRx0Ba9423YfWNJIZLqTNmo2XFN6Ojo7kbT93fXV0Hpc2v931BZaws0zF4tN5cDx3dqjCppYkI_HA6HATZ1sRBYTaGxMpMfOaiLtqBQJyvd60nMo2gwys4uCDpNcGLIG_X8Hp6cepmpXji1GwvX0ajx-bqGGhxMtSVasV4aIEsSllUcxgNwiWl7qSqRUDEep5ICE34pO259XZkIS5lluc6JhmxABEc0rwGI7S4ivW1gqmICBiKj9tHFP7z4')",
              }}
            />
          </div>
        </div>
      </header>

      <main className="flex flex-grow items-start justify-center px-4 py-10 md:px-10">
        <div className="flex w-full max-w-[800px] flex-col gap-8">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-6xl">check_circle</span>
            </div>
            <div className="flex max-w-[520px] flex-col gap-2">
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-[#111718] dark:text-white">Your request was sent!</h1>
              <p className="text-base leading-relaxed text-[#618689] dark:text-gray-400">
                We&apos;ve notified the host. You&apos;ll receive a confirmation email once they approve your booking request for <strong>The Loft Downtown</strong>.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm dark:border-[#2a3b3d] dark:bg-[#1a2b2d]">
            <div className="flex flex-col gap-6 border-b border-[#f0f4f4] p-6 dark:border-[#2a3b3d] md:flex-row">
              <div
                className="aspect-video w-full rounded-lg bg-center bg-cover md:aspect-[4/3] md:w-1/3"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB_Iedkewr7q2gqvrSbktOiQdaRQ4n42UeePoU51RMk_eygyk5CTnfTbTR9ljV5aepV7p6MFV7d8Ub93KpHiQlV8hARAl2b886okgWelFOIIt9nxrXyOiFUnXuLQusRaHc94eTCRVIen6P_Il6fuumeQsjpXJf3Pk1ZTobqy3rSe_no60yzeFzcTwvRdsTtLqy8zCP9jeS4t4F82SpXHQk8Bza2Df1_C4ZEgGUKqSSaKPwuzj3cIEvMwfpEABpSygMhxnC3watpRm8')",
                }}
              />
              <div className="flex flex-1 flex-col justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold leading-tight text-[#111718] dark:text-white">The Loft Downtown - Main Hall</h3>
                      <div className="mt-1 flex items-center gap-1 text-[#618689] dark:text-gray-400">
                        <span className="material-symbols-outlined text-[18px]">location_on</span>
                        <span className="text-sm">123 Market St, San Francisco, CA</span>
                      </div>
                    </div>
                    <span className="hidden items-center rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 dark:border-amber-800/50 dark:bg-amber-900/40 dark:text-amber-200 md:inline-flex">
                      <span className="material-symbols-outlined mr-1 text-[14px]">hourglass_empty</span>
                      Pending Approval
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-[#618689] dark:text-gray-400">Total Price Estimate</p>
                    <div className="flex items-center gap-1 text-[#111718] dark:text-white">
                      <span className="material-symbols-outlined text-[22px] text-primary">payments</span>
                      <span className="text-2xl font-bold">$500.00</span>
                    </div>
                  </div>
                  <div className="md:hidden">
                    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 dark:border-amber-800/50 dark:bg-amber-900/40 dark:text-amber-200">
                      <span className="material-symbols-outlined mr-1 text-[14px]">hourglass_empty</span>
                      Pending Approval
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-x-8 gap-y-6 p-6 sm:grid-cols-2">
              {[
                ["calendar_month", "Date", "October 24, 2023"],
                ["schedule", "Time", "6:00 PM - 10:00 PM"],
                ["group", "Guest Count", "50 Guests"],
                ["warehouse", "Venue Type", "Indoor Hall"],
              ].map(([icon, label, value]) => (
                <div key={label} className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-[#618689] dark:text-gray-400">{label}</p>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-[#111718] dark:text-white">{icon}</span>
                    <p className="text-base font-medium text-[#111718] dark:text-white">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex w-full flex-col justify-center gap-4 sm:flex-row">
            <Link href="/host-management" className="flex h-12 w-full items-center justify-center rounded-lg bg-primary px-8 text-sm font-bold leading-normal tracking-[0.015em] text-[#111718] shadow-sm shadow-primary/20 transition-colors hover:bg-[#0fb3c2] sm:w-auto">
              View My Bookings
            </Link>
            <Link href="/search" className="flex h-12 w-full items-center justify-center rounded-lg border border-[#dbe5e6] bg-white px-8 text-sm font-bold leading-normal tracking-[0.015em] text-[#111718] transition-colors hover:bg-[#f0f4f4] dark:border-gray-600 dark:bg-transparent dark:text-white dark:hover:bg-[#1a2b2d] sm:w-auto">
              Search More Venues
            </Link>
          </div>

          <div className="mt-4 text-center">
            <Link href="/confirmation" className="flex items-center justify-center gap-1 text-sm text-[#618689] transition-colors hover:text-primary dark:text-gray-400">
              Need help? Contact Support
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}