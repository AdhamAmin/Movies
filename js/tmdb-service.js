class TMDBService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.themoviedb.org/3';
        this.imageBase = 'https://image.tmdb.org/t/p';
    }

    async getTrendingMovies(timeWindow = 'week') {
        try {
            const response = await fetch(
                `${this.baseUrl}/trending/movie/${timeWindow}?api_key=${this.apiKey}`
            );
            if (!response.ok) throw new Error('Failed to fetch trending movies');
            return await response.json();
        } catch (error) {
            console.error('Error fetching trending movies:', error);
            return null;
        }
    }

    async searchMovies(query) {
        try {
            const response = await fetch(
                `${this.baseUrl}/search/movie?api_key=${this.apiKey}&query=${encodeURIComponent(query)}`
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

    getImageUrl(path, size = 'w500') {
        if (!path) return null;
        return `${this.imageBase}/${size}${path}`;
    }
}
