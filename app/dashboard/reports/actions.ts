"use server";

import { createClient } from "@/utils/supabase/server";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";

export async function getRevenueStats() {
    const supabase = await createClient();

    // Fetch paid invoices from the last 6 months (simplified)
    const { data: invoices } = await supabase
        .from("invoices")
        .select("total_amount, paid_at")
        .eq("status", "paid")
        .order("paid_at", { ascending: true });

    if (!invoices) return [];

    // Simple aggregator: Monthly Revenue
    const aggregated = invoices.reduce((acc: Record<string, number>, curr) => {
        const date = new Date(curr.paid_at);
        const key = format(date, "MMM yyyy"); // e.g., "Jan 2024"
        if (!acc[key]) acc[key] = 0;
        acc[key] += Number(curr.total_amount);
        return acc;
    }, {});

    return Object.entries(aggregated).map(([name, total]) => ({ name, total }));
}

export async function getOccupancyStats() {
    const supabase = await createClient();

    // Get total units count
    const { count: totalUnits } = await supabase.from("units").select("*", { count: 'exact', head: true });

    if (!totalUnits) return [];

    // Get bookings for last 30 days
    const endDate = new Date();
    const startDate = subDays(endDate, 30);

    const { data: bookings } = await supabase
        .from("bookings")
        .select("check_in_date, check_out_date")
        .in("status", ["confirmed", "checked_in", "checked_out"])
        .gte("check_out_date", startDate.toISOString());

    // Generate last 30 days array
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const stats = days.map(day => {
        // Count how many bookings cover this day
        const occupied = bookings?.filter(b => {
            const start = new Date(b.check_in_date);
            const end = new Date(b.check_out_date);
            return day >= start && day < end;
        }).length || 0;

        const percentage = totalUnits > 0 ? (occupied / totalUnits) * 100 : 0;

        return {
            name: format(day, "dd/MM"),
            occupancy: Math.round(percentage),
            occupied,
            total: totalUnits
        };
    });

    return stats;
}

export async function getKPIs() {
    const supabase = await createClient();

    // Total Revenue (All time paid)
    const { data: paidInvoices } = await supabase.from("invoices").select("total_amount").eq("status", "paid");
    const totalRevenue = paidInvoices?.reduce((acc, curr) => acc + (curr.total_amount || 0), 0) || 0;

    // Active Bookings (Checked In)
    const { count: checkedInCount } = await supabase
        .from("bookings")
        .select("*", { count: 'exact', head: true })
        .eq("status", "checked_in");

    // Pending Tickets
    const { count: pendingTickets } = await supabase
        .from("tickets")
        .select("*", { count: 'exact', head: true })
        .neq("status", "closed");

    return {
        totalRevenue,
        checkedInCount: checkedInCount || 0,
        pendingTickets: pendingTickets || 0
    };
}
