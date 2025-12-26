'use client';

import { useState } from 'react';
import { populateCitiesAction } from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function UtilitiesPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  async function handlePopulateCities() {
    try {
      setLoading(true);
      setError('');
      setResult(null);
      
      const data = await populateCitiesAction();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to populate cities');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-2">Utilities</h1>
      <p className="text-gray-600 mb-6">Administrative utility functions</p>

      <Card>
        <CardHeader>
          <CardTitle>Populate Cities</CardTitle>
          <CardDescription>
            Aggregate city data from user profiles and create city records.
            This will scan all users and group them by city and country.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handlePopulateCities} disabled={loading}>
            {loading ? 'Processing...' : 'Populate Cities'}
          </Button>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="font-semibold text-green-900 mb-2">
                ✅ Successfully created {result.citiesCreated} cities
              </p>
              <div className="space-y-1 text-sm text-green-800">
                {result.cities.map((city: any, idx: number) => (
                  <div key={idx}>
                    • {city.name}, {city.country}: {city.users} users 
                    ({city.businesses} businesses, {city.creators} creators)
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
