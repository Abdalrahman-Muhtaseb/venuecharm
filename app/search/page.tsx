import Link from "next/link";

const venues = [
  {
    title: "The Urban Loft TLV",
    area: "Florentin, Tel Aviv",
    rating: "4.9",
    guests: "80 Guests",
    price: "₪2,500",
    status: "Popular",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB6d3FF04KLWsyIiNxkBbWBa_6tz3tJgERvrzWNVzXH2cPh-HzW0MGM9WlLgtLrkHnlG8I7qnKcvQAT_Hy1akuo9XHqTzrpU9IaxW1IHS0NGolZQa9iTp130v1rlXChloieX0odFo1Zhg3J60a39j4cm6E3Xy_20QTjLJE7GXqDVS67Pi9Plsc5qe_YLgQPVXisbQRmvqan2zYLsngT__iYwQjjtnnjTOpyNvsD9ABAqhBpcNnRJ-K9aiKLiPL7JrdLYTrbxyFmQjA",
    amenities: ["WiFi", "A/V"],
  },
  {
    title: "Seaside Conference Center",
    area: "Jaffa, Tel Aviv",
    rating: "4.8",
    guests: "200 Guests",
    price: "₪5,000",
    status: "Top rated",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC2m-zXld3RtQafBYYuthFxjTZUcz74Evt7LZTOJtPumH15lVSwqeSKEsIADKlpErZywWqD3YE-s7K2hVaoQCZONj_PEw9I6g6JnB5RJSSBVKstAI4PR7LuX5RyQyS0QihdhB-6u2uGWunjKMNUAMluIOj45VrKfQjPz0VBrZk1RqnLQfWHkq4UHaSKejcHqhQciAPEjcpYELLWeoBMqqiu89BOZ3B7MTppxXggmkGa5NM-ukKSwlFZQubDzyEZOfqunUF_0qKlAis",
    amenities: ["Catering", "Stage"],
  },
  {
    title: "Skyline Rooftop Garden",
    area: "Rothschild, Tel Aviv",
    rating: "4.7",
    guests: "50 Guests",
    price: "₪3,200",
    status: "New",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCa3BuSDShGVhcQ8bNG2uy1YhLnOQzhRHmJbVvuqQk1N2e7-3qbrH3IiBKBast6m0rAmeQ2XhHpXFf-LFmHborlY1s1zDkuwKokjEGRMOUEQLKDPfw3oU1UeXz_PwicF4EjvQ8ZopDHjArPAk9RczXwAzfATmjWz3AvEa5IzGir6Z15AwN8ktiJnfCY9B8tqj33cM-v6-Ynp8A6WPCma7tb54qOJ2AFWw1yGy7uzywtWYKcQ3N6YA3PF0xJcBxOchQAzjijs66e-3U",
    amenities: ["Bar", "Outdoor"],
  },
];

const pins = [
  { top: "35%", left: "42%", label: "₪2.5k", active: true },
  { top: "50%", left: "55%", label: "₪4.8k", active: false },
  { top: "25%", left: "60%", label: "₪3.2k", active: false },
  { top: "60%", left: "30%", label: "₪1.9k", active: false },
  { top: "68%", left: "48%", label: "₪2.1k", active: false },
];

