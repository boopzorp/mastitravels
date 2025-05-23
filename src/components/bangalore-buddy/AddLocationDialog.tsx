
// src/components/bangalore-buddy/AddLocationDialog.tsx
"use client";

import { useEffect, type FC } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
// Select is removed as category is now a text input
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// DefaultLocationCategories and LocationCategoryType are no longer used here for selection
import { Pin } from 'lucide-react';
import AddressAutocompleteInput from './AddressAutocompleteInput';

// Schema updated for category to be a string
const addLocationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required (e.g., Cafe, Park)"), // Category as free text
  address: z.string().min(5, "Address is required for geocoding"),
});

export type AddLocationFormInput = z.infer<typeof addLocationSchema>;

interface AddLocationDialogProps {
  onSave: (data: AddLocationFormInput) => Promise<void>;
  isLoading: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // defaultCategory?: string; // Could be useful if opening dialog with a prefill
}

const AddLocationDialog: FC<AddLocationDialogProps> = ({ onSave, isLoading, open, onOpenChange }) => {
  const form = useForm<AddLocationFormInput>({
    resolver: zodResolver(addLocationSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "", // Default to empty string for text input
      address: "",
    },
  });

  const handleFormSubmit: SubmitHandler<AddLocationFormInput> = async (data) => {
    await onSave(data);
    // Resetting form is now handled by useEffect when `open` becomes false
  };
  
  useEffect(() => {
    if (!open) {
      form.reset(); // Reset form when dialog closes
    }
  }, [open, form]);


  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        // No need to explicitly reset here if useEffect handles it, but doesn't hurt
        if (!isOpen) form.reset(); 
      }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Pin className="mr-2 h-4 w-4" /> Add New Pin (Legacy - Not Used on Main Page)
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add a New Pinned Location</DialogTitle>
          <DialogDescription>
            Enter the details for the new location. The address will be used to place it on the map.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Favorite Cafe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <AddressAutocompleteInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="e.g., 45 Park Avenue, Bangalore"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                     <Input placeholder="e.g., Cafe, Museum, Park" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Great coffee, quiet ambiance" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>
                ) : (
                  "Save Location"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddLocationDialog;
