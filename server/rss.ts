import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent': 'NexoraBrasil/1.0 (RSS news reader)'
  },
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['content:encoded', 'contentEncoded']
    ]
  }
});

export interface RSSItem {
  title: string;
  link: string;
  contentSnippet: string;
  content: string;
  pubDate: string;
  isoDate: string;
  imageUrl: string;
  guid: string;
}

export interface RSSFeedResult {
  title: string;
  description: string;
  feedUrl: string;
  items: RSSItem[];
}

function extractImage(item: any): string {
  const html = [
    item['content:encoded'],
    item.content,
    item.description
  ].filter(Boolean).join(' ');

  const htmlImage = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (htmlImage?.[1]) return htmlImage[1];

  const media = item.mediaContent;
  if (Array.isArray(media) && media[0]?.$?.url) {
    return media[0].$.url;
  }
  if (media?.$?.url) return media.$.url;

  const thumbnail = item.mediaThumbnail;
  if (Array.isArray(thumbnail) && thumbnail[0]?.$?.url) {
    return thumbnail[0].$.url;
  }
  if (thumbnail?.$?.url) return thumbnail.$.url;

  return '';
}

export async function readRSSFeed(url: string): Promise<RSSFeedResult> {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error('O endereço RSS não é válido.');
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('A fonte RSS deve usar HTTP ou HTTPS.');
  }

  if (parsedUrl.username || parsedUrl.password) {
    throw new Error('O endereço RSS não pode conter credenciais.');
  }

  const feed = await parser.parseURL(parsedUrl.toString());

  const items: RSSItem[] = (feed.items || []).map((item: any) => ({
    title: String(item.title || '').trim(),
    link: String(item.link || '').trim(),
    contentSnippet: String(item.contentSnippet || item.summary || item.description || '').trim(),
    content: String(item['content:encoded'] || item.content || item.description || '').trim(),
    pubDate: String(item.pubDate || ''),
    isoDate: String(item.isoDate || ''),
    imageUrl: extractImage(item),
    guid: String(item.guid || item.id || item.link || '').trim()
  })).filter(item => item.title && item.link);

  return {
    title: String(feed.title || parsedUrl.hostname),
    description: String(feed.description || ''),
    feedUrl: parsedUrl.toString(),
    items
  };
}
