class TMDBService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        const config = (typeof CONFIG !== 'undefined' ? CONFIG : window.CONFIG) || {};
        this.baseUrl = config.BASE_URL || 'https://api.themoviedb.org/3';
        this.imageBase = (config.IMG_URL || 'https://image.tmdb.org/t/p/w500').replace('/w500', ''); // Base for images
    }

    async getTrendingMovies(timeWindow = 'week', page = 1) {
        try {
            const response = await fetch(
                `${this.baseUrl}/trending/movie/${timeWindow}?api_key=${this.apiKey}&page=${page}`
            );
            if (!response.ok) throw new Error('Failed to fetch trending movies');
            return await response.json();
        } catch (error) {
            console.error('Error fetching trending movies:', error);
            return null;
        }
    }

    async searchMovies(query, page = 1) {
        try {
            const response = await fetch(
                `${this.baseUrl}/search/movie?api_key=${this.apiKey}&query=${encodeURIComponent(query)}&page=${page}`
            );
            if (!response.ok) throw new Error('Failed to search movies');
            return await response.json();
        } catch (error) {
            console.error('Error searching movies:', error);
            return null;
        }
    }

    async getMovieDetails(movieId) {
        try {
            // reviews and stuff
            const response = await fetch(
                `${this.baseUrl}/movie/${movieId}?api_key=${this.apiKey}&append_to_response=credits,videos,reviews`
            );
            if (!response.ok) throw new Error('Failed to fetch movie details');
            return await response.json();
        } catch (error) {
            console.error('Error fetching movie details:', error);
            return null;
        }
    }

    async getTopRated(page = 1) {
        try {
            const response = await fetch(`${this.baseUrl}/movie/top_rated?api_key=${this.apiKey}&page=${page}`);
            return await response.json();
        } catch (error) { return null; }
    }

    async getMoviesByGenre(genreId, page = 1) {
        try {
            const response = await fetch(`${this.baseUrl}/discover/movie?api_key=${this.apiKey}&with_genres=${genreId}&sort_by=popularity.desc&page=${page}`);
            return await response.json();
        } catch (error) { return null; }
    }

    async getTrendingTV(timeWindow = 'week', page = 1) {
        try {
            const response = await fetch(
                `${this.baseUrl}/trending/tv/${timeWindow}?api_key=${this.apiKey}&page=${page}`
            );
            return await response.json();
        } catch (error) {
            console.error('Error fetching trending TV:', error);
            return null;
        }
    }

    async getTopRatedTV(page = 1) {
        try {
            const response = await fetch(`${this.baseUrl}/tv/top_rated?api_key=${this.apiKey}&page=${page}`);
            return await response.json();
        } catch (error) { return null; }
    }

    getImageUrl(path, size = 'w500') {
        if (!path) return null;
        return `${this.imageBase}/${size}${path}`;
    }
}
