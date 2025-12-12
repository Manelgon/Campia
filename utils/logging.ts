
import { SupabaseClient } from "@supabase/supabase-js";

type LogActivityParams = {
    propertyId: string;
    userId: string;
    type: string;
    description: string;
    entityId?: string;
    metadata?: Record<string, any>;
}

export const logActivity = async (supabase: SupabaseClient, params: LogActivityParams) => {
    try {
        await supabase.from("activity_logs").insert({
            property_id: params.propertyId,
            user_id: params.userId,
            type: params.type,
            description: params.description,
            entity_id: params.entityId,
            metadata: params.metadata || {}
        });
    } catch (error) {
        console.error("Failed to log activity:", error);
        // Fail silently so we don't block the main action? 
        // Or rethrow? Usually logging is side-effect, best not to crash main flow.
    }
};
