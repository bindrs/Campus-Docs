export function initials(name?: string) {
  return (name || 'Campus')
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function formatSize(size?: number) {
  if (!size) return '—';
  return size > 1000000
    ? `${(size / 1000000).toFixed(1)} MB`
    : `${Math.round(size / 1000)} KB`;
}

export function formatDate(value?: string) {
  if (!value) return 'Recently';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}
