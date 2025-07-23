"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "@/context/UserContext";

interface EventFiltersProps {
  onFilterChange: (filters: { category?: string; eventStart?: string; location?: string; search?: string }) => void;
}

export function EventFilters({ onFilterChange }: EventFiltersProps) {
  const [date, setDate] = React.useState<Date>();
  const [category, setCategory] = React.useState<string | undefined>();
  const [location, setLocation] = React.useState<string>("");
  const [search, setSearch] = React.useState<string>("");
  const [categories, setCategories] = useState<string[]>([]);
  const { currentUser } = useContext(UserContext);

  const popularCategories = [
    "Music",
    "Tech",
    "Art",
    "Sports",
    "Food",
    "Business",
    "Education",
    "Festival",
    "Workshop"
  ];

  useEffect(() => {
    // Fetch categories from backend or use predefined list
    const fetchCategories = async () => {
      if (!currentUser?.id) {
        setCategories([...popularCategories, "Other"]);
        return;
      }
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/api/events/organizer/${currentUser.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const events = await res.json();
        const eventCategories = events.map((e: any) => String(e.category)).filter(Boolean);
        // Merge, deduplicate, and keep 'Other' at the end
        const merged = Array.from(new Set([...popularCategories, ...eventCategories])).filter(cat => cat !== "Other");
        setCategories([...merged, "Other"]);
      } else {
        setCategories([...popularCategories, "Other"]);
      }
    };
    fetchCategories();
  }, [currentUser]);

  React.useEffect(() => {
    onFilterChange({
      category,
      eventStart: date ? date.toISOString().split('T')[0] : undefined,
      location: location || undefined,
      search: search || undefined,
    });
    
  }, [category, date, location, search]);

  return (
    <div className="bg-card p-4 rounded-lg shadow-sm border mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <Select onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Location</label>
          <Input
            placeholder="Enter a location or venue"
            value={location}
            onChange={e => setLocation(e.target.value)}
          />
        </div>
        <div className="space-y-2 col-span-2">
          <label className="text-sm font-medium">Search</label>
          <Input
            placeholder="Search by event name, location, or organizer"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
