// src/components/bangalore-buddy/AddressAutocompleteInput.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface AddressAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const AddressAutocompleteInput: React.FC<AddressAutocompleteInputProps> = ({
  value,
  onChange,
  placeholder = "Enter an address",
}) => {
  const placesLib = useMapsLibrary('places');
  const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [inputValue, setInputValue] = useState(value);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (placesLib && !autocompleteService) {
      setAutocompleteService(new placesLib.AutocompleteService());
    }
  }, [placesLib, autocompleteService]);

  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const fetchSuggestions = (currentInput: string) => {
    if (autocompleteService && currentInput.length > 2) {
      autocompleteService.getPlacePredictions(
        {
          input: currentInput,
          componentRestrictions: { country: 'in' }, // Restrict to India for Bangalore Buddy
          // Optional: Add bounds for Bangalore for more relevant suggestions
          // bounds: new google.maps.LatLngBounds(
          //   new google.maps.LatLng(12.834, 77.466), // SW corner
          //   new google.maps.LatLng(13.145, 77.769)  // NE corner
          // ),
          // strictBounds: false, // Allow results outside bounds but rank them lower
        },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions);
            if (predictions.length > 0) setIsPopoverOpen(true); else setIsPopoverOpen(false);
          } else {
            setSuggestions([]);
            setIsPopoverOpen(false);
          }
        }
      );
    } else {
      setSuggestions([]);
      setIsPopoverOpen(false);
    }
  };

  const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const debounced = (...args: Parameters<F>) => {
      if (timeout !== null) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => func(...args), waitFor);
    };
    return debounced as (...args: Parameters<F>) => void;
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFetchSuggestions = useCallback(debounce(fetchSuggestions, 400), [autocompleteService]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInputValue = e.target.value;
    setInputValue(newInputValue);
    onChange(newInputValue); // Update react-hook-form state immediately
    debouncedFetchSuggestions(newInputValue);
  };

  const handleSuggestionClick = (suggestion: google.maps.places.AutocompletePrediction) => {
    const newAddress = suggestion.description;
    setInputValue(newAddress);
    onChange(newAddress);
    setSuggestions([]);
    setIsPopoverOpen(false);
    // Consider whether to focus inputRef.current?.focus();
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={() => {
            // Delay closing to allow click on suggestion.
            // onMouseDown on list items should handle clicks before blur.
            setTimeout(() => {
               // if the popover is still open and the input value does not match any suggestion, close it
              if (isPopoverOpen && !suggestions.find(s => s.description === inputRef.current?.value)) {
                // setIsPopoverOpen(false); // This might be too aggressive.
              }
            }, 150);
          }}
          onFocus={() => {
            if (inputValue.length > 2 && suggestions.length > 0) {
              setIsPopoverOpen(true);
            } else if (inputValue.length > 2) {
              fetchSuggestions(inputValue); // Fetch suggestions if input has text on focus
            }
          }}
          autoComplete="off" // Prevent browser's own autocomplete
        />
      </PopoverTrigger>
      {suggestions.length > 0 && isPopoverOpen && (
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          onOpenAutoFocus={(e) => e.preventDefault()} // Prevent focus stealing from input
        >
          <ul className="max-h-60 overflow-y-auto py-1 rounded-md shadow-md">
            {suggestions.map((suggestion) => (
              <li
                key={suggestion.place_id}
                className="px-3 py-2 text-sm hover:bg-accent cursor-pointer"
                onMouseDown={() => handleSuggestionClick(suggestion)} // Use onMouseDown
              >
                {suggestion.description}
              </li>
            ))}
          </ul>
        </PopoverContent>
      )}
    </Popover>
  );
};

export default AddressAutocompleteInput;