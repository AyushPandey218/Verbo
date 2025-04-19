
import React from 'react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Input } from './ui/input';

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

const EnhancedColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor,
  onColorChange,
}) => {
  const colors = [
    '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff',
    '#c0c0c0', '#808080', '#800000', '#808000', '#008000', '#800080', '#008080', '#000080',
    '#ff8080', '#80ff80', '#8080ff', '#ffff80', '#80ffff', '#ff80ff', '#ff8040', '#40ff80',
    '#8040ff', '#ffff40', '#40ffff', '#ff40ff', '#804000', '#008040', '#400080', '#804000'
  ];

  return (
    <Popover>
      <PopoverTrigger>
        <Button variant="outline" size="icon" className="h-8 w-8">
          <div
            className="w-4 h-4 rounded-full border border-gray-300"
            style={{ backgroundColor: selectedColor }}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-2">
          <div className="grid grid-cols-8 gap-1">
            {colors.map((color) => (
              <Button
                key={color}
                size="sm"
                className="w-6 h-6 p-0"
                style={{ backgroundColor: color }}
                onClick={() => onColorChange(color)}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              type="color"
              value={selectedColor}
              onChange={(e) => onColorChange(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EnhancedColorPicker;
