import { useState } from 'react';
import { toMarkdown, filenameFor, toJiraCsv } from '../utils/exportResult';

function download(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke on the next tick so the download has started.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export default function ExportBar({ mode, result }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!result) return null;

  async function handleCopy() {
    const md = toMarkdown(mode, result);
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setFailed(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied (insecure context, permissions).
      // Fall back to a download so the analysis is never trapped on screen.
      setFailed(true);
      download(`${filenameFor(mode, result)}.md`, md, 'text/markdown');
      setTimeout(() => setFailed(false), 3000);
    }
  }

  const btn =
    'text-xs px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-800';

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-xs text-gray-400 mr-1">Export</span>
      <button type="button" onClick={handleCopy} className={btn}>
        {copied ? 'Copied' : failed ? 'Downloaded instead' : 'Copy as Markdown'}
      </button>
      <button
        type="button"
        onClick={() => download(`${filenameFor(mode, result)}.md`, toMarkdown(mode, result), 'text/markdown')}
        className={btn}
      >
        Download .md
      </button>
      <button
        type="button"
        onClick={() =>
          download(
            `${filenameFor(mode, result)}.json`,
            JSON.stringify(result, null, 2),
            'application/json',
          )
        }
        className={btn}
      >
        Download .json
      </button>
      {mode === 'translator' && result.jiraTickets?.length > 0 && (
        <button
          type="button"
          onClick={() =>
            download(`${filenameFor(mode, result)}-jira.csv`, toJiraCsv(result.jiraTickets), 'text/csv')
          }
          className={btn}
        >
          Jira CSV ({result.jiraTickets.length})
        </button>
      )}
      <button type="button" onClick={() => window.print()} className={btn}>
        Print / PDF
      </button>
    </div>
  );
}
