import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { 
  Download, 
  Eraser, 
  PenTool, 
  Save, 
  Trash2, 
  Share2, 
  Users,
  Undo,
  Redo,
  Image as ImageIcon,
  SeparatorHorizontal,
  PaintBucket,
  Type,
  Plus,
  Minus,
  LayoutTemplate,
  Square,
  Circle as CircleIcon,
  Triangle,
  Minus as LineIcon // Using Minus icon for Line since LineSegment doesn't exist
} from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import WhiteboardTemplates from './WhiteboardTemplates';
import { User } from '@/utils/types';
import StickerPicker from './StickerPicker';
import EnhancedColorPicker from './EnhancedColorPicker';
import { useShapeDrawing, Shape } from '../hooks/useShapeDrawing';

interface WhiteboardProps {
  roomId: string;
  userId: string;
  onClose: () => void;
  onDrawingUpdate: (data: any) => void;
  drawingData?: string;
  onSaveDrawing?: (imageUrl: string) => void;
  onlineUsers: User[];
}

interface Point {
  x: number;
  y: number;
}

interface DrawingData {
  points: Point[];
  color: string;
  size: number;
  tool: 'pen' | 'eraser';
}

const Whiteboard: React.FC<WhiteboardProps> = ({ 
  roomId, 
  userId, 
  onClose, 
  onDrawingUpdate, 
  drawingData, 
  onSaveDrawing,
  onlineUsers
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [selectedSize, setSelectedSize] = useState(5);
  const [selectedTool, setSelectedTool] = useState<'pen' | 'eraser'>('pen');
  const [showToolbar, setShowToolbar] = useState(true);
  const [drawingHistory, setDrawingHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [scale, setScale] = useState(1);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isStickerPickerOpen, setIsStickerPickerOpen] = useState(false);
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const [isBrushActive, setIsBrushActive] = useState(false);
  const [isTextToolActive, setIsTextToolActive] = useState(false);
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState(20);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [isFillActive, setIsFillActive] = useState(false);
  const [fillColor, setFillColor] = useState('#FFFFFF');
  const [isBackgroundColorActive, setIsBackgroundColorActive] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [isBackgroundImageActive, setIsBackgroundImageActive] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [isImageToolActive, setIsImageToolActive] = useState(false);
  const [imageURL, setImageURL] = useState<string | null>(null);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 100, height: 100 });
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [isGridVisible, setIsGridVisible] = useState(false);
  const [gridSize, setGridSize] = useState(50);
  const [isObjectSnappingActive, setIsObjectSnappingActive] = useState(false);
  const [objectSnapThreshold, setObjectSnapThreshold] = useState(10);
  const [isRulerVisible, setIsRulerVisible] = useState(false);
  const [rulerOrientation, setRulerOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [rulerPosition, setRulerPosition] = useState(50);
  const [isEraserActive, setIsEraserActive] = useState(false);
  const [eraserSize, setEraserSize] = useState(20);
  // Remove redundant shape state variables since we're using the hook
  const [shapeStartPoint, setShapeStartPoint] = useState<Point | null>(null);
  const [isLineToolActive, setIsLineToolActive] = useState(false);
  const [lineStartPoint, setLineStartPoint] = useState<Point | null>(null);
  const [isArrowToolActive, setIsArrowToolActive] = useState(false);
  const [arrowStartPoint, setArrowStartPoint] = useState<Point | null>(null);
  const [isZoomToolActive, setIsZoomToolActive] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isMirrorToolActive, setIsMirrorToolActive] = useState(false);
  const [mirrorOrientation, setMirrorOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [mirrorLinePosition, setMirrorLinePosition] = useState(50);
  const [isCropToolActive, setIsCropToolActive] = useState(false);
  const [cropStartPoint, setCropStartPoint] = useState<Point | null>(null);
  const [cropEndPoint, setCropEndPoint] = useState<Point | null>(null);
  const [isRotateToolActive, setIsRotateToolActive] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [isSkewToolActive, setIsSkewToolActive] = useState(false);
  const [skewX, setSkewX] = useState(0);
  const [skewY, setSkewY] = useState(0);
  const [isPerspectiveToolActive, setIsPerspectiveToolActive] = useState(false);
  const [perspectivePoints, setPerspectivePoints] = useState<Point[]>([
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
  ]);
  const [isBlurToolActive, setIsBlurToolActive] = useState(false);
  const [blurRadius, setBlurRadius] = useState(5);
  const [isSharpenToolActive, setIsSharpenToolActive] = useState(false);
  const [sharpenAmount, setSharpenAmount] = useState(5);
  const [isDodgeToolActive, setIsDodgeToolActive] = useState(false);
  const [dodgeAmount, setDodgeAmount] = useState(5);
  const [isBurnToolActive, setIsBurnToolActive] = useState(false);
  const [burnAmount, setBurnAmount] = useState(5);
  const [isSpongeToolActive, setIsSpongeToolActive] = useState(false);
  const [spongeAmount, setSpongeAmount] = useState(5);
  const [isCloneToolActive, setIsCloneToolActive] = useState(false);
  const [cloneSourcePoint, setCloneSourcePoint] = useState<Point | null>(null);
  const [cloneDestinationPoint, setCloneDestinationPoint] = useState<Point | null>(null);
  const [isSmudgeToolActive, setIsSmudgeToolActive] = useState(false);
  const [smudgeAmount, setSmudgeAmount] = useState(5);
  
  const [isTextAlignmentActive, setIsTextAlignmentActive] = useState(false);
  const [textAlignment, setTextAlignment] = useState<'left' | 'center' | 'right'>('left');
  const [isTextBoldActive, setIsTextBoldActive] = useState(false);
  const [isTextItalicActive, setIsTextItalicActive] = useState(false);
  const [isTextUnderlineActive, setIsTextUnderlineActive] = useState(false);
  const [isTextStrikethroughActive, setIsTextStrikethroughActive] = useState(false);
  const [isTextShadowActive, setIsTextShadowActive] = useState(false);
  const [textShadowColor, setTextShadowColor] = useState('#000000');
  const [textShadowOffset, setTextShadowOffset] = useState({ x: 2, y: 2 });
  const [textShadowBlur, setTextShadowBlur] = useState(3);
  const [isTextOutlineActive, setIsTextOutlineActive] = useState(false);
  const [textOutlineColor, setTextOutlineColor] = useState('#000000');
  const [textOutlineWidth, setTextOutlineWidth] = useState(1);
  const [isTextGradientActive, setIsTextGradientActive] = useState(false);
  const [textGradientColors, setTextGradientColors] = useState(['#000000', '#FFFFFF']);
  const [isTextPatternActive, setIsTextPatternActive] = useState(false);
  const [textPatternURL, setTextPatternURL] = useState<string | null>(null);
  const [isTextSpacingActive, setIsTextSpacingActive] = useState(false);
  const [textLetterSpacing, setTextLetterSpacing] = useState(0);
  const [textWordSpacing, setTextWordSpacing] = useState(0);
  const [isTextKerningActive, setIsTextKerningActive] = useState(false);
  const [textKerningAmount, setTextKerningAmount] = useState(0);
  const [isTextTransformActive, setIsTextTransformActive] = useState(false);
  const [textTransform, setTextTransform] = useState<'uppercase' | 'lowercase' | 'capitalize'>('uppercase');
  const [isTextVerticalAlignmentActive, setIsTextVerticalAlignmentActive] = useState(false);
  const [textVerticalAlignment, setTextVerticalAlignment] = useState<'top' | 'middle' | 'bottom'>('top');
  const [isTextDirectionActive, setIsTextDirectionActive] = useState(false);
  const [textDirection, setTextDirection] = useState<'ltr' | 'rtl'>('ltr');
  const [isTextWritingModeActive, setIsTextWritingModeActive] = useState(false);
  const [textWritingMode, setTextWritingMode] = useState<'horizontal-tb' | 'vertical-rl' | 'vertical-lr'>('horizontal-tb');
  const [isTextOrientationActive, setIsTextOrientationActive] = useState(false);
  const [textOrientation, setTextOrientation] = useState<'mixed' | 'upright' | 'sideways'>('mixed');
  const [isTextUnicodeBidiActive, setIsTextUnicodeBidiActive] = useState(false);
  const [textUnicodeBidi, setTextUnicodeBidi] = useState<'normal' | 'embed' | 'bidi-override'>('normal');
  const [isTextRubyActive, setIsTextRubyActive] = useState(false);
  const [textRubyText, setTextRubyText] = useState('');
  const [textRubyPosition, setTextRubyPosition] = useState<'over' | 'under'>('over');
  const [isTextEmphasisActive, setIsTextEmphasisActive] = useState(false);
  const [textEmphasisStyle, setTextEmphasisStyle] = useState<'filled' | 'open' | 'dot' | 'circle' | 'double-circle' | 'triangle' | 'sesame'>('filled');
  const [textEmphasisColor, setTextEmphasisColor] = useState('#000000');
  const [isTextJustifyActive, setIsTextJustifyActive] = useState(false);
  const [textJustifyContent, setTextJustifyContent] = useState<'auto' | 'inter-word' | 'inter-character' | 'none'>('auto');
  const [isTextHyphensActive, setIsTextHyphensActive] = useState(false);
  const [textHyphens, setTextHyphens] = useState<'none' | 'manual' | 'auto'>('none');
  const [isTextOverflowActive, setIsTextOverflowActive] = useState(false);
  const [textOverflow, setTextOverflow] = useState<'clip' | 'ellipsis'>('clip');
  const [isTextWhiteSpaceActive, setIsTextWhiteSpaceActive] = useState(false);
  const [textWhiteSpace, setTextWhiteSpace] = useState<'normal' | 'nowrap' | 'pre' | 'pre-wrap' | 'pre-line'>('normal');
  const [isTextWordBreakActive, setIsTextWordBreakActive] = useState(false);
  const [textWordBreak, setTextWordBreak] = useState<'normal' | 'break-all' | 'keep-all' | 'break-word'>('normal');
  const [isTextOverflowWrapActive, setIsTextOverflowWrapActive] = useState(false);
  const [textOverflowWrap, setTextOverflowWrap] = useState<'normal' | 'break-word'>('normal');
  const [isTextTabSizeActive, setIsTextTabSizeActive] = useState(false);
  const [textTabSize, setTextTabSize] = useState(4);
  const [isTextInitialLetterActive, setIsTextInitialLetterActive] = useState(false);
  const [textInitialLetter, setTextInitialLetter] = useState({ size: 1, drop: false });
  const [isTextColumnsActive, setIsTextColumnsActive] = useState(false);
  const [textColumnCount, setTextColumnCount] = useState(1);
  const [textColumnGap, setTextColumnGap] = useState(0);
  const [isTextColumnRuleActive, setIsTextColumnRuleActive] = useState(false);
  const [textColumnRuleStyle, setTextColumnRuleStyle] = useState<'none' | 'dotted' | 'dashed' | 'solid' | 'double' | 'groove' | 'ridge' | 'inset' | 'outset'>('none');
  const [textColumnRuleWidth, setTextColumnRuleWidth] = useState(1);
  const [textColumnRuleColor, setTextColumnRuleColor] = useState('#000000');
  const [isTextBreakInsideActive, setIsTextBreakInsideActive] = useState(false);
  const [textBreakInside, setTextBreakInside] = useState<'auto' | 'avoid' | 'avoid-column' | 'avoid-page' | 'avoid-region'>('auto');
  const [isTextBoxDecorationBreakActive, setIsTextBoxDecorationBreakActive] = useState(false);
  const [textBoxDecorationBreak, setTextBoxDecorationBreak] = useState<'slice' | 'clone'>('slice');
  const [isTextLineClampActive, setIsTextLineClampActive] = useState(false);
  const [textLineClamp, setTextLineClamp] = useState(0);
  
  const [isTextTextShadowActive, setIsTextTextShadowActive] = useState(false);
  const [textTextShadowColor, setTextTextShadowColor] = useState('#000000');
  const [textTextShadowOffset, setTextTextShadowOffset] = useState({ x: 2, y: 2 });
  const [textTextShadowBlur, setTextTextShadowBlur] = useState(3);
  const [isTextTextOutlineActive, setIsTextTextOutlineActive] = useState(false);
  const [textTextOutlineColor, setTextTextOutlineColor] = useState('#000000');
  const [textTextOutlineWidth, setTextTextOutlineWidth] = useState(1);
  const [isTextTextGradientActive, setIsTextTextGradientActive] = useState(false);
  const [textTextGradientColors, setTextTextGradientColors] = useState(['#000000', '#FFFFFF']);
  const [isTextTextPatternActive, setIsTextTextPatternActive] = useState(false);
  const [textTextPatternURL, setTextTextPatternURL] = useState<string | null>(null);
  const [isTextTextSpacingActive, setIsTextTextSpacingActive] = useState(false);
  const [textTextLetterSpacing, setTextTextLetterSpacing] = useState(0);
  const [textTextWordSpacing, setTextTextWordSpacing] = useState(0);
  const [isTextTextKerningActive, setIsTextTextKerningActive] = useState(false);
  const [textTextKerningAmount, setTextTextKerningAmount] = useState(0);
  const [isTextTextTransformActive, setIsTextTextTransformActive] = useState(false);
  const [textTextTransform, setTextTextTransform] = useState<'uppercase' | 'lowercase' | 'capitalize'>('uppercase');
  const [isTextTextVerticalAlignmentActive, setIsTextTextVerticalAlignmentActive] = useState(false);
  const [textTextVerticalAlignment, setTextTextVerticalAlignment] = useState<'top' | 'middle' | 'bottom'>('top');
  const [isTextTextDirectionActive, setIsTextTextDirectionActive] = useState(false);
  const [textTextDirection, setTextTextDirection] = useState<'ltr' | 'rtl'>('ltr');
  const [isTextTextWritingModeActive, setIsTextTextWritingModeActive] = useState(false);
  const [textTextWritingMode, setTextTextWritingMode] = useState<'horizontal-tb' | 'vertical-rl' | 'vertical-lr'>('horizontal-tb');
  const [isTextTextOrientationActive, setIsTextTextOrientationActive] = useState(false);
  const [textTextOrientation, setTextTextOrientation] = useState<'mixed' | 'upright' | 'sideways'>('mixed');
  const [isTextTextUnicodeBidiActive, setIsTextTextUnicodeBidiActive] = useState(false);
  const [textTextUnicodeBidi, setTextTextUnicodeBidi] = useState<'normal' | 'embed' | 'bidi-override'>('normal');
  const [isTextTextRubyActive, setIsTextTextRubyActive] = useState(false);
  const [textTextRubyText, setTextTextRubyText] = useState('');
  const [textTextRubyPosition, setTextTextRubyPosition] = useState<'over' | 'under'>('over');
  const [isTextTextEmphasisActive, setIsTextTextEmphasisActive] = useState(false);
  const [textTextEmphasisStyle, setTextTextEmphasisStyle] = useState<'filled' | 'open' | 'dot' | 'circle' | 'double-circle' | 'triangle' | 'sesame'>('filled');
  const [textTextEmphasisColor, setTextTextEmphasisColor] = useState('#000000');
  const [isTextTextJustifyActive, setIsTextTextJustifyActive] = useState(false);
  const [textTextJustifyContent, setTextTextJustifyContent] = useState<'auto' | 'inter-word' | 'inter-character' | 'none'>('auto');
  const [isTextTextHyphensActive, setIsTextTextHyphensActive] = useState(false);
  const [textTextHyphens, setTextTextHyphens] = useState<'none' | 'manual' | 'auto'>('none');
  const [isTextTextOverflowActive, setIsTextTextOverflowActive] = useState(false);
  const [textTextOverflow, setTextTextOverflow] = useState<'clip' | 'ellipsis'>('clip');
  const [isTextTextWhiteSpaceActive, setIsTextTextWhiteSpaceActive] = useState(false);
  const [textTextWhiteSpace, setTextTextWhiteSpace] = useState<'normal' | 'nowrap' | 'pre' | 'pre-wrap' | 'pre-line'>('normal');
  const [isTextTextWordBreakActive, setIsTextTextWordBreakActive] = useState(false);
  const [textTextWordBreak, setTextTextWordBreak] = useState<'normal' | 'break-all' | 'keep-all' | 'break-word'>('normal');
  const [isTextTextOverflowWrapActive, setIsTextTextOverflowWrapActive] = useState(false);
  const [textTextOverflowWrap, setTextTextOverflowWrap] = useState<'normal' | 'break-word'>('normal');
  const [isTextTextTabSizeActive, setIsTextTextTabSizeActive] = useState(false);
  const [textTextTabSize, setTextTextTabSize] = useState(4);
  const [isTextTextInitialLetterActive, setIsTextTextInitialLetterActive] = useState(false);
  const [textTextInitialLetter, setTextTextInitialLetter] = useState({ size: 1, drop: false });
  const [isTextTextColumnsActive, setIsTextTextColumnsActive] = useState(false);
  const [textTextColumnCount, setTextTextColumnCount] = useState(1);
  const [textTextColumnGap, setTextTextColumnGap] = useState(0);
  const [isTextTextColumnRuleActive, setIsTextTextColumnRuleActive] = useState(false);
  const [textTextColumnRuleStyle, setTextTextColumnRuleStyle] = useState<'none' | 'dotted' | 'dashed' | 'solid' | 'double' | 'groove' | 'ridge' | 'inset' | 'outset'>('none');
  const [textTextColumnRuleWidth, setTextTextColumnRuleWidth] = useState(1);
  const [textTextColumnRuleColor, setTextTextColumnRuleColor] = useState('#000000');
  const [isTextTextBreakInsideActive, setIsTextTextBreakInsideActive] = useState(false);
  const [textTextBreakInside, setTextTextBreakInside] = useState<'auto' | 'avoid' | 'avoid-column' | 'avoid-page' | 'avoid-region'>('auto');
  const [isTextTextBoxDecorationBreakActive, setIsTextTextBoxDecorationBreakActive] = useState(false);
  const [textTextBoxDecorationBreak, setTextTextBoxDecorationBreak] = useState<'slice' | 'clone'>('slice');
  const [isTextTextLineClampActive, setIsTextTextLineClampActive] = useState(false);
  const [textTextLineClamp, setTextTextLineClamp] = useState(0);

  const drawingDataRef = useRef<DrawingData[]>([]);
  const onlineUsersWithoutSelf = onlineUsers.filter(u => u.id !== userId);

  // Use the shape drawing hook to get access to drawing functions
  const { selectedShape, setSelectedShape, startPoint, setStartPoint, drawShape } = useShapeDrawing();

  const debouncedOnDrawingUpdate = useCallback(
    (data: any) => {
      const delay = 200;
      let timeoutId: NodeJS.Timeout;
  
      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
  
        timeoutId = setTimeout(() => {
          onDrawingUpdate(data);
        }, delay);
      };
    },
    [onDrawingUpdate]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 800;
    canvas.height = 600;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.lineCap = 'round';
    context.strokeStyle = selectedColor;
    context.lineWidth = selectedSize;
    contextRef.current = context;

    if (drawingData) {
      loadImageFromDataUrl(drawingData);
    }
  }, [drawingData, selectedColor, selectedSize]);

  useEffect(() => {
    if (isEraserActive) {
      setSelectedTool('eraser');
    } else {
      setSelectedTool('pen');
    }
  }, [isEraserActive]);

  const startDrawing = ({ nativeEvent }: { nativeEvent: MouseEvent }) => {
    if (!contextRef.current || isTextToolActive) return;
    const { offsetX, offsetY } = nativeEvent;
    
    if (selectedShape) {
      setStartPoint({ x: offsetX, y: offsetY });
    } else {
      setIsDrawing(true);
      if (selectedTool === 'pen') {
        contextRef.current.beginPath();
        contextRef.current.moveTo(offsetX, offsetY);
      } else if (selectedTool === 'eraser') {
        contextRef.current.clearRect(offsetX - eraserSize / 2, offsetY - eraserSize / 2, eraserSize, eraserSize);
      }
    }
  };

  const draw = ({ nativeEvent }: { nativeEvent: MouseEvent }) => {
    if ((!isDrawing && !startPoint) || !contextRef.current || isTextToolActive) return;
    const { offsetX, offsetY } = nativeEvent;

    if (selectedShape && startPoint) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = contextRef.current;
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      if (drawingHistory[historyIndex]) {
        loadImageFromDataUrl(drawingHistory[historyIndex]);
      }

      drawShape(context, startPoint, { x: offsetX, y: offsetY }, selectedShape, selectedColor);
    } else if (isDrawing) {
      if (selectedTool === 'pen') {
        contextRef.current.lineTo(offsetX, offsetY);
        contextRef.current.stroke();
      } else if (selectedTool === 'eraser') {
        contextRef.current.clearRect(offsetX - eraserSize / 2, offsetY - eraserSize / 2, eraserSize, eraserSize);
      }
    }
  };

  const endDrawing = () => {
    if (!contextRef.current) return;
    
    if (selectedShape && startPoint) {
      setStartPoint(null);
      saveDrawing();
    } else {
      setIsDrawing(false);
      contextRef.current.closePath();
      saveDrawing();
    }
  };

  const changeColor = (color: string) => {
    setSelectedColor(color);
    if (contextRef.current) {
      contextRef.current.strokeStyle = color;
    }
  };

  const changeSize = (size: number) => {
    setSelectedSize(size);
    if (contextRef.current) {
      contextRef.current.lineWidth = size;
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !contextRef.current) return;
    contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
    saveDrawing();
  };

  const saveDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataURL = canvas.toDataURL('image/png');
    setDrawingHistory(prevHistory => [...prevHistory.slice(0, historyIndex + 1), dataURL]);
    setHistoryIndex(prevIndex => prevIndex + 1);
    debouncedOnDrawingUpdate(dataURL)();
  };

  const undoDrawing = () => {
    if (historyIndex <= 0) return;
    setHistoryIndex(prevIndex => prevIndex - 1);
    loadImageFromDataUrl(drawingHistory[historyIndex - 1]);
  };

  const redoDrawing = () => {
    if (historyIndex >= drawingHistory.length - 1) return;
    setHistoryIndex(prevIndex => prevIndex + 1);
    loadImageFromDataUrl(drawingHistory[historyIndex + 1]);
  };

  const loadImageFromDataUrl = (dataUrl: string) => {
    const canvas = canvasRef.current;
    if (!canvas || !contextRef.current) return;
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      contextRef.current?.clearRect(0, 0, canvas.width, canvas.height);
      contextRef.current?.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataURL = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = 'whiteboard.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !onSaveDrawing) return;
    const dataURL = canvas.toDataURL('image/png');
    onSaveDrawing(dataURL);
  };

  const handleTemplateSelect = (templateName: string, templateData: any) => {
    console.log(`Selected template: ${templateName}`, templateData);
    setIsTemplateDialogOpen(false);
    
    const canvas = canvasRef.current;
    if (!canvas || !contextRef.current) return;
    
    contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
    
    if (templateData.type === "blank") {
      // Do nothing, canvas is already cleared
    } else if (templateData.structure) {
      drawTemplateStructure(templateData.structure);
    } else if (templateData.type === "grid") {
      drawGrid(templateData.gridSize);
    }
    
    saveDrawing();
  };

  const drawTemplateStructure = (structure: any[]) => {
    if (!contextRef.current) return;
    
    structure.forEach(element => {
      const ctx = contextRef.current;
      if (!ctx) return;
      
      ctx.save();
      
      switch(element.type) {
        case "text":
          ctx.font = element.style === "heading" ? "bold 24px Arial" : 
                    element.style === "subheading" ? "bold 18px Arial" : 
                    element.style === "columnHeader" ? "bold 16px Arial" : 
                    element.style === "boxText" ? "14px Arial" : 
                    "14px Arial";
          ctx.fillStyle = "#000000";
          ctx.textAlign = "center";
          ctx.fillText(element.content, element.position.x, element.position.y);
          break;
          
        case "rectangle":
          ctx.strokeStyle = "#666666";
          ctx.lineWidth = 2;
          ctx.strokeRect(
            element.position.x - element.width/2, 
            element.position.y - element.height/2, 
            element.width, 
            element.height
          );
          break;
          
        case "circle":
          ctx.beginPath();
          ctx.strokeStyle = "#666666";
          ctx.lineWidth = 2;
          ctx.arc(element.position.x, element.position.y, element.radius, 0, Math.PI * 2);
          ctx.stroke();
          break;
          
        case "arrow":
          drawArrow(ctx, element.start, element.end);
          break;
      }
      
      ctx.restore();
    });
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, from: Point, to: Point) => {
    const headLen = 15;
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = "#666666";
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - headLen * Math.cos(angle - Math.PI / 6), to.y - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(to.x - headLen * Math.cos(angle + Math.PI / 6), to.y - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = "#666666";
    ctx.fill();
  };

  const drawGrid = (size: number) => {
    if (!contextRef.current || !canvasRef.current) return;
    
    const ctx = contextRef.current;
    const canvas = canvasRef.current;
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.beginPath();
    ctx.strokeStyle = "#dddddd";
    ctx.lineWidth = 0.5;
    
    for (let x = 0; x <= width; x += size) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    
    for (let y = 0; y <= height; y += size) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    
    ctx.stroke();
  };

  const handleStickerSelect = (stickerUrl: string) => {
    console.log("Selected sticker:", stickerUrl);
    setSelectedSticker(stickerUrl);
    setIsStickerPickerOpen(false);
    
    const canvas = canvasRef.current;
    if (!canvas || !contextRef.current) return;
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = stickerUrl;
    img.onload = () => {
      const x = (canvas.width - img.width) / 2;
      const y = (canvas.height - img.height) / 2;
      
      contextRef.current?.drawImage(img, x, y);
      saveDrawing();
    };
    img.onerror = (err) => {
      console.error("Error loading sticker:", err);
    };
  };

  const handleZoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.1, 2));
  };

  const handleZoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.1, 0.5));
  };

  const handleBrushToggle = () => {
    setIsBrushActive(!isBrushActive);
  };

  const handleTextToolToggle = () => {
    setIsTextToolActive(!isTextToolActive);
  };

  const handleFillToggle = () => {
    setIsFillActive(!isFillActive);
  };

  const handleBackgroundColorToggle = () => {
    setIsBackgroundColorActive(!isBackgroundColorActive);
  };

  const handleBackgroundImageToggle = () => {
    setIsBackgroundImageActive(!isBackgroundImageActive);
  };

  const handleImageToolToggle = () => {
    setIsImageToolActive(!isImageToolActive);
  };

  const handlePanningStart = ({ nativeEvent }: { nativeEvent: MouseEvent }) => {
    setIsPanning(true);
    setLastPanPoint({ x: nativeEvent.clientX, y: nativeEvent.clientY });
  };

  const handlePanningMove = ({ nativeEvent }: { nativeEvent: MouseEvent }) => {
    if (!isPanning) return;
    const deltaX = nativeEvent.clientX - lastPanPoint.x;
    const deltaY = nativeEvent.clientY - lastPanPoint.y;
    setPanOffset(prevOffset => ({
      x: prevOffset.x + deltaX,
      y: prevOffset.y + deltaY,
    }));
    setLastPanPoint({ x: nativeEvent.clientX, y: nativeEvent.clientY });
  };

  const handlePanningEnd = () => {
    setIsPanning(false);
  };

  const handleGridToggle = () => {
    setIsGridVisible(!isGridVisible);
  };

  const handleObjectSnappingToggle = () => {
    setIsObjectSnappingActive(!isObjectSnappingActive);
  };

  return (
    <div className="bg-white w-full h-full relative flex flex-col">
      <div className="flex items-center justify-between p-2 border-b">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Whiteboard</h3>
          <Badge variant="outline" className="flex items-center gap-1">
            <Users size={14} />
            {onlineUsers.length}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>
      </div>

      {showToolbar && (
        <div className="border-b p-2 flex flex-wrap items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle 
                  pressed={selectedTool === 'pen'} 
                  onPressedChange={() => setSelectedTool('pen')}
                >
                  <PenTool size={16} />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>
                <p>Pen</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle 
                  pressed={selectedTool === 'eraser'} 
                  onPressedChange={() => setSelectedTool('eraser')}
                >
                  <Eraser size={16} />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>
                <p>Eraser</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle pressed={isTextToolActive} onPressedChange={handleTextToolToggle}>
                  <Type size={16} />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>
                <p>Text</p>
              </TooltipContent>
            </Tooltip>

            <EnhancedColorPicker
              selectedColor={selectedColor}
              onColorChange={changeColor}
            />

            <div className="w-32">
              <Slider
                value={[selectedSize]}
                min={1}
                max={20}
                step={1}
                onValueChange={([value]) => changeSize(value)}
              />
            </div>

            <SeparatorHorizontal className="mx-2 text-gray-300" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={undoDrawing} className="h-8 w-8">
                  <Undo size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Undo</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={redoDrawing} className="h-8 w-8">
                  <Redo size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Redo</p>
              </TooltipContent>
            </Tooltip>

            <SeparatorHorizontal className="mx-2 text-gray-300" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <LayoutTemplate size={16} />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <WhiteboardTemplates 
                      onSelectTemplate={handleTemplateSelect}
                      onClose={() => setIsTemplateDialogOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              </TooltipTrigger>
              <TooltipContent>
                <p>Templates</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Dialog open={isStickerPickerOpen} onOpenChange={setIsStickerPickerOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <ImageIcon size={16} />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <StickerPicker 
                      onSelect={handleStickerSelect} 
                      onClose={() => setIsStickerPickerOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              </TooltipTrigger>
              <TooltipContent>
                <p>Stickers</p>
              </TooltipContent>
            </Tooltip>

            <SeparatorHorizontal className="mx-2 text-gray-300" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleZoomIn} className="h-8 w-8">
                  <Plus size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Zoom In</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleZoomOut} className="h-8 w-8">
                  <Minus size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Zoom Out</p>
              </TooltipContent>
            </Tooltip>

            <SeparatorHorizontal className="mx-2 text-gray-300" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={clearCanvas} className="h-8 w-8">
                  <Trash2 size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Clear</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleDownload} className="h-8 w-8">
                  <Download size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleSave} className="h-8 w-8">
                  <Save size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Save</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle 
                  pressed={selectedShape === 'rectangle'} 
                  onPressedChange={() => setSelectedShape(s => s === 'rectangle' ? null : 'rectangle')}
                >
                  <Square size={16} />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>
                <p>Rectangle</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle 
                  pressed={selectedShape === 'circle'} 
                  onPressedChange={() => setSelectedShape(s => s === 'circle' ? null : 'circle')}
                >
                  <CircleIcon size={16} />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>
                <p>Circle</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle 
                  pressed={selectedShape === 'triangle'} 
                  onPressedChange={() => setSelectedShape(s => s === 'triangle' ? null : 'triangle')}
                >
                  <Triangle size={16} />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>
                <p>Triangle</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle 
                  pressed={selectedShape === 'line'} 
                  onPressedChange={() => setSelectedShape(s => s === 'line' ? null : 'line')}
                >
                  <LineIcon size={16} />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>
                <p>Line</p>
              </TooltipContent>
            </Tooltip>

          </TooltipProvider>
        </div>
      )}

      <div className="flex-1 overflow-hidden relative">
        <div 
          className="absolute top-0 right-0 p-2 z-10"
          style={{ transform: `scale(${scale})` }}
        >
          {onlineUsersWithoutSelf.map(user => (
            <div key={user.id} className="flex items-center gap-1 mb-1 bg-white/80 rounded-full px-2 py-1 shadow-sm">
              <Avatar className="h-6 w-6">
                <AvatarImage src={user.photoURL} alt={user.name} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-xs">{user.name}</span>
            </div>
          ))}
        </div>
        
        <div 
          className="w-full h-full flex items-center justify-center bg-gray-100"
          style={{ 
            transform: `scale(${scale})`,
            overflow: 'hidden'
          }}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={endDrawing}
            onMouseLeave={endDrawing}
            className="bg-white shadow-md"
            style={{
              cursor: selectedTool === 'pen' ? 'crosshair' : 'default'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Whiteboard;
