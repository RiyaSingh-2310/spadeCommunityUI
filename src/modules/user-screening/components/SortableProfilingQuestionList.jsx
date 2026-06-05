import { useCallback, useEffect, useRef, useState } from "react";
import { GripVertical } from "lucide-react";

function reorderList(items, fromIndex, toIndex) {
  if (fromIndex === toIndex) return items;
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

function SortableProfilingQuestionList({
  items,
  onChange,
  isDarkMode,
  disabled = false,
}) {
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const rowRefs = useRef([]);
  const scrollRef = useRef(null);
  const pointerYRef = useRef(0);
  const dragIndexRef = useRef(null);

  const findIndexAtY = useCallback((clientY) => {
    for (let index = 0; index < rowRefs.current.length; index += 1) {
      const node = rowRefs.current[index];
      if (!node) continue;
      const rect = node.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      if (clientY < midpoint) {
        return index;
      }
    }
    return Math.max(0, rowRefs.current.length - 1);
  }, []);

  const autoScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container || dragIndexRef.current == null) return;

    const rect = container.getBoundingClientRect();
    const y = pointerYRef.current;
    const edge = 48;
    const step = 10;

    if (y < rect.top + edge) {
      container.scrollTop -= step;
    } else if (y > rect.bottom - edge) {
      container.scrollTop += step;
    }
  }, []);

  useEffect(() => {
    if (dragIndex == null) return undefined;

    const tick = () => autoScroll();
    const interval = window.setInterval(tick, 16);
    return () => window.clearInterval(interval);
  }, [dragIndex, autoScroll]);

  const endDrag = useCallback(() => {
    const from = dragIndexRef.current;
    const to = overIndex;

    if (from != null && to != null && from !== to) {
      onChange(reorderList(items, from, to));
    }

    dragIndexRef.current = null;
    setDragIndex(null);
    setOverIndex(null);
  }, [items, onChange, overIndex]);

  const handlePointerDown = (event, index) => {
    if (disabled || event.button > 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragIndexRef.current = index;
    setDragIndex(index);
    setOverIndex(index);
    pointerYRef.current = event.clientY;
  };

  const handlePointerMove = (event) => {
    if (dragIndexRef.current == null) return;
    pointerYRef.current = event.clientY;
    setOverIndex(findIndexAtY(event.clientY));
  };

  const handlePointerUp = (event) => {
    if (dragIndexRef.current == null) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    endDrag();
  };

  const handlePointerCancel = () => {
    dragIndexRef.current = null;
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <div
      ref={scrollRef}
      className="sortable-question-list max-h-[min(70vh,640px)] overflow-y-auto pr-1"
    >
      <ul className="space-y-2">
        {items.map((question, index) => {
          const isDragging = dragIndex === index;
          const isDropTarget =
            overIndex === index && dragIndex != null && dragIndex !== index;

          return (
            <li
              key={question.id}
              ref={(node) => {
                rowRefs.current[index] = node;
              }}
              className={`sortable-question-row flex items-center gap-3 rounded-xl border px-3 py-3 transition-all ${
                isDragging
                  ? "sortable-question-row-dragging opacity-60"
                  : isDropTarget
                    ? "sortable-question-row-over"
                    : isDarkMode
                      ? "border-[#344662] bg-[#101a2a]"
                      : "border-[#d8e3ef] bg-[#f8fbfe]"
              }`}
            >
              <button
                type="button"
                aria-label={`Drag to reorder ${question.questionTitle}`}
                disabled={disabled}
                onPointerDown={(event) => handlePointerDown(event, index)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
                className={`sortable-question-handle inline-flex h-9 w-9 shrink-0 cursor-grab items-center justify-center rounded-lg border transition active:cursor-grabbing ${
                  disabled ? "cursor-not-allowed opacity-50" : ""
                } ${
                  isDarkMode
                    ? "border-[#344662] text-[#9fb0c8] hover:bg-[#1f3047]"
                    : "border-[#d8e3ef] text-[#5e718a] hover:bg-[#eef4fb]"
                }`}
              >
                <GripVertical size={16} />
              </button>

              <span
                className={`admin-text-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${
                  isDarkMode ? "bg-[#1a283c]" : "bg-[#eef4fb]"
                }`}
              >
                {index + 1}
              </span>

              <span className="admin-text min-w-0 flex-1 text-sm font-medium">
                {question.questionTitle}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default SortableProfilingQuestionList;
