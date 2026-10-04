// Safeguard against "Cannot set property fetch of #<Window> which has only a getter"
try {
  if (typeof window !== 'undefined') {
    let _fetch = typeof window.fetch === 'function' ? window.fetch.bind(window) : undefined;
    if (typeof Window !== 'undefined' && Window.prototype) {
      try {
        Object.defineProperty(Window.prototype, 'fetch', {
          get() {
            return _fetch;
          },
          set(fn) {
            _fetch = fn;
          },
          configurable: true,
          enumerable: true,
        });
      } catch (_) {}
    }
    try {
      Object.defineProperty(window, 'fetch', {
        get() {
          return _fetch;
        },
        set(fn) {
          _fetch = fn;
        },
        configurable: true,
        enumerable: true,
      });
    } catch (_) {}
  }
} catch (_) {}

// Protection against F12, right-click, and DevTools inspection
try {
  if (typeof window !== 'undefined') {
    window.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    }, true);

    window.addEventListener('keydown', (e) => {
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, true);
  }
} catch (_) {}

import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);