export default function SearchResultsPage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background-light font-display text-slate-900 dark:bg-background-dark dark:text-white">
      <div className="z-20 flex-none border-b border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-background-dark">
        <header className="flex items-center justify-between whitespace-nowrap px-6 py-3 lg:px-10">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-4 text-slate-900 dark:text-white">
              <div className="size-8 text-primary">
                <svg className="h-full w-full" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path d="M39.5563 34.1455V13.8546C39.5563 15.708 36.8773 17.3437 32.7927 18.3189C30.2914 18.916 27.263 19.2655 24 19.2655C20.737 19.2655 17.7086 18.916 15.2073 18.3189C11.1227 17.3437 8.44365 15.708 8.44365 13.8546V34.1455C8.44365 35.9988 11.1227 37.6346 15.2073 38.6098C17.7086 39.2069 20.737 39.5564 24 39.5564C27.263 39.5564 30.2914 39.2069 32.7927 38.6098C36.8773 37.6346 39.5563 35.9988 39.5563 34.1455Z" fill="currentColor" />
                </svg>
              </div>
              <h2 className="hidden text-lg font-bold tracking-[-0.015em] sm:block">VenueCharm</h2>
            </Link>

            <label className="hidden h-10 w-80 min-w-40 md:flex lg:w-96">
              <div className="flex h-full w-full flex-1 items-stretch rounded-full shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
                <div className="flex items-center justify-center rounded-l-full border-none border-r-0 bg-white pl-4 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  <span className="material-symbols-outlined text-[20px]">search</span>
                </div>
                <input
                  className="form-input h-full w-full min-w-0 flex-1 resize-none overflow-hidden rounded-full rounded-l-none border-none bg-white px-4 pl-2 text-sm font-normal leading-normal text-slate-900 focus:border-none focus:outline-0 focus:ring-0 dark:bg-slate-800 dark:text-white"
                  placeholder="Tel Aviv, Corporate Event"
                  value=""
                  readOnly
                />
                <div className="m-1 flex cursor-pointer items-center justify-center rounded-full bg-primary p-2 text-white transition-colors hover:bg-primary/90">
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </div>
              </div>
            </label>
          </div>

          <div className="flex flex-1 items-center justify-end gap-4 lg:gap-8">
            <div className="hidden items-center gap-6 lg:flex">
              <Link href="/" className="text-sm font-medium leading-normal transition-colors hover:text-primary">
                Explore
              </Link>
              <Link href="/venue" className="text-sm font-medium leading-normal transition-colors hover:text-primary">
                Saved
              </Link>
              <Link href="/confirmation" className="text-sm font-medium leading-normal transition-colors hover:text-primary">
                Messages
              </Link>
            </div>
            <Link href="/host-management" className="hidden min-w-[84px] rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary/90 sm:flex">
              List your venue
            </Link>
            <div
              className="size-10 rounded-full bg-center bg-no-repeat bg-cover ring-2 ring-slate-100 dark:ring-slate-700"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCoNfJH_suc6sshvunpsQ5-ax0kOTsE911Ll43XFGkSgekVeSrL7yJPRhOAzC33dxAlHmqPtoaK9rzYaysHKcxug73JmUszythRXeMTcAKzkw3gIinLc9acI1RxwVjOv6bs_rvu5lf9-_aktjPYPjCKgGe4LRtkJZNqVbCCSvRrlBeaYRCfIp2XKW490v6_X19-yPlU0miSTCPgJO5hKq-_MiNLbwaokTMCKhUf1PFeX8Il9LsUY5UChclUkBi7poa9ZK4R7ivxxpo')",
              }}
            />
          </div>
        </header>

        <div className="border-t border-slate-100 px-6 pb-3 pt-1 dark:border-slate-800/50 lg:px-10">
          <div className="no-scrollbar flex items-center gap-3 overflow-x-auto">
            {[
              "Dates",
              "Guests",
              "Price: ₪1k-5k",
              "Venue Type",
              "More filters",
            ].map((label, index) => {
              const active = label === "Price: ₪1k-5k";

              return (
                <button
                  key={label}
                  className={`group flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg border pl-4 pr-3 transition-all shadow-sm ${
                    active
                      ? "border-primary bg-primary/10"
                      : "border-slate-200 bg-white hover:border-primary/50 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                  }`}
                >
                  <p className={`text-sm font-medium leading-normal ${active ? "text-primary" : "text-slate-700 dark:text-slate-200"}`}>
                    {label}
                  </p>
                  <span className={`material-symbols-outlined text-[20px] ${active ? "text-primary" : "text-slate-500 group-hover:text-primary"}`}>
                    {active ? "close" : index === 4 ? "tune" : "keyboard_arrow_down"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="relative flex flex-1 overflow-hidden">
        <div className="w-full overflow-y-auto bg-background-light dark:bg-background-dark lg:w-[55%] xl:w-1/2">
          <div className="mx-auto flex max-w-[800px] flex-col gap-6 p-6 lg:p-10">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">300+ venues found in Tel Aviv</h3>
              <div className="flex cursor-pointer items-center gap-1 text-sm font-medium text-slate-500 hover:text-primary">
                Sort by relevance <span className="material-symbols-outlined text-[18px]">keyboard_arrow_down</span>
              </div>
            </div>

            {venues.map((venue) => (
              <Link
                key={venue.title}
                href="/venue"
                className="group relative flex flex-col items-stretch justify-start overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="relative w-full overflow-hidden rounded-t-xl bg-gray-100 aspect-video sm:aspect-[2/1]">
                  <div className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url('${venue.image}')` }} />
                  <button className="absolute right-3 top-3 rounded-full bg-white/80 p-2 text-slate-400 backdrop-blur-sm transition-colors hover:bg-white hover:text-red-500 dark:bg-black/50 dark:hover:bg-black/70">
                    <span className="material-symbols-outlined block text-[20px] fill-current">favorite</span>
                  </button>
                  <div className="absolute left-3 top-3 rounded bg-white/90 px-2 py-1 text-xs font-bold uppercase tracking-wider text-slate-900 backdrop-blur-sm dark:bg-slate-900/90 dark:text-white">
                    {venue.status}
                  </div>
                </div>

                <div className="flex flex-col gap-3 p-4 sm:p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-lg font-bold leading-tight text-slate-900 transition-colors group-hover:text-primary dark:text-white">
                        {venue.title}
                      </h4>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{venue.area}</p>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-medium text-slate-900 dark:text-white">
                      <span className="material-symbols-outlined text-[18px] text-primary">star</span>
                      {venue.rating}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      <span className="material-symbols-outlined text-[14px]">groups</span> {venue.guests}
                    </span>
                    {venue.amenities.map((amenity) => (
                      <span key={amenity} className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <span className="material-symbols-outlined text-[14px]">check</span> {amenity}
                      </span>
                    ))}
                  </div>

                  <div className="mt-1 flex items-end justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                    <div className="text-sm text-slate-500 dark:text-slate-400">Entire venue</div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {venue.price} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">/ day</span>
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            <div className="flex justify-center pb-12 pt-4">
              <button className="rounded-lg border border-slate-300 px-6 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800">
                Load more venues
              </button>
            </div>
          </div>
        </div>

        <div className="relative z-0 hidden h-full bg-slate-200 dark:bg-slate-800 lg:block lg:w-[45%] xl:w-1/2">
          <div
            className="h-full w-full bg-cover bg-center opacity-80 dark:opacity-60"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBMlh04O2tU0VYB0tXBPmYC_OKj3DHhigsmnTwMeM6NSNb3aJdk50BaYJyqR_I0PLzqHdbTrVfnp84WekwTDOYGp7at7twcvgBckySwnqmI3gw_l2m1XdAiEbyVnqxsMCaC1HyHWOL_6FAZLYiuzcJKjFFgW4bwWNcoVy94-7yUKB0yiVxHhSjozykreQiWgUAYe3J1b4We5QVlFQL0nAPLOMbrq8WRS3gxl7TDbD_bJTB4Ns9wbfP1wpJohYOtD_RhCWkQvWCHSZ0')",
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-200/20 to-transparent" />

          <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
            <button className="flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-white shadow-lg transition-transform hover:scale-105">
              <span className="material-symbols-outlined text-[18px]">map</span>
              <span>Search this area</span>
            </button>
          </div>

          {pins.map((pin) => (
            <div key={`${pin.top}-${pin.left}`} className="absolute z-10" style={{ top: pin.top, left: pin.left, transform: "translate(-50%, -50%)" }}>
              <div className="relative flex flex-col items-center">
                <div
                  className={`rounded-full px-3 py-1.5 text-sm font-bold shadow-lg ${
                    pin.active
                      ? "scale-110 bg-primary text-white ring-4 ring-white/30 dark:ring-black/20"
                      : "border border-slate-200 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  }`}
                >
                  {pin.label}
                </div>
                <div
                  className={`mt-[-2px] h-0 w-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent ${
                    pin.active ? "border-t-primary" : "border-t-white dark:border-t-slate-800"
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}