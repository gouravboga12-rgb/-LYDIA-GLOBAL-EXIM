import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Package, ShieldCheck, Box, Globe, Info } from "lucide-react";

export function ShippoConfigModal({ order, onClose, onSubmit }) {
  const parseJ = (v) => {
    try { return typeof v === 'string' ? JSON.parse(v) : (v || []); } catch(e) { return []; }
  };
  const parseO = (v) => {
    try { return typeof v === 'string' ? JSON.parse(v) : (v || {}); } catch(e) { return {}; }
  };

  const items = parseJ(order.items);
  const address = parseO(order.address);

  // Determine default box size and weight in grams based on total quantity
  const totalQty = items.reduce((sum, item) => sum + (item.qty || 1), 0);
  
  const initialBoxPreset = totalQty > 4 ? "8x8x1" : "6x4x1";
  const initialLength = totalQty > 4 ? "8" : "6";
  const initialWidth = totalQty > 4 ? "8" : "4";
  const initialWeight = totalQty > 4 ? "125" : "75";
  
  const [boxPreset, setBoxPreset] = useState(initialBoxPreset);
  const [length, setLength] = useState(initialLength);
  const [width, setWidth] = useState(initialWidth);
  const [height, setHeight] = useState("1");
  const [weight, setWeight] = useState(initialWeight);

  const [signatureRequired, setSignatureRequired] = useState(!!address.signature_required);
  const [insuranceRequested, setInsuranceRequested] = useState(!!address.insurance_requested);
  const [insuranceAmount, setInsuranceAmount] = useState(address.insurance_amount ? String(address.insurance_amount) : "");

  // International Check
  const isInternational = address.country && address.country.toLowerCase() !== "united states" && address.country.toLowerCase() !== "us";
  
  const [customsDescription, setCustomsDescription] = useState("Fashion Jewelry");
  const [customsQuantity, setCustomsQuantity] = useState(String(totalQty));
  const [customsUnitWeight, setCustomsUnitWeight] = useState(String((parseFloat(initialWeight) / (totalQty || 1)).toFixed(1)));
  const [customsUnitValue, setCustomsUnitValue] = useState("");
  const [customsOrigin, setCustomsOrigin] = useState("United States of America");
  const [customsHarmonizationCode, setCustomsHarmonizationCode] = useState("711719");

  const handleBoxChange = (e) => {
    const val = e.target.value;
    setBoxPreset(val);
    if (val === "6x4x1") { setLength("6"); setWidth("4"); setHeight("1"); setWeight("75"); }
    else if (val === "8x8x1") { setLength("8"); setWidth("8"); setHeight("1"); setWeight("125"); }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isInternational && (!customsUnitValue || parseFloat(customsUnitValue) <= 0)) {
      alert("Please enter a valid Customs Unit Value in USD for international shipments.");
      return;
    }
    onSubmit({
      box: boxPreset === "custom" ? { length, width, height } : boxPreset,
      customBox: { length, width, height },
      weight,
      signatureRequired,
      insuranceRequested,
      insuranceAmount: insuranceRequested ? (parseFloat(insuranceAmount) || 0) : 0,
      customs: isInternational ? {
        description: customsDescription,
        quantity: parseInt(customsQuantity) || 1,
        unitWeight: parseFloat(customsUnitWeight) || 1,
        unitValue: parseFloat(customsUnitValue) || 1,
        countryOfOrigin: customsOrigin,
        harmonizationCode: customsHarmonizationCode
      } : null
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]"
        >
          <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50 shrink-0">
            <div>
              <h2 className="text-xl font-bold text-[#45055B]">Configure Shippo Label</h2>
              <p className="text-xs text-gray-500 mt-1">Order #{order.order_number} • {address.name}</p>
            </div>
            <button type="button" onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
            {/* Package Dimensions */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <Box className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="font-bold text-[#45055B] text-sm">Package Dimensions & Weight</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Box Size</label>
                  <select value={boxPreset} onChange={handleBoxChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#D4AF37]">
                    <option value="6x4x1">6 x 4 x 1 (Standard)</option>
                    <option value="8x8x1">8 x 8 x 1 (Medium)</option>
                    <option value="custom">Custom Size</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Total Weight (g)</label>
                  <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#D4AF37]" required />
                </div>
              </div>

              {boxPreset === "custom" && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">Length (in)</label>
                    <input type="number" step="0.1" value={length} onChange={e => setLength(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">Width (in)</label>
                    <input type="number" step="0.1" value={width} onChange={e => setWidth(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">Height (in)</label>
                    <input type="number" step="0.1" value={height} onChange={e => setHeight(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm" required />
                  </div>
                </div>
              )}
            </div>

            {/* Extra Services */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="font-bold text-[#45055B] text-sm">Extra Services</h3>
              </div>
              
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={signatureRequired} onChange={e => setSignatureRequired(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#45055B] rounded" />
                <div>
                  <span className="text-sm font-bold text-gray-800">Signature Confirmation</span>
                  <p className="text-[10px] text-gray-500">Require a signature upon delivery.</p>
                </div>
              </label>

              <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={insuranceRequested} onChange={e => setInsuranceRequested(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#45055B] rounded" />
                  <div>
                    <span className="text-sm font-bold text-gray-800">Shipping Insurance</span>
                  </div>
                </label>
                
                {insuranceRequested && (
                  <div className="mt-2 ml-7">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Declared Value for Insurance (USD)</label>
                    <input type="number" min="0" step="0.01" value={insuranceAmount} onChange={e => setInsuranceAmount(e.target.value)} placeholder="0.00" className="w-full sm:w-1/2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#D4AF37]" required />
                  </div>
                )}
              </div>
            </div>

            {/* Customs Declaration (International Only) */}
            {isInternational && (
              <div className="space-y-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2 border-b border-blue-200 pb-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-[#45055B] text-sm">Customs Declaration (International)</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Description</label>
                    <input type="text" value={customsDescription} onChange={e => setCustomsDescription(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-400" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Quantity</label>
                    <input type="number" value={customsQuantity} onChange={e => setCustomsQuantity(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-400" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Unit Weight (oz)</label>
                    <input type="number" step="0.1" value={customsUnitWeight} onChange={e => setCustomsUnitWeight(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-400" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Unit Value (USD) *</label>
                    <input type="number" step="0.01" value={customsUnitValue} onChange={e => setCustomsUnitValue(e.target.value)} placeholder="e.g. 50.00" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Country of Origin</label>
                    <input type="text" value={customsOrigin} onChange={e => setCustomsOrigin(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-400" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Harmonization Code</label>
                    <input type="text" value={customsHarmonizationCode} onChange={e => setCustomsHarmonizationCode(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-400" required />
                  </div>
                </div>
              </div>
            )}
            
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100 shrink-0">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                Cancel
              </button>
              <button type="submit" className="px-6 py-2 bg-[#45055B] text-[#D4AF37] font-bold text-sm rounded-lg hover:bg-[#06122a] transition-all shadow-md">
                Fetch Rates
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
