import React from 'react';
import { useNCAANews } from '../hooks/useNCAANews';
import { Newspaper, AlertCircle } from 'lucide-react';

export function NewsBanner() {
  const { news, loading, error } = useNCAANews();

  if (loading) {
    return (
      <div className="bg-indigo-50 animate-pulse h-12"></div>
    );
  }

  if (error) {
    return null;
  }

  return (
    <div className="bg-indigo-50 py-2 px-4 overflow-hidden">
      <div className="flex items-center space-x-4">
        <Newspaper className="w-5 h-5 text-indigo-600 flex-shrink-0" />
        <div className="flex-1 overflow-hidden relative">
          <div className="flex animate-marquee whitespace-nowrap">
            {news.map((item, index) => (
              <a
                key={index}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center mx-4 text-indigo-700 hover:text-indigo-900"
              >
                <span className="font-medium">{item.title}</span>
                <span className="mx-2">•</span>
                <span className="text-indigo-500 text-sm">
                  {new Date(item.pubDate).toLocaleDateString()}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
