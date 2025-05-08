const sources = {
  komikcast: {
    name: 'Komikcast',
    baseUrl: 'https://komikcast02.com',
    comicsListUrl: '/daftar-komik/',
    comicDetailBase: '/komik/',
    genresUrl: '/',
    popularMangaUrl: '/'
  }
  // Tambahkan sumber lain di sini, misal:
  // komiku: { name: 'Komiku', baseUrl: 'https://komiku.id', comicsListUrl: '/manga/', ... }
};

module.exports = { sources };