// src/components/bangalore-buddy/AddLocationDialog.tsx
"use client";

import type { FC } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DefaultLocationCategories, LocationCategory, type LocationCategoryType } from '@/lib/types';
import { Pin } from 'lucide-react';

const addLocationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.custom<LocationCategoryType>((val) => DefaultLocationCategories.includes(val as LocationCategoryType) , "Invalid category"),
  address: z.string().min(5, "Address is required for geocoding"),
});

export type AddLocationFormInput = z.infer<typeof addLocationSchema>;

interface AddLocationDialogProps {
  onSave: (data: AddLocationFormInput) => Promise<void>; // Changed to Promise<void> as form reset is handled in parent
  isLoading: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddLocationDialog: FC<AddLocationDialogProps> = ({ onSave, isLoading, open, onOpenChange }) => {
  const form = useForm<AddLocationFormInput>({
    resolver: zodResolver(addLocationSchema),
    defaultValues: {
      name: "",
      description: "",
      category: LocationCategory.EXPLORATION, // Default to exploration for new pins
      address: "",
    },
  });

  const handleFormSubmit: SubmitHandler<AddLocationFormInput> = async (data) => {
    await onSave(data); // Parent will handle closing and resetting if successful
    // No longer resetting form here, parent (HomePage) will reset if needed or handle dialog close.
    // This ensures form isn't reset if there's a save error and dialog remains open.
  };
  
  // Effect to reset form when dialog is closed externally OR after successful save (handled by onOpenChange)
  React.useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);


  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) form.reset(); // Reset form when dialog is closed
      }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Pin className="mr-2 h-4 w-4" /> Add New Pin
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
                    <Input placeholder="e.g., 45 Park Avenue, Bangalore" {...field} />
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
                  <Select 
                    onValueChange={(value) => field.onChange(value as LocationCategoryType)} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DefaultLocationCategories.filter(cat => cat !== LocationCategory.FRIEND).map((cat) => ( // Exclude Friend category here
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
