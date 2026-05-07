import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { CURRENCIES } from '../utils/currencies';

const CurrencySelect = ({ value, onChange, disabled, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const selectedCurrency = CURRENCIES.find(c => c.code === value) || CURRENCIES.find(c => c.code === 'USD');

  const filteredCurrencies = CURRENCIES.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (code) => {
    onChange(code);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-10 border border-[#E4E4E0] rounded-[5px] px-3 flex items-center justify-between bg-white transition-all ${
          disabled ? 'cursor-default bg-[#FAFAF8]' : 'hover:border-[#95BF47] focus:border-[#95BF47] cursor-pointer'
        } ${isOpen ? 'border-[#95BF47] ring-2 ring-[#95BF47]/10' : ''}`}
      >
        <span className="text-[13px] font-bold text-[#0C0E10] truncate">
          {selectedCurrency.name} ({selectedCurrency.code}, {selectedCurrency.symbol})
        </span>
        {!disabled && <ChevronDown size={16} className={`text-[#6B7280] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-[#E4E4E0] rounded-[5px] shadow-xl z-[60] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="p-2 border-b border-[#F4F4F1] sticky top-0 bg-white">
            <div className="relative flex items-center bg-[#FAFAF8] border border-[#E4E4E0] rounded-[4px] h-9 px-2 focus-within:bg-white focus-within:border-[#95BF47] transition-all">
              <Search size={14} className="text-[#6B7280] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search currency..."
                className="w-full bg-transparent border-none outline-none pl-2 text-[13px] font-medium text-[#0C0E10] placeholder:text-[#9CA3AF]"
              />
            </div>
          </div>
          
          <div className="max-h-[250px] overflow-y-auto py-1 custom-scrollbar">
            {filteredCurrencies.length > 0 ? (
              filteredCurrencies.map((curr) => (
                <button
                  key={curr.code}
                  type="button"
                  onClick={() => handleSelect(curr.code)}
                  className={`w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-[#F3F8E8] transition-colors group ${
                    value === curr.code ? 'bg-[#F3F8E8]' : ''
                  }`}
                >
                  <div className="flex flex-col">
                    <span className={`text-[13px] ${value === curr.code ? 'font-bold text-[#0C0E10]' : 'font-medium text-[#4B5563]'}`}>
                      {curr.name}
                    </span>
                    <span className="text-[11px] text-[#9CA3AF] font-bold uppercase tracking-wider">
                      {curr.code} • {curr.symbol}
                    </span>
                  </div>
                  {value === curr.code && <Check size={14} className="text-[#95BF47]" />}
                </button>
              ))
            ) : (
              <div className="px-4 py-6 text-center">
                <p className="text-[13px] text-[#9CA3AF] font-medium">No currencies found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencySelect;
