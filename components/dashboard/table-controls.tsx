"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

// Simple debounce hook
function useDebounceValue<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

interface TableToolbarProps {
    searchPlaceholder?: string;
    showLimit?: boolean;
}

export function TableToolbar({
    searchPlaceholder = "Buscar...",
    showLimit = true
}: TableToolbarProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Get current values
    const currentLimit = searchParams.get("limit") || "10";
    const currentQ = searchParams.get("q") || "";

    const [text, setText] = useState(currentQ);
    const query = useDebounceValue(text, 500);

    // Sync URL when query changes
    useEffect(() => {
        const currentQ = searchParams.get("q") || "";
        if (query !== currentQ) {
            const params = new URLSearchParams(searchParams);
            if (query) {
                params.set("q", query);
            } else {
                params.delete("q");
            }
            params.set("page", "1"); // Reset page only when query changes
            router.replace(`?${params.toString()}`);
        }
    }, [query, router, searchParams]);

    const handleLimitChange = (val: string) => {
        const params = new URLSearchParams(searchParams);
        params.set("limit", val);
        params.set("page", "1");
        router.replace(`?${params.toString()}`);
    };

    return (
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border">
            {/* Search */}
            <div className="relative w-full sm:w-72">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder={searchPlaceholder}
                    className="pl-8"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto">
                {/* Limit Selector */}
                {showLimit && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground whitespace-nowrap">Mostrar:</span>
                        <Select value={currentLimit} onValueChange={handleLimitChange}>
                            <SelectTrigger className="w-[80px]">
                                <SelectValue placeholder="10" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                                <SelectItem value="all">Todo</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>
        </div>
    );
}

export function TablePagination({ total, limit, page }: { total: number, limit: number, page: number }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", newPage.toString());
        router.replace(`?${params.toString()}`);
    };

    if (total <= 0) return null;

    return (
        <div className="flex items-center justify-between py-4">
            <div className="text-sm text-muted-foreground">
                Mostrando <span className="font-medium text-foreground">{start}</span> a <span className="font-medium text-foreground">{end}</span> de <span className="font-medium text-foreground">{total}</span>
            </div>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm font-medium">
                    Página {page} de {totalPages}
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
