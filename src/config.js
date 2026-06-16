export const API_BASE_URL = 'https://memesgenaretor.onrender.com';

export const getMemeUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  // If it starts with /uploads or similar, prepend the base url
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};
