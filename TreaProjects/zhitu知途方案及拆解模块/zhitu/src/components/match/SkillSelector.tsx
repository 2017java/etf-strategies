'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SkillSelectorProps {
  presets: string[];
  selectedSkills: string[];
  onSkillsChange: (skills: string[]) => void;
  customPlaceholder?: string;
}

export default function SkillSelector({
  presets,
  selectedSkills,
  onSkillsChange,
  customPlaceholder = '添加自定义技能',
}: SkillSelectorProps) {
  const [customInput, setCustomInput] = useState('');

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      onSkillsChange(selectedSkills.filter((s) => s !== skill));
    } else {
      onSkillsChange([...selectedSkills, skill]);
    }
  };

  const addCustomSkill = () => {
    const trimmed = customInput.trim();
    if (trimmed && !selectedSkills.includes(trimmed)) {
      onSkillsChange([...selectedSkills, trimmed]);
      setCustomInput('');
    }
  };

  const removeSkill = (skill: string) => {
    onSkillsChange(selectedSkills.filter((s) => s !== skill));
  };

  return (
    <div className="space-y-4">
      {/* Selected skills */}
      <AnimatePresence>
        {selectedSkills.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-wrap gap-2"
          >
            {selectedSkills.map((skill) => (
              <motion.span
                key={skill}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="inline-flex items-center gap-1 px-3 py-1 bg-terracotta/10 text-terracotta text-sm rounded-full"
              >
                {skill}
                <button
                  onClick={() => removeSkill(skill)}
                  className="hover:text-error-crimson transition-colors"
                >
                  <X size={12} />
                </button>
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preset skills grid */}
      <div className="flex flex-wrap gap-2">
        {presets.map((skill) => {
          const isSelected = selectedSkills.includes(skill);
          return (
            <button
              key={skill}
              onClick={() => toggleSkill(skill)}
              className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                isSelected
                  ? 'bg-terracotta text-ivory'
                  : 'bg-parchment text-olive-gray hover:bg-warm-sand'
              }`}
            >
              {skill}
            </button>
          );
        })}
      </div>

      {/* Custom skill input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addCustomSkill()}
          placeholder={customPlaceholder}
          className="flex-1 px-3 py-2 text-sm bg-parchment border border-border-warm rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta/30"
        />
        <button
          onClick={addCustomSkill}
          disabled={!customInput.trim()}
          className="px-3 py-2 bg-terracotta text-ivory rounded-lg hover:bg-coral disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
