'use client';

import React, { useState, useEffect } from 'react';
import { useCRM } from '@/lib/store';
import { Modal } from '../ui/Modal';
import { IconCheck, IconBuildingSkyscraper, IconColorPicker, IconTrash } from '@tabler/icons-react';

const PRESET_COLORS = [
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Teal', hex: '#14b8a6' },
];

export function EditSpaceModal() {
  const {
    editingSpace,
    setEditingSpace,
    updateIndustrySpace,
    deleteIndustrySpace,
  } = useCRM();

  const [spaceName, setSpaceName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#10b981');

  useEffect(() => {
    if (editingSpace) {
      setSpaceName(editingSpace.name);
      setSelectedColor(editingSpace.color || '#10b981');
    }
  }, [editingSpace]);

  if (!editingSpace) return null;

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spaceName.trim()) return;

    updateIndustrySpace(editingSpace.id, {
      name: spaceName.trim(),
      color: selectedColor,
    });
    setEditingSpace(null);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete the "${editingSpace.name}" space?`)) {
      deleteIndustrySpace(editingSpace.id);
      setEditingSpace(null);
    }
  };

  return (
    <Modal
      isOpen={Boolean(editingSpace)}
      onClose={() => setEditingSpace(null)}
      title="Edit Industry Space"
      subtitle={`Configure name & accent color for "${editingSpace.name}"`}
      maxWidth="max-w-[440px]"
    >
      <form onSubmit={handleUpdate} className="space-y-3.5 text-[11.5px]">
        {/* Space Name Input */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider block">
            Space Display Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              required
              autoFocus
              value={spaceName}
              onChange={(e) => setSpaceName(e.target.value)}
              placeholder="e.g. Real Estate & Properties"
              className="w-full h-[30px] pl-7 pr-2 text-[12px] bg-[var(--t-background-secondary)] hover:bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)] focus:border-[var(--t-border-color-focus)] rounded-[4px] outline-none text-[var(--t-font-color-primary)] font-medium"
            />
            <IconBuildingSkyscraper size={14} className="absolute left-2 top-2 text-[var(--t-font-color-tertiary)] pointer-events-none" />
          </div>
        </div>

        {/* Color Palette & Custom Color Picker */}
        <div className="space-y-2 p-3 rounded-[6px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)]">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider">
              Badge Accent Color
            </label>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--t-font-color-secondary)]">
              <span
                className="w-3 h-3 rounded-full border border-white/20"
                style={{ backgroundColor: selectedColor }}
              />
              <span>{selectedColor.toUpperCase()}</span>
            </div>
          </div>

          {/* Preset Swatches */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {PRESET_COLORS.map((c) => {
              const isSelected = selectedColor.toLowerCase() === c.hex.toLowerCase();
              return (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setSelectedColor(c.hex)}
                  className={`w-[22px] h-[22px] rounded-full transition-transform flex items-center justify-center cursor-pointer ${
                    isSelected ? 'ring-2 ring-offset-2 ring-[#5d4ef7] scale-110' : 'opacity-80 hover:opacity-100 hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              );
            })}

            {/* Custom Color Picker Button */}
            <label
              className="w-[22px] h-[22px] rounded-full border border-[var(--t-border-color-medium)] hover:border-[var(--t-border-color-strong)] flex items-center justify-center cursor-pointer relative bg-gradient-to-tr from-pink-500 via-purple-500 to-cyan-400 opacity-90 hover:opacity-100"
              title="Open full color picker wheel"
            >
              <input
                type="color"
                value={selectedColor.startsWith('#') ? selectedColor : '#10b981'}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
              />
              <IconColorPicker size={11} className="text-white drop-shadow pointer-events-none" />
            </label>
          </div>

          {/* Custom Hex Code Input */}
          <div className="flex items-center gap-2 pt-1 border-t border-[var(--t-border-color-light)]">
            <span className="text-[11px] text-[var(--t-font-color-tertiary)]">Custom Hex:</span>
            <input
              type="text"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              placeholder="#5d4ef7"
              className="w-[90px] h-[22px] px-1.5 font-mono text-[11px] bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)] rounded-[3px] outline-none text-[var(--t-font-color-primary)]"
            />
            {/* Live Badge Preview */}
            <div className="ml-auto flex items-center gap-1.5">
              <span className="text-[10px] text-[var(--t-font-color-tertiary)]">Preview:</span>
              <span
                className="px-2 py-0.5 rounded-[3px] text-[10.5px] font-medium border"
                style={{
                  backgroundColor: `${selectedColor}15`,
                  borderColor: `${selectedColor}40`,
                  color: selectedColor,
                }}
              >
                {spaceName || 'Space Preview'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--t-border-color-light)]">
          {editingSpace.id !== 'all' ? (
            <button
              type="button"
              onClick={handleDelete}
              className="h-[26px] px-2 rounded-[4px] text-[11px] font-medium text-rose-400 hover:bg-rose-500/10 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <IconTrash size={12} />
              <span>Delete Space</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setEditingSpace(null)}
              className="h-[26px] px-2.5 rounded-[4px] text-[11px] font-medium text-[var(--t-font-color-secondary)] hover:bg-[var(--t-background-secondary)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-[26px] px-3 rounded-[4px] bg-[var(--t-btn-primary-bg)] text-[var(--t-btn-primary-text)] hover:opacity-90 text-[11px] font-medium flex items-center gap-1.5 transition-opacity cursor-pointer shadow-2xs"
            >
              <IconCheck size={12} />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
