// =============================================================================
// components/ui/EditableCell.tsx
// =============================================================================
// PURPOSE: A table cell that switches between display mode and edit mode.
// When the user clicks it, it becomes an input field.
// When they press Enter or click away, it validates and saves the value.
//
// WHY: Manual allocation requires editing the "Allocated Qty" column inline
// in the table. This pattern (click to edit) is common in data management UIs.
//
// HOW IT WORKS:
//   1. Default state: shows the value as text with a subtle edit hint
//   2. When clicked: shows an <input> field pre-filled with the current value
//   3. On Enter or blur: calls the onSave callback with the new number
//   4. If onSave returns an error string, displays it in red
//   5. On Escape: cancels editing without saving
// =============================================================================

import React, { useState, useRef, useEffect } from 'react';

interface EditableCellProps {
  value: number;
  maxValue: number;      // Can't exceed this (the requested quantity)
  onSave: (newValue: number) => string | null; // Returns error or null
  disabled?: boolean;
}

export const EditableCell: React.FC<EditableCellProps> = ({
  value,
  maxValue,
  onSave,
  disabled = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(String(value));
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // When entering edit mode, auto-focus the input
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select(); // Select all text for easy replacement
    }
  }, [isEditing]);

  // Reset input value when the external value changes (e.g. after auto-allocate)
  useEffect(() => {
    if (!isEditing) {
      setInputValue(String(value));
    }
  }, [value, isEditing]);

  const handleClick = () => {
    if (disabled) return;
    setIsEditing(true);
    setInputValue(String(value));
    setError(null);
  };

  const handleSave = () => {
    const parsed = parseFloat(inputValue);

    // Basic validation before calling onSave
    if (isNaN(parsed)) {
      setError('Must be a number');
      return;
    }

    const errorMsg = onSave(parsed);
    if (errorMsg) {
      setError(errorMsg);
      return;
    }

    // Success
    setIsEditing(false);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setInputValue(String(value));
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter')  handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  // ─── Edit Mode ───────────────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <div className="flex flex-col gap-1 min-w-[100px]">
        <input
          ref={inputRef}
          type="number"
          min="0"
          max={maxValue}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className={`
            w-full px-2 py-1 text-sm border rounded
            focus:outline-none focus:ring-2 focus:ring-blue-500
            ${error ? 'border-red-400' : 'border-blue-400'}
          `}
        />
        {error && (
          <span className="text-xs text-red-500 leading-tight">{error}</span>
        )}
        <div className="flex gap-1 text-xs text-slate-400">
          <span>↵ save</span>
          <span>·</span>
          <span>Esc cancel</span>
        </div>
      </div>
    );
  }

  // ─── Display Mode ────────────────────────────────────────────────────────────
  return (
    <div
      onClick={handleClick}
      className={`
        group flex items-center gap-1.5 
        ${disabled ? 'cursor-default' : 'cursor-pointer'}
      `}
      title={disabled ? undefined : 'Click to edit'}
    >
      <span className={`
        text-sm font-medium
        ${value === 0 ? 'text-slate-400' : 'text-slate-800'}
      `}>
        {value.toFixed(2)}
      </span>
      {!disabled && (
        <span className="
          text-xs text-slate-300 opacity-0 group-hover:opacity-100
          transition-opacity duration-150
        ">
          ✏
        </span>
      )}
    </div>
  );
};
