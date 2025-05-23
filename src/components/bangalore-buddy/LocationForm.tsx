// src/components/bangalore-buddy/LocationForm.tsx
"use client";

import type { FC } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Keep for categories/details
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Wand2 } from 'lucide-react';
import AddressAutocompleteInput from './AddressAutocompleteInput'; // Import the new component

const formSchema = z.object({
  address: z.string().min(5, { message: "Address must be at least 5 characters." }),
  categories: z.string().min(3, { message: "Categories must be at least 3 characters." }),
  details: z.string().min(5, { message: "Details must be at least 5 characters." }),
});

export type LocationFormInput = z.infer<typeof formSchema>;

interface LocationFormProps {
  onSubmit: (data: LocationFormInput) => Promise<void>;
  isLoading: boolean;
}

const LocationForm: FC<LocationFormProps> = ({ onSubmit, isLoading }) => {
  const form = useForm<LocationFormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: "",
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
          Enter your friend&apos;s new address and some preferences to get AI-powered recommendations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Friend&apos;s New Address</FormLabel>
                  <FormControl>
                    <AddressAutocompleteInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="e.g., 123 Main St, Indiranagar, Bangalore"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>
              ) : (
                "Get Recommendations"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default LocationForm;
