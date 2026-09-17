/**
 * Shown when an analysis needs a key the visitor has not supplied. This is the
 * moment a cold visitor discovers the tool is not free to run, so it explains
 * rather than scolds, and points at the parts that cost nothing.
 */
export default function CredentialsPrompt({ code, message, onOpenSettings }) {
  const wrongCredential = code === 'bad_passphrase' || code === 'key_rejected' || code === 'malformed_key';

  return (
    <div className="bg-[#e8f0fe] border border-blue-200 rounded-lg p-5">
      <p className="text-sm font-medium text-gray-800">
        {wrongCredential ? 'That credential was not accepted' : 'This analysis needs an Anthropic API key'}
      </p>
      <p className="text-sm text-gray-600 mt-1">
        {message ||
          'The Translator, Risk Scorer and SAIF Mapper each run a Claude model, so they run on your own Anthropic key.'}
      </p>

      {!wrongCredential && (
        <p className="text-sm text-gray-600 mt-2">
          The <strong>Regulatory Radar</strong> is free to browse and needs no key — curated
          regulatory milestones with sources, and the last 30 days of US federal activity.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 mt-4">
        <button
          type="button"
          onClick={onOpenSettings}
          className="text-sm px-4 py-1.5 bg-[#1a73e8] text-white font-medium rounded-lg hover:bg-[#1557b0] transition-colors cursor-pointer"
        >
          {wrongCredential ? 'Update key' : 'Add your key'}
        </button>
        <a
          href="https://console.anthropic.com/settings/keys"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#1a73e8] hover:underline"
        >
          Get an Anthropic key
        </a>
        <a
          href="https://github.com/delschlangen/regready"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-500 hover:text-gray-700 hover:underline"
        >
          Or run it yourself
        </a>
      </div>
    </div>
  );
}
