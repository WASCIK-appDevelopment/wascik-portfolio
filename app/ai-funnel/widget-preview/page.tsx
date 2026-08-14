import RepresentativeWidget from "../RepresentativeWidget";

export default function WidgetPreviewPage() {
  return (
    <main className="min-h-screen bg-[#06101c] text-white">
      <section className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
        <p className="text-xs font-black uppercase tracking-[.28em] text-cyan-300">WASCIK AI Representative Preview</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight sm:text-6xl">Standing assistant + speech-bubble test page</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">Use this isolated page to test the representative before it is mounted on the live portfolio or affiliate pages. Resize the browser or open it on your iPhone to check spacing, bubble placement, typing, and response behavior.</p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <article className="rounded-3xl border border-cyan-400/20 bg-cyan-400/[.05] p-7">
            <p className="text-sm font-black uppercase tracking-[.2em] text-cyan-300">Service-page simulation</p>
            <h2 className="mt-3 text-2xl font-black">Website visitor</h2>
            <p className="mt-4 leading-7 text-slate-300">Try asking questions such as “What kind of website can WASCIK build?” or “Can you help me start a project?” The representative should use the general assistant endpoint.</p>
          </article>

          <article className="rounded-3xl border border-violet-400/20 bg-violet-400/[.05] p-7">
            <p className="text-sm font-black uppercase tracking-[.2em] text-violet-300">Visual QA</p>
            <h2 className="mt-3 text-2xl font-black">What to inspect</h2>
            <ul className="mt-4 grid gap-2 leading-7 text-slate-300">
              <li>• Representative does not cover important page content.</li>
              <li>• Speech bubble fits on a narrow phone screen.</li>
              <li>• Input and send button remain easy to tap.</li>
              <li>• Bubble can collapse and reopen cleanly.</li>
              <li>• Text remains readable while scrolling.</li>
            </ul>
          </article>
        </div>

        <div className="mt-10 rounded-3xl border border-white/10 bg-white/[.03] p-7">
          <h2 className="text-2xl font-black">Affiliate-mode test</h2>
          <p className="mt-3 max-w-3xl leading-7 text-slate-300">The widget automatically switches to shopping-guide mode based on pathname. Once we mount the same component on an affiliate route, it will call the shopping endpoint instead of the general assistant endpoint.</p>
        </div>
      </section>

      <RepresentativeWidget
        title="WASCIK Digital Representative"
        greeting="Hi! I’m the WASCIK digital representative. Ask me anything about what we can build for you."
      />
    </main>
  );
}
