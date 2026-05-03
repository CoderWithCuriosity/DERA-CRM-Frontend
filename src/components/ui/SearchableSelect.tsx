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
                <label className="block text-[11px] font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1">
                    {label}
                    {required && <span className="text-[var(--danger)] ml-1">*</span>}
                </label>
            )}

            <div className="relative">
                <button
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    className={cn(
                        'w-full h-8 px-3 bg-[var(--bg-base)] border rounded-[var(--radius-md)]',
                        'focus:outline-none focus:ring-2 transition-all duration-[120ms]',
                        'text-left flex items-center justify-between',
                        error
                            ? 'border-[var(--danger)] focus:ring-[var(--danger)]'
                            : 'border-[var(--border-default)] hover:border-[var(--border-strong)] focus:border-[var(--border-focus)] focus:ring-[var(--border-focus)] focus:ring-opacity-20',
                        disabled && 'opacity-50 cursor-not-allowed',
                        className
                    )}
                    disabled={disabled}
                >
                    {selectedOption ? (
                        <div className="flex items-center space-x-2">
                            {selectedOption.avatar ? (
                                <img src={selectedOption.avatar} alt="" className="w-5 h-5 rounded-full" />
                            ) : selectedOption.initials ? (
                                <div className="w-5 h-5 rounded-full bg-[var(--accent-subtle)] flex items-center justify-center text-[10px] font-medium text-[var(--accent-text)]">
                                    {selectedOption.initials}
                                </div>
                            ) : null}
                            <span className="text-[13px] text-[var(--text-primary)]">{selectedOption.label}</span>
                            {selectedOption.sublabel && (
                                <span className="text-[11px] text-[var(--text-tertiary)]">{selectedOption.sublabel}</span>
                            )}
                        </div>
                    ) : (
                        <span className="text-[13px] text-[var(--text-tertiary)]">{placeholder}</span>
                    )}
                    <ChevronDown size={14} className={cn('text-[var(--text-tertiary)] transition-transform', isOpen && 'transform rotate-180')} />
                </button>

                {isOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-[var(--radius-lg)] shadow-lg overflow-hidden">
                        <div className="p-2 border-b border-[var(--border-default)]">
                            <div className="relative">
                                <Search size={13} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-tertiary)]" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type to search..."
                                    className="w-full pl-9 pr-8 py-1.5 text-[13px] border border-[var(--border-default)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] bg-[var(--bg-base)] text-[var(--text-primary)]"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                        </div>

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
                                            'px-3 py-2 cursor-pointer hover:bg-[var(--bg-subtle)] transition-colors',
                                            option.value === value && 'bg-[var(--accent-subtle)] text-[var(--accent-text)]',
                                            highlightedIndex === index && 'bg-[var(--bg-subtle)]'
                                        )}
                                    >
                                        <div className="flex items-center space-x-2">
                                            {option.avatar ? (
                                                <img src={option.avatar} alt="" className="w-6 h-6 rounded-full" />
                                            ) : option.initials ? (
                                                <div className="w-6 h-6 rounded-full bg-[var(--accent-subtle)] flex items-center justify-center text-[10px] font-medium text-[var(--accent-text)]">
                                                    {option.initials}
                                                </div>
                                            ) : null}
                                            <div>
                                                <div className="text-[13px] font-medium text-[var(--text-primary)]">
                                                    {option.label}
                                                </div>
                                                {option.sublabel && (
                                                    <div className="text-[11px] text-[var(--text-tertiary)]">{option.sublabel}</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="px-3 py-3 text-[13px] text-[var(--text-tertiary)] text-center">
                                    No results found
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <p className="mt-1 text-[11px] text-[var(--danger-text)]">{error}</p>
            )}
        </div>
    );
};