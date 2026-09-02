import SiteHeader from "@/components/SiteHeader";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="px-[6vw] sm:px-[8vw] py-16 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/mascot/not-found.png"
          alt=""
          className="w-64 sm:w-80 mx-auto mb-4"
        />
        <h1 className="font-display text-2xl text-char mb-2">Couldn't find that page</h1>
        <p className="text-smoke mb-6">Might've been moved, or the link's just wrong.</p>
        <a href="/" className="bg-chili text-paper rounded-full px-5 py-2.5 text-sm font-medium">
          Back to MASH
        </a>
      </main>
    </>
  );
}
