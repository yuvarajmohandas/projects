interface FulfillmentSectionProps {
  fulfillmentType: 'DELIVERY' | 'PICKUP';
  setFulfillmentType: (type: 'DELIVERY' | 'PICKUP') => void;
  slotLabel: string;
  setSlotLabel: (slot: string) => void;
  slots: string[];
}

export function FulfillmentSection({
  fulfillmentType,
  setFulfillmentType,
  slotLabel,
  setSlotLabel,
  slots,
}: FulfillmentSectionProps) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-black uppercase tracking-wider text-gray-500">Fulfillment Preference</h3>
      <div className="flex gap-3">
        {(['DELIVERY', 'PICKUP'] as const).map((type) => (
          <button
            type="button"
            key={type}
            onClick={() => setFulfillmentType(type)}
            className={`px-5 py-2 rounded-full text-xs font-black border transition-all ${
              fulfillmentType === type
                ? 'bg-bb-green text-white border-bb-green shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-bb-green shadow-sm'
            }`}
          >
            {type === 'DELIVERY' ? '🚚 Home Delivery' : '🏬 Warehouse Pickup'}
          </button>
        ))}
      </div>
      
      <div>
        <label className="block text-[11px] font-bold text-gray-400 mb-1">Select Available Time Slot</label>
        <select
          value={slotLabel}
          onChange={(e) => setSlotLabel(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-bb-green"
        >
          {slots.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
    </section>
  );
}
