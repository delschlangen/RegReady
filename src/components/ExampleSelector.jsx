export default function ExampleSelector({ examples, onSelect }) {
  return (
    <div className="flex justify-end mb-2">
      <select
        onChange={(e) => {
          const idx = parseInt(e.target.value, 10);
          if (!isNaN(idx)) onSelect(examples[idx].text);
          e.target.value = '';
        }}
        defaultValue=""
        className="text-sm border border-gray-300 rounded-md px-3 py-1.5 text-gray-600 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-transparent"
      >
        <option value="" disabled>Load Example</option>
        {examples.map((ex, i) => (
          <option key={i} value={i}>{ex.label}</option>
        ))}
      </select>
    </div>
  );
}
