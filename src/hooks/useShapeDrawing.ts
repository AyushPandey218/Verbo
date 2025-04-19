
import { useState } from 'react';

// Define the Shape type to include all shapes we want to support
export type Shape = 'rectangle' | 'circle' | 'triangle' | 'line';

export const useShapeDrawing = () => {
  const [selectedShape, setSelectedShape] = useState<Shape | null>(null);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);

  const drawShape = (
    ctx: CanvasRenderingContext2D,
    start: { x: number; y: number },
    end: { x: number; y: number },
    shape: Shape,
    color: string
  ) => {
    ctx.beginPath();
    ctx.strokeStyle = color;

    switch (shape) {
      case 'rectangle':
        const width = end.x - start.x;
        const height = end.y - start.y;
        ctx.strokeRect(start.x, start.y, width, height);
        break;
      case 'circle':
        const radius = Math.sqrt(
          Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
        );
        ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
        break;
      case 'triangle':
        ctx.moveTo(start.x, end.y);
        ctx.lineTo(start.x + (end.x - start.x) / 2, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.closePath();
        ctx.stroke();
        break;
      case 'line':
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        break;
    }
  };

  return {
    selectedShape,
    setSelectedShape,
    startPoint,
    setStartPoint,
    drawShape,
  };
};
