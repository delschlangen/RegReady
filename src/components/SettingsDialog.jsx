import { useState, useEffect, useRef } from 'react';
import {
  getApiKey,
  getPassphrase,
  setApiKey,
  setPassphrase,
  clearCredentials,
  maskKey,
  looksLikeAnthropicKey,
} from '../utils/credentials';

export default function SettingsDialog({ open, onClose, onSaved }) {
  const [key, setKey] = useState('');
  const [pass, setPass] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [storageBlocked, setStorageBlocked] = useState(false);
  const firstField = useRef(null);

  useEffect(() => {
    if (!open) return;
    setKey(getApiKey());
    setPass(getPassphrase());
    setSaved(false);
    setShowKey(false);
    const t = setTimeout(() => firstField.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const keyLooksWrong = key.trim() && !looksLikeAnthropicKey(key);

  function handleSave() {
    const okKey = setApiKey(key);
    const okPass = setPassphrase(pass);
    if (!okKey || !okPass) {
      setStorageBlocked(true);
      return;
    }
    setStorageBlocked(false);
    setSaved(true);
    onSaved?.();
    setTimeout(() => onClose(), 600);
  }

  function handleClear() {
    clearCredentials();
    setKey('');
    setPass('');
    setSaved(false);
    onSaved?.();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/40 p-4 overflow-y-auto"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-xl w-full max-w-lg my-8"
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <h2 id="settings-title" className="text-sm font-semibold text-gray-800">
            API access
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="text-gray-400 hover:text-gray-700 text-lg leading-none cursor-pointer px-1"
          >
            &times;
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          <p className="text-sm text-gray-600">
            The Regulatory Radar is free to browse and needs no key. The Translator,
            Risk Scorer and SAIF Mapper each run a Claude model, so they need an
            Anthropic API key — yours.
          </p>

          <div>
            <label htmlFor="anthropic-key" className="block text-xs font-medium text-gray-700 mb-1">
              Your Anthropic API key
            </label>
            <div className="flex gap-2">
              <input
                id="anthropic-key"
                ref={firstField}
                type={showKey ? 'text' : 'password'}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="sk-ant-..."
                autoComplete="off"
                spellCheck={false}
                className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="text-xs px-3 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 cursor-pointer shrink-0"
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
            {keyLooksWrong && (
              <p className="text-xs text-amber-700 mt-1">
                Anthropic keys start with <code>sk-ant-</code>. Double-check this one.
              </p>
            )}
            {!key && (
              <p className="text-xs text-gray-400 mt-1">
                Get one at{' '}
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1a73e8] hover:underline"
                >
                  console.anthropic.com
                </a>
                .
              </p>
            )}
          </div>

          {/* The honest part. A visitor is pasting a live credential into a
              stranger's site; they are owed the specifics before they do. */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-700 mb-1">What happens to your key</p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>
                It is stored in <strong>this browser only</strong> (localStorage) — never on a
                server, never in a database.
              </li>
              <li>
                Each analysis sends it over HTTPS to this site&apos;s own API route, which
                forwards the request to Anthropic and returns the result. It is
                <strong> not logged and not retained</strong> after the request.
              </li>
              <li>
                It pays for your own usage. Typical analysis: a few cents.
              </li>
              <li>
                If you would rather not paste a key into someone else&apos;s site —
                a fair instinct —{' '}
                <a
                  href="https://github.com/delschlangen/regready"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1a73e8] hover:underline"
                >
                  run it yourself
                </a>
                , or revoke the key in the Anthropic console when you are done.
              </li>
            </ul>
          </div>

          <details className="group">
            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 select-none">
              I&apos;m the owner of this deployment
            </summary>
            <div className="mt-2">
              <label htmlFor="owner-pass" className="block text-xs font-medium text-gray-700 mb-1">
                Owner passphrase
              </label>
              <input
                id="owner-pass"
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="Runs on the deployment's own key"
                autoComplete="off"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1">
                Takes priority over a key above. Nothing to enter here unless you deployed this.
              </p>
            </div>
          </details>

          {storageBlocked && (
            <p className="text-xs text-[#d93025]">
              This browser is blocking local storage, so nothing could be saved. Private
              browsing usually causes this.
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-gray-500 hover:text-[#d93025] cursor-pointer"
          >
            Clear from this browser
          </button>
          <div className="flex items-center gap-3">
            {getApiKey() && !saved && (
              <span className="text-xs text-gray-400 font-mono">{maskKey(getApiKey())}</span>
            )}
            <button
              type="button"
              onClick={handleSave}
              className="text-sm px-4 py-1.5 bg-[#1a73e8] text-white font-medium rounded-lg hover:bg-[#1557b0] transition-colors cursor-pointer"
            >
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
