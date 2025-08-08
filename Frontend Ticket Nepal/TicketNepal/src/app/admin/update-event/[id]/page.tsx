"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "@/styles/datepicker-custom.css";
import { format } from "date-fns";
import { toSafeDate } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(2, { message: "Event name must be at least 2 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  category: z.string().min(2, { message: "Category is required." }),
  eventStart: z.date({ required_error: "A start date and time is required." }),
  eventEnd: z.date({ required_error: "An end date and time is required." }),
  location: z.string().min(2, { message: "Location is required." }),
  seatCount: z.coerce.number().min(1, { message: "Number of seats must be at least 1." }),
  price: z.coerce.number().min(0, { message: "Price must be a positive number." }),
  image: z.any().optional(),
});

export default function UpdateEventPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<any>(null);
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

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const token = localStorage.getItem("authToken");
        const res = await fetch(`${API_URL}/api/events/${params.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const event = await res.json();
          setInitialData(event);
          form.reset({
            name: event.name,
            description: event.description,
            category: event.category,
            location: event.location,
            seatCount: event.seats?.length || 10,
            price: event.price,
            eventStart: new Date(event.eventStart),
            eventEnd: new Date(event.eventEnd),
            image: undefined,
          });
        } else {
          toast({ title: "Error", description: "Could not fetch event.", variant: "destructive" });
          router.replace("/admin");
        }
      } catch {
        toast({ title: "Error", description: "Could not fetch event.", variant: "destructive" });
        router.replace("/admin");
      }
      setLoading(false);
    };
    fetchEvent();
  }, [params.id]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Validate eventStart and eventEnd
    if (!values.eventStart) {
      toast({ title: "Invalid Start Date", description: "Please select a valid event start date and time.", variant: "destructive" });
      return;
    }
    if (!values.eventEnd) {
      toast({ title: "Invalid End Date", description: "Please select a valid event end date and time.", variant: "destructive" });
      return;
    }
    // Log for debugging
    console.log('Submitting event update:', {
      ...values,
      eventStart: values.eventStart,
      eventEnd: values.eventEnd
    });
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("description", values.description);
    formData.append("category", values.category);
    formData.append("eventStart", values.eventStart.toISOString());
    formData.append("eventEnd", values.eventEnd.toISOString());
    formData.append("location", values.location);
    formData.append("seats", initialData?.seats?.join(",") || "");
    formData.append("price", values.price.toString());
    if (values.image && values.image.length > 0 && values.image[0]) {
      formData.append("image", values.image[0]);
    }
    formData.append("organizerId", initialData?.organizer || "");
    try {
                  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/api/events/${params.id}`, {
        method: "PUT",
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (response.ok) {
        toast({ title: "Event Updated!", description: "Your event has been updated." });
        router.push("/admin");
      } else {
        const err = await response.json();
        toast({
          title: "Update Failed",
          description: err.error || err.message || "Could not update the event.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({ title: "Error", description: "An error occurred.", variant: "destructive" });
    }
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="w-full max-w-xl mx-auto py-6 px-2 sm:px-4">
      <h1 className="text-2xl font-bold mb-6">Update Event</h1>
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
                  <Input type="number" min={1} placeholder="e.g. 100" {...field} disabled />
                </FormControl>
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
                  <Input type="file" accept="image/*" onChange={e => field.onChange(e.target.files)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Update Event</Button>
        </form>
      </Form>
    </div>
  );
} 