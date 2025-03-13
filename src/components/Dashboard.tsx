import React, { useState } from 'react';
import { Layout } from './Layout';
import { MatchList } from './MatchList';
import { PredictionDetails } from './PredictionDetails';
import { AIInsights } from './AIInsights';
import { SportFilter } from './SportFilter';
import { PerformanceMetrics } from './PerformanceMetrics';
import { HighConfidencePicks } from './HighConfidencePicks';
import { Match } from '../types';
import { AIAgent } from '../ai/AIAgent';

const agent = new AIAgent();

export function Dashboard() {
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const highConfidencePicks = agent.getHighConfidencePicks();
  const performance = agent.getPerformanceMetrics();

  return (
    <Layout>
      <div className="flex flex-col h-screen">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Sports AI Analytics</h1>
            <SportFilter selected={selectedSport} onSelect={setSelectedSport} />
          </div>
        </header>

        <main className="flex-1 overflow-hidden bg-gray-50 p-6">
          <div className="grid grid-cols-12 gap-6 h-full">
            {/* Matches List */}
            <div className="col-span-4 bg-white rounded-lg shadow overflow-hidden">
              <MatchList
                selectedSport={selectedSport}
                onSelectMatch={setSelectedMatch}
                selectedMatch={selectedMatch}
              />
            </div>

            {/* Main Content Area */}
            <div className="col-span-8 grid grid-rows-3 gap-6">
              {/* Prediction Details */}
              <div className="bg-white rounded-lg shadow">
                <PredictionDetails match={selectedMatch} />
              </div>

              {/* AI Insights */}
              <div className="bg-white rounded-lg shadow">
                <AIInsights match={selectedMatch} />
                <PerformanceMetrics />
              </div>
              
              {/* High Confidence Picks */}
              <div className="bg-white rounded-lg shadow">
                <HighConfidencePicks
                  picks={highConfidencePicks}
                  performance={performance}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
}
