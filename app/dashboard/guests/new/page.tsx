
import { GuestForm } from "./guest-form";

export default function NewGuestPage() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Nuevo Cliente</h2>
            <div className="max-w-2xl">
                <GuestForm />
            </div>
        </div>
    );
}
