import Link from "next/link";

const amenities = [
  ["wifi", "High-speed Wifi (1Gbps)"],
  ["videocam", "Pro AV Equipment"],
  ["soup_kitchen", "Prep Kitchen"],
  ["ac_unit", "Central Air Conditioning"],
  ["accessible", "Wheelchair Accessible"],
  ["local_parking", "Valet Parking Available"],
];

const capacity = [
  ["chair", "200", "Theater"],
  ["restaurant", "150", "Banquet"],
  ["local_bar", "250", "Cocktail"],
  ["meeting_room", "80", "Classroom"],
];

const calendarDays = Array.from({ length: 19 }, (_, index) => index + 1);

export default function VenuePage() {
  return (
    <div className="bg-background-light font-display text-[#111718] antialiased dark:bg-background-dark dark:text-white">
      <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-b-[#e5e7eb] bg-white px-4 py-3 dark:border-b-slate-800 dark:bg-[#111718] md:px-10">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 text-[#111718] dark:text-white">
            <div className="size-8 text-primary">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M39.5563 34.1455V13.8546C39.5563 15.708 36.8773 17.3437 32.7927 18.3189C30.2914 18.916 27.263 19.2655 24 19.2655C20.737 19.2655 17.7086 18.916 15.2073 18.3189C11.1227 17.3437 8.44365 15.708 8.44365 13.8546V34.1455C8.44365 35.9988 11.1227 37.6346 15.2073 38.6098C17.7086 39.2069 20.737 39.5564 24 39.5564C27.263 39.5564 30.2914 39.2069 32.7927 38.6098C36.8773 37.6346 39.5563 35.9988 39.5563 34.1455Z" fill="currentColor" />
              </svg>
            </div>
            <h2 className="text-xl font-bold leading-tight tracking-[-0.015em]">VenueCharm</h2>
          </Link>
          <label className="hidden max-w-64 min-w-40 flex-col !h-10 md:flex">
            <div className="flex h-full w-full items-stretch overflow-hidden rounded-lg border border-[#dbe5e6] dark:border-slate-700">
              <div className="flex items-center justify-center border-none bg-white pl-3 text-[#618689] dark:bg-slate-800">
                <span className="material-symbols-outlined text-[20px]">search</span>
              </div>
              <input
                className="form-input h-full w-full min-w-0 flex-1 resize-none border-none bg-white px-3 text-sm font-normal leading-normal text-[#111718] placeholder:text-[#618689] focus:border-none focus:outline-0 focus:ring-0 dark:bg-slate-800 dark:text-white"
                placeholder="Search venues..."
                value=""
                readOnly
              />
            </div>
          </label>
        </div>

        <div className="flex items-center gap-8">
          <div className="hidden items-center gap-9 md:flex">
            <Link href="/search" className="text-sm font-medium transition-colors hover:text-primary">
              Venues
            </Link>
            <Link href="/host-management" className="text-sm font-medium transition-colors hover:text-primary">
              Services
            </Link>
            <Link href="/confirmation" className="text-sm font-medium transition-colors hover:text-primary">
              Community
            </Link>
          </div>
          <div
            className="size-10 rounded-full border-2 border-white bg-cover bg-center shadow-sm dark:border-slate-700"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAiSBz8hb8pny1km6uCCRWJw-tOp93AgkwPHH0sBgRwbyO3UuI-iZTXRk8OJItZCghd6-QlLP2Usag-pD1xRLWDMtqBwNteoPRklyhZ9_igujtyWSFK_kFnb9tcmu10ohQcx1yhv33ZXnLyqOCESGpi6d6z_n2Kvk8I-5YeguflOeVsQ6fFKVE7avKliZ3L8kUOjXfvD0YuqZqvwGmjuTxgS0pD2MwJu0wWIAe6pmg8CpAKFqOvYEBT8_EG-k_NctTbw_Tpe5DrvZQ')",
            }}
          />
        </div>
      </header>

      <main className="mx-auto flex max-w-[1280px] flex-col gap-6 px-4 py-6 md:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-black leading-tight tracking-[-0.033em] text-[#111718] dark:text-white md:text-4xl">
              The Grand Atrium at Skyline Tower
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-[#618689] dark:text-slate-400 md:text-base">
              <span className="cursor-pointer font-medium underline text-[#111718] transition-colors hover:text-primary dark:text-white">Downtown District</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-primary">star</span> 4.92 (128 reviews)
              </span>
              <span>•</span>
              <span>Superhost</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-slate-800">
              <span className="material-symbols-outlined text-[18px]">share</span> Share
            </button>
            <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-slate-800">
              <span className="material-symbols-outlined text-[18px]">favorite</span> Save
            </button>
          </div>
        </div>

        <div className="relative grid h-[300px] grid-cols-1 gap-2 overflow-hidden rounded-xl md:h-[450px] md:grid-cols-4 md:grid-rows-2">
          <div className="md:col-span-2 md:row-span-2 bg-gray-200">
            <div className="h-full w-full bg-center bg-no-repeat bg-cover transition-transform duration-500 hover:scale-105" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDBnk6ZozpcfRUbn1fuQBObcWeSZLizxb9yEs6CgEOfOpKc37y5nigh6irVz8-DMDfzRG3VyFvy4R5aJn5ShAwpUp_ZPVeXO5YRN13wk2YItEfpv7FoaycAEPhWpWh0dfQYGXyw7e0r00YL2yvYmNipURP7xmzie0wzoZLfygSbJ18R8UzzY7D_IPi1DbjG5JozWE3ExBZxvJmc2ZcXfcbg2JETHBvaX_tzSt61Q5pUfAoDANA0r4Oy2Okz5FHNszyTskMRQJRr1gw')" }} />
          </div>
          {[
            "https://lh3.googleusercontent.com/aida-public/AB6AXuBFLsorOrGo88T8Xabyc_-Td-sgl8XZ35IhBNarsRp0zTFPhXpuGmQEMhVmZ9l5bQiRCS1jneAL_bPQV7qRLeYnjyH4HMb7Yt-8Fij8GwtB6rusoC06L2Ta0JDHmYJHkHsuL4gQXoDtgd-QmuZNRjd86VgW5E86NnomiEN2wy-A1I5ahkV6lo8TjggluF-8Hq4RDAobcBrO5pAu2x5SDMCEwHeHhPfsjVWSN5GHH3em9csnM8jRD6RxtJz7QNAM_wG8LOAk83h4cxI",
            "https://lh3.googleusercontent.com/aida-public/AB6AXuDpU8hEXWnfgDnh7-NvtLe3JNUpghwPgZ3EBFVbPRAKZmvBqzB5pmcUP9xwwt6vhh5Dvk8m7146uWIxVI2xdzo4ungrvt0wxb3Bgpv9bIMvo6u9sh6QQBpe5zcTGju2Ox1ihEIEafIoy8EP9cHEBMDknbAd-3NeavzrBxfGcUThEf6QSLTNSM2FEScA-x_s_h4rvNtIKaMVYYi3f_JCybqXY4sBouHvPKyK9ZcD3hyo1u7cwD6DDV8jv-JpQffI43lZPqYTmwNhH64",
            "https://lh3.googleusercontent.com/aida-public/AB6AXuA8JCcl_CfuL-9yJsRI5b0FKpAV5qFQdMwQy17pmycXBFU9GnAuEhd-YE7f895nHhMYKlWNDLQf-1YmOJI6_qzlCmIL_ZILBqgzUEEgZgJEO0q2KV4XeF2421DfHR7iAj2snnHflfL8DKr4tDY3DHDtIl9hjlF5tPtbmwuzNvkyiVCQY4SDGRj49nsGv6nRblhDx81kQGtw975-bPpYNCBUZ0UKF8ObHImw_NhOrYOgoNKuyVNmzdXj8N7i9nUjgstH2yAOer-O_lE",
          ].map((src) => (
            <div key={src} className="hidden bg-gray-200 md:block">
              <div className="h-full w-full bg-center bg-no-repeat bg-cover transition-transform duration-500 hover:scale-105" style={{ backgroundImage: `url('${src}')` }} />
            </div>
          ))}
          <div className="relative hidden bg-gray-200 md:block">
            <div className="h-full w-full bg-center bg-no-repeat bg-cover transition-transform duration-500 hover:scale-105" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD7dRZhPOmGEQv5z-Dfp7NxSCnO6dfzgZaOpGFSkne9gFj_v84GzrFMO3jVTc_qEbuJ_Wnltk8YaG-YTWP5u_SKW4-eLGjmPS8hFWnO5MxIp7JzExN5QHY3A0l3P0H8iQOldkc1cadsQ-kPyUYQtQjwDcm_SFH2XLuDjm7PA72T6DsCnayOakpgK7u9uwlmBsPqaOlE5b2OuEm1v6hgSh4Jd6sZO6ybojExHbef9GROWfYb_9ZDbRDxJqoykDV9SzHU4FS_nVAPeVc')" }} />
            <button className="absolute bottom-4 right-4 flex items-center gap-2 rounded-md bg-white/90 px-3 py-1.5 text-sm font-semibold shadow-sm transition-colors hover:bg-white dark:bg-black/80 dark:hover:bg-black backdrop-blur-sm">
              <span className="material-symbols-outlined text-[16px]">grid_view</span> Show all photos
            </button>
          </div>
        </div>

        <div className="relative mt-4 grid grid-cols-1 gap-12 lg:grid-cols-3">
          <div className="flex flex-col gap-10 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-[#f0f4f4] pb-8 dark:border-slate-800">
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold text-[#111718] dark:text-white">Hosted by Elena R.</h3>
                <p className="text-sm text-[#618689]">Professional Host • 5 years hosting</p>
              </div>
              <div
                className="size-14 rounded-full bg-cover bg-center shadow-md"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA2dE2-reamUhG6Y4HdN22mtF0sjkMoODW7eoswdexi2dX_hx5rgnCAovsd8z8ufITA9shlSSSVM8pgP6uiVCYB-ktOOBQbxDJpysA2s_w2ciJPFOxx1Z8U1SzE9noR65KBBNMbuhAwIVs0kWsBb54QDaZdx6Ik4ArGzlZ286Om5tRVgtbtOguwGNA1dN9X4t49-ULu9AyR5a6s4k9MBw0k5bLBRjZuQh7w7IlBEmyHhuc5LRDT1JsMqwBWtJyNmrO4nguUQnVp8r0')",
                }}
              />
            </div>

            <div className="flex flex-col gap-6">
              {[
                ["workspace_premium", "Professional Event Space", "Designed specifically for corporate events and large gatherings."],
                ["location_on", "Prime Location", "Located in the heart of the Downtown District, close to transit."],
                ["calendar_clock", "Flexible Cancellation", "Cancel up to 48 hours before your event for a partial refund."],
              ].map(([icon, title, description]) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <span className="material-symbols-outlined text-primary">{icon}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#111718] dark:text-white">{title}</h4>
                    <p className="text-sm text-[#618689]">{description}</p>
                  </div>
                </div>
              ))}
            </div>

            <hr className="border-[#f0f4f4] dark:border-slate-800" />

            <div className="flex flex-col gap-4">
              <h3 className="text-xl font-bold">About this venue</h3>
              <div className="space-y-4 leading-relaxed text-[#111718] dark:text-slate-300">
                <p>
                  The Grand Atrium at Skyline Tower is a premium event destination designed for memorable corporate gatherings, celebrations, and productions. With expansive windows, elegant finishes, and flexible layouts, the space adapts to your event needs.
                </p>
                <p>
                  Guests enjoy a seamless experience with modern amenities, dedicated support, and easy access to the city&apos;s most vibrant district. It&apos;s built to host polished, high-impact events.
                </p>
              </div>
              <button className="mt-2 flex items-center gap-1 font-semibold underline hover:text-primary">
                Show more <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>

            <hr className="border-[#f0f4f4] dark:border-slate-800" />

            <div className="flex flex-col gap-6">
              <h3 className="text-xl font-bold">What this place offers</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {amenities.map(([icon, name]) => (
                  <div key={name} className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/50">
                    <span className="material-symbols-outlined text-[#618689]">{icon}</span>
                    <span className="text-[#111718] dark:text-white">{name}</span>
                  </div>
                ))}
              </div>
              <button className="mt-2 w-fit rounded-lg border border-[#111718] px-6 py-3 font-medium transition-colors hover:bg-gray-50 dark:border-white dark:hover:bg-slate-800">
                Show all 24 amenities
              </button>
            </div>

            <hr className="border-[#f0f4f4] dark:border-slate-800" />

            <div className="flex flex-col gap-6">
              <h3 className="text-xl font-bold">Capacity &amp; Layouts</h3>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {capacity.map(([icon, count, label]) => (
                  <div key={label} className="flex flex-col items-center gap-2 rounded-xl border border-[#f0f4f4] p-4 text-center dark:border-slate-700">
                    <span className="material-symbols-outlined text-3xl text-primary">{icon}</span>
                    <span className="text-lg font-bold">{count}</span>
                    <span className="text-xs uppercase tracking-wide text-[#618689]">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-[#f0f4f4] dark:border-slate-800" />

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold">Availability</h3>
                <p className="text-sm text-[#618689]">Prices may vary on weekends and holidays.</p>
              </div>
              <div className="rounded-xl border border-[#f0f4f4] bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
                <div className="mb-6 flex items-center justify-between">
                  <h4 className="text-lg font-bold">October 2023</h4>
                  <div className="flex gap-2">
                    <button className="flex size-8 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-700">
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <button className="flex size-8 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-700">
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                </div>

                <div className="mb-2 grid grid-cols-7 gap-1 text-center">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                    <span key={day} className="py-2 text-xs font-semibold text-[#618689]">
                      {day}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  <span className="p-3" />
                  <span className="p-3" />
                  {calendarDays.map((day) => (
                    <div
                      key={day}
                      className={`flex aspect-square cursor-pointer items-center justify-center rounded-full text-sm hover:bg-gray-100 dark:hover:bg-slate-700 ${
                        day <= 2
                          ? "text-gray-400 line-through decoration-gray-400"
                          : day === 9
                            ? "bg-primary font-bold text-white shadow-md shadow-primary/30"
                            : day === 10
                              ? "bg-primary/20 font-bold text-primary-dark"
                              : ""
                      }`}
                    >
                      {day}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <hr className="border-[#f0f4f4] dark:border-slate-800" />

            <div className="mb-10 flex flex-col gap-8">
              <h3 className="flex items-center gap-2 text-xl font-bold">
                <span className="material-symbols-outlined text-primary">star</span> 4.9 · 128 reviews
              </h3>
              <div className="grid grid-cols-1 gap-x-12 gap-y-4 md:grid-cols-2">
                {[
                  ["Cleanliness", 98],
                  ["Communication", 100],
                  ["Check-in", 95],
                  ["Accuracy", 92],
                  ["Location", 98],
                ].map(([label, width]) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm">{label}</span>
                    <div className="flex w-1/2 items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                        <div className="h-full bg-[#111718] dark:bg-white" style={{ width: `${width}%` }} />
                      </div>
                      <span className="text-xs font-bold">{`${(width as number / 20).toFixed(1)}`}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:col-span-1 lg:self-start">
            <div className="rounded-2xl border border-[#f0f4f4] bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#1a2c2e]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#618689]">Starting from</p>
                  <p className="text-3xl font-black text-[#111718] dark:text-white">$500</p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">Instant response</span>
              </div>
              <div className="mt-6 space-y-4">
                {[
                  ["calendar_month", "Oct 24, 2023"],
                  ["schedule", "6:00 PM - 10:00 PM"],
                  ["group", "50 Guests"],
                  ["warehouse", "Indoor Hall"],
                ].map(([icon, text]) => (
                  <div key={text} className="flex items-center gap-3 rounded-lg bg-[#f6f8f8] px-4 py-3 dark:bg-[#102022]">
                    <span className="material-symbols-outlined text-[#618689]">{icon}</span>
                    <span className="text-sm font-medium text-[#111718] dark:text-white">{text}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 grid gap-3">
                <Link href="/confirmation" className="flex h-12 items-center justify-center rounded-lg bg-primary text-sm font-bold text-[#111718] shadow-sm transition-colors hover:bg-[#0fb3c2]">
                  Request to book
                </Link>
                <Link href="/search" className="flex h-12 items-center justify-center rounded-lg border border-[#dbe5e6] text-sm font-bold text-[#111718] transition-colors hover:bg-[#f0f4f4] dark:border-gray-600 dark:text-white dark:hover:bg-[#1a2b2d]">
                  Back to search
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}