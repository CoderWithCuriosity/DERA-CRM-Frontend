import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface Option {
    value: string | number;
    label: string;
    sublabel?: string;
    avatar?: string;
    initials?: string;
}

export interface SearchableSelectProps {
    label?: string;
    error?: string;
    value?: string | number;
    onChange: (value: string | number) => void;
    options: Option[];
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    className?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
    label,
    error,
    value,
    onChange,
    options,
    placeholder = 'Search...',
    disabled = false,
    required = false,
    className,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const optionsRef = useRef<(HTMLDivElement | null)[]>([]);

    const selectedOption = options.find(opt => opt.value === value);

    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (option.sublabel?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
            setHighlightedIndex(-1);
        }
    }, [isOpen]);

    useEffect(() => {
        if (highlightedIndex >= 0 && optionsRef.current[highlightedIndex]) {
            optionsRef.current[highlightedIndex]?.scrollIntoView({
                block: 'nearest',
                behavior: 'smooth',
            });
        }
    }, [highlightedIndex]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < filteredOptions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
                    onChange(filteredOptions[highlightedIndex].value);
                    setIsOpen(false);
                    setSearchTerm('');
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setSearchTerm('');
                break;
            case 'Tab':
                setIsOpen(false);
                setSearchTerm('');
                break;
        }
    };

    return (
        <div className="w-full" ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium text-deep-ink mb-1">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <div className="relative">
                {/* Select Button */}
                <button
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    className={cn(
                        'w-full px-4 py-2 bg-white/70 backdrop-blur-sm border rounded-xl',
                        'focus:outline-none focus:ring-2 transition-all duration-200',
                        'text-left flex items-center justify-between',
                        error
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                            : 'border-blue-100 focus:ring-primary-500 focus:border-primary-500',
                        disabled && 'opacity-50 cursor-not-allowed',
                        className
                    )}
                    disabled={disabled}
                >
                    {selectedOption ? (
                        <div className="flex items-center space-x-2">
                            {selectedOption.avatar ? (
                                <img src={selectedOption.avatar} alt="" className="w-6 h-6 rounded-full" />
                            ) : selectedOption.initials ? (
                                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                                    {selectedOption.initials}
                                </div>
                            ) : null}
                            <span>{selectedOption.label}</span>
                            {selectedOption.sublabel && (
                                <span className="text-sm text-gray-500">{selectedOption.sublabel}</span>
                            )}
                        </div>
                    ) : (
                        <span className="text-gray-400">{placeholder}</span>
                    )}
                    <ChevronDown size={18} className={cn('text-gray-400 transition-transform', isOpen && 'transform rotate-180')} />
                </button>

                {/* Dropdown */}
                {isOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                        {/* Search Input */}
                        <div className="p-2 border-b border-gray-100">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type to search..."
                                    className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Options */}
                        <div className="max-h-60 overflow-y-auto">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((option, index) => (
                                    <div
                                        key={option.value}
                                        ref={(el) => {
                                            optionsRef.current[index] = el;
                                        }}
                                        onClick={() => {
                                            onChange(option.value);
                                            setIsOpen(false);
                                            setSearchTerm('');
                                        }}
                                        className={cn(
                                            'px-4 py-2 cursor-pointer hover:bg-primary-50 transition-colors',
                                            option.value === value && 'bg-primary-50 text-primary-700',
                                            highlightedIndex === index && 'bg-primary-50'
                                        )}
                                    >
                                        <div className="flex items-center space-x-2">
                                            {option.avatar ? (
                                                <img src={option.avatar} alt="" className="w-6 h-6 rounded-full" />
                                            ) : option.initials ? (
                                                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                                                    {option.initials}
                                                </div>
                                            ) : null}
                                            <div>
                                                <div className="text-sm font-medium text-deep-ink">
                                                    {option.label}
                                                </div>
                                                {option.sublabel && (
                                                    <div className="text-xs text-gray-500">{option.sublabel}</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                    No results found
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
        </div>
    );
};