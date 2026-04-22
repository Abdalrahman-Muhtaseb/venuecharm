import Link from "next/link";

const featuredVenues = [
  {
    name: "The Industrial Loft",
    location: "Brooklyn, NY • Up to 50 Guests",
    price: "$150/hr",
    rating: "4.9",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAfYcf002C5VyzJkeYd90p3fafbX3wwEItqCAjZvsualt4qahoXxA3i1Sbs0BSLGDyfcZUVwmdQeOa5yo1bpBSiL-h2KnrIuA1eBLrK1kTGfRgwXzxUlf6bYoaCZGwAgOh6U_RQo1f4vlIzzNc7wdtrjBvSjOEgCPlKvbyuepzx2nvHovuQfvTkA9-Lt_4wMQEq1yx6HJSv7RtffocmeQfCHc86K7YVzGcj90UTl--EfzeKWJdkbbkz1D4YIKJFs5OyQkeA44ldMzk",
  },
  {
    name: "Sunny Garden Oasis",
    location: "Los Angeles, CA • Up to 100 Guests",
    price: "$200/hr",
    rating: "4.8",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBn6gvcZtFBOK2UZmutevG4KAt_e1IFaoLmKm5Fa1eO6c59lxewqSPW0H7LJPdxuZPv5bighuVuUHuo9zVsZkCtGAqoRkk0THsQxI2rTvLP8WF6QCuSZmB1nEdDalLraLFka59QiJMSaE9N29o_xxt86x-jnv9sI7Pb6xP1kXwDtlNWuajgMAB8WPV-rchimOgMejiEf4H5tdatYaubCrXIieWQiL0_ld6ZMLz5tcRb1C-6zHHu7a0b8wGZsrzuAuDgBw6jlqUdhTI",
  },
  {
    name: "Downtown Studio",
    location: "Austin, TX • Up to 20 Guests",
    price: "$90/hr",
    rating: "5.0",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAlZaxc06RQajhA68SvkgnyUuUDRiBuusFRbRsnV4koMRi4_LkuU3ZDuf7g570n3FxdSXHT4SaZFOb3eIr6oWgxhMr7ZOy5PsCXuRk9rtNXrn0yMyIg5pNTjDNQpo-BWBmxAQhvxv_Idic5CGOEDfYDnNOAV1UiFrvsOrMEmasoGfEVI4LbugvF80BDNGYaRT-SvtVm9NysK0aBBZH8PemnKBnpuWEEoTfsNNZvryb_4qlnjpBQ2EGDS_EezT7Wv4RvQMXVlq9Wvig",
  },
  {
    name: "Skyline Rooftop",
    location: "Chicago, IL • Up to 150 Guests",
    price: "$300/hr",
    rating: "4.7",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBCW7A5yJQTdOu0YuHLU6DDBG8XlhGqlEbOjlNrAZBJY993foSHhSvNIL0WJskNkreQH3vUbZzMNV0AeotxwB2QQY4xbE99bpK0VZR4BpogEvnEBb_eulSBk-X46vCJHYuYMvCZyojyYiocRW-Y8M1hj-7yPa0GwS7Cr21AJXAJrctB4BXYkTd4lzdwLoJE0k-qBnliU6gQbqRlYY4cpcoaJnpRLTRYV4jcxRdViwMQPX_xQfYL_CnYAviFONlHm4gLPm7Ycjsb2hQ",
  },
];

