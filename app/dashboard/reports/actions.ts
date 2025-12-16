"use server";

import { createClient } from "@/utils/supabase/server";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfYear, startOfToday, eachMonthOfInterval, subMonths, startOfDay, endOfToday, addDays, endOfDay } from "date-fns";

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
        startDate = subDays(endDate, 6); // Past 7 days including today
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

export async function getOccupancyStats(range: string = 'week') {
    const supabase = await createClient();

    // Get total units count
    const { count: totalUnits } = await supabase.from("units").select("*", { count: 'exact', head: true });

    if (!totalUnits) return [];

    const now = new Date();
    let startDate = subDays(now, 30);
    let endDate = now;

    if (range === 'today') {
        startDate = startOfToday();
        endDate = endOfToday();
    }
    if (range === 'week') {
        startDate = startOfToday();
        endDate = endOfDay(addDays(now, 6)); // Today + 6 days = 7 days forecast
    }
    if (range === 'year') {
        startDate = startOfYear(now);
        endDate = now;
    }

    // Fetch bookings that overlap with the window
    // We want any booking where check_out_date > startDate AND check_in_date <= endDate
    const { data: bookings } = await supabase
        .from("bookings")
        .select("check_in_date, check_out_date, status")
        .neq("status", "cancelled")
        .gte("check_out_date", format(startDate, 'yyyy-MM-dd'))
        .lte("check_in_date", format(endDate, 'yyyy-MM-dd'));

    // Generate intervals
    let intervals;
    if (range === 'today') {
        intervals = [now];
    } else if (range === 'year') {
        intervals = eachMonthOfInterval({ start: startDate, end: endDate });
    } else {
        intervals = eachDayOfInterval({ start: startDate, end: endDate });
    }

    const stats = intervals.map(datePoint => {
        let occupied = 0;
        let name = format(datePoint, "dd/MM");

        // Ensure we are comparing dates without time interference
        const pointDate = startOfDay(datePoint);
        const pointString = format(pointDate, "yyyy-MM-dd");

        if (range === 'year') name = format(datePoint, "M/yy");
        if (range === 'today') name = "Hoy";

        if (range === 'year') {
            const midMonth = new Date(datePoint.getFullYear(), datePoint.getMonth(), 15);
            const midString = format(midMonth, "yyyy-MM-dd");
            occupied = bookings?.filter(b => midString >= b.check_in_date && midString < b.check_out_date).length || 0;
        } else {
            // Check if this specific day is within the booking range [check_in, check_out)
            // Note: check_out_date is usually the morning of departure, so it's NOT an "occupied night" for that date.
            // Example: In 12th, Out 13th. Night of 12th is occupied.
            // 12th >= 12th (True) && 12th < 13th (True). 
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

export async function getArrivalsStats(range: string = 'week') {
    const supabase = await createClient();

    const now = new Date();
    let startDate = subDays(now, 30);
    let endDate = now;

    if (range === 'today') {
        startDate = startOfToday();
        endDate = endOfToday();
    }
    if (range === 'week') {
        startDate = startOfToday();
        endDate = endOfDay(addDays(now, 6)); // Today + 6 days = 7 days forecast
    }
    if (range === 'year') {
        startDate = startOfYear(now);
        endDate = now;
    }

    // Fetch bookings with check_in_date in range
    const { data: bookings } = await supabase
        .from("bookings")
        .select("check_in_date")
        .in("status", ["confirmed", "checked_in"])
        .gte("check_in_date", format(startDate, 'yyyy-MM-dd'))
        .lte("check_in_date", format(endDate, 'yyyy-MM-dd'));

    // Generate intervals
    let intervals;
    if (range === 'today') {
        intervals = [now];
    } else if (range === 'year') {
        intervals = eachMonthOfInterval({ start: startDate, end: endDate });
    } else {
        intervals = eachDayOfInterval({ start: startDate, end: endDate });
    }

    const stats = intervals.map(datePoint => {
        let count = 0;
        let name = format(datePoint, "dd/MM");

        const pointDate = startOfDay(datePoint);
        const pointString = format(pointDate, "yyyy-MM-dd");

        if (range === 'year') name = format(datePoint, "M/yy");
        if (range === 'today') name = "Hoy";

        if (range === 'year') {
            // For year view, maybe sum by month?
            // Simple version: count items starting with yyyy-MM
            const monthPrefix = format(datePoint, "yyyy-MM");
            count = bookings?.filter(b => b.check_in_date.startsWith(monthPrefix)).length || 0;
        } else {
            count = bookings?.filter(b => b.check_in_date === pointString).length || 0;
        }

        return {
            name,
            total: count
        };
    });

    return stats;
}

export async function getGuestsStats(range: string = 'week') {
    const supabase = await createClient();

    const now = new Date();
    let startDate = subDays(now, 30);
    let endDate = now;

    if (range === 'today') {
        startDate = startOfToday();
        endDate = endOfToday();
    }
    if (range === 'week') {
        startDate = startOfToday();
        endDate = endOfDay(addDays(now, 6)); // Today + 6 days = 7 days forecast
    }
    if (range === 'year') {
        startDate = startOfYear(now);
        endDate = now;
    }

    // Fetch active bookings overlap
    const { data: bookings } = await supabase
        .from("bookings")
        .select("check_in_date, check_out_date, guests_count")
        .in("status", ["confirmed", "checked_in"])
        .gte("check_out_date", format(startDate, 'yyyy-MM-dd'))
        .lte("check_in_date", format(endDate, 'yyyy-MM-dd'));

    // Generate intervals
    let intervals;
    if (range === 'today') {
        intervals = [now];
    } else if (range === 'year') {
        intervals = eachMonthOfInterval({ start: startDate, end: endDate });
    } else {
        intervals = eachDayOfInterval({ start: startDate, end: endDate });
    }

    const stats = intervals.map(datePoint => {
        let count = 0;
        let name = format(datePoint, "dd/MM");

        const pointDate = startOfDay(datePoint);
        const pointString = format(pointDate, "yyyy-MM-dd");

        if (range === 'year') name = format(datePoint, "M/yy");
        if (range === 'today') name = "Hoy";

        if (range === 'year') {
            // simplified for year
            const midMonth = new Date(datePoint.getFullYear(), datePoint.getMonth(), 15);
            const midString = format(midMonth, "yyyy-MM-dd");
            count = bookings?.filter(b => midString >= b.check_in_date && midString < b.check_out_date)
                .reduce((sum, b) => sum + (b.guests_count || 0), 0) || 0;
        } else {
            // Count total guests in active bookings for this day
            count = bookings?.filter(b => pointString >= b.check_in_date && pointString < b.check_out_date)
                .reduce((sum, b) => sum + (b.guests_count || 0), 0) || 0;
        }

        return {
            name,
            total: count
        };
    });

    return stats;
}

export async function getCleaningStats(range: string = 'week') {
    const supabase = await createClient();
    const endDate = new Date();
    let startDate = subDays(endDate, 6);
    let intervals: Date[] = [];
    let formatStr = "dd/MM";

    if (range === 'week') {
        startDate = subDays(endDate, 6);
        intervals = eachDayOfInterval({ start: startDate, end: endDate });
    } else if (range === 'month') {
        startDate = subDays(endDate, 30);
        intervals = eachDayOfInterval({ start: startDate, end: endDate });
    } else {
        intervals = eachDayOfInterval({ start: startDate, end: endDate });
    }

    const { data: tasks } = await supabase
        .from("housekeeping_tasks")
        .select("created_at")
        .gte("created_at", startDate.toISOString());

    const statsMap = new Map<string, number>();
    intervals.forEach(d => {
        statsMap.set(format(d, formatStr), 0);
    });

    if (tasks) {
        tasks.forEach(t => {
            const date = new Date(t.created_at);
            const key = format(date, formatStr);
            if (statsMap.has(key)) {
                statsMap.set(key, (statsMap.get(key) || 0) + 1);
            }
        });
    }

    return Array.from(statsMap.entries()).map(([name, total]) => ({ name, total }));
}

export async function getTicketStats(range: string = 'week') {
    const supabase = await createClient();
    const endDate = new Date();
    let startDate = subDays(endDate, 6);
    let intervals: Date[] = [];
    let formatStr = "dd/MM";

    if (range === 'week') {
        startDate = subDays(endDate, 6);
        intervals = eachDayOfInterval({ start: startDate, end: endDate });
    } else if (range === 'month') {
        startDate = subDays(endDate, 30);
        intervals = eachDayOfInterval({ start: startDate, end: endDate });
    } else {
        intervals = eachDayOfInterval({ start: startDate, end: endDate });
    }

    const { data: tickets } = await supabase
        .from("tickets")
        .select("created_at")
        .gte("created_at", startDate.toISOString());

    const statsMap = new Map<string, number>();
    intervals.forEach(d => {
        statsMap.set(format(d, formatStr), 0);
    });

    if (tickets) {
        tickets.forEach(t => {
            const date = new Date(t.created_at);
            const key = format(date, formatStr);
            if (statsMap.has(key)) {
                statsMap.set(key, (statsMap.get(key) || 0) + 1);
            }
        });
    }

    return Array.from(statsMap.entries()).map(([name, total]) => ({ name, total }));
}

export async function getMaintenanceAdvancedStats(range: { from: Date; to: Date }) {
    const supabase = await createClient();
    const startDate = range.from.toISOString();
    const endDate = range.to.toISOString();

    // 1. Fetch Tickets in Range
    const { data: tickets } = await supabase
        .from("tickets")
        .select("id, status, priority, created_at, started_at, resolved_at, assigned_to, profiles:assigned_to(full_name)")
        .gte("created_at", startDate)
        .lte("created_at", endDate);

    if (!tickets) return {
        totalTickets: 0,
        pendingTickets: 0,
        resolvedTickets: 0,
        avgResolutionHours: 0,
        avgResponseHours: 0,
        ticketsByTech: []
    };

    const totalTickets = tickets.length;
    const pendingTickets = tickets.filter(t => t.status !== 'closed' && t.status !== 'resolved').length;
    const resolvedTickets = tickets.filter(t => t.status === 'closed' || t.status === 'resolved').length;

    // Resolution Time (resolved_at - created_at)
    let totalResTime = 0;
    let resCount = 0;
    tickets.forEach(t => {
        if (t.resolved_at && t.created_at) {
            const start = new Date(t.created_at).getTime();
            const end = new Date(t.resolved_at).getTime();
            totalResTime += (end - start);
            resCount++;
        }
    });
    const avgResolutionHours = resCount > 0 ? (totalResTime / resCount) / (1000 * 60 * 60) : 0;

    // Response Time (started_at - created_at)
    let totalRespTime = 0;
    let respCount = 0;
    tickets.forEach(t => {
        if (t.started_at && t.created_at) {
            const start = new Date(t.created_at).getTime();
            const end = new Date(t.started_at).getTime();
            totalRespTime += (end - start);
            respCount++;
        }
    });
    const avgResponseHours = respCount > 0 ? (totalRespTime / respCount) / (1000 * 60 * 60) : 0;

    // Tickets by Tech
    const techMap = new Map<string, { name: string, count: number, resolved: number }>();
    tickets.forEach(t => {
        const assignedName = (t.profiles as any)?.full_name || "Sin Asignar";
        if (!techMap.has(assignedName)) {
            techMap.set(assignedName, { name: assignedName, count: 0, resolved: 0 });
        }
        const entry = techMap.get(assignedName)!;
        entry.count++;
        if (t.status === 'resolved' || t.status === 'closed') {
            entry.resolved++;
        }
    });

    const ticketsByTech = Array.from(techMap.values());

    return {
        totalTickets,
        pendingTickets,
        resolvedTickets,
        avgResolutionHours,
        avgResponseHours,
        ticketsByTech
    };
}

export async function getHousekeepingAdvancedStats(range: { from: Date; to: Date }) {
    const supabase = await createClient();
    const startDate = range.from.toISOString();
    const endDate = range.to.toISOString();

    // 1. Fetch Tasks in Range
    const { data: tasks } = await supabase
        .from("housekeeping_tasks")
        .select("id, status, priority, created_at, completed_at, assigned_to, profiles:assigned_to(full_name), unit:units(name, type)")
        .gte("created_at", startDate)
        .lte("created_at", endDate);

    if (!tasks) return {
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        avgCleaningHours: 0,
        tasksByStaff: []
    };

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'resolved' || t.status === 'completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'open' || t.status === 'pending' || t.status === 'in_progress').length;

    // Cleaning Time (completed_at - created_at for completed tasks)
    let totalCleanTime = 0;
    let cleanCount = 0;
    tasks.forEach(t => {
        if (t.completed_at && t.created_at) {
            const start = new Date(t.created_at).getTime();
            const end = new Date(t.completed_at).getTime();
            totalCleanTime += (end - start);
            cleanCount++;
        }
    });
    const avgCleaningHours = cleanCount > 0 ? (totalCleanTime / cleanCount) / (1000 * 60 * 60) : 0;

    // Tasks by Staff
    const staffMap = new Map<string, { name: string, count: number, completed: number }>();
    tasks.forEach(t => {
        const assignedName = (t.profiles as any)?.full_name || "Sin Asignar";
        if (!staffMap.has(assignedName)) {
            staffMap.set(assignedName, { name: assignedName, count: 0, completed: 0 });
        }
        const entry = staffMap.get(assignedName)!;
        entry.count++;
        if (t.status === 'resolved' || t.status === 'completed') {
            entry.completed++;
        }
    });

    const tasksByStaff = Array.from(staffMap.values());

    return {
        totalTasks,
        completedTasks,
        pendingTasks,
        avgCleaningHours,
        tasksByStaff
    };
}

export async function getFinancialAdvancedStats(range: { from: Date; to: Date }) {
    const supabase = await createClient();
    const startDate = range.from.toISOString();
    const endDate = range.to.toISOString();

    // 1. Get Total Units (for RevPAR calculation)
    const { count: totalUnits } = await supabase
        .from("units")
        .select("*", { count: 'exact', head: true });

    // 2. Fetch Payments in Range (Total Revenue)
    const { data: payments } = await supabase
        .from("payments")
        .select("amount, created_at")
        .gte("created_at", startDate)
        .lte("created_at", endDate);

    const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;

    // 3. Fetch Bookings that overlap with the range for ADR and Occupancy
    const { data: bookings } = await supabase
        .from("bookings")
        .select("check_in_date, check_out_date, total_amount, status")
        .neq("status", "cancelled")
        .gte("check_out_date", format(range.from, 'yyyy-MM-dd'))
        .lte("check_in_date", format(range.to, 'yyyy-MM-dd'));

    // Calculate number of nights and total room revenue
    let totalNights = 0;
    let totalRoomRevenue = 0;
    let bookedRoomNights = 0;

    bookings?.forEach(b => {
        const checkIn = new Date(b.check_in_date);
        const checkOut = new Date(b.check_out_date);
        const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));

        totalNights += nights;
        totalRoomRevenue += Number(b.total_amount || 0);
        bookedRoomNights += nights;
    });

    // ADR (Average Daily Rate) = Total Room Revenue / Number of Rooms Sold
    const adr = bookedRoomNights > 0 ? totalRoomRevenue / bookedRoomNights : 0;

    // Calculate available room nights in the period
    const daysInRange = Math.ceil((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const availableRoomNights = (totalUnits || 0) * daysInRange;

    // Occupancy Rate = Booked Room Nights / Available Room Nights
    const occupancyRate = availableRoomNights > 0 ? (bookedRoomNights / availableRoomNights) * 100 : 0;

    // RevPAR (Revenue Per Available Room) = Total Room Revenue / Available Room Nights
    const revPAR = availableRoomNights > 0 ? totalRoomRevenue / availableRoomNights : 0;

    // TRevPAR (Total Revenue Per Available Room) = Total Revenue (including extras) / Available Room Nights
    const trevPAR = availableRoomNights > 0 ? totalRevenue / availableRoomNights : 0;

    // Revenue trend by day
    const intervals = eachDayOfInterval({ start: range.from, end: range.to });
    const revenueByDay = intervals.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayRevenue = payments?.filter(p => {
            const pDate = format(new Date(p.created_at), 'yyyy-MM-dd');
            return pDate === dayStr;
        }).reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;

        return {
            name: format(day, 'dd/MM'),
            revenue: dayRevenue
        };
    });

    return {
        totalRevenue,
        adr,
        revPAR,
        trevPAR,
        occupancyRate,
        totalBookings: bookings?.length || 0,
        revenueByDay
    };
}

export async function getOccupancyAdvancedStats(range: { from: Date; to: Date }) {
    const supabase = await createClient();
    const startDate = range.from.toISOString();
    const endDate = range.to.toISOString();

    // 1. Get Total Units
    const { count: totalUnits } = await supabase
        .from("units")
        .select("*", { count: 'exact', head: true });

    // 2. Fetch Bookings that overlap with the range
    const { data: bookings } = await supabase
        .from("bookings")
        .select("check_in_date, check_out_date, status, guests_count")
        .neq("status", "cancelled")
        .gte("check_out_date", format(range.from, 'yyyy-MM-dd'))
        .lte("check_in_date", format(range.to, 'yyyy-MM-dd'));

    // Calculate metrics
    const daysInRange = Math.ceil((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const availableRoomNights = (totalUnits || 0) * daysInRange;

    let bookedRoomNights = 0;
    let totalStayDuration = 0;
    let stayCount = 0;

    bookings?.forEach(b => {
        const checkIn = new Date(b.check_in_date);
        const checkOut = new Date(b.check_out_date);
        const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));

        bookedRoomNights += nights;
        totalStayDuration += nights;
        stayCount++;
    });

    // Occupancy Rate
    const occupancyRate = availableRoomNights > 0 ? (bookedRoomNights / availableRoomNights) * 100 : 0;

    // Vacancy Rate
    const vacancyRate = 100 - occupancyRate;

    // Average Length of Stay
    const avgLengthOfStay = stayCount > 0 ? totalStayDuration / stayCount : 0;

    // Occupancy by day
    const intervals = eachDayOfInterval({ start: range.from, end: range.to });
    const occupancyByDay = intervals.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');

        // Count how many rooms are occupied on this specific day
        const occupiedRooms = bookings?.filter(b => {
            return dayStr >= b.check_in_date && dayStr < b.check_out_date;
        }).length || 0;

        const dayOccupancy = totalUnits && totalUnits > 0 ? (occupiedRooms / totalUnits) * 100 : 0;

        return {
            name: format(day, 'dd/MM'),
            occupancy: Math.round(dayOccupancy),
            occupied: occupiedRooms,
            available: totalUnits || 0
        };
    });

    // Occupancy by unit type (if we have type info)
    const { data: units } = await supabase
        .from("units")
        .select("id, type");

    const typeMap = new Map<string, { type: string, total: number, occupied: number }>();

    units?.forEach(u => {
        const type = u.type || "Sin tipo";
        if (!typeMap.has(type)) {
            typeMap.set(type, { type, total: 0, occupied: 0 });
        }
        typeMap.get(type)!.total++;
    });

    // Count occupied units by type (simplified - checking if any booking exists for this unit in range)
    bookings?.forEach(b => {
        // We'd need unit_id in bookings to properly categorize, for now we'll skip this detail
    });

    const occupancyByType = Array.from(typeMap.values()).map(t => ({
        type: t.type,
        occupancy: t.total > 0 ? Math.round((t.occupied / t.total) * 100) : 0,
        total: t.total
    }));

    return {
        occupancyRate,
        vacancyRate,
        avgLengthOfStay,
        totalBookings: bookings?.length || 0,
        totalUnits: totalUnits || 0,
        occupancyByDay,
        occupancyByType
    };
}
