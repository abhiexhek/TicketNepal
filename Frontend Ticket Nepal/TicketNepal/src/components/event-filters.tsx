"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Search, MapPin, Filter, X, SlidersHorizontal } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Function to clear all filters
  const clearFilters = () => {
    setDate(undefined);
    setCategory(undefined);
    setLocation("");
    setSearch("");
  };
  
  // Check if any filters are applied
  const hasActiveFilters = date || category || location.trim() !== "" || search.trim() !== "";
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
    "Workshop",
    "Comedy",
    "Theater",
    "Conference"
  ];

  useEffect(() => {
    // Fetch categories from backend or use predefined list
    const fetchCategories = async () => {
      if (!currentUser?.id) {
        setCategories([...popularCategories, "Other"]);
        return;
      }
              const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
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
      category: category && category !== "all" ? category : undefined,
      eventStart: date ? format(date, 'yyyy-MM-dd') : undefined,
      location: location || undefined,
      search: search || undefined,
    });
    
  }, [category, date, location, search]);

  const activeFiltersCount = [
    category && category !== "all",
    date,
    location.trim() !== "",
    search.trim() !== ""
  ].filter(Boolean).length;

  return (
    <Card className="card-elevated">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Filter className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Filter Events</h3>
              <p className="text-sm text-muted-foreground">
                Find exactly what you're looking for
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFiltersCount} active
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-muted-foreground hover:text-foreground"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search Bar - Always Visible */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events by name, organizer, or description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>

        {/* Advanced Filters - Expandable */}
        {isExpanded && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Category
                </label>
                <Select onValueChange={setCategory} value={category}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-11",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Location Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </label>
                <Input
                  placeholder="Enter location or venue"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            {/* Quick Category Pills */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Popular Categories</label>
              <div className="flex flex-wrap gap-2">
                {popularCategories.slice(0, 8).map((cat) => (
                  <Badge
                    key={cat}
                    variant={category === cat ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/10 transition-colors"
                    onClick={() => setCategory(category === cat ? undefined : cat)}
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 pt-4 border-t">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {category && category !== "all" && (
              <Badge variant="secondary" className="text-xs">
                Category: {category}
                <X 
                  className="ml-1 h-3 w-3 cursor-pointer" 
                  onClick={() => setCategory(undefined)}
                />
              </Badge>
            )}
            {date && (
              <Badge variant="secondary" className="text-xs">
                Date: {format(date, "MMM dd")}
                <X 
                  className="ml-1 h-3 w-3 cursor-pointer" 
                  onClick={() => setDate(undefined)}
                />
              </Badge>
            )}
            {location && (
              <Badge variant="secondary" className="text-xs">
                Location: {location}
                <X 
                  className="ml-1 h-3 w-3 cursor-pointer" 
                  onClick={() => setLocation("")}
                />
              </Badge>
            )}
            {search && (
              <Badge variant="secondary" className="text-xs">
                Search: "{search}"
                <X 
                  className="ml-1 h-3 w-3 cursor-pointer" 
                  onClick={() => setSearch("")}
                />
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear all
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
