import { formatDistanceToNow } from "date-fns";
import type { Lead, LeadStatusType } from "@/shared/types";

interface LeadTableProps {
  leads: Lead[];
  loading: boolean;
  onStatusUpdate: (leadId: number, newStatus: LeadStatusType) => void;
}

const statusColors: Record<LeadStatusType, { bg: string; text: string; dot: string }> = {
  new: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  contacted: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500" },
  qualified: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  closed: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
};

const sourceIcons: Record<string, { icon: string; color: string }> = {
  instagram: { icon: "📷", color: "text-pink-600" },
  google: { icon: "🔍", color: "text-blue-600" },
  website: { icon: "🌐", color: "text-gray-600" },
  other: { icon: "📋", color: "text-gray-600" },
};

export default function LeadTable({ leads, loading, onStatusUpdate }: LeadTableProps) {
  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading leads...</p>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p className="text-gray-600 font-medium mb-2">No leads found</p>
        <p className="text-sm text-gray-500">Leads will appear here when they arrive via webhooks</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Source
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contact
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Message
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {leads.map((lead) => (
            <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{sourceIcons[lead.source]?.icon || "📋"}</span>
                  <div>
                    <div className={`text-sm font-medium ${sourceIcons[lead.source]?.color || "text-gray-600"}`}>
                      {lead.source.charAt(0).toUpperCase() + lead.source.slice(1)}
                    </div>
                    {lead.campaign_name && (
                      <div className="text-xs text-gray-500">{lead.campaign_name}</div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="max-w-xs">
                  {lead.name && <div className="text-sm font-medium text-gray-900">{lead.name}</div>}
                  {lead.email && <div className="text-sm text-gray-600">{lead.email}</div>}
                  {lead.phone && <div className="text-sm text-gray-600">{lead.phone}</div>}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="max-w-xs text-sm text-gray-600 truncate">
                  {lead.message || "-"}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <select
                  value={lead.status}
                  onChange={(e) => onStatusUpdate(lead.id, e.target.value as LeadStatusType)}
                  className={`text-sm font-medium px-3 py-1.5 rounded-full border-0 cursor-pointer ${statusColors[lead.status].bg} ${statusColors[lead.status].text} focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="closed">Closed</option>
                </select>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
