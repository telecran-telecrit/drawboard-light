import React from "react";
import { Popover } from "./Popover";

import "./ColorPicker.scss";
import { KEYS } from "../keys";
import { t, getLanguage } from "../i18n";
import { isWritableElement } from "../utils";
import colors from "../colors";

// This is a narrow reimplementation of the awesome react-color Twitter component
// https://github.com/casesandberg/react-color/blob/master/src/components/twitter/Twitter.js

// Unfortunately, we can't detect keyboard layout in the browser. So this will
// only work well for QWERTY but not AZERTY or others...
const keyBindings = [
  ["1", "2", "3", "4", "5"],
  ["q", "w", "e", "r", "t"],
  ["a", "s", "d", "f", "g"],
].flat();

const Picker = function ({
  colors,
  color,
  onChange,
  onClose,
  label,
  showInput = true,
}: {
  colors: string[];
  color: string | null;
  onChange: (color: string) => void;
  onClose: () => void;
  label: string;
  showInput: boolean;
}) {
  const firstItem = React.useRef<HTMLButtonElement>();
  const activeItem = React.useRef<HTMLButtonElement>();
  const gallery = React.useRef<HTMLDivElement>();
  const colorInput = React.useRef<HTMLInputElement>();

  React.useEffect(() => {
    // After the component is first mounted
    // focus on first input
    if (activeItem.current) {
      activeItem.current.focus();
    } else if (colorInput.current) {
      colorInput.current.focus();
    }
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === KEYS.TAB) {
      const { activeElement } = document;
      if (event.shiftKey) {
        if (activeElement === firstItem.current) {
          colorInput.current?.focus();
          event.preventDefault();
        }
      } else {
        if (activeElement === colorInput.current) {
          firstItem.current?.focus();
          event.preventDefault();
        }
      }
    } else if (
      event.key === KEYS.ARROW_RIGHT ||
      event.key === KEYS.ARROW_LEFT ||
      event.key === KEYS.ARROW_UP ||
      event.key === KEYS.ARROW_DOWN
    ) {
      const { activeElement } = document;
      const isRTL = getLanguage().rtl;
      const index = Array.prototype.indexOf.call(
        gallery!.current!.children,
        activeElement,
      );
      if (index !== -1) {
        const length = gallery!.current!.children.length - (showInput ? 1 : 0);
        const nextIndex =
          event.key === (isRTL ? KEYS.ARROW_LEFT : KEYS.ARROW_RIGHT)
            ? (index + 1) % length
            : event.key === (isRTL ? KEYS.ARROW_RIGHT : KEYS.ARROW_LEFT)
            ? (length + index - 1) % length
            : event.key === KEYS.ARROW_DOWN
            ? (index + 5) % length
            : event.key === KEYS.ARROW_UP
            ? (length + index - 5) % length
            : index;
        (gallery!.current!.children![nextIndex] as any).focus();
      }
      event.preventDefault();
    } else if (
      keyBindings.includes(event.key.toLowerCase()) &&
      !isWritableElement(event.target)
    ) {
      const index = keyBindings.indexOf(event.key.toLowerCase());
      (gallery!.current!.children![index] as any).focus();
      event.preventDefault();
    } else if (event.key === KEYS.ESCAPE || event.key === KEYS.ENTER) {
      event.preventDefault();
      onClose();
    }
    event.nativeEvent.stopImmediatePropagation();
  };

  return (
    <div
      className="color-picker"
      role="dialog"
      aria-modal="true"
      aria-label={t("labels.colorPicker")}
      onKeyDown={handleKeyDown}
    >
      <div className="color-picker-triangle color-picker-triangle-shadow"></div>
      <div className="color-picker-triangle"></div>
      <div
        className="color-picker-content"
        ref={(el) => {
          if (el) {
            gallery.current = el;
          }
        }}
      >
        {colors.map((_color, i) => (
          <button
            className="color-picker-swatch"
            onClick={(event) => {
              (event.currentTarget as HTMLButtonElement).focus();
              onChange(_color);
            }}
            title={`${_color} ??? ${keyBindings[i].toUpperCase()}`}
            aria-label={_color}
            aria-keyshortcuts={keyBindings[i]}
            style={{ color: _color }}
            key={_color}
            ref={(el) => {
              if (el && i === 0) {
                firstItem.current = el;
              }
              if (el && _color === color) {
                activeItem.current = el;
              }
            }}
            onFocus={() => {
              onChange(_color);
            }}
          >
            {_color === "transparent" ? (
              <div className="color-picker-transparent"></div>
            ) : undefined}
            <span className="color-picker-keybinding">{keyBindings[i]}</span>
          </button>
        ))}
        {showInput && (
          <ColorInput
            color={color}
            label={label}
            onChange={(color) => {
              onChange(color);
            }}
            ref={colorInput}
          />
        )}
      </div>
    </div>
  );
};

const ColorInput = React.forwardRef(
  (
    {
      color,
      onChange,
      label,
    }: {
      color: string | null;
      onChange: (color: string) => void;
      label: string;
    },
    ref,
  ) => {
    const colorRegex = /^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8}|transparent)$/;
    const [innerValue, setInnerValue] = React.useState(color);
    const inputRef = React.useRef(null);

    React.useEffect(() => {
      setInnerValue(color);
    }, [color]);

    React.useImperativeHandle(ref, () => inputRef.current);

    return (
      <label className="color-input-container">
        <div className="color-picker-hash">#</div>
        <input
          spellCheck={false}
          className="color-picker-input"
          aria-label={label}
          onChange={(event) => {
            const value = event.target.value.toLowerCase();
            if (value.match(colorRegex)) {
              onChange(value === "transparent" ? "transparent" : `#${value}`);
            }
            setInnerValue(value);
          }}
          value={(innerValue || "").replace(/^#/, "")}
          onPaste={(event) => onChange(event.clipboardData.getData("text"))}
          onBlur={() => setInnerValue(color)}
          ref={inputRef}
        />
      </label>
    );
  },
);

export function ColorPicker({
  type,
  color,
  onChange,
  label,
}: {
  type: "canvasBackground" | "elementBackground" | "elementStroke";
  color: string | null;
  onChange: (color: string) => void;
  label: string;
}) {
  const [isActive, setActive] = React.useState(false);
  const pickerButton = React.useRef<HTMLButtonElement>(null);

  return (
    <div>
      <div className="color-picker-control-container">
        <button
          className="color-picker-label-swatch"
          aria-label={label}
          style={
            color
              ? ({ "--swatch-color": color } as React.CSSProperties)
              : undefined
          }
          onClick={() => setActive(!isActive)}
          ref={pickerButton}
        />
        <ColorInput
          color={color}
          label={label}
          onChange={(color) => {
            onChange(color);
          }}
        />
      </div>
      <React.Suspense fallback="">
        {isActive ? (
          <Popover
            onCloseRequest={(event) =>
              event.target !== pickerButton.current && setActive(false)
            }
          >
            <Picker
              colors={colors[type]}
              color={color || null}
              onChange={(changedColor) => {
                onChange(changedColor);
              }}
              onClose={() => {
                setActive(false);
                pickerButton.current?.focus();
              }}
              label={label}
              showInput={false}
            />
          </Popover>
        ) : null}
      </React.Suspense>
    </div>
  );
}
