import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../api/sources';

interface NewsItem {
  title: string;
  link: string;
  date: string;
}

export function useNCAANews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNews() {
      try {
        const response = await axios.get(API_ENDPOINTS.BASKETBALL.NCAAB.SCORES);
        const articles = response.data.news || [];
        
        setNews(articles.map((article: any) => ({
          title: article.headline,
          link: article.links?.web || '',
          date: article.published
        })));
      } catch (err) {
        console.error('Error fetching NCAA news:', err);
        setError('Failed to fetch news');
      } finally {
        setLoading(false);
      }
    }

    fetchNews();
    const interval = setInterval(fetchNews, 300000); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, []);

  return { news, loading, error };
}