const filterChips = [
  { icon: "business_center", label: "Offsites", active: true },
  { icon: "favorite", label: "Weddings", active: false },
  { icon: "camera_alt", label: "Studios", active: false },
  { icon: "celebration", label: "Parties", active: false },
  { icon: "groups", label: "Meetings", active: false },
  { icon: "movie", label: "Production", active: false },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background-light font-display text-[#111718] dark:bg-background-dark dark:text-white">
      <header className="sticky top-0 z-50 w-full border-b border-[#f0f4f4] bg-white/80 backdrop-blur-md dark:border-white/10 dark:bg-background-dark/90">
        <div className="mx-auto flex w-full max-w-360 items-center justify-between px-4 py-4 md:px-10">
          <Link href="/" className="flex items-center gap-2 text-[#111718] dark:text-white">
            <span className="material-symbols-outlined text-3xl text-primary">diamond</span>
            <span className="text-xl font-bold tracking-tight">VenueCharm</span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <div className="flex items-center gap-6">
              <Link href="/host-management" className="text-sm font-medium transition-colors hover:text-primary">
                List your space
              </Link>
              <Link href="/search" className="text-sm font-medium transition-colors hover:text-primary">
                Login
              </Link>
            </div>
            <Link
              href="/search"
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-background-dark shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
            >
              Sign Up
            </Link>
          </div>
          <button className="text-[#111718] dark:text-white md:hidden">
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
      </header>

      <main className="grow">
        <section className="relative mx-auto w-full max-w-360 px-4 pb-16 pt-12 md:px-10 lg:px-20">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div className="flex max-w-2xl flex-col gap-8">
              <div className="space-y-4">
                <h1 className="text-4xl font-black leading-[1.1] tracking-tight md:text-5xl lg:text-6xl">
                  Find the perfect space for your next story.
                </h1>
                <h2 className="max-w-lg text-lg font-normal leading-relaxed text-gray-600 dark:text-gray-300 md:text-xl">
                  Intelligent sourcing for offsites, weddings, and productions. Book unique venues in seconds.
                </h2>
              </div>

              <div className="w-full rounded-2xl border border-gray-100 bg-white p-3 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:border-white/5 dark:bg-[#1a2c2e]">
                <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/10 md:flex-row md:divide-x md:divide-y-0">
                  {[
                    ["Where", "City or Zip"],
                    ["When", "Add dates"],
                    ["Who", "Add guests"],
                    ["Budget", "Any"],
                  ].map(([label, placeholder]) => (
                    <div
                      key={label}
                      className="group flex-1 cursor-pointer rounded-lg px-4 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
                    >
                      <label className="mb-1 block text-xs font-bold text-gray-500 dark:text-gray-400">{label}</label>
                      <input
                        className="w-full cursor-pointer border-none bg-transparent p-0 text-sm font-medium text-[#111718] placeholder:text-gray-400 focus:ring-0 dark:text-white"
                        placeholder={placeholder}
                        type="text"
                      />
                    </div>
                  ))}
                  <div className="flex items-center justify-between gap-2 px-2 py-2 md:pl-4 md:flex-[1.2]">
                    <Link
                      href="/search"
                      className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary font-bold text-background-dark shadow-md transition-all hover:bg-primary/90 md:h-12 md:w-auto md:px-6"
                    >
                      <span className="material-symbols-outlined md:hidden">search</span>
                      <span className="hidden whitespace-nowrap md:inline">Search</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative hidden h-100 w-full grid-cols-12 grid-rows-6 gap-4 md:grid md:h-125">
              <div className="group relative col-span-7 row-span-6 overflow-hidden rounded-2xl bg-gray-200 shadow-lg">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{
                    backgroundImage:
                      "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAo43wOZKilQKr_Zil_MVadPN281cnv5gC73x36ThME15CoUWGt3Tof2Zl_YhNmwNgQvjbUmZkBznX-Mp-_Cgw7FyC-q3uAA6-Un4V5G02f1AdqVlytVZRKbJ5jgETw2KObchqnbt9oER4tgVi1WDGQggXAHs_3mNCBnMmB9b7wkNzF_MVzfbPIZJwLXAEkcaG240cq8yptJFI_94ZS10M-uXWEN71PRgVgoOesOmS2wM3ivGyIQF18Fp5kciZxOiK2CPzANz4xQjk')",
                  }}
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="text-lg font-bold">The Glass Atrium</p>
                  <div className="flex items-center gap-1 text-xs text-white/90">
                    <span className="material-symbols-outlined text-[14px]">star</span> 4.9 (120 reviews)
                  </div>
                </div>
              </div>
              <div className="group relative col-span-5 row-span-3 overflow-hidden rounded-2xl bg-gray-200 shadow-md">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{
                    backgroundImage:
                      "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC3g3cHmfjxlPFj7dJEQSx6RjS4XjG52VJIB0sahLFnphMf7jcFQggy0JTz4aQkNg7yVGIikAiRBnTPEky0ZKmlKxX9-eiA-7U5S89Np97jAT8B7nlulgDLIfs2pTF410EeaKSRl3YiKethNR7c6geeAxqxupXQHw3MnLA05RzHUGUqYcsa4KCC1-2v_NhkqmLMeqyEgcLtpXRvFtUVH_Aq2OMg2khFiPtxgINMHnrMbOuTVE2QPKQPPMdaBUoj-pYQmAJzKyOIxZc')",
                  }}
                />
              </div>
              <div className="group relative col-span-5 row-span-3 overflow-hidden rounded-2xl bg-gray-200 shadow-md">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{
                    backgroundImage:
                      "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC5lerjQrq1Vm4jzM24IlhZ_r0jB9g3rltrzeud2FMET59NTSxWsZ30N8sY06IS1JAas5y1-UOxt5yBIo7umWW2-XzKiI_RkLsrx9CmeMSXo4gxqr3_Rppp1cC01TO1_94q3XUa3oC4aldIG13s4fJQk6MBRE-_CnkmjyJKp2aG65ObU6p30ySERf9cAJJ7oGBfYWIk9DJZ-bTXMwJQgjdQ_GDbVwgcSliSuvO7cxqnaBWmv5TR7oeScbMFKXZ16K7CkMJuuyT_oHA')",
                  }}
                />
              </div>
              <div className="absolute -bottom-6 -left-6 hidden items-center gap-3 rounded-xl bg-white p-4 shadow-xl dark:bg-[#1a2c2e] lg:flex" style={{ animationDuration: "3s" }}>
                <div className="rounded-full bg-primary/20 p-2 text-primary">
                  <span className="material-symbols-outlined">celebration</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Just booked</p>
                  <p className="text-sm font-bold">Rooftop Garden, NYC</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#f0f4f4] bg-white dark:border-white/5 dark:bg-background-dark">
          <div className="mx-auto max-w-360 px-4 py-4 md:px-10">
            <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
              {filterChips.map(({ icon, label, active }) => (
                <button
                  key={label}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium transition-all active:scale-95 ${
                    active
                      ? "bg-primary text-background-dark shadow-sm"
                      : "border border-gray-200 bg-white text-[#111718] hover:border-primary/50 hover:shadow-sm dark:border-white/10 dark:bg-[#1a2c2e] dark:text-white"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-360 px-4 py-16 md:px-10">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Featured Venues</h2>
            <div className="flex gap-2">
              <button className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-[#111718] transition-colors hover:bg-gray-50 dark:border-white/10 dark:text-white dark:hover:bg-white/5">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-[#111718] transition-colors hover:bg-gray-50 dark:border-white/10 dark:text-white dark:hover:bg-white/5">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>

          <div className="no-scrollbar -mx-4 flex gap-6 overflow-x-auto px-4 pb-4 md:mx-0 md:px-0">
            {featuredVenues.map((venue) => (
              <Link key={venue.name} href="/venue" className="group min-w-70 flex-1 cursor-pointer md:min-w-[320px]">
                <div className="relative mb-4 aspect-4/3 overflow-hidden rounded-xl">
                  <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-xs font-bold dark:bg-black/60 backdrop-blur-sm">
                    <span className="material-symbols-outlined text-[14px] text-primary">star</span> {venue.rating}
                  </div>
                  <div className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110" style={{ backgroundImage: `url('${venue.image}')` }} />
                  <button className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-400 opacity-0 shadow-sm transition-all duration-300 hover:bg-red-50 hover:text-red-500 group-hover:translate-y-0 group-hover:opacity-100">
                    <span className="material-symbols-outlined text-[18px]">favorite</span>
                  </button>
                </div>
                <div>
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-bold text-[#111718] transition-colors group-hover:text-primary dark:text-white">{venue.name}</h3>
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary dark:text-primary-dark">{venue.price}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{venue.location}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
