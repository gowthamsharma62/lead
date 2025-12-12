import { useState } from "react";
import type { LeadSourceType, LeadStatusType } from "@/shared/types";

interface LeadFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFilterChange: (filters: {
    source: LeadSourceType | "";
    status: LeadStatusType | "";
    dateFrom: string;
    dateTo: string;
  }) => void;
}

export default function LeadFilters({ searchQuery, onSearchChange, onFilterChange }: LeadFiltersProps) {
  const [source, setSource] = useState<LeadSourceType | "">("");
  const [status, setStatus] = useState<LeadStatusType | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const handleSourceChange = (newSource: LeadSourceType | "") => {
    setSource(newSource);
    onFilterChange({ source: newSource, status, dateFrom, dateTo });
  };

  const handleStatusChange = (newStatus: LeadStatusType | "") => {
    setStatus(newStatus);
    onFilterChange({ source, status: newStatus, dateFrom, dateTo });
  };

  const handleDateFromChange = (newDateFrom: string) => {
    setDateFrom(newDateFrom);
    onFilterChange({ source, status, dateFrom: newDateFrom, dateTo });
  };

  const handleDateToChange = (newDateTo: string) => {
    setDateTo(newDateTo);
    onFilterChange({ source, status, dateFrom, dateTo: newDateTo });
  };

  const handleClearFilters = () => {
    setSource("");
    setStatus("");
    setDateFrom("");
    setDateTo("");
    onSearchChange("");
    onFilterChange({ source: "", status: "", dateFrom: "", dateTo: "" });
  };

  const hasActiveFilters = searchQuery || source || status || dateFrom || dateTo;

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name, email, phone, or message..."
          className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={source}
          onChange={(e) => handleSourceChange(e.target.value as LeadSourceType | "")}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Sources</option>
          <option value="instagram">Instagram</option>
          <option value="google">Google</option>
          <option value="website">Website</option>
          <option value="other">Other</option>
        </select>

        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value as LeadStatusType | "")}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="closed">Closed</option>
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => handleDateFromChange(e.target.value)}
          placeholder="From date"
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        <input
          type="date"
          value={dateTo}
          onChange={(e) => handleDateToChange(e.target.value)}
          placeholder="To date"
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
