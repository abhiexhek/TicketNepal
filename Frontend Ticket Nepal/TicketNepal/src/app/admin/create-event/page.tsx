'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "@/styles/datepicker-custom.css";

import { cn, toSafeDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { UserContext } from "@/context/UserContext";

const MAX_FILE_SIZE = 5000000; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const formSchema = z.object({
  name: z.string().min(2, { message: "Event name must be at least 2 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  category: z.string().min(2, { message: "Category is required." }),
  eventStart: z.date({ required_error: "A start date and time is required." }),
  eventEnd: z.date({ required_error: "An end date and time is required." }),
  location: z.string().min(2, { message: "Location is required." }),
  seatCount: z.coerce.number().min(1, { message: "Number of seats must be at least 1." }),
  price: z.coerce.number().min(0, { message: "Price must be a positive number." }),
  image: z
    .any()
    .refine((files) => files?.length === 1, "Image is required.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      ".jpg, .jpeg, .png and .webp files are accepted."
    ),
});

export default function CreateEventPage() {
  const { currentUser } = useContext(UserContext);
  const router = useRouter();
  const [customCategory, setCustomCategory] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const popularCategories = [
    "Music",
    "Tech",
    "Art",
    "Sports",
    "Food",
    "Business",
    "Education",
    "Festival",
    "Workshop",
    "Other"
  ];

  useEffect(() => {
    if (currentUser && !['Organizer', 'Admin'].includes(currentUser.role)) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to create events.",
        variant: "destructive"
      });
      router.push('/admin');
    }
  }, [currentUser, router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      location: "",
      seatCount: 10,
      price: 0,
      eventStart: undefined,
      eventEnd: undefined,
      image: undefined,
    },
  });

  // Initialize selectedCategory from form value if present
  useEffect(() => {
    if (form.getValues("category") && !selectedCategory) {
      setSelectedCategory(form.getValues("category"));
    }
  }, [form, selectedCategory]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Generate seat IDs (A1, A2, ..., B1, B2, ...)
    function generateSeatIds(count: number): string[] {
      const seats: string[] = [];
      const seatsPerRow = 12;
      for (let i = 0; i < count; i++) {
        const row = String.fromCharCode(65 + Math.floor(i / seatsPerRow));
        const seatNum = (i % seatsPerRow) + 1;
        seats.push(`${row}${seatNum}`);
      }
      return seats;
    }
    const seatIds = generateSeatIds(values.seatCount);
    const formData = new FormData();
    formData.append('name', values.name);
    formData.append('description', values.description);
    formData.append('category', values.category);
    formData.append('eventStart', values.eventStart.toISOString());
    formData.append('eventEnd', values.eventEnd.toISOString());
    formData.append('location', values.location);
    formData.append('seats', seatIds.join(","));
    formData.append('price', values.price.toString());
    formData.append('image', values.image[0]);
    formData.append('organizerId', String(currentUser?.id));

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/events`,
        {
          method: 'POST',
          body: formData,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (response.ok) {
        toast({ title: "Event Created!", description: "Your new event has been successfully created." });
        router.push('/admin');
      } else {
        const err = await response.json();
        toast({
          title: "Creation Failed",
          description: err.error || err.message || "Could not create the event.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({ title: "Error", description: "An error occurred.", variant: "destructive" });
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto py-6 px-2 sm:px-4">
      <h1 className="text-2xl font-bold mb-6">Create New Event</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Name</FormLabel>
                <FormControl>
                  <Input placeholder="Event Name" {...field} />
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
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Event Description" {...field} />
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
                  <select
                    className="w-full border rounded px-3 py-2 bg-muted focus:bg-secondary focus:border-primary transition-colors"
                    value={selectedCategory || field.value}
                    onChange={e => {
                      setSelectedCategory(e.target.value);
                      if (e.target.value !== "Other") {
                        field.onChange(e.target.value);
                        setCustomCategory("");
                      } else {
                        field.onChange("");
                      }
                    }}
                  >
                    <option value="">Select a category</option>
                    {popularCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </FormControl>
                {selectedCategory === "Other" && (
                  <div className="mt-2">
                    <input
                      className="w-full border rounded px-3 py-2"
                      placeholder="Enter custom category"
                      value={customCategory}
                      onChange={e => {
                        setCustomCategory(e.target.value);
                        field.onChange(e.target.value);
                      }}
                    />
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex space-x-4">
            <FormField
                control={form.control}
                name="eventStart"
                render={({ field }) => {
                  const now = new Date();
                  const selectedDate = field.value ?? null;
                  let minTime: Date | undefined = undefined;
                  let maxTime: Date | undefined = undefined;
                  if (selectedDate) {
                    const isToday = selectedDate.getFullYear() === now.getFullYear() &&
                      selectedDate.getMonth() === now.getMonth() &&
                      selectedDate.getDate() === now.getDate();
                    if (isToday) {
                      minTime = now;
                      maxTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59);
                    } else {
                      minTime = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0);
                      maxTime = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 23, 59);
                    }
                  }
                  return (
                    <FormItem>
                      <FormLabel>Event Start</FormLabel>
                      <FormControl>
                        <ReactDatePicker
                          selected={field.value ?? null}
                          onChange={date => field.onChange(date)}
                          showTimeSelect
                          timeFormat="HH:mm"
                          timeIntervals={15}
                          dateFormat="yyyy-MM-dd HH:mm"
                          minDate={now}
                          // @ts-ignore
                          minTime={minTime}
                          // @ts-ignore
                          maxTime={maxTime}
                          className={`w-full border rounded px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary${field.value ? ' has-value' : ''}`}
                          calendarClassName="custom-datepicker"
                          dayClassName={date => "rounded-full hover:bg-primary/20"}
                          popperClassName="z-50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            <FormField
              control={form.control}
              name="eventEnd"
              render={({ field }) => {
                const start = form.getValues("eventStart") ?? null;
                const end = field.value ?? null;
                let minTime: Date | undefined = undefined;
                let maxTime: Date | undefined = undefined;
                let minDate = start || new Date();
                if (end && start) {
                  const isSameDay = start.getFullYear() === end.getFullYear() &&
                    start.getMonth() === end.getMonth() &&
                    start.getDate() === end.getDate();
                  if (isSameDay) {
                    minTime = start;
                    maxTime = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 23, 59);
                  } else {
                    minTime = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 0, 0);
                    maxTime = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59);
                  }
                } else if (end) {
                  minTime = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 0, 0);
                  maxTime = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59);
                }
                return (
                  <FormItem>
                    <FormLabel>Event End</FormLabel>
                    <FormControl>
                      <ReactDatePicker
                        selected={field.value ?? null}
                        onChange={date => field.onChange(date)}
                        showTimeSelect
                        timeFormat="HH:mm"
                        timeIntervals={15}
                        dateFormat="yyyy-MM-dd HH:mm"
                        minDate={minDate}
                        // @ts-ignore
                        minTime={minTime}
                        // @ts-ignore
                        maxTime={maxTime}
                        className={`w-full border rounded px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary${field.value ? ' has-value' : ''}`}
                        calendarClassName="custom-datepicker"
                        dayClassName={date => "rounded-full hover:bg-primary/20"}
                        popperClassName="z-50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="Location" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="seatCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Seats</FormLabel>
                <FormControl>
                  <Input type="number" min={1} placeholder="e.g. 100" {...field} />
                </FormControl>
                <FormDescription>Enter the total number of seats for this event. Seats will be auto-numbered (A1, A2, ...).</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (NPR)</FormLabel>
                <FormControl>
                  <Input type="number" step="1" min="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Image</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    accept={ACCEPTED_IMAGE_TYPES.join(", ")}
                    onChange={(e) => field.onChange(e.target.files)}
                  />
                </FormControl>
                <FormDescription>Accepted formats: .jpg, .jpeg, .png, .webp (Max size: 5MB)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Create Event</Button>
        </form>
      </Form>
    </div>
  );
}
