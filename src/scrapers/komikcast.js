const axios = require('axios');
const cheerio = require('cheerio');
const { getCache, setCache } = require('../config/cache');
const { logger } = require('../config/logger');

const cacheDuration = 60 * 60 * 1000; // 1 jam dalam milidetik

async function fetchComicsList(baseUrl, params = {}) {
  // Ekstrak parameter
  const { page = 1, genres = [], status = '', type = '', orderby = 'update' } = params;
  const cacheKey = `komikcast:comics-list:page-${page}-genres-${genres.join(',')}-status-${status}-type-${type}-orderby-${orderby}`;

  // Cek cache
  if (getCache(cacheKey)) {
    logger.info(`Mengembalikan daftar komik (${cacheKey}) dari cache`);
    return getCache(cacheKey);
  }

  try {
    // Bangun query string untuk filter
    const queryParams = [];
    genres.forEach((genre, index) => {
      queryParams.push(`genre[${index}]=${encodeURIComponent(genre.toLowerCase())}`);
    });
    if (status) queryParams.push(`status=${encodeURIComponent(status)}`);
    if (type) queryParams.push(`type=${encodeURIComponent(type)}`);
    if (orderby) queryParams.push(`orderby=${encodeURIComponent(orderby)}`);

    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    const url = page === 1 ? `${baseUrl}${queryString}` : `${baseUrl}page/${page}/${queryString}`;
    logger.info(`Mengambil daftar komik: ${url}`);

    const response = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(response.data);
    const comicsList = [];

    $('.list-update_item').each((i, element) => {
      const title = $(element).find('.title').text().trim() || 'No Title';
      const link = $(element).find('a').attr('href') || 'No Link';
      const image = $(element).find('.ts-post-image').attr('src') || 'No Image';
      const type = $(element).find('.type').text().trim().toLowerCase() || 'No Type';
      const chapter = $(element).find('.chapter').text().trim() || 'No Chapter';
      const rating = $(element).find('.numscore').text().trim() || '0';
      const status = $(element).find('.status').text().trim().toLowerCase() || 'ongoing';

      comicsList.push({ title, link, image, type, chapter, rating, status });
    });

    setCache(cacheKey, comicsList, cacheDuration);
    logger.info(`Daftar komik (${cacheKey}, ${comicsList.length} item) berhasil diambil dan disimpan di cache`);

    return comicsList;
  } catch (error) {
    logger.error(`Gagal mengambil daftar komik: ${error.message}`);
    throw error;
  }
}

async function fetchComicDetail(slug) {
  const url = `https://komikcast02.com/komik/${slug}/`;
  const cacheKey = `komikcast:comic-detail:${url}`;

  // Cek cache
  if (getCache(cacheKey)) {
    logger.info(`Mengembalikan detail komik untuk ${url} dari cache`);
    return getCache(cacheKey);
  }

  try {
    logger.info(`Mengambil detail komik: ${url}`);
    const response = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(response.data);
    const detail = {};

    // Periksa apakah halaman valid
    if (!$('.komik_info').length) {
      throw new Error('Comic not found');
    }

    // Ambil data
    detail.coverImage = $('.komik_info-cover-image img').attr('src') || 'No Image';
    detail.title = $('.komik_info-content-body-title').text().trim() || 'No Title';
    detail.nativeTitle = $('.komik_info-content-native').text().trim() || 'No Native Title';
    detail.genres = [];
    $('.komik_info-content-genre a').each((i, element) => {
      detail.genres.push($(element).text().trim());
    });
    detail.releaseYear = $('.komik_info-content-info-release').text().replace('Released:', '').trim() || 'No Year';
    detail.author = $('.komik_info-content-info:contains("Author:")').text().replace('Author:', '').trim() || 'No Author';
    detail.status = $('.komik_info-content-info:contains("Status:")').text().replace('Status:', '').trim().toLowerCase() || 'ongoing';
    detail.type = $('.komik_info-content-info-type a').text().trim().toLowerCase() || 'No Type';
    detail.totalChapters = $('.komik_info-content-info:contains("Total Chapter:")').text().replace('Total Chapter:', '').trim() || '0';
    detail.updatedOn = $('.komik_info-content-update time').text().trim() || 'No Date';
    detail.rating = $('.data-rating').attr('data-ratingkomik') || '0';
    detail.synopsis = $('.komik_info-description-sinopsis p').text().trim() || 'No Synopsis';
    detail.chapters = [];
    $('.komik_info-chapters-item').each((i, element) => {
      detail.chapters.push({
        title: $(element).find('.chapter-link-item').text().trim() || 'No Title',
        link: $(element).find('.chapter-link-item').attr('href') || 'No Link',
        releaseTime: $(element).find('.chapter-link-time').text().trim() || 'No Time'
      });
    });

    setCache(cacheKey, detail, cacheDuration);
    logger.info(`Detail komik untuk ${url} berhasil diambil dan disimpan di cache`);

    return detail;
  } catch (error) {
    logger.error(`Gagal mengambil detail komik untuk ${url}: ${error.message}`);
    throw error;
  }
}

