import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Maximize2, Minimize2, GripHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Dashboard from '@/pages/Dashboard';
import Tasks from '@/pages/Tasks';
import Projects from '@/pages/Projects';
import Clients from '@/pages/Clients';
import Talent from '@/pages/Talent';
import Finance from '@/pages/Finance';
import Bookings from '@/pages/Bookings';

interface PageOverlayProps {
  page: string;
  onClose: () => void;
}

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  contacts: 'Contacts',
  tasks: 'Tasks',
  projects: 'Projects',
  talent: 'Talent',
  finance: 'Finance',
  bookings: 'Bookings',
};

const MIN_WIDTH = 320;
const MIN_HEIGHT = 240;

function PageContent({ page }: { page: string }) {
  switch (page) {
    case 'dashboard':
      return <Dashboard />;
    case 'tasks':
      return <Tasks />;
    case 'projects':
      return <Projects />;
    case 'contacts':
      return <Clients />;
    case 'talent':
      return <Talent />;
    case 'finance':
      return <Finance />;
    case 'bookings':
      return <Bookings />;
    default:
      return (
        <div className="text-muted-foreground text-sm">
          Unknown page: {page}
        </div>
      );
  }
}

type ResizeEdge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export function PageOverlay({ page, onClose }: PageOverlayProps) {
  const title = PAGE_TITLES[page] || page.charAt(0).toUpperCase() + page.slice(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isMaximized, setIsMaximized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [initialized, setInitialized] = useState(false);

  // Drag state
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);

  // Resize state
  const resizeRef = useRef<{
    edge: ResizeEdge;
    startX: number;
    startY: number;
    startPosX: number;
    startPosY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  // Initialize centered position at 70% width, 80% height
  useEffect(() => {
    if (!containerRef.current || initialized) return;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const w = Math.max(MIN_WIDTH, rect.width * 0.7);
    const h = Math.max(MIN_HEIGHT, rect.height * 0.8);
    setSize({ width: w, height: h });
    setPosition({
      x: (rect.width - w) / 2,
      y: (rect.height - h) / 2,
    });
    setInitialized(true);
  }, [initialized]);

  // Drag handlers
  const handleDragStart = useCallback((e: React.PointerEvent) => {
    if (isMaximized) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y,
    };
  }, [isMaximized, position]);

  const handleDragMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPosition({
      x: dragRef.current.startPosX + dx,
      y: dragRef.current.startPosY + dy,
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    dragRef.current = null;
  }, []);

  // Resize handlers
  const handleResizeStart = useCallback((edge: ResizeEdge, e: React.PointerEvent) => {
    if (isMaximized) return;
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    resizeRef.current = {
      edge,
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y,
      startWidth: size.width,
      startHeight: size.height,
    };
  }, [isMaximized, position, size]);

  const handleResizeMove = useCallback((e: React.PointerEvent) => {
    if (!resizeRef.current) return;
    const { edge, startX, startY, startPosX, startPosY, startWidth, startHeight } = resizeRef.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    let newX = startPosX;
    let newY = startPosY;
    let newW = startWidth;
    let newH = startHeight;

    if (edge.includes('e')) newW = Math.max(MIN_WIDTH, startWidth + dx);
    if (edge.includes('w')) {
      newW = Math.max(MIN_WIDTH, startWidth - dx);
      newX = startPosX + (startWidth - newW);
    }
    if (edge.includes('s')) newH = Math.max(MIN_HEIGHT, startHeight + dy);
    if (edge.includes('n')) {
      newH = Math.max(MIN_HEIGHT, startHeight - dy);
      newY = startPosY + (startHeight - newH);
    }

    setSize({ width: newW, height: newH });
    setPosition({ x: newX, y: newY });
  }, []);

  const handleResizeEnd = useCallback(() => {
    resizeRef.current = null;
  }, []);

  // Combined pointer move/up for both drag and resize
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (dragRef.current) handleDragMove(e);
    if (resizeRef.current) handleResizeMove(e);
  }, [handleDragMove, handleResizeMove]);

  const handlePointerUp = useCallback(() => {
    handleDragEnd();
    handleResizeEnd();
  }, [handleDragEnd, handleResizeEnd]);

  const resizeHandles: { edge: ResizeEdge; className: string }[] = [
    { edge: 'n', className: 'top-0 left-2 right-2 h-1.5 cursor-n-resize' },
    { edge: 's', className: 'bottom-0 left-2 right-2 h-1.5 cursor-s-resize' },
    { edge: 'e', className: 'top-2 bottom-2 right-0 w-1.5 cursor-e-resize' },
    { edge: 'w', className: 'top-2 bottom-2 left-0 w-1.5 cursor-w-resize' },
    { edge: 'nw', className: 'top-0 left-0 w-3 h-3 cursor-nw-resize' },
    { edge: 'ne', className: 'top-0 right-0 w-3 h-3 cursor-ne-resize' },
    { edge: 'sw', className: 'bottom-0 left-0 w-3 h-3 cursor-sw-resize' },
    { edge: 'se', className: 'bottom-0 right-0 w-3 h-3 cursor-se-resize' },
  ];

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-40 pointer-events-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Dimmed backdrop — click-through so chat input stays usable */}
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />

      {/* Floating window */}
      <div
        className="absolute flex flex-col bg-background border border-border rounded-lg shadow-2xl overflow-hidden pointer-events-auto"
        style={
          isMaximized
            ? { inset: 0, borderRadius: 0 }
            : {
                left: position.x,
                top: position.y,
                width: size.width,
                height: size.height,
              }
        }
      >
        {/* Title bar — draggable */}
        <div
          className="flex items-center justify-between px-3 h-11 border-b border-border shrink-0 select-none bg-muted/50"
          onPointerDown={handleDragStart}
          style={{ cursor: isMaximized ? 'default' : 'grab' }}
        >
          <div className="flex items-center gap-2 pointer-events-none">
            <GripHorizontal className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">{title}</h2>
          </div>
          <div className="flex items-center gap-0.5" onPointerDown={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMaximized(!isMaximized)}
              className="h-7 w-7"
            >
              {isMaximized ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-auto">
          <PageContent page={page} />
        </div>

        {/* Resize handles (hidden when maximized) */}
        {!isMaximized &&
          resizeHandles.map(({ edge, className }) => (
            <div
              key={edge}
              className={`absolute ${className} z-50`}
              onPointerDown={(e) => handleResizeStart(edge, e)}
            />
          ))}
      </div>
    </div>
  );
}
