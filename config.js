const TMDB_API_KEY = "10986161491746979685ed71ae22c1ec";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
const GENRE_LIST_URL = "https://api.themoviedb.org/3/genre/movie/list";
// Add your Gemini API Key here (starts with AIza...)
// Get one for free at https://aistudio.google.com/app/apikey
// window.TMDB_API_KEY is actually used for the TMDB service, we'll use a new global for Gemini if needed, 
// or just modify where it's called. The AI Chat class looks for window.TMDB_API_KEY for TMDB, 
// but for Gemini we can add:
window.GEMINI_API_KEY = ""; // PASTE YOUR KEY HERE TMDB_API_KEY = '0dbb7daf18a8a11c01994614e3e426ed';


window.CONFIG = CONFIG;
window.TMDB_API_KEY = TMDB_API_KEY;
