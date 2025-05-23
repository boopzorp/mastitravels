// src/components/bangalore-buddy/RecommendationsDisplay.tsx
"use client";

import type { FC } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles } from 'lucide-react';

interface RecommendationsDisplayProps {
  recommendations: string | null;
  isLoading: boolean;
}

const RecommendationsDisplay: FC<RecommendationsDisplayProps> = ({ recommendations, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="text-primary animate-pulse" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-2/3 animate-pulse"></div>
          <p className="text-sm text-muted-foreground">Generating recommendations, please wait...</p>
        </CardContent>
      </Card>
    );
  }

  if (!recommendations) {
    return null; // Don't show the card if there are no recommendations yet and not loading
  }

  // Split recommendations into a list for better display if they are newline separated
  const recommendationItems = recommendations.split('\n').filter(item => item.trim() !== '');

  return (
    <Card className="shadow-lg rounded-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Sparkles className="text-primary" />
          AI Recommendations
        </CardTitle>
        <CardDescription>Here are some places your friend might like:</CardDescription>
      </CardHeader>
      <CardContent>
        {recommendationItems.length > 0 ? (
          <ScrollArea className="h-[200px] pr-3"> {/* Max height and scroll */}
            <ul className="list-disc list-inside space-y-1 text-sm">
              {recommendationItems.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </ScrollArea>
        ) : (
          <p className="text-muted-foreground">No specific recommendations found based on the input. Try broadening your criteria!</p>
        )}
      </CardContent>
    </Card>
  );
};

export default RecommendationsDisplay;
