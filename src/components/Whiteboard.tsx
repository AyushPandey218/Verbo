import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
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
  Minus
} from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { User } from '@/utils/messageUtils';

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
  const [isShapeToolActive, setIsShapeToolActive] = useState(false);
  const [selectedShape, setSelectedShape] = useState<'rectangle' | 'circle'>('rectangle');
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
    setIsDrawing(true);

    if (selectedTool === 'pen') {
      contextRef.current.beginPath();
      contextRef.current.moveTo(offsetX, offsetY);
    } else if (selectedTool === 'eraser') {
      contextRef.current.clearRect(offsetX - eraserSize / 2, offsetY - eraserSize / 2, eraserSize, eraserSize);
    }
  };

  const draw = ({ nativeEvent }: { nativeEvent: MouseEvent }) => {
    if (!isDrawing || !contextRef.current || isTextToolActive) return;
    const { offsetX, offsetY } = nativeEvent;

    if (selectedTool === 'pen') {
      contextRef.current.lineTo(offsetX, offsetY);
      contextRef.current.stroke();
    } else if (selectedTool === 'eraser') {
      contextRef.current.clearRect(offsetX - eraserSize / 2, offsetY - eraserSize / 2, eraserSize, eraserSize);
    }
  };

  const endDrawing = () => {
    if (!contextRef.current) return;
    setIsDrawing(false);
    contextRef.current.closePath();
    saveDrawing();
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

  const handleRulerToggle = () => {
    setIsRulerVisible(!isRulerVisible);
  };

  const handleEraserToggle = () => {
    setIsEraserActive(!isEraserActive);
  };

  const handleShapeToolToggle = () => {
    setIsShapeToolActive(!isShapeToolActive);
  };

  const handleLineToolToggle = () => {
    setIsLineToolActive(!isLineToolActive);
  };

  const handleArrowToolToggle = () => {
    setIsArrowToolActive(!isArrowToolActive);
  };

  const handleZoomToolToggle = () => {
    setIsZoomToolActive(!isZoomToolActive);
  };

  const handleMirrorToolToggle = () => {
    setIsMirrorToolActive(!isMirrorToolActive);
  };

  const handleCropToolToggle = () => {
    setIsCropToolActive(!isCropToolActive);
  };

  const handleRotateToolToggle = () => {
    setIsRotateToolActive(!isRotateToolActive);
  };

  const handleSkewToolToggle = () => {
    setIsSkewToolActive(!isSkewToolActive);
  };

  const handlePerspectiveToolToggle = () => {
    setIsPerspectiveToolActive(!isPerspectiveToolActive);
  };

  const handleBlurToolToggle = () => {
    setIsBlurToolActive(!isBlurToolActive);
  };

  const handleSharpenToolToggle = () => {
    setIsSharpenToolActive(!isSharpenToolActive);
  };

  const handleDodgeToolToggle = () => {
    setIsDodgeToolActive(!isDodgeToolActive);
  };

  const handleBurnToolToggle = () => {
    setIsBurnToolActive(!isBurnToolActive);
  };

  const handleSpongeToolToggle = () => {
    setIsSpongeToolActive(!isSpongeToolActive);
  };

  const handleCloneToolToggle = () => {
    setIsCloneToolActive(!isCloneToolActive);
  };

  const handleSmudgeToolToggle = () => {
    setIsSmudgeToolActive(!isSmudgeToolActive);
  };

  const handleTextAlignmentToggle = () => {
    setIsTextAlignmentActive(!isTextAlignmentActive);
  };

  const handleTextBoldToggle = () => {
    setIsTextBoldActive(!isTextBoldActive);
  };

  const handleTextItalicToggle = () => {
    setIsTextItalicActive(!isTextItalicActive);
  };

  const handleTextUnderlineToggle = () => {
    setIsTextUnderlineActive(!isTextUnderlineActive);
  };

  const handleTextStrikethroughToggle = () => {
    setIsTextStrikethroughActive(!isTextStrikethroughActive);
  };

  const handleTextShadowToggle = () => {
    setIsTextShadowActive(!isTextShadowActive);
  };

  const handleTextOutlineToggle = () => {
    setIsTextOutlineActive(!isTextOutlineActive);
  };

  const handleTextGradientToggle = () => {
    setIsTextGradientActive(!isTextGradientActive);
  };

  const handleTextPatternToggle = () => {
    setIsTextPatternActive(!isTextPatternActive);
  };

  const handleTextSpacingToggle = () => {
    setIsTextSpacingActive(!isTextSpacingActive);
  };

  const handleTextKerningToggle = () => {
    setIsTextKerningActive(!isTextKerningActive);
  };

  const handleTextTransformToggle = () => {
    setIsTextTransformActive(!isTextTransformActive);
  };

  const handleTextVerticalAlignmentToggle = () => {
    setIsTextVerticalAlignmentActive(!isTextVerticalAlignmentActive);
  };

  const handleTextDirectionToggle = () => {
    setIsTextDirectionActive(!isTextDirectionActive);
  };

  const handleTextWritingModeToggle = () => {
    setIsTextWritingModeActive(!isTextWritingModeActive);
  };

  const handleTextOrientationToggle = () => {
    setIsTextOrientationActive(!isTextOrientationActive);
  };

  const handleTextUnicodeBidiToggle = () => {
    setIsTextUnicodeBidiActive(!isTextUnicodeBidiActive);
  };

  const handleTextRubyToggle = () => {
    setIsTextRubyActive(!isTextRubyActive);
  };

  const handleTextEmphasisToggle = () => {
    setIsTextEmphasisActive(!isTextEmphasisActive);
  };

  const handleTextJustifyToggle = () => {
    setIsTextJustifyActive(!isTextJustifyActive);
  };

  const handleTextHyphensToggle = () => {
    setIsTextHyphensActive(!isTextHyphensActive);
  };

  const handleTextOverflowToggle = () => {
    setIsTextOverflowActive(!isTextOverflowActive);
  };

  const handleTextWhiteSpaceToggle = () => {
    setIsTextWhiteSpaceActive(!isTextWhiteSpaceActive);
  };

  const handleTextWordBreakToggle = () => {
    setIsTextWordBreakActive(!isTextWordBreakActive);
  };

  const handleTextOverflowWrapToggle = () => {
    setIsTextOverflowWrapActive(!isTextOverflowWrapActive);
  };

  const handleTextTabSizeToggle = () => {
    setIsTextTabSizeActive(!isTextTabSizeActive);
  };

  const handleTextInitialLetterToggle = () => {
    setIsTextInitialLetterActive(!isTextInitialLetterActive);
  };

  const handleTextColumnsToggle = () => {
    setIsTextColumnsActive(!isTextColumnsActive);
  };

  const handleTextColumnRuleToggle = () => {
    setIsTextColumnRuleActive(!isTextColumnRuleActive);
  };

  const handleTextBreakInsideToggle = () => {
    setIsTextBreakInsideActive(!isTextBreakInsideActive);
  };

  const handleTextBoxDecorationBreakToggle = () => {
    setIsTextBoxDecorationBreakActive(!isTextBoxDecorationBreakActive);
  };

  const handleLineClampToggle = () => {
    setIsTextLineClampActive(!isTextLineClampActive);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-2 bg-gray-100 border-b">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleSave} disabled={!onSaveDrawing}>
            <Save size={16} className="mr-1" />
            Save
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDownload}>
            <Download size={16} className="mr-1" />
            Download
          </Button>
          <Button variant="ghost" size="sm" onClick={clearCanvas}>
            <Trash2 size={16} className="mr-1" />
            Clear
          </Button>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={undoDrawing} disabled={historyIndex <= 0}>
            <Undo size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={redoDrawing} disabled={historyIndex >= drawingHistory.length - 1}>
            <Redo size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleZoomIn}>
            <Plus size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleZoomOut}>
            <Minus size={16} />
          </Button>
        </div>
        
        {onlineUsersWithoutSelf.length > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center mr-2">
                  <Badge variant="outline" className="px-2 py-1 flex items-center gap-1 bg-indigo-50 text-indigo-700 border-indigo-200">
                    <Users size={12} />
                    <span className="text-xs">{onlineUsersWithoutSelf.length}</span>
                  </Badge>
                  <div className="flex -space-x-2 ml-2">
                    {onlineUsersWithoutSelf.slice(0, 3).map(user => (
                      <Avatar key={user.id} className="h-6 w-6 border-2 border-white">
                        {user.photoURL ? (
                          <AvatarImage src={user.photoURL} alt={user.name} />
                        ) : (
                          <AvatarFallback className="bg-indigo-500 text-[10px]">
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    ))}
                    {onlineUsersWithoutSelf.length > 3 && (
                      <Avatar className="h-6 w-6 border-2 border-white">
                        <AvatarFallback className="bg-gray-400 text-[10px]">
                          +{onlineUsersWithoutSelf.length - 3}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent align="end">
                <p className="text-sm">Drawing with:</p>
                <ul className="text-xs">
                  {onlineUsersWithoutSelf.map(user => (
                    <li key={user.id}>{user.name}</li>
                  ))}
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      <div className="flex flex-1 relative overflow-hidden">
        <div className="absolute left-2 top-2 flex flex-col gap-1 z-10 bg-white/80 rounded-md p-1 shadow-sm">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle 
                  pressed={selectedTool === 'pen' && !isEraserActive} 
                  onClick={() => { setIsEraserActive(false); setSelectedTool('pen'); }}
                  size="sm"
                  className="w-8 h-8 p-0 data-[state=on]:bg-indigo-100 data-[state=on]:text-indigo-700"
                >
                  <PenTool size={14} />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent side="right">Pen Tool</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle 
                  pressed={isEraserActive} 
                  onClick={handleEraserToggle}
                  size="sm"
                  className="w-8 h-8 p-0 data-[state=on]:bg-indigo-100 data-[state=on]:text-indigo-700"
                >
                  <Eraser size={14} />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent side="right">Eraser</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle 
                  pressed={isTextToolActive} 
                  onClick={handleTextToolToggle}
                  size="sm"
                  className="w-8 h-8 p-0 data-[state=on]:bg-indigo-100 data-[state=on]:text-indigo-700"
                >
                  <Type size={14} />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent side="right">Text Tool</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle 
                  pressed={isFillActive} 
                  onClick={handleFillToggle}
                  size="sm"
                  className="w-8 h-8 p-0 data-[state=on]:bg-indigo-100 data-[state=on]:text-indigo-700"
                >
                  <PaintBucket size={14} />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent side="right">Fill Tool</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle 
                  pressed={isShapeToolActive} 
                  onClick={handleShapeToolToggle}
                  size="sm"
                  className="w-8 h-8 p-0 data-[state=on]:bg-indigo-100 data-[state=on]:text-indigo-700"
                >
                  <SeparatorHorizontal size={14} />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent side="right">Shapes</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle 
                  pressed={isImageToolActive} 
                  onClick={handleImageToolToggle}
                  size="sm"
                  className="w-8 h-8 p-0 data-[state=on]:bg-indigo-100 data-[state=on]:text-indigo-700"
                >
                  <ImageIcon size={14} />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent side="right">Insert Image</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <div className="absolute left-2 bottom-2 bg-white rounded-md shadow-sm overflow-hidden">
              <div 
                className="w-6 h-6 cursor-pointer" 
                style={{ backgroundColor: selectedColor }}
              ></div>
            </div>
          </PopoverTrigger>
          <PopoverContent side="top" className="w-auto p-2">
            <div className="grid grid-cols-6 gap-1">
              {[
                '#000000', '#FF0000', '#00FF00', '#0000FF', 
                '#FFFF00', '#00FFFF', '#FF00FF', '#FF9900',
                '#9900FF', '#009900', '#990000', '#999999',
                '#FFFFFF', '#CCCCCC', '#333333', '#666666',
                '#996633', '#99CC33', '#3399CC', '#FF6666'
              ].map(color => (
                <div
                  key={color}
                  className="w-5 h-5 cursor-pointer border border-gray-300"
                  style={{ backgroundColor: color }}
                  onClick={() => changeColor(color)}
                ></div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        
        <div className="absolute right-2 top-2 bg-white rounded-md shadow-sm overflow-hidden">
          <Slider
            className="w-24 h-8"
            value={[selectedSize]}
            min={1}
            max={50}
            step={1}
            onValueChange={(value) => changeSize(value[0])}
          />
        </div>
        
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          className="border bg-white shadow-sm"
          style={{
            transform: `scale(${scale})`,
            cursor: isEraserActive 
              ? 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><path d=\'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6\'/><path d=\'M15 3h6v6\'/><path d=\'m10 14 11-11\'/></svg>"), auto'
              : 'crosshair'
          }}
        />
      </div>
    </div>
  );
};

export default Whiteboard;
