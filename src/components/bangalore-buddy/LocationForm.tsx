
// src/components/bangalore-buddy/LocationForm.tsx
"use client";

import type { FC } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Wand2 } from 'lucide-react';
// AddressAutocompleteInput is no longer needed here as address field is removed

const formSchema = z.object({
  // address: z.string().min(5, { message: "Address must be at least 5 characters." }), // Removed
  categories: z.string().min(3, { message: "Categories must be at least 3 characters." }),
  details: z.string().min(5, { message: "Details must be at least 5 characters." }),
});

export type LocationFormInput = z.infer<typeof formSchema>;

interface LocationFormProps {
  onSubmit: (data: LocationFormInput) => Promise<void>;
  isLoading: boolean;
  isFriendHomeSet: boolean; // New prop to control button disable state
}

const LocationForm: FC<LocationFormProps> = ({ onSubmit, isLoading, isFriendHomeSet }) => {
  const form = useForm<LocationFormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      // address: "", // Removed
      categories: "",
      details: "",
    },
  });

  const handleFormSubmit: SubmitHandler<LocationFormInput> = async (data) => {
    await onSubmit(data);
  };

  return (
    <Card className="shadow-lg rounded-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Wand2 className="text-primary" />
          Find Cool Spots!
        </CardTitle>
        <CardDescription>
          Enter some preferences to get AI-powered recommendations. The friend's home address (set in the card below) will be used.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Address field removed */}
            <FormField
              control={form.control}
              name="categories"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Place Categories (comma-separated)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., cafes, parks, bookstores" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Friend&apos;s Preferences</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Loves quiet places, enjoys South Indian food, into indie music" {...field} rows={3}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading || !isFriendHomeSet} className="w-full">
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>
              ) : (
                "Get Recommendations"
              )}
            </Button>
            {!isFriendHomeSet && (
              <p className="text-sm text-destructive text-center">
                Please set your friend's home address first to get recommendations.
              </p>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default LocationForm;

