// Sample TMDB API responses for testing

const movieResponse = {
  id: 550,
  title: "Fight Club",
  tagline: "Mischief. Mayhem. Soap.",
  overview: "A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.",
  backdrop_path: "/fCayJrkfRaCRCTh8GqN30f8oyQF.jpg",
  poster_path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
  release_date: "1999-10-15",
  vote_average: 8.433,
  vote_count: 26280,
  genres: [
    { id: 18, name: "Drama" }
  ],
  status: "Released",
  runtime: 139,
  production_companies: [
    {
      id: 508,
      name: "Regency Enterprises",
      logo_path: "/7PzJdsLGlR7oW4J0J5Xcd0pHGRg.png"
    }
  ],
  original_language: "en",
  revenue: 100853753,
  budget: 63000000
};

const tvResponse = {
  id: 1399,
  name: "Game of Thrones",
  tagline: "Winter Is Coming",
  overview: "Seven noble families fight for control of the mythical land of Westeros.",
  backdrop_path: "/suopoADq0k2YZr0QQGBuMEh6cjV.jpg",
  poster_path: "/7WUHnWGx5OO145IRxPDUkQSh4C7.jpg",
  first_air_date: "2011-04-17",
  vote_average: 8.453,
  vote_count: 22075,
  genres: [
    { id: 10765, name: "Sci-Fi & Fantasy" },
    { id: 18, name: "Drama" },
    { id: 10759, name: "Action & Adventure" }
  ],
  status: "Ended",
  number_of_seasons: 8,
  number_of_episodes: 73,
  networks: [
    {
      id: 49,
      name: "HBO",
      logo_path: "/tuomPhY2UtuPTqqFnKMVHvSb724.png"
    }
  ],
  original_language: "en"
};

const searchResponse = {
  page: 1,
  results: [
    {
      id: 550,
      media_type: "movie",
      title: "Fight Club",
      poster_path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
      release_date: "1999-10-15",
      vote_average: 8.433
    },
    {
      id: 1399,
      media_type: "tv",
      name: "Game of Thrones",
      poster_path: "/7WUHnWGx5OO145IRxPDUkQSh4C7.jpg",
      first_air_date: "2011-04-17",
      vote_average: 8.453
    }
  ],
  total_pages: 1,
  total_results: 2
};

const creditsResponse = {
  id: 550,
  cast: [
    {
      id: 819,
      name: "Edward Norton",
      character: "The Narrator",
      profile_path: "/5XBzD5WuTyVQZeS4VI25z2moMeY.jpg"
    },
    {
      id: 287,
      name: "Brad Pitt",
      character: "Tyler Durden",
      profile_path: "/cckcYc2v0yh1tc9QjRelptcOBko.jpg"
    }
  ],
  crew: [
    {
      id: 7467,
      name: "David Fincher",
      job: "Director",
      profile_path: "/tpEczFclQZeKAiCeKZZ0adRvtfz.jpg"
    }
  ]
};

const videosResponse = {
  id: 550,
  results: [
    {
      id: "533ec654c3a36854480003eb",
      key: "SUXWAEX2jlg",
      name: "Fight Club | #TBT Trailer",
      site: "YouTube",
      type: "Trailer"
    }
  ]
};

const watchProvidersResponse = {
  id: 550,
  results: {
    US: {
      flatrate: [
        {
          provider_id: 8,
          provider_name: "Netflix",
          logo_path: "/t2yyOv40HZeVlLjYsCsPHnWLk4W.jpg"
        }
      ],
      rent: [
        {
          provider_id: 2,
          provider_name: "Apple TV",
          logo_path: "/peURlLlr8jggOwK53fJ5wdQl05y.jpg"
        }
      ]
    }
  }
};

const errorResponse = {
  status_code: 34,
  status_message: "The resource you requested could not be found."
};

module.exports = {
  movieResponse,
  tvResponse,
  searchResponse,
  creditsResponse,
  videosResponse,
  watchProvidersResponse,
  errorResponse
};