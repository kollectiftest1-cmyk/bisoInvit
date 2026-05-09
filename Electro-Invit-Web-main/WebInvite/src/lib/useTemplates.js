import { useEffect, useState } from 'react';

export function useTemplates() {
  const [templates, setTemplates] = useState([]);
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/templates`)
      .then((r) => r.json())
      .then(setTemplates)
      .catch(() => setTemplates([]));
  }, []);
  return templates;
}
