import { useRef } from 'react';

// Ref global compartilhada entre o hook e o App.jsx
export const toastRef = { current: null };

export function showToast({ type, text1, text2, duration }) {
  toastRef.current?.show({ type, text1, text2, duration });
}
