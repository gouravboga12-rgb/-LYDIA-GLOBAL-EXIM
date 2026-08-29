import React, { useState, useEffect, useRef } from 'react';

export default function AddressAutocomplete({ value, onChange, onSelect }) {
  const [inputVal, setInputVal] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [apiError, setApiError] = useState(false); // true when quota/API fails
  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  const debounceTimer = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (window.google?.maps?.places) {
      try {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
        placesService.current = new window.google.maps.places.PlacesService(document.createElement('div'));
      } catch (err) {
        setApiError(true);
      }
    } else {
      setApiError(true);
    }
  }, []);

  useEffect(() => {
    setInputVal(value || '');
  }, [value]);

  useEffect(() => {
    const handler = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) setSuggestions([]); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleInput = (e) => {
    const v = e.target.value;
    setInputVal(v);
    onChange(v);
    if (apiError) return;
    clearTimeout(debounceTimer.current);
    if (!v.trim() || !autocompleteService.current) { setSuggestions([]); return; }
    debounceTimer.current = setTimeout(() => {
      autocompleteService.current.getPlacePredictions({ input: v }, (results, status) => {
        const PS = window.google.maps.places.PlacesServiceStatus;
        if (status === PS.OK) {
          setSuggestions(results);
        } else {
          setSuggestions([]);
          if (status === PS.OVER_QUERY_LIMIT || status === PS.REQUEST_DENIED || status === 'UNKNOWN_ERROR') {
            setApiError(true);
          }
        }
      });
    }, 300);
  };

  const handleSelect = (suggestion) => {
    setSuggestions([]);
    placesService.current.getDetails(
      { placeId: suggestion.place_id, fields: ['address_components'] },
      (place, status) => {
        const PS = window.google.maps.places.PlacesServiceStatus;
        if (status !== PS.OK) {
          const line1 = suggestion.structured_formatting.main_text;
          setInputVal(line1);
          onChange(line1);
          if (status === PS.OVER_QUERY_LIMIT || status === PS.REQUEST_DENIED) setApiError(true);
          return;
        }
        const components = place.address_components || [];
        const get = (type) => components.find(c => c.types.includes(type))?.long_name || '';
        const line1 = `${get('street_number')} ${get('route')}`.trim() || get('premise') || get('sublocality_level_1') || suggestion.structured_formatting.main_text;
        setInputVal(line1);
        onChange(line1);
        onSelect({
          line1,
          city: get('locality') || get('administrative_area_level_2') || get('postal_town'),
          state: get('administrative_area_level_1'),
          pincode: get('postal_code'),
          country: get('country'),
        });
      }
    );
  };

  return (
    <div className="relative" ref={containerRef}>
      {apiError ? (
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span className="text-xs font-semibold">Address lookup unavailable. Please type your address manually.</span>
          </div>
          <input
            type="text"
            value={inputVal}
            onChange={handleInput}
            className="w-full text-sm border border-[#2A0845]/15 rounded-xl px-3 py-2 bg-[#FAF6F0] text-[#2A0845] focus:outline-none focus:border-[#2A0845]/30 transition-colors"
            placeholder="Address Line 1"
          />
        </div>
      ) : (
        <>
          <div className="relative">
            <input
              type="text"
              value={inputVal}
              onChange={handleInput}
              autoComplete="off"
              className="w-full text-sm border border-[#2A0845]/15 rounded-xl px-3 py-2 bg-[#FAF6F0] text-[#2A0845] focus:outline-none focus:border-[#2A0845]/30 transition-colors"
              placeholder="Start typing your address..."
            />
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden max-h-60 overflow-y-auto">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.place_id}
                    onClick={(e) => { e.preventDefault(); handleSelect(suggestion); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#FAF6F0] focus:bg-[#FAF6F0] focus:outline-none transition-colors border-b border-gray-50 last:border-0 flex items-start gap-3"
                  >
                    <svg className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{suggestion.structured_formatting.main_text}</p>
                      <p className="text-xs text-gray-500">{suggestion.structured_formatting.secondary_text}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
