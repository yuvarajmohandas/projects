import type { Address } from '../../../types';

interface AddressSectionProps {
  addresses: Address[];
  addressId: string;
  setAddressId: (id: string) => void;
  showNewAddress: boolean;
  setShowNewAddress: (show: boolean) => void;
  newAddress: { label: string; street: string; houseNumber: string; postalCode: string; city: string };
  setNewAddress: (addr: any) => void;
}

export function AddressSection({
  addresses,
  addressId,
  setAddressId,
  showNewAddress,
  setShowNewAddress,
  newAddress,
  setNewAddress,
}: AddressSectionProps) {
  return (
    <section className="space-y-3 bg-gray-50/50 border border-gray-100 rounded-2xl p-4">
      <h3 className="text-sm font-black uppercase tracking-wider text-gray-500">Delivery Destination</h3>
      
      {addresses.length > 0 && !showNewAddress && (
        <div className="space-y-2">
          {addresses.map((a) => (
            <label key={a.id} className={`flex items-center gap-3 text-sm border rounded-xl p-3 cursor-pointer transition-colors bg-white ${addressId === a.id ? 'border-bb-green bg-bb-green-light/20' : 'border-gray-200'}`}>
              <input
                type="radio"
                name="address"
                checked={addressId === a.id}
                onChange={() => setAddressId(a.id)}
                className="text-bb-green focus:ring-bb-green"
              />
              <span className="font-medium text-gray-800">
                <strong className="text-xs uppercase font-black bg-gray-100 px-1.5 py-0.5 rounded mr-1.5 text-gray-500">{a.label}</strong> 
                {a.street} {a.houseNumber}, {a.postalCode} {a.city}
              </span>
            </label>
          ))}
          <button type="button" onClick={() => setShowNewAddress(true)} className="text-bb-green-darker text-xs font-black hover:underline pt-1 block">
            + Ship to a different address
          </button>
        </div>
      )}

      {(showNewAddress || addresses.length === 0) && (
        <div className="grid grid-cols-2 gap-3 bg-white border border-gray-100 rounded-xl p-4 shadow-inner">
          <div className="col-span-2">
            <input
              placeholder="Address Tag Label (e.g. Office, Vacation Home)"
              value={newAddress.label}
              onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bb-green"
            />
          </div>
          <input
            placeholder="Street Name"
            required
            value={newAddress.street}
            onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bb-green"
          />
          <input
            placeholder="House / Box Number"
            required
            value={newAddress.houseNumber}
            onChange={(e) => setNewAddress({ ...newAddress, houseNumber: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bb-green"
          />
          <input
            placeholder="Postal Code"
            required
            value={newAddress.postalCode}
            onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bb-green"
          />
          <input
            placeholder="City"
            required
            value={newAddress.city}
            onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bb-green"
          />
          {addresses.length > 0 && (
            <button type="button" onClick={() => setShowNewAddress(false)} className="text-gray-500 hover:text-gray-700 text-xs font-bold col-span-2 text-left mt-1">
              ← Back to saved profiles
            </button>
          )}
        </div>
      )}
    </section>
  );
}
