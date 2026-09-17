export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">RegReady</h1>
            <p className="text-lg text-gray-600 mt-1">AI Compliance Architecture Tool</p>
            <p className="text-sm text-gray-500 mt-2 max-w-2xl">
              Paste a regulation or describe an AI feature. Get a risk classification,
              multi-jurisdiction exposure, engineering requirements and ready-to-file
              tickets — in seconds instead of a legal review cycle.
            </p>
          </div>
          <a
            href="https://github.com/delschlangen/regready"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
          >
            Source on GitHub
          </a>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Covers the EU AI Act, DSA, US state AI law, NIST AI RMF, ISO/IEC 42005 and
          Google&apos;s SAIF. AI-generated analysis — not legal advice.
        </p>
      </div>
    </header>
  );
}
