"use server";

import { createClient } from "@/utils/supabase/server";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfYear, startOfToday, eachMonthOfInterval, subMonths } from "date-fns";

export async function getRevenueStats(range: string = 'month') {
    const supabase = await createClient();

    // 1. Define Date Range and intervals
    const endDate = new Date(); // now
    let startDate = subDays(endDate, 30);
    let intervals: Date[] = [];
    let formatStr = "dd/MM";

    if (range === 'today') {
        startDate = startOfToday();
        const endOfToday = new Date(); endOfToday.setHours(23, 59, 59, 999);
        // Generate hourly intervals for today
        let current = new Date(startDate);
        while (current <= endOfToday) {
            intervals.push(new Date(current));
            current.setHours(current.getHours() + 1);
        }
        formatStr = "HH:00";
    } else if (range === 'week') {
        startDate = subDays(endDate, 7);
        intervals = eachDayOfInterval({ start: startDate, end: endDate });
        formatStr = "dd/MM";
    } else if (range === 'month') {
        startDate = subDays(endDate, 30);
        intervals = eachDayOfInterval({ start: startDate, end: endDate });
        formatStr = "dd/MM";
    } else if (range === 'year') {
        startDate = startOfYear(endDate);
        intervals = eachMonthOfInterval({ start: startDate, end: endDate });
        formatStr = "MMM yyyy";
    } else {
        // Default month
        intervals = eachDayOfInterval({ start: startDate, end: endDate });
    }

    // 2. Initialize Map with 0s
    // Use a Map to preserve insertion order of intervals
    const statsMap = new Map<string, number>();
    intervals.forEach(d => {
        statsMap.set(format(d, formatStr), 0);
    });

    // 3. Fetch Data
    const { data: payments } = await supabase
        .from("payments")
        .select("amount, created_at")
        .eq("status", "completed")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });

    if (payments) {
        // 4. Aggregate
        payments.forEach(p => {
            const date = new Date(p.created_at);
            const key = format(date, formatStr);
            // Only add if key exists (falls within our specific generated intervals)
            if (statsMap.has(key)) {
                statsMap.set(key, (statsMap.get(key) || 0) + Number(p.amount));
            }
        });
    }

    // 5. Convert to Array
    return Array.from(statsMap.entries()).map(([name, total]) => ({ name, total }));
}

export async function getOccupancyStats(range: string = 'month') {
    const supabase = await createClient();

    // Get total units count
    const { count: totalUnits } = await supabase.from("units").select("*", { count: 'exact', head: true });

    if (!totalUnits) return [];

    const endDate = new Date();
    let startDate = subDays(endDate, 30);

    if (range === 'today') startDate = startOfToday();
    if (range === 'week') startDate = subDays(endDate, 7);
    if (range === 'year') startDate = startOfYear(endDate);

    const { data: bookings } = await supabase
        .from("bookings")
        .select("check_in_date, check_out_date")
        .in("status", ["confirmed", "checked_in", "checked_out"])
        .gte("check_out_date", startDate.toISOString());

    // Generate intervals
    let intervals;
    if (range === 'today') {
        // For today, maybe just return one single point? Chart might need array. 
        // Let's do hourly for today? Or just "Today" single bar. 
        // Single bar chart is ugly. Let's return Today + Tomorrow for context? 
        // Or just Keep it simple: Today is just 1 point.
        intervals = [new Date()];
    } else if (range === 'year') {
        intervals = eachMonthOfInterval({ start: startDate, end: endDate });
    } else {
        intervals = eachDayOfInterval({ start: startDate, end: endDate });
    }

    const stats = intervals.map(datePoint => {
        let occupied = 0;
        let name = format(datePoint, "dd/MM");

        if (range === 'year') name = format(datePoint, "M/yy");
        if (range === 'today') name = "Hoy";

        const pointString = format(datePoint, "yyyy-MM-dd");

        if (range === 'year') {
            // Monthly logic... simplistic check if booking overlaps ANY day in month? 
            // Heavy. Let's keep year view simple: average occupancy of that month?
            // Or just check mid-month. 
            // MVP: Check if booking overlaps the 15th of the month.
            const midMonth = new Date(datePoint.getFullYear(), datePoint.getMonth(), 15);
            const midString = format(midMonth, "yyyy-MM-dd");
            occupied = bookings?.filter(b => midString >= b.check_in_date && midString < b.check_out_date).length || 0;
        } else {
            occupied = bookings?.filter(b => pointString >= b.check_in_date && pointString < b.check_out_date).length || 0;
        }

        const percentage = totalUnits > 0 ? (occupied / totalUnits) * 100 : 0;

        return {
            name,
            occupancy: Math.round(percentage),
            occupied,
            total: totalUnits
        };
    });

    return stats;
}

export async function getKPIs() {
    const supabase = await createClient();

    // Total Revenue (Cash Flow - Actual money received)
    const { data: payments } = await supabase
        .from("payments")
        .select("amount")
        .eq("status", "completed");

    const totalRevenue = payments?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;

    // Active Occupancy (Bookings occupying a unit today)
    const today = new Date().toISOString().split('T')[0];
    const { count: occupiedCount } = await supabase
        .from("bookings")
        .select("*", { count: 'exact', head: true })
        .lte("check_in_date", today)
        .gt("check_out_date", today) // check_out day is usually not "occupied" for night count, but let's be consistent with logic
        .in("status", ["confirmed", "checked_in"]); // Include confirmed as they block availability

    // Pending Tickets
    const { count: pendingTickets } = await supabase
        .from("tickets")
        .select("*", { count: 'exact', head: true })
        .neq("status", "closed");

    return {
        totalRevenue,
        occupiedCount: occupiedCount || 0,
        pendingTickets: pendingTickets || 0
    };
}
