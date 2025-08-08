"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "@/styles/datepicker-custom.css";
import { format } from "date-fns";
import { toSafeDate } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload, Image as ImageIcon, MapPin, Clock, Users, DollarSign, Tag, FileText } from "lucide-react";
import Link from "next/link";

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
  image: z.any().optional(),
});

export default function UpdateEventPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<any>(null);
  const [customCategory, setCustomCategory] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formProgress, setFormProgress] = useState(0);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
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

  // Calculate form progress
  useEffect(() => {
    const values = form.getValues();
    const fields = ['name', 'description', 'category', 'eventStart', 'eventEnd', 'location', 'seatCount', 'price'];
    const filledFields = fields.filter(field => {
      const value = values[field as keyof typeof values];
      return value !== undefined && value !== null && value !== '';
    });
    setFormProgress((filledFields.length / fields.length) * 100);
  }, [form.watch()]);

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
          setSelectedCategory(event.category);
          if (event.imageUrl) {
            setUploadedImage(event.imageUrl);
          }
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
    setIsSubmitting(true);
    
    // Validate eventStart and eventEnd
    if (!values.eventStart) {
      toast({ title: "Invalid Start Date", description: "Please select a valid event start date and time.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    if (!values.eventEnd) {
      toast({ title: "Invalid End Date", description: "Please select a valid event end date and time.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

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
        toast({ title: "Event Updated!", description: "Your event has been updated successfully." });
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
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Loading event data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight mb-2">Update Event</h1>
            <p className="text-muted-foreground text-lg">
              Modify your event details and keep your audience informed
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <Card className="card-elevated mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Form Completion</span>
              <span className="text-sm text-muted-foreground">{Math.round(formProgress)}%</span>
            </div>
            <Progress value={formProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Complete all fields to update your event
            </p>
          </CardContent>
        </Card>

        <div className="max-w-4xl mx-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Basic Information */}
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                  <CardDescription>
                    Update the essential details about your event
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Event Name
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Enter event name" {...field} className="input-professional" />
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
                          <FormLabel className="flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            Category
                          </FormLabel>
                          <FormControl>
                            <select
                              className="w-full border rounded-lg px-3 py-2 bg-background focus:bg-background focus:border-primary transition-colors input-professional"
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
                              <Input
                                className="input-professional"
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
                  </div>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Description
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your event in detail..." 
                            className="min-h-[120px] input-professional"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Provide a compelling description that will attract attendees
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Date & Time */}
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Date & Time
                  </CardTitle>
                  <CardDescription>
                    Update when your event will take place
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
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
                            <FormLabel className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Event Start
                            </FormLabel>
                            <FormControl>
                              <ReactDatePicker
                                selected={field.value ?? null}
                                onChange={date => field.onChange(date)}
                                showTimeSelect
                                timeFormat="HH:mm"
                                timeIntervals={15}
                                dateFormat="yyyy-MM-dd HH:mm"
                                minDate={now}
                                minTime={minTime}
                                maxTime={maxTime}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary input-professional"
                                calendarClassName="custom-datepicker"
                                dayClassName={date => "rounded-full hover:bg-primary/20"}
                                popperClassName="z-50"
                                placeholderText="Select start date and time"
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
                            <FormLabel className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Event End
                            </FormLabel>
                            <FormControl>
                              <ReactDatePicker
                                selected={field.value ?? null}
                                onChange={date => field.onChange(date)}
                                showTimeSelect
                                timeFormat="HH:mm"
                                timeIntervals={15}
                                dateFormat="yyyy-MM-dd HH:mm"
                                minDate={minDate}
                                minTime={minTime}
                                maxTime={maxTime}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary input-professional"
                                calendarClassName="custom-datepicker"
                                dayClassName={date => "rounded-full hover:bg-primary/20"}
                                popperClassName="z-50"
                                placeholderText="Select end date and time"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Location & Pricing */}
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Location & Pricing
                  </CardTitle>
                  <CardDescription>
                    Update the venue and ticket pricing for your event
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Location
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter event location" {...field} className="input-professional" />
                        </FormControl>
                        <FormDescription>
                          Provide the full address or venue name
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="seatCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Number of Seats
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1} 
                              placeholder="e.g. 100" 
                              {...field} 
                              className="input-professional"
                              disabled
                            />
                          </FormControl>
                          <FormDescription>
                            Seat count cannot be changed after event creation
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Price (NPR)
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="1" 
                              min="0" 
                              placeholder="0" 
                              {...field} 
                              className="input-professional"
                            />
                          </FormControl>
                          <FormDescription>
                            Set to 0 for free events
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Event Image */}
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Event Image
                  </CardTitle>
                  <CardDescription>
                    Update the image for your event
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Upload className="h-4 w-4" />
                          Event Image
                        </FormLabel>
                        <FormControl>
                          <div className="space-y-4">
                            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                              <Input
                                type="file"
                                accept={ACCEPTED_IMAGE_TYPES.join(", ")}
                                onChange={(e) => {
                                  field.onChange(e.target.files);
                                  if (e.target.files && e.target.files[0]) {
                                    const file = e.target.files[0];
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      setUploadedImage(event.target?.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                className="hidden"
                                id="image-upload"
                              />
                              <label htmlFor="image-upload" className="cursor-pointer">
                                <span className="text-sm font-medium text-primary hover:text-primary/80">
                                  Click to upload
                                </span>
                                <span className="text-sm text-muted-foreground"> or drag and drop</span>
                              </label>
                              <p className="text-xs text-muted-foreground mt-2">
                                PNG, JPG, JPEG, WEBP up to 5MB
                              </p>
                            </div>
                            
                            {/* Image Preview */}
                            {uploadedImage && (
                              <div className="relative">
                                <div className="aspect-video rounded-lg overflow-hidden border">
                                  <img
                                    src={uploadedImage}
                                    alt="Event preview"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute top-2 right-2"
                                  onClick={() => {
                                    setUploadedImage(null);
                                    field.onChange(undefined);
                                    const input = document.getElementById('image-upload') as HTMLInputElement;
                                    if (input) input.value = '';
                                  }}
                                >
                                  Remove
                                </Button>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormDescription>
                          Choose a high-quality image that represents your event well
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex justify-center">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="px-8 py-3 text-lg font-semibold shadow-lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Updating Event...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-5 w-5" />
                      Update Event
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
} 