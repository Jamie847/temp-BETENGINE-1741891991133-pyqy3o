// Mock data for testing when API limits are reached or keys aren't available
export const MOCK_DATA = {
  matches: [
    {
      id: 'mock-1',
      sport: 'NCAAB',
      competitions: [{
        competitors: [{
          team: {
            id: 'gonzaga',
            name: 'Gonzaga Bulldogs',
            logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2250.png',
            injuries: []
          },
          records: [{
            summary: '26-7'
          }],
          score: null
        }, {
          team: {
            id: 'kansas',
            name: 'Kansas Jayhawks',
            logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2305.png',
            injuries: []
          },
          records: [{
            summary: '22-9'
          }],
          score: null
        }],
        venue: {
          fullName: 'T-Mobile Arena',
          address: {
            city: 'Las Vegas',
            state: 'NV',
            latitude: 36.1029,
            longitude: -115.1686
          }
        }
      }],
      date: new Date().toISOString(),
      status: {
        type: {
          state: 'scheduled',
          completed: false,
          description: 'Scheduled'
        }
      }
    }
  ]
}