async function fetchGenres(url) {
  const cacheKey = 'komikcast:genres';

  // Cek cache
  if (getCache(cacheKey)) {
    logger.info('Mengembalikan genres dari cache');
    return getCache(cacheKey);
  }

  try {
    logger.info(`Mengambil genres dari ${url}`);
    const response = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(response.data);
    const genresList = [];

    $('ul.genre li a').each((i, element) => {
      const text = $(element).text().trim();
      const match = text.match(/^(.+?)\s*\((\d+)\)$/);
      const name = match ? match[1].trim() : text || 'No Name';
      const count = match ? parseInt(match[2], 10) : 0;
      const link = $(element).attr('href') || 'No Link';

      genresList.push({ name, seriesCount: count, link });
    });

    setCache(cacheKey, genresList, cacheDuration);
    logger.info('Genres berhasil diambil dan disimpan di cache');

    return genresList;
  } catch (error) {
    logger.error(`Gagal mengambil genres: ${error.message}`);
    throw error;
  }
}

async function fetchPopularManga(url) {
  const cacheKey = 'komikcast:popular-manga';

  // Cek cache
  if (getCache(cacheKey)) {
    logger.info('Mengembalikan manga populer dari cache');
    return getCache(cacheKey);
  }

  try {
    logger.info(`Mengambil manga populer dari ${url}`);
    const response = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(response.data);
    const popularMangaList = [];

    $('.section .serieslist.pop ul li').each((i, element) => {
      const rank = $(element).find('.ctr').text().trim() || 'No Rank';
      const title = $(element).find('.leftseries h2 a').text().trim() || 'No Title';
      const link = $(element).find('.leftseries h2 a').attr('href') || 'No Link';
      const image = $(element).find('.imgseries img').attr('src') || 'No Image';
      const genres = [];
      $(element).find('.leftseries span').first().find('a').each((j, genreElement) => {
        genres.push($(element).text().trim());
      });
      const year = $(element).find('.leftseries span').eq(1).text().trim() || 'No Year';

      popularMangaList.push({ rank, title, link, image, genres, year });
    });

    setCache(cacheKey, popularMangaList, cacheDuration);
    logger.info('Manga populer berhasil diambil dan disimpan di cache');

    return popularMangaList;
  } catch (error) {
    logger.error(`Gagal mengambil manga populer: ${error.message}`);
    throw error;
  }
}

async function fetchChapterContent(chapterSlug) {
  logger.info(`Mengambil konten chapter: ${chapterSlug}`);
  const url = `https://komikcast02.com/chapter/${chapterSlug}/`;
  const cacheKey = `komikcast:chapter:${url}`;

  // Cek cache
  if (getCache(cacheKey)) {
    logger.info(`Mengembalikan konten chapter untuk ${url} dari cache`);
    return getCache(cacheKey);
  }

  try {
    logger.info(`Mengambil konten chapter: ${url}`);
    const response = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(response.data);
    const chapter = {};
    

    // Periksa apakah halaman valid
    if (!$('.chapter_body').length) {
      throw new Error('Chapter not found');
    }

    // Ambil gambar
    chapter.images = [];
    $('.main-reading-area img').each((i, element) => {
      const src = $(element).attr('src');
      if (src) chapter.images.push(src);
    });

    // Ambil link chapter sebelumnya dan berikutnya
    chapter.previousChapter = $('.nextprev a[rel="prev"]').attr('href') || null;
    chapter.nextChapter = $('.nextprev a[rel="next"]').attr('href') || null;

    // Ambil daftar chapter
    chapter.chapters = [];
    $('select[name="chapter"] option').each((i, element) => {
      const title = $(element).text().trim() || 'No Title';
      const url = $(element).attr('value') || 'No URL';
      chapter.chapters.push({ title, url });
    });

    setCache(cacheKey, chapter, cacheDuration);
    logger.info(`Konten chapter untuk ${url} berhasil diambil dan disimpan di cache`);

    return chapter;
  } catch (error) {
    logger.error(`Gagal mengambil konten chapter untuk ${url}: ${error.message}`);
    throw error;
  }
}

module.exports = { fetchComicsList, fetchComicDetail, fetchGenres, fetchPopularManga, fetchChapterContent };